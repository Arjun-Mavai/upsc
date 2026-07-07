const fs = require('fs');
const files = [
  'src/app/admin/support-inbox/page.tsx',
  'src/actions/support-inbox-actions.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/MPPSC/g, 'UPSC');
  content = content.replace(/mppsc/g, 'upsc');
  fs.writeFileSync(file, content);
});
console.log('✅ Replaced MPPSC with UPSC in support inbox files');
