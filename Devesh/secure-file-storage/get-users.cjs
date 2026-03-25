const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.all('SELECT username, created_at, mfa_enabled FROM users', (err, rows) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
  });
});
