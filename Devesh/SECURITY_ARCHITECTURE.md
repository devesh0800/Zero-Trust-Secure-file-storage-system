# Security Architecture & Encryption Strategy: SecureVault (Zero-Trust)

Namaste Security Expert! Is document mein humne **Vault's Encryption Blueprint** aur **Zero-Trust Security layer** ko explain kiya hai. Humne isse developer-friendly aur auditor-friendly banaya hai.

---

## 1. **The Core Philosophy: Zero-Knowledge** 🧠
Hamara goal hai: **"Hum aapki files kabhi nahi dekh sakte."** 
Backend sirf encrypted metadata aur file chunks store karta hai. Transcription ya decryption client device par hi hota hai.

---

## 2. **Encryption Strategy (The "How?")** 🔐
Humne **Military-grade encryption** layers use ki hain:

### **A. AES-256-GCM (symmetric)**
*   Har file ke liye frontend par ek **Unique AES Key** generate hoti hai.
*   Encryption ke liye `GCM` mode use kiya hai jo data integrity check bhi deta hai (Authentication tag).
*   Encrypted file tab tak useless hai jab tak user ke account key se use decrypt na kiya jaye.

### **B. Asymmetric Key Pairs (RSA / Ed25519)**
*   Registration ke waqt frontend ek **Public/Private Key Pair** generate karta hai.
*   **Public Key:** Backend par save hoti hai taaki dusre users files share kar saken.
*   **Private Key:** Sabse sensitive part! Ye backend par kabhi nahi jati.

### **C. The Security PIN (Zero-Knowledge Key Protection)** 🔑
*   User ki **Private Key** ko frontend local storage mein encrypt kar ke save karta hai.
*   Ye encryption **User's 6-digit Security PIN** par based hoti hai (derived key).
*   **Why PIN?** Agar koi user ka laptop chura le, tab bhi private key encrypted rahegi bina PIN ke.

---

## 3. **Authentication Security Flows** 🚪
1.  **JWT Layer:** Humne standard JWT auth flow use kiya hai Access/Refresh tokens ke saath.
2.  **MFA Layer:** `speakeasy` library se humne Google Authenticator support diya hai.
3.  **OTP Layer:** Unrecognized devices ya new logins ke liye transactional OTP flow hai (`nodemailer`).

---

## 4. **Defense in Depth (Extra Layers)** 🛡️
Humne sirf encryption par nahi, in layers par bhi focus kiya hai:
*   **Rate Limiting:** `express-rate-limit` se API abuse aur brute force attacks block kiye hain.
*   **NoSQL / XSS Prevention:** Inputs ko sanitize kiya jata hai using `mongo-sanitize` aur `xss-clean`.
*   **Audit Logging:** Winston se hum security-relevant events track karte hain (failed logins, unauthorized access).
*   **Account Lockout:** Multiple failed attempts ke baad account temporarily disable ho jata hai.

---

## 5. **Security Checklist for Developers** 💡
1.  **Keys:** Kabhi bhi keys ko hard-code na karein. Humesha `.env` se secrets read karein.
2.  **HTTPS:** Production par bina SSL ke API use na karein kyunki MITM attack se data leak ho sakta hai.
3.  **Audit:** Humesha database schemas check karein taaki plaintext passwords/keys store na hon. (BCRYPT use kiya gaya hai with cost factor 12).

---

**Summary:** 
SecureVault sirf encryption tool nahi hai, ye ek **Chain of Trust** hai. Har link (Frontend, PIN, Backend) securely connect hota hai bina sensitive info reveal kiye. 🛡️
