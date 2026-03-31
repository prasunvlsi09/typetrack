const AdmZip = require('adm-zip');
try {
  const zip = new AdmZip('cloudflare.zip');
  zip.extractEntryTo('test-think.ts', './', false, true);
  console.log('extracted from cloudflare.zip');
} catch (e) {
  try {
    const zip2 = new AdmZip('typetrack-website.zip');
    zip2.extractEntryTo('test-think.ts', './', false, true);
    console.log('extracted from typetrack-website.zip');
  } catch (e2) {
    console.log('not found');
  }
}
