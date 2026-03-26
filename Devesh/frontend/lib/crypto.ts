/**
 * Zero-Trust Crypto Utilities
 * Uses WebCrypto API for secure asymmetric and symmetric operations
 */

// Helper: Convert buffer to base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper: Convert base64 to buffer
export function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a new RSA-OAEP Key Pair for the user
 */
export async function generateIdentityKeys() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Derives an AES-GCM key from a 6-digit PIN using PBKDF2
 */
async function deriveKeyFromPin(pin: string, salt: Uint8Array) {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a Private Key with a user's PIN
 */
export async function encryptPrivateKey(privateKey: CryptoKey, pin: string) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptionKey = await deriveKeyFromPin(pin, salt);

    const exportedKey = await window.crypto.subtle.exportKey("pkcs8", privateKey);

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        encryptionKey,
        exportedKey
    );

    return {
        encryptedKey: bufferToBase64(encryptedContent),
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv)
    };
}

/**
 * Decrypts a Private Key using a user's PIN
 */
export async function decryptPrivateKey(
    encryptedBlob: { encryptedKey: string, salt: string, iv: string }, 
    pin: string
) {
    const salt = base64ToBuffer(encryptedBlob.salt);
    const iv = base64ToBuffer(encryptedBlob.iv);
    const encryptedData = base64ToBuffer(encryptedBlob.encryptedKey);
    
    const decryptionKey = await deriveKeyFromPin(pin, new Uint8Array(salt));

    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        decryptionKey,
        encryptedData
    );

    return await window.crypto.subtle.importKey(
        "pkcs8",
        decryptedKeyBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}

/**
 * Export Public Key as a Base64 string for server storage
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return bufferToBase64(exported);
}

/**
 * Decrypts a file's AES key using the user's RSA private key
 * (Phase 4: Final handshake)
 */
export async function decryptAesKey(encryptedKeyBase64: string, privateKey: CryptoKey): Promise<ArrayBuffer> {
    const encryptedData = base64ToBuffer(encryptedKeyBase64);
    
    return await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        privateKey,
        encryptedData
    );
}

/**
 * Decrypts a file blob using the unwrapped AES key and original IV
 */
export async function decryptFile(
    encryptedBlob: Blob,
    aesKey: ArrayBuffer,
    iv: string
): Promise<Blob> {
    const key = await window.crypto.subtle.importKey(
        "raw",
        aesKey,
        "AES-GCM",
        false,
        ["decrypt"]
    );

    const data = await encryptedBlob.arrayBuffer();
    const ivBuffer = base64ToBuffer(iv);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(ivBuffer),
        },
        key,
        data
    );

    return new Blob([decrypted]);
}

/**
 * Encrypts (wraps) an AES key with a recipient's RSA public key
 */
export async function wrapAesKey(
    aesKey: ArrayBuffer,
    recipientPublicKeySpkiBase64: string
): Promise<string> {
    const publicKeyBuffer = base64ToBuffer(recipientPublicKeySpkiBase64);
    
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );

    const wrapped = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        aesKey
    );

    return bufferToBase64(wrapped);
}
