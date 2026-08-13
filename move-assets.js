const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'app', 'assets');
const dest = path.join(__dirname, 'src', 'assets');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

function copyDir(s, d) {
  fs.readdirSync(s).forEach(f => {
    const srcPath = path.join(s, f);
    const dstPath = path.join(d, f);
    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(dstPath)) {
        fs.mkdirSync(dstPath);
      }
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  });
}

copyDir(src, dest);
fs.rmSync(src, { recursive: true });
console.log('Assets moved successfully');
