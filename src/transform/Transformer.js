class Transformer {

  transformDefToVarLambda(defExp) {
    const [_tag, name, params, body] = defExp;
    return ['var', name, ['lambda', params, body]];
  }

  // transformSwitchToIf(switchExp) {
  //   const [_tag, ...conds] = switchExp;
  //   const iter = (conds) => {
  //     if (conds.length) {
  //       const [[cond, body], ...rest] = conds;
  //       if (cond != 'else') {
  //         return ['if', cond, body, iter(rest)];
  //       }
  //       return body == undefined ? 'null' : body;
  //     }
  //     return 'null';
  //   }
  //   return iter(conds);
  // }

  transformSwitchToIf(switchExp) {
    const [_tag, ...cases] = switchExp;
    if (cases.length) {
      const [[cond, body]] = cases.slice(-1);
      if (!body) throw new SyntaxError(`Empty case body! ${JSON.stringify(switchExp)}`);
      return cases
            .slice(0, -1)
            .reduceRight((tail, [cond, body]) => ['if', cond, body, tail],
          cond === 'else' ? body : ['if', cond, body, 'null']);
    }
    throw new SyntaxError(`Empty switch body! ${JSON.stringify(switchExp)}`);

  }

  transformForToWhile(forExp) {
    const [_tag, init, condition, modifier, exp] = forExp;
    return ['begin', init, ['while', condition, ['begin', exp, modifier]]];
  }

  transformIncToSet(incExp) {
    const [_tag, exp] = incExp;
    return ['set', exp, ['+', exp, 1]];
  }

  transformDecToSet(incExp) {
    const [_tag, exp] = incExp;
    return ['set', exp, ['-', exp, 1]];
  }

  transformIncValToSet(incExp) {
    const [_tag, exp, val] = incExp;
    return ['set', exp, ['+', exp, val]];
  }

  transformDecValToSet(incExp) {
    const [_tag, exp, val] = incExp;
    return ['set', exp, ['-', exp, val]];
  }
}

module.exports = Transformer;
