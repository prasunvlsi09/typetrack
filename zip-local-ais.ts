import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function createZip(filename: string) {
  const zip = new AdmZip();
  
  function addFolder(dirPath: string, zipPath: string) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (['node_modules', 'dist', '.git', 'zip.ts', 'zip-cloudflare.ts', 'verify-zip.ts', 'create-zip.ts', 'zip-local-ais.ts'].includes(file) || file.endsWith('.zip')) continue;
      
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
    zip.writeZip(filename);
    console.log(`Successfully created ${filename}`);
  } catch (err) {
    console.error(`Error creating ${filename}:`, err);
  }
}

createZip('local.zip');
createZip('ais.zip');
