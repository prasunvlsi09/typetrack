import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
const rootDir = process.cwd();

function addDirectoryToZip(dirPath: string, zipPath: string) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    // Skip node_modules, dist, .git, and existing zip files
    if (['node_modules', 'dist', '.git', '.next'].includes(item) || item.endsWith('.zip')) {
      continue;
    }
    
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath, path.join(zipPath, item));
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

console.log('Creating website.zip...');
addDirectoryToZip(rootDir, '');
zip.writeZip(path.join(rootDir, 'website.zip'));
console.log('Successfully created website.zip!');
