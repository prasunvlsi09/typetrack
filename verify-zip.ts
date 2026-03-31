import AdmZip from 'adm-zip';

try {
  const zip = new AdmZip('./typetrack-website.zip');
  console.log('Zip is valid! Entries:', zip.getEntries().length);
} catch (e) {
  console.error('Zip is invalid!', e);
}
