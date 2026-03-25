const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.all('SELECT username, created_at, mfa_enabled FROM users', (err, rows) => {
    if (err) {
      console.error("Error:", err);
    } else {
      fs.writeFileSync('./credentials_utf8.json', JSON.stringify(rows, null, 2), 'utf8');
    }
    db.close();
  });
});
