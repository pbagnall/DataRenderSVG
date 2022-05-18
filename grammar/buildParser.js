import { execSync } from 'child_process';
import fs from 'fs';

console.log(process.cwd());
execSync('jison grammar/grammar.jison -m js -o grammar/parser.js');

let parserCode = "\n\nexport default parser;\n";
fs.appendFileSync('grammar/parser.js', parserCode);