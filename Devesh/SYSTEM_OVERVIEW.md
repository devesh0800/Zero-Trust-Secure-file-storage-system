# System Design & Deployment Overview: SecureVault (Full Ecosystem)

Namaste Team Lead / Architect! Is document mein humne **Full Stack Ecosystem** aur **System Workflow** ko explain kiya hai. Ye document aapko development aur operational flow samajhne mein help karega.

---

## 1. **System Interaction (The "Big Picture")** 📐
Hamari total system do major modules se bani hui hai:

**[Frontend (Next.js)] <--- REST API (v1) ---> [Backend (Express/Node)]**

1.  **Frontend:** UI logic, file encryption/decryption, aur PIN management handle karta hai.
2.  **Backend:** API Gateway ki tarah kaam karta hai. Data persistence (SQLite), metadata storage, aur email notifications handle karta hai.

---

## 2. **Core Processes (Business Logic flow)** 🔄

### **A. User Lifecycle (Auth Flow)**
1.  **Registration:** Frontend keys generate karta hai -> User details encrypted PIN ke saath server par bheje jate hain -> Server user create karta hai aur metadata save karta hai.
2.  **Login:** User identity verify hoti hai via BCRYPT -> Agar MFA enabled hai, toh OTP/MFA verify hota hai -> Final short-lived JWT token generate hota hai.

### **B. File Lifecycle (Standard E2EE Flow)**
*   **Upload:** Select File -> Encrypt on Frontend -> Upload Encrypted Blob + Metadata to `/api/v1/files/upload`.
*   **Sharing:** Backend ek unique "Share Token" generate karta hai. Agar password protected hai, toh metadata mein flag set kiya jata hai.
*   **Download:** Fetch Metadata -> Prompt User for PIN -> Decrypt Private Key (locally) -> Decrypt File Content -> Provide File to User.

---

## 3. **Infrastructure & Deployment Tips** ☁️
Humne system ko flexible rakha hai taaki asani se deploy ho sake:
*   **Environment Variables:** `.env` file humara configuration source hai (Auth secrets, DB paths, App Port).
*   **Database:** Default **SQLite3** hai for production-ready persistence with low overhead.
*   **Storage:** Encrypted chunks local disk par store hote hain (`uploads/`). Inhe S3 ya cloud storage par asani se point kiya ja sakta hai.

---

## 4. **Developer Workflows** 🛠️
1.  **Setup:** `npm install` in both `frontend` and `secure-file-storage` folders.
2.  **Dev Run:** `npm run dev` se dono servers background mein chalte hain (Backend port 5000, Frontend port 3000).
3.  **Audit Logs:** System admin ke liye `src/logs` folder central repository hai logs ki (Error tracker).

---

## 5. **Future Roadmap & Enhancements** 🚀
*   **Multi-User Sharing:** Share files within groups.
*   **S3/Azure Storage:** Support for larger blob storage.
*   **Mobile App:** ReactNative integrated with the current REST API.
*   **AI Security:** AI-based anomaly detection (failed PIN attempts tracking).

---

**Summary:** 
SecureVault ek **Production-ready blueprint** hai. Iska modular design developers ko freedom deta hai parts change karne ki bina system break kiye. 💪
