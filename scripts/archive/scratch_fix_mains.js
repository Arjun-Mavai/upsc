const fs = require('fs');
const path = require('path');

const dirsToProcess = [
  'src/app/admin/mains',
  'src/app/admin/mains-pyq',
  'src/app/mains',
  'src/components/mains',
  'src/components/MainsPremiumMarketing.tsx',
  'src/features/mains'
];

const actionFiles = fs.readdirSync('src/actions').filter(f => f.startsWith('mains-'));
const actionPaths = actionFiles.map(f => path.join('src/actions', f));

const allPaths = [...dirsToProcess, ...actionPaths];

function walk(dir, fileList = []) {
  if (fs.statSync(dir).isFile()) {
    if (dir.endsWith('.ts') || dir.endsWith('.tsx')) {
      fileList.push(dir);
    }
    return fileList;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let targetFiles = [];
for (const p of allPaths) {
  if (fs.existsSync(p)) {
    targetFiles = targetFiles.concat(walk(p));
  }
}

let modifiedFiles = 0;

for (const file of targetFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace mppscMainsUsers with mppscUsers
  content = content.replace(/mppscMainsUsers/g, 'mppscUsers');
  
  // Replace examType references
  content = content.replace(/'mppsc_mains'/g, "'upsc'");
  content = content.replace(/"mppsc_mains"/g, "'upsc'");
  
  // Replace text references 
  content = content.replace(/MPPSC Mains/g, 'UPSC Mains');
  content = content.replace(/MPPSC/g, 'UPSC');
  
  // Product grants replace
  content = content.replace(/"mppsc_mains"/g, '"upsc_mains"');
  content = content.replace(/"mppsc_pre"/g, '"upsc_pre"');

  if (content !== original) {
    fs.writeFileSync(file, content);
    modifiedFiles++;
  }
}

console.log(`Modified ${modifiedFiles} files.`);
