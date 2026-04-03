# Integration & API Strategy: SecureVault (The Connector Role)

Namaste Integration Specialist! Is document mein humne frontend aur backend ke beech ke **Digital Bridge** ko explain kiya hai. Hamara main focus **Connectivity, Data Sync, aur Error Handling** par hai.

---

## 1. **The Communication Layer** 📡
Frontend aur Backend ke beech ka communication **RESTful API Architecture** par based hai:
*   **Protocol:** HTTPS (in Production) aur HTTP (in Dev).
*   **Data Format:** JSON (Standard `application/json` payload).
*   **Base URL (Frontend):** `http://localhost:5000/api/v1` (Default in Dev).
*   **CORS Policy:** Backend par `cors` middleware configured hai taaki sirf authorized frontend (localhost:3000) hi request bhej sake.

---

## 2. **Authentication Flow (Handshake)** 🤝
Frontend aur Backend tab tak baat nahi karte jab tak user authenticate na ho:
1.  **Login Handshake:** Frontend (`api.ts`) credentials bhejta hai -> Backend JWT tokens vapas bhejta hai.
2.  **Bearer Authentication:** Har request ke header mein `Authorization: Bearer <TOKEN>` bhija jata hai.
3.  **Token Refresh:** `accessToken` expire hone par system automatically `refreshToken` se naya access mangta hai (Self-healing session).

---

## 3. **Critical API Endpoints Map** 🗺️
Integrators ko ye major endpoints yaad rakhne chahiye:
*   **AUTH:**
    *   `POST /auth/register`: New user metadata aur public key upload.
    *   `POST /auth/login`: Identity check aur MFA trigger.
*   **FILES:**
    *   `POST /files/upload`: Encrypted blob receive karta hai (`Multer` ka use).
    *   `GET /files`: User ki encrypted vault files fetch karta hai.
    *   `DELETE /files/:id`: Backend se file aur disk se chunk remove karta hai.
*   **SHARING:**
    *   `POST /share/create`: Public/Password-protected share link generate karna.

---

## 4. **Handling Failures (Error Mapping)** ⚠️
Integration Specialist ki duty hai ki Backend errors ko User-friendly messages mein transform kare:
*   **Status 401 (Unauthorized):** Dashboard se direct Login page par redirect (Auto-kick logic).
*   **Status 413 (Payload Too Large):** Frontend side pre-upload size check mechanism.
*   **Status 500 (Server Error):** Backend detailed logs (`winston`) likhta hai, frontend par "Try again later" message display hota hai.

---

## 5. **Syncing Environments & Logic** 🛠️
1.  **Frontend Config:** `lib/api.ts` mein base URL centrally managed hona chahiye. Hardcoded strings forbidden hain.
2.  **Encryption Sync:** Frontend jo key length (256-bit) use kar raha hai, backend use handle karne ki capacity rakhta hai (Metadata fields verification).
3.  **MFA Sync:** Frontend OTP inputs ko backend ke logic (`speakeasy`) ke saath format sync rakhta hai.

---

## 6. **Developer Tools for Integrators** 💻
*   **Postman/Insomnia:** Humne `test-all-endpoints.js` script banayi hai, jo API testing ke liye core documentation ka kaam karti hai.
*   **Chrome DevTools (Network Tab):** Humesha headers aur payloads ko monitor karein taaki plaintext leaks detect ho sakein.

---

**Summary:** 
Integration Specialist ek **Glue** ki tarah hota hai jo security, logical flows aur UI ko ek unified product mein convert karta hai. 💪🌐
