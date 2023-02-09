const Environment = require('./Environment');
const ContextStack = require('./ContextStack');
const Transformer = require('./transform/Transformer');

class Eva {
  constructor(global = GlobalEnvironment) {
    this.global = global;
    this.contextStack = new ContextStack(global);
    this._transformer = new Transformer();
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

      if (exp[0] === 'begin') {
        const blockEnv = new Environment({}, env);
        return this._evalBlock(exp, blockEnv);
      }

      if (exp[0] === 'var') {
        const [_, name, value] = exp;
        return env.define(name, this.eval(value, env));
      }

      if (exp[0] === 'set') {
        const [_, name, value] = exp;
        return env.assign(name, this.eval(value, env));
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

        return typeof fn === 'function'
          ? this._evalNativeFunction(fn, exp, env)
          : this._evalUserDefinedFunction(fn, exp, env);
      }

      throw `Unimplemented expr${JSON.stringify(exp)}`;
    } catch (error) {
      console.log(`\x1b[31mAn error occurred: ${error}\x1b[0m`);
      this.contextStack.printStackTrace();
      this.contextStack.purgeStack();
    }
  }

  _evalNativeFunction(fn, exp, env) {
    const args = exp.slice(1).map(arg => this.eval(arg, env));
    const fnName = `<Native function>: ${exp[0]}`
    this.contextStack.pushFrame(fnName, env);
    let evalRes = fn(...args);
    this.contextStack.popFrame();
    return evalRes;
  }

  _evalUserDefinedFunction(fn, exp, env) {
    const args = exp.slice(1).map(arg => this.eval(arg, env));
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
