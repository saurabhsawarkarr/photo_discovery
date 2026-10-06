const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', (filePath) => {
  if (filePath.endsWith('.module.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Dark to Light palette mapping
    content = content.replace(/rgba\(30,\s*41,\s*59,\s*[0-9.]+\)/g, '#ffffff');
    content = content.replace(/rgba\(15,\s*23,\s*42,\s*[0-9.]+\)/g, '#f8f9fa');
    content = content.replace(/rgba\(51,\s*65,\s*85,\s*[0-9.]+\)/g, '#e0e0e0');
    content = content.replace(/#f8fafc/g, '#202124');
    content = content.replace(/#e2e8f0/g, '#3c4043');
    content = content.replace(/#94a3b8/g, '#5f6368');
    content = content.replace(/#cbd5e1/g, '#3c4043');
    content = content.replace(/#0f172a/g, '#ffffff');
    content = content.replace(/#334155/g, '#dadce0');
    fs.writeFileSync(filePath, content);
  }
});
