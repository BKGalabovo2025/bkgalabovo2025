const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint-report3.json', 'utf8'));
data.forEach(f => {
  if (f.messages) {
    f.messages.forEach(m => {
      if (m.ruleId === 'sonarjs/no-nested-functions' || m.ruleId === 'sonarjs/no-nested-template-literals') {
        console.log(f.filePath.split('\\\\').pop() + ':' + m.line + ' [' + m.ruleId + '] ');
      }
    });
  }
});
