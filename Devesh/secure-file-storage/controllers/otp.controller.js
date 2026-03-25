import { sendOTPEmail } from "../utils/mailer.js";
import { saveOTP, verifyOTP } from "../utils/otpStore.js";

// Rate limiting ke liye simple tracker
const requestTracker = new Map();

/**
 * Send OTP Controller
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Valid email do" });
  }

  // Rate limiting — 1 min me sirf 3 requests
  const now = Date.now();
  const tracker = requestTracker.get(email) || { count: 0, resetAt: now + 60000 };
  
  if (now > tracker.resetAt) { 
    tracker.count = 0; 
    tracker.resetAt = now + 60000; 
  }
  
  if (tracker.count >= 3) {
    return res.status(429).json({ message: "Bahut zyada requests, 1 min baad try karo" });
  }
  
  tracker.count++;
  requestTracker.set(email, tracker);

  // OTP generate karo
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    saveOTP(email, otp);
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP bhej diya gaya!" });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({ message: "Email bhejne mein error aaya" });
  }
};

/**
 * Verify OTP Controller
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const verifyOTPHandler = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email aur OTP dono chahiye" });
  }

  const result = verifyOTP(email, otp);
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  // ✅ Yahan JWT token bana sakte ho ya session set kar sakte ho
  res.json({ message: result.message });
};

export default { sendOTP, verifyOTPHandler };
