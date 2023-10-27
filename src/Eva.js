const Environment = require('./Environment');
const ContextStack = require('./ContextStack');
const Transformer = require('./transform/Transformer');
const evaParser = require('../parser/evaParser');
const fs = require('fs');

class Eva {
  constructor(global = GlobalEnvironment) {
    this.global = global;
    this.contextStack = new ContextStack(global);
    this._transformer = new Transformer();
  }

  evalGlobal(exp) {
    return this._evalBody(exp, this.global);
  }

  eval(exp, env = this.global) {
    try {
      if (this._isNumber(exp)) return exp;
      if (this._isString(exp)) return exp.slice(1, -1);

      if (exp[0] === 'and') return this.eval(exp[1], env) && this.eval(exp[2], env);
      if (exp[0] === 'or') return this.eval(exp[1], env) || this.eval(exp[2], env);
      if (exp[0] === 'not') return !this.eval(exp[1], env);

      if (exp[0] === '++') {
        const setExp = this._transformer.transformIncToSet(exp);
        return this.eval(setExp, env);
      }

      if (exp[0] === '--') {
        const setExp = this._transformer.transformDecToSet(exp);
        return this.eval(setExp, env);
      }

      if (exp[0] === '+=') {
        const setExp = this._transformer.transformIncValToSet(exp);
        return this.eval(setExp, env);
      }

      if (exp[0] === '-=') {
        const setExp = this._transformer.transformDecValToSet(exp)
        return this.eval(setExp, env);
      }

      if (exp[0] === '>js-fn') {
        return (...args) => this._evalUserDefinedFunction(this.eval(exp[1], env), args, exp.slice(1))
      }

      if (exp[0] === '.') {
        const [_tag, objectRef, method, ...args] = exp;
        const evaledArgs = args.map(arg => this.eval(arg, env));
        return global[objectRef][method].apply(null, evaledArgs);
      }

      if (exp[0] === 'list') {
        const [_tag, ...body] = exp;
        return body.reduce((acc, e) => [...acc, this.eval(e, env)], []);
      }

      if (exp[0] === 'first') {
        const [_tag, body] = exp;
        return this.eval(body, env)[0] || null;
      }

      if (exp[0] === 'rest') {
        const [_tag, body] = exp;
        return this.eval(body, env).slice(1);
      }

      if (exp[0] === 'conj') {
        const [_tag, to, el] = exp;
        return [...this.eval(to, env), this.eval(el, env)];
      }

      if (exp[0] === 'begin') {
        const blockEnv = new Environment({}, env);
        return this._evalBlock(exp, blockEnv);
      }

      if (exp[0] === 'var') {
        const [_, name, value] = exp;
        return env.define(name, this.eval(value, env));
      }

      if (exp[0] === 'set') {
        const [_, ref, value] = exp;

        if (ref[0] === 'prop') {
          const [_tag, instance, prop] = ref;
          const instanceEnv = this.eval(instance, env);

          return instanceEnv.define(prop, this.eval(value, env))
        }

        return env.assign(ref, this.eval(value, env));
      }

      if (this._isVariableName(exp)) return env.lookup(exp);

      if (exp[0] === 'switch') {
        const ifExp = this._transformer.transformSwitchToIf(exp);
        return this.eval(ifExp, env);
      }

      if (exp[0] === 'if') {
        const [_tag, condition, consequent, alternate] = exp;
        if (this.eval(condition, env)) {
          return this.eval(consequent, env);
        }
        return this.eval(alternate, env);
      }

      if (exp[0] === 'for') {
        const whileExp = this._transformer.transformForToWhile(exp);
        return this.eval(whileExp, env);
      }

      if (exp[0] === 'while') {
        const [_tag, condition, body] = exp;
        let result;
        while (this.eval(condition, env)) {
          result = this.eval(body, env);
        }
        return result;
      }

      if (exp[0] === 'class') {
        const [_tag, name, parent, body] = exp;

        const parentEnv = this.eval(parent, env) || env;

        const classEnv = new Environment({}, parentEnv);

        this._evalBody(body, classEnv);

        return env.define(name, classEnv);
      }

      if (exp[0] === 'new') {
        const [_tag, classname, ...args] = exp;

        const classEnv = this.eval(classname, env);

        const instanceEnv = new Environment({}, classEnv);

        this._evalUserDefinedFunction(
          classEnv.lookup('constructor'),
          [instanceEnv, ...args.map(a => this.eval(a, env))],
          [`<${classname}>.constructor`],
        )

        return instanceEnv;
      }

      if (exp[0] === 'super') {
        const [_tag, className] = exp;
        return this.eval(className, env).parent;
      }

      if (exp[0] === 'prop') {
        const [_tag, instance, prop] = exp;
        const instanceEnv = this.eval(instance, env);
        return instanceEnv.lookup(prop);
      };

      if (exp[0] === 'module') {
        const [_tag, name] = exp;
        const { body, exportedDefs } = this._transformer.transformInlineExports(exp)

        const moduleEnv = new Environment({}, env);

        this._evalBody(body, moduleEnv);

        if (exportedDefs && exportedDefs.length) {
          const focusedEnv = new Environment({}, null);
          exportedDefs.forEach(def => focusedEnv.define(def, moduleEnv.lookup(def)));
          return env.define(name, focusedEnv);
        }
        return env.define(name, moduleEnv);
      };

      if (exp[0] === 'import') {
        const [_tag, ...importBody] = exp;

        const referredNames = Array.isArray(importBody[0]) ? importBody[0] : null;
        const moduleName = importBody.at(-1);
        let importResult;

        try { // Shitty loader caching
          this.global.lookup(moduleName);
        } catch {
          const moduleSrc = fs.readFileSync(
            `../modules/${moduleName}.eva`, //WOAH, smells funny
            'utf-8',
          );

          const body = evaParser.parse(`(begin ${moduleSrc})`);
          const moduleExpression = ['module', moduleName, body];

          importResult = this.eval(moduleExpression, this.global);
        } finally {
          if (referredNames && referredNames.length) {
            referredNames.forEach(name => this.eval(['var', name, ['prop', moduleName, name]], env));
          }
          return importResult || null;
        }
      }

      if (exp[0] === 'def') {
        // JIT, kinda :)
        const varExp = this._transformer.transformDefToVarLambda(exp);
        return this.eval(varExp, env);
      }

      if (exp[0] === 'lambda') {
        const [_tag, params, body] = exp;

        return {
          params,
          body,
          env
        }
      }

      if (Array.isArray(exp)) {
        const fn = this.eval(exp[0], env);
        const args = exp.slice(1).map(arg => this.eval(arg, env));

        return typeof fn === 'function'
          ? this._evalNativeFunction(fn, args, exp, env)
          : this._evalUserDefinedFunction(fn, args, exp);
      }

      throw `Unimplemented expr${JSON.stringify(exp)}`;
    } catch (error) {
      console.log(`\x1b[31mAn error occurred:\n ${error}\x1b[0m`);
      if (this.contextStack.stackIsNotEmpty()) {
        this.contextStack.printStackTrace();
      }
      console.log();
      this.contextStack.purgeStack();
    }
  }

  _evalNativeFunction(fn, args, exp, env) {
    const fnName = `<Native function>: ${exp[0]}`
    this.contextStack.pushFrame(fnName, env);
    let evalRes = fn(...args);
    this.contextStack.popFrame();
    return evalRes;
  }

  _evalUserDefinedFunction(fn, args, exp) {
    const fnName = typeof exp[0] === 'string' ? exp[0] : '<Anonymous function>';
    const activationRecord = {};
    fn.params.forEach((param, index) => activationRecord[param] = args[index]);
    const activationEnvironment = new Environment(activationRecord, fn.env);
    this.contextStack.pushFrame(fnName, activationEnvironment);
    let evalRes = this._evalBody(fn.body, activationEnvironment);
    this.contextStack.popFrame();
    return evalRes;
  }

  _evalBody(body, env) {
    if(body[0] === 'begin') {
      return this._evalBlock(body, env);
    }
    return this.eval(body, env);
  }

  _evalBlock(block, env) {
    let result;
    const [_tag, ...expressions] = block;
    expressions.forEach(exp => result = this.eval(exp, env))
    return result;
  }

  _isNumber = exp => typeof exp === 'number';
  _isString = exp => typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
  _isVariableName = exp => typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_]*$/.test(exp);
}

const GlobalEnvironment = new Environment({
  null: null,
  undefined: null,

  true: true,
  false: false,

  VERSION: '0.1',

  '+'(op1, op2) {
    return op1 + op2;
  },

  '*'(op1, op2) {
    return op1 * op2;
  },

  '-'(op1, op2 = null) {
    if(op2 == null) {
      return -op1;
    }
    return op1 - op2;
  },

  '/'(op1, op2) {
    return op1 / op2;
  },

  '>'(op1, op2) {
    return op1 > op2;
  },

  '>='(op1, op2) {
    return op1 >= op2;
  },

  '<'(op1, op2) {
    return op1 < op2;
  },

  '<='(op1, op2) {
    return op1 <= op2;
  },

  '='(op1, op2) {
    return op1 === op2;
  },

  'print'(...args) {
    console.log(...args);
  },

  'seq'(...args) {
    return [...args];
  }

})

module.exports = Eva;
