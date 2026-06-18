/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs'); 
const data = JSON.parse(fs.readFileSync('eslint-report3.json', 'utf8')); 
const issues = []; 
data.forEach(f => {
  if (f.messages && f.messages.length > 0) {
    const filename = f.filePath.split('\\\\').pop().split('/').pop();
    f.messages.forEach(m => issues.push(`${filename}:${m.line} [${m.ruleId}] ${m.message}`));
  }
}); 
fs.writeFileSync('issues3.txt', issues.join('\n')); 
console.log('Wrote ' + issues.length + ' issues');
