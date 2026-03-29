import AdmZip from 'adm-zip';
import fs from 'fs';

try {
  const zip = new AdmZip();
  zip.addLocalFolder('./dist');
  zip.writeZip('./website.zip');
  console.log('Successfully zipped dist folder to website.zip');
} catch (e) {
  console.error('Failed to zip dist folder:', e);
}
