import express from 'express';
import { sendOTP, verifyOTPHandler } from "../controllers/otp.controller.js";

const router = express.Router();

// Route for requesting a new OTP (GET for browser check, POST for real use)
router.get("/send-otp", (req, res) => res.send("OTP Service is Online! Please use POST request to send an email."));
router.post("/send-otp", sendOTP);

// Route for verifying an OTP (GET for browser check, POST for real use)
router.get("/verify-otp", (req, res) => res.send("Verification Service is Online!"));
router.post("/verify-otp", verifyOTPHandler);

export default router;
