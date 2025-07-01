const fs = require('fs');
const vm = require('vm');
const path = require('path');

function runFile(file) {
  const code = fs.readFileSync(file, 'utf-8');
  const script = new vm.Script(code, { filename: file });
  const context = {
    require,
    console,
    __dirname: path.dirname(file),
    __filename: file,
    module,
    exports,
    describe: (name, fn) => { fn(); },
    it: (msg, fn) => { fn(); },
  };
  script.runInNewContext(context);
}

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js'));
files.forEach(f => runFile(path.join(__dirname, f)));
console.log('All tests passed');
