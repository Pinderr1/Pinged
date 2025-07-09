const fs = require('fs');
const path = require('path');

function parseImports(code) {
  const importRegex = /^import\s+([^'";]+)\s+from\s+['"][^'"]+['"]/gm;
  const imports = [];
  let match;
  while ((match = importRegex.exec(code))) {
    const statement = match[1].trim();
    // default import or named imports
    if (statement.startsWith('{')) {
      // named imports
      const names = statement
        .replace(/[{}]/g, '')
        .split(',')
        .map(s => {
          const parts = s.trim().split(' as ');
          return parts[1] ? parts[1] : parts[0];
        });
      imports.push(...names);
    } else if (statement.includes(',')) {
      const [defaultName, namedPart] = statement.split(',');
      imports.push(defaultName.trim());
      const names = namedPart
        .replace(/[{}]/g, '')
        .split(',')
        .map(s => {
          const parts = s.trim().split(' as ');
          return parts[1] ? parts[1] : parts[0];
        });
      imports.push(...names);
    } else {
      const parts = statement.split(' as ');
      const name = parts[1] ? parts[1].trim() : parts[0].trim();
      if (name !== '*') {
        imports.push(name);
      }
    }
  }
  return imports;
}

function findUnused(file) {
  const code = fs.readFileSync(file, 'utf8');
  const imports = parseImports(code);
  const restCode = code.replace(/^import[^\n]+\n/gm, '');
  const unused = imports.filter(name => !new RegExp('\\b' + name + '\\b', 'm').test(restCode));
  return unused;
}

const dirs = ['screens', 'components'];
for (const dir of dirs) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js') && !file.endsWith('.tsx')) continue;
    const filepath = path.join(dir, file);
    const unused = findUnused(filepath);
    if (unused.length) {
      console.log(filepath + ': ' + unused.join(', '));
    }
  }
}
