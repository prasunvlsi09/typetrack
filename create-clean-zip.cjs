const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zip = new AdmZip();
const rootDir = process.cwd();

const allowedFiles = [
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'server.ts',
  'firebase-applet-config.json',
  'firebase-blueprint.json',
  'firestore.rules',
  'metadata.json',
  '.env.example',
  '.gitignore'
];

const allowedDirs = [
  'src',
  'public'
];

function addDirectoryToZip(dirPath, zipPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath, path.join(zipPath, item));
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

console.log('Creating clean website.zip...');

// Add allowed files
for (const file of allowedFiles) {
  if (fs.existsSync(path.join(rootDir, file))) {
    zip.addLocalFile(path.join(rootDir, file), '');
  }
}

// Add allowed directories
for (const dir of allowedDirs) {
  if (fs.existsSync(path.join(rootDir, dir))) {
    addDirectoryToZip(path.join(rootDir, dir), dir);
  }
}

zip.writeZip(path.join(rootDir, 'website.zip'));
console.log('Successfully created clean website.zip!');
