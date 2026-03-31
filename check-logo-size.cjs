const fs = require('fs');
const stats = fs.statSync('public/logo.png');
console.log('Size in KB:', stats.size / 1024);
