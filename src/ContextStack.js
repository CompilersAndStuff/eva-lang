class ContextStack {
  constructor(globalEnvironment) {
    this.stack = [];
    this.pushFrame('<Global Environment>', globalEnvironment);
  }

  pushFrame(functionName, environment) {
    this.stack.push({ functionName, environment });
  }

  popFrame() {
    this.stack.pop();
  }

  purgeStack() {
    this.stack = [];
  }

  printStackTrace() {
    console.log(`Stacktrace: \n${this.stack.slice().reverse().map((frame, idx) => ` ${frame.functionName} `).join('\n')}`);
  }

  stackIsNotEmpty() {
    return !!this.stack.length;
  }
}

module.exports = ContextStack;
