# 🛡️ Secure File Storage - Manual Testing Guide

Ye guide aapko step-by-step batayegi ki saare advanced security features ko manually kaise test karna hai using Postman, Thunder Client (VS Code), ya Frontend UI.

---

## 1️⃣ Login & MFA Security

### Test Password Policy & Brute Force Protection
1. **Action:** Ek naya account banane ki koshish karo with weak password (e.g., `pass123`).
   * **Result:** Reject hona chahiye (Minimum 12 chars, Upper, Lower, Number, Special char required).
2. **Action:** Kisi existing account pe 4-5 baar galat password dalo.
   * **Result:** 4th attempt pe account 15 minutes ke liye lock ho jana chahiye. `403 Account is locked` error aayega.

### Test MFA (Multi-Factor Authentication)
1. **Action:** `/api/v1/auth/mfa/setup` pe POST request bhejo.
   * **Result:** Auth app me scan karne ke liye QR code (base64) aur secret milega.
2. **Action:** Auth app ka code daal ke `/api/v1/auth/mfa/verify-setup` pe bhejo.
   * **Result:** MFA enable ho jayega.
3. **Action:** Logout karke wapas login karo.
   * **Result:** Seedha login nahi hoga. Response me `mfa_required: true` and `temp_token` aayega. Us temp_token ke sath `/api/v1/auth/verify-mfa` call karke final tokens lene honge.

---

## 2️⃣ Device Fingerprinting (Zero Trust)

Jab bhi aap naye device (ya browser) se login karte ho, system usko track karta hai.

1. **Action:** Apne normal browser me login karo. System isko "Device A" maan lega.
2. **Action:** Dusra browser (jaise Edge ya Firefox) open karo, ya incognito mode me jao, aur wahan se login karo.
3. **Result:** Login to ho jayega, but Postman/Browser se `GET /api/v1/admin/devices` hit karke dekho. Aapko dono alag-alag devices wahan dikhenge.
4. **Log Check:** `src/logs/security.log` file open karo. Aapko `🚨 SUSPICIOUS_ACTIVITY` alert dikhega jisme likha hoga `NEW DEVICE DETECTED`.

---

## 3️⃣ Secure File Upload & Virus Scan

### Test File Extension Blocker
1. **Action:** Ek `.txt` file banao aur uska naam change karke `test.exe` ya `script.sh` rakh do.
2. **Action:** Upload endpoint `/api/v1/files/upload` pe ye file bhejo.
3. **Result:** Scanner turant block kar dega aur `403 Security Scan Failed` dega kyunki `.exe` allowed nahi hai.

### Test Content Heuristics Backup
1. **Action:** Ek normal `.txt` file banao jisme ye text ho: `<script>alert('hack')</script>`
2. **Action:** Upload karo.
3. **Result:** Scanner file content ko check karega aur XSS injection detect karke file block kar dega!

---

## 4️⃣ File Encryption & Integrity

Files kabhi bhi plain text me server pe save nahi hoti hain.

1. **Action:** Ek secret text (`"My Secret Data"`) wali `.txt` file upload karo.
2. **Action:** Code editor me `uploads/` folder check karo.
3. **Result:** Wahan par ek random naam wali file hogi (e.g. `uuid_temp` ya encrypted hash). Agar usko open karoge to sab "kachra" (Garbage/Encrypted binary) dikhega. Original text directly padha nahi ja sakta.
4. **Action:** Apna download endpoint use karke file download karo.
5. **Result:** Downloaded file me exact `"My Secret Data"` wapas properly decrypt hoke milega. (SHA-256 integrity check pass hoga).

---

## 5️⃣ Secure Signed Download Links

File share karne ke liye permanent link nahi banta.

1. **Action:** Kisi uploaded file pe `/api/v1/files/:id/signed-url` hit karo.
2. **Result:** Ek bada sa temporary `token` aur `downloadUrl` milega.
3. **Action:** Us URL ko copy karke directly browser me paste karo (bina kisi token header ke). File download ho jayegi.
4. **Action:** URL me se token ka ek bhi letter delete ya change karke try karo.
5. **Result:** `403 Invalid signature` aayega aur file access nahi hogi. (Link sir 5 minutes tak valid rahega).

---

## 6️⃣ Intrusion Detection System (IDS)

Ye middleware constantly SQL injection, path traversal, aur hacker tools ko block karta hai.

### Test SQL Injection Blocker
1. **Action:** Login endpoint `/api/v1/auth/login` pe email daalo: `' OR 1=1 --` aur password me kuch bhi dalo.
2. **Result:** Invalid details hone ke bawajood directly normal error nahi aayega, ye IDS log me record ho jayega.

### Test Path Traversal
1. **Action:** Kisi file ID ki jagah `../../../etc/passwd` leke `/api/v1/files/../../../etc/passwd` hit karo.
2. **Result:** Request block ho jayegi aur IDS usko log kar lega.

### Test IP Blocking
1. **Action:** Agar aap lagaatar 10 baar aise "hacking" wale attacks karoge, to aapka IP block ho jayega.
2. **Result:** Agli koi bhi normal request karne pe `403 Access temporarily blocked due to suspicious activity` aayega.
3. **Verification:** `GET /api/v1/admin/ids/status` hit karke dekho (kisi aur non-blocked machine ya IP mask se, ya local host pe hi pehle run karke dekho). Aapko apna IP "blocked" devices list me dikh jayega.

---

## 7️⃣ Encrypted Backup System

Database ka secure backup kaise banta hai.

1. **Action:** `POST /api/v1/admin/backup` pe request bhejo.
2. **Result:** Success response aayega.
3. **Action:** Project folder me `backups/` name ka folder check karo.
4. **Result:** Wahan ek `.enc` file (AES-256 Encrypted Database backup) aur ek `.meta.json` (usko decrypt karne ki info) file generate ho chuki hogi. Original `.sqlite` database ka duplicate backup directly accessible(hackable) form me ahi hoga.
