import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// ANSI Escape Codes for Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    red: "\x1b[31m",
    bgBlue: "\x1b[44m"
};

const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;

if (!MASTER_KEY) {
    console.error(`${colors.red}ERROR: MASTER_ENCRYPTION_KEY not found in .env file!${colors.reset}`);
    process.exit(1);
}

async function runDemo() {
    console.log(`\n${colors.bgBlue}${colors.bright}  ZERO-TRUST ENCRYPTION DEMO FOR MENTOR  ${colors.reset}\n`);

    // --- STEP 1: ORIGINAL DATA ---
    const originalText = "SECRET DATA: This is a highly confidential document for the Zero-Trust system.";
    const originalBuffer = Buffer.from(originalText);

    console.log(`${colors.bright}[STEP 1: Original Data]${colors.reset}`);
    console.log(`${colors.cyan}Plaintext:${colors.reset} "${originalText}"`);
    console.log(`${colors.cyan}Size:${colors.reset} ${originalBuffer.length} bytes`);
    console.log("-".repeat(50));

    // --- STEP 2: PER-FILE KEY GENERATION ---
    console.log(`${colors.bright}[STEP 2: Per-File Key Generation]${colors.reset}`);
    const fileKey = crypto.randomBytes(32); // 256-bit unique key
    const contentIV = crypto.randomBytes(16); // Random IV

    console.log(`${colors.yellow}Unique File Key (Generated):${colors.reset} ${fileKey.toString('hex')}`);
    console.log(`${colors.yellow}Initialization Vector (IV):${colors.reset} ${contentIV.toString('hex')}`);
    console.log(`${colors.dim}Note: This key is unique to THIS file only.${colors.reset}`);
    console.log("-".repeat(50));

    // --- STEP 3: FILE ENCRYPTION (AES-256-GCM) ---
    console.log(`${colors.bright}[STEP 3: File Encryption (AES-256-GCM)]${colors.reset}`);
    const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, contentIV);
    const encryptedContent = Buffer.concat([cipher.update(originalBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    console.log(`${colors.green}Encrypted Content (Binary):${colors.reset} ${encryptedContent.toString('hex').substring(0, 60)}...`);
    console.log(`${colors.green}Authentication Tag (GCM):${colors.reset} ${authTag.toString('hex')}`);
    console.log(`${colors.magenta}Status:${colors.reset} File is now UNREADABLE without the unique File Key.`);
    console.log("-".repeat(50));

    // --- STEP 4: ENCRYPTING THE FILE KEY (THE ZERO-TRUST PART) ---
    console.log(`${colors.bright}[STEP 4: Encrypting the File Key (Master Key Protection)]${colors.reset}`);
    const masterKeyBuffer = Buffer.from(MASTER_KEY, 'hex');
    const keyIV = crypto.randomBytes(16);
    const keyCipher = crypto.createCipheriv('aes-256-gcm', masterKeyBuffer, keyIV);
    const encryptedFileKey = Buffer.concat([keyCipher.update(fileKey), keyCipher.final()]);
    const keyAuthTag = keyCipher.getAuthTag();

    console.log(`${colors.blue}Encrypted File Key:${colors.reset} ${encryptedFileKey.toString('base64')}`);
    console.log(`${colors.dim}This is what we store in the Database. Even if the DB leaks, the hiker needs the MASTER_KEY from .env to decrypt this.${colors.reset}`);
    console.log("-".repeat(50));

    // --- STEP 5: DECRYPTION FLOW ---
    console.log(`${colors.bright}[STEP 5: Decryption Flow]${colors.reset}`);
    console.log("1. Fetching Encrypted File Key and IV from Database...");
    console.log("2. Decrypting File Key using Master Key from .env...");

    // Decrypt Key
    const keyDecipher = crypto.createDecipheriv('aes-256-gcm', masterKeyBuffer, keyIV);
    keyDecipher.setAuthTag(keyAuthTag);
    const decryptedFileKey = Buffer.concat([keyDecipher.update(encryptedFileKey), keyDecipher.final()]);

    console.log(`   ${colors.green}✔ File Key successfully recovered.${colors.reset}`);

    // Decrypt Content
    console.log("3. Decrypting File Content using Recovered Key...");
    const contentDecipher = crypto.createDecipheriv('aes-256-gcm', decryptedFileKey, contentIV);
    contentDecipher.setAuthTag(authTag);
    const decryptedContent = Buffer.concat([contentDecipher.update(encryptedContent), contentDecipher.final()]);

    console.log(`   ${colors.green}✔ Content successfully decrypted.${colors.reset}`);
    console.log("-".repeat(50));

    // --- STEP 6: FINAL VALIDATION ---
    console.log(`${colors.bright}[STEP 6: Final Validation]${colors.reset}`);
    console.log(`${colors.cyan}Decrypted Text:${colors.reset} "${decryptedContent.toString()}"`);

    if (decryptedContent.toString() === originalText) {
        console.log(`\n${colors.bgBlue}${colors.bright}  SUCCESS: Zero-Trust Encryption Verified!  ${colors.reset}\n`);
        console.log(`${colors.bright}Mentor Summary:${colors.reset}`);
        console.log("1. Plaintext never stored.");
        console.log("2. Every file has a unique key.");
        console.log("3. Keys are protected by the Master Key.");
        console.log("4. Tampering detection via GCM Auth Tags.");
    } else {
        console.log(`${colors.red}FAILURE: Content Mismatch!${colors.reset}`);
    }
}

runDemo().catch(err => {
    console.error(err);
});


//Step 1 (Original Data): Aapka asali message (Plaintext) kya hai.
//Step 2 (Key Generation): Har file ke liye ek Unique 256-bit Key kaise banti hai.
//Step 3 (AES-256-GCM Encryption): Data kaise unreadable binary mein badal jata hai aur Auth Tag kaise integrity check karta hai.
//Step 4 (Zero-Trust Part): Wo unique key khud kaise Master Key (jo .env mein hai) se encrypt hoti hai database ke liye.
//Step 5 (Decryption Flow): Kaise system database se key nikalta hai aur file ko wapas asali state mein lata hai.
//Step 6 (Success Verification): Final confirmation ki data waisa hi hai jaisa bhejha tha.