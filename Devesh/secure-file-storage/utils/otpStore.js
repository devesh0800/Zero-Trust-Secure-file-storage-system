import bcrypt from 'bcrypt';

// In-memory store (dev) — production me Redis use karo
const otpStore = new Map();

/**
 * Save OTP to in-memory store
 * @param {string} email - User email
 * @param {string} otp - Plain text OTP
 */
export const saveOTP = (email, otp) => {
  const expiry = Date.now() + 10 * 60 * 1000; // 10 min
  const hashed = bcrypt.hashSync(otp, 10);
  otpStore.set(email, { hashed, expiry, attempts: 0 });
  console.log(`[OTP Store] Code saved for ${email}`);
};

/**
 * Verify OTP from in-memory store
 * @param {string} email - User email
 * @param {string} inputOtp - OTP entered by user
 * @returns {object} { success: boolean, message: string }
 */
export const verifyOTP = (email, inputOtp) => {
  const record = otpStore.get(email);

  if (!record) {
    return { success: false, message: "OTP nahi mila ya expire ho gaya" };
  }

  if (Date.now() > record.expiry) {
    otpStore.delete(email);
    return { success: false, message: "OTP expire ho gaya" };
  }

  if (record.attempts >= 5) {
    otpStore.delete(email);
    return { success: false, message: "Bahut zyada galat attempts, dobara request karo" };
  }

  const isMatch = bcrypt.compareSync(inputOtp, record.hashed);

  if (!isMatch) {
    record.attempts += 1;
    return { success: false, message: "Galat OTP" };
  }

  // One-time use — delete after successful verify
  otpStore.delete(email);
  return { success: true, message: "OTP verified!" };
};

export default { saveOTP, verifyOTP };
