# Backend Architecture: SecureVault (The Fortified API)

Namaste Backend Dev! Is document mein humne **Express-based Secure API** ke architecture aur technical implementation ko explain kiya hai. Humne isse **Security-First** approach se design kiya hai.

---

## 1. **Technical Stack** 🛠️
Backend ko robust aur secure banane ke liye humne ye stack use kiya hai:
*   **Node.js & Express:** Modern, fast, aur flexible API logic ke liye.
*   **Sequelize (SQLite):** Database management ke liye humne SQLite use kiya hai, Sequelize ORM ke saath (Easy migrations and schema handling).
*   **JSON Web Tokens (JWT):** Short-lived `accessToken` aur persistent `refreshToken` strategy.
*   **Helmet & CORS:** HTTP Headers aur Cross-Origin requests ko restrict karne ke liye.
*   **Winston:** Professional enterprise-grade logging ke liye.

---

## 2. **Folder Structure & Modules** 🏗️
Hamara backend modular hai, har part ki ek clear responsibility hai:
*   **`src/controllers/`**: Saari business logic yahan rehti hai (e.g., handles file logic, auth logic).
*   **`src/routes/`**: API endpoints define hote hain (v1 versioning follow ki gayi hai).
*   **`src/middlewares/`**: Sabse critical part! Input validation, rate limiting, aur authentication yahan handle hota hai.
*   **`src/config/`**: Database connections aur app configuration (Environment variables validation).
*   **`src/utils/`**: Helper functions like hashing, encryption wrapper, aur logger.

---

## 3. **Core Backend Flows (How & Why?)** 🔐

### **A. Smart Middleware & Rate Limiting (Why?)**
"Brute force" aur DDOS attacks se bachne ke liye humne multiple layers use ki hain:
*   **Rate Limiter:** Authentication endpoints par strict 15-minute windows hain taaki account lock na ho jaye spamming se.
*   **Input Sanitization:** NoSQL query injection aur XSS se bachne ke liye `mongo-sanitize` aur `xss-clean` middlewares use kiye hain.

### **B. Authentication Strategy**
Backend **Double Verification** karta hai:
1.  **JWT Validation:** Check karta hai user authenticated hai ya nahi.
2.  **MFA Check:** Agar user account par MFA enabled hai, toh controller verify karne ki koshish karega before final processing.

### **C. File Management Architecture**
Files backend par "raw" storage mein nahi jati hain:
*   Frontend se encrypted file aati hai.
*   Backend use `uploads/` folder mein safely store karta hai.
*   Database sirf **Metadata** (encrypted keys, file name, MIME type) store karta hai.

---

## 4. **Scalability & Performance** 🚀
*   **Compression:** Response payloads ko compress kiya jata hai for faster speed.
*   **Async/Await:** Pure execution asynchronous hai taaki I/O operations block na karein request cycle ko.
*   **Migration Support:** Database schema changes gracefully handle hote hain via `migrate.js`.

---

## 5. **Developer Workflows** 💡
1.  **Testing:** Humne `Jest` aur `test-all-endpoints.js` scripts likhi hain. Humesha major changes ke baad ye run karein.
2.  **Logs:** `src/logs` check karein error tracking ke liye, winston bahut details deta hai about internal failures.
3.  **Environment:** `.env` file ko update karke production settings change ki ja sakti hain without code touch.

---

**Summary:** 
Backend ek **Guard Dog** ki tarah kaam karta hai—it never trusts the input. Har request validate, sanitize aur authenticate hoti hai before touch. 🛡️
