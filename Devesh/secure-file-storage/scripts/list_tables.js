
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- List of Tables ---');
        rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });
        console.log('---------------------');
        console.log(`Total Tables: ${rows.length}`);
    }
    db.close();
});
