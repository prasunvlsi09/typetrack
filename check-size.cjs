const fs = require('fs');
const stats = fs.statSync('website.zip');
console.log('Size in MB:', stats.size / (1024 * 1024));
