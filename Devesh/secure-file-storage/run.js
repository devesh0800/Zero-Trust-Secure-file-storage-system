import fs from 'fs';
import('./src/server.js').catch(e => {
    fs.writeFileSync('err.txt', e.message + '\n' + e.stack);
});
