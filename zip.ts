import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
const rootDir = process.cwd();

function addFolder(dirPath: string, zipPath: string) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (['node_modules', 'dist', '.git', 'zip.ts', 'zip-cloudflare.ts', 'verify-zip.ts', 'website.zip', 'cloudflare.zip', 'typetrack-website.zip'].includes(file)) continue;
    
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      zip.addLocalFolder(fullPath, path.join(zipPath, file));
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

try {
  addFolder(rootDir, '');
  zip.writeZip('website.zip');
  console.log('Successfully created website.zip');
} catch (err) {
  console.error('Error creating zip:', err);
}
