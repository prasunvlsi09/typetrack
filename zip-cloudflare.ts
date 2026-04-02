import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
const distDir = path.resolve(process.cwd(), 'dist');

try {
  if (fs.existsSync(distDir)) {
    zip.addLocalFolder(distDir);
    zip.writeZip('cloudflare.zip');
    console.log('Successfully created cloudflare.zip');
  } else {
    console.error('dist folder not found. Run npm run build first.');
  }
} catch (err) {
  console.error('Error creating zip:', err);
}
