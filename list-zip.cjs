const AdmZip = require('adm-zip');
const zip = new AdmZip('website.zip');
const entries = zip.getEntries();
console.log(entries.slice(0, 20).map(e => e.entryName).join('\n'));
