# Frontend Architecture: SecureVault (Zero-Trust E2EE)

Namaste Dev! Is document mein humne frontend ke **Core Architecture**, **Security Flow**, aur **Technical Stack** ko explain kiya hai. Is vault ko humne purely **Zero-Knowledge** and **End-to-End Encrypted (E2EE)** banaya hai.

---

## 1. **Core Technical Stack** 🛠️
Humne modern technology use ki hai taaki system fast, secure, aur maintainable rahe:
*   **Next.js (App Router):** Humne Next.js 16 (App Router) use kiya hai routing aur performance ke liye.
*   **Tailwind CSS:** Pure visual excellence ke liye Tailwind use kiya hai with custom glassmorphism effects.
*   **TypeScript:** Type-safety ke liye, taaki dev errors kam ho sakein.
*   **Browser Crypto API:** Standard `SubtleCrypto` API use kiya hai for all AES-GCM operations.

---

## 2. **Architecture Components** 🏗️
Frontend architecture ko humne 3 major layers mein divide kiya hai:

### **A. UI / Component Layer (App Router)**
*   **Pages:** `login`, `register`, aur `dashboard` pages hamare primary entrance points hain.
*   **Components:** Hamare reusable UI elements (Modals, Navbars, FileCards) yahan handle hote hain.
*   **AuthGuard:** Yeh layer ensure karti hai ki unauthenticated users files access na kar payein.

### **B. State Management (`lib/auth-context.tsx`)**
*   Yahan humne **React Context API** ka use kiya hai user sessions, MFA status, aur tokens ko centralize karne ke liye.
*   `login`, `verifyMfa`, aur `logout` functions isi context se global access hote hain.

### **C. Encryption & API Layer (`lib/crypto.ts` & `lib/api.ts`)**
*   **Crypto Layer:** Sabse important part! Jab bhi user file upload karta hai, use frontend par hi encrypt kiya jata hai before sending it to the server.
*   **API Layer:** `axios` use karke hum backend se communicate karte hain. Custom error classes (`ApiError`) handle ki gayi hain detailed feedback dene ke liye.

---

## 3. **The Security Flow (Why & How?)** 🔐

### **Why Zero-Trust?**
Hum chahte hain ki **Server ko kabhi bhi user ka data pata na chale**. Agar backend compromise ho jaye, tab bhi user ki files encrypted rahengi kyunki encryption keys client-side par hoti hain.

### **How it works step-by-step:**
1.  **Identity Generation:** Jab user register karta hai, frontend ek public/private key pair generate karta hai (`lib/crypto.ts`).
2.  **Key Protection:** User ka **Security PIN** use karke hum uski *Private Key* ko local browser storage mein encrypt karke save karte hain. Yeh PIN backend par kabhi nahi jata.
3.  **File Upload (E2EE):** 
    *   File select karo -> Frontend ek random AES key generate karta hai.
    *   File ko encrypt kiya jata hai using AES-256-GCM.
    *   Final encrypted blob aur 'per-file-key' ko server par bheja jata hai.
4.  **Security PIN Validation:** Har file download ya sensitive action ke waqt user se PIN manga jata hai. Kyunki private key PIN se hi decrypt hogi, server handle nahi kar sakta bina PIN ke.

---

## 4. **Visual & Aesthetic Decisions** ✨
Humne **Premium Dark Aesthetic** follow kiya hai:
*   **Ambient Glows:** Use kiye hain interactive feels ke liye.
*   **Glassmorphism:** Divs ko translucent banaya hai with `backdrop-blur`.
*   **Consistent Theme:** Indigo aur Violet color palette ka use kiya hai for a professional look.

---

## 5. **Developer Tips** 💡
1.  **Local Dev:** Debugging ke liye humne captcha bypass (`0000`) enable kiya hai in `NODE_ENV === 'development'`.
2.  **State Logic:** Koi bhi new auth feature implement karna ho toh humesha `auth-context.tsx` upgrade karein, pages individual states handle nahi karte.
3.  **Error Handling:** API errors humesha Toast notification ya form indicators ke through user ko proper "Hinglish/English" feedback dete hain.

---

**Summary:** 
Human error kam karne aur data privacy maximum karne ke liye humne automation and E2EE par focus kiya hai. Is architecture ke saath hamara application **Highly Scalable and Cyber-Secure** hai! 🚀
