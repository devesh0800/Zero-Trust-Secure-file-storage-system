import 'dotenv/config';
import express from 'express';
import otpRoutes from './routes/otp.routes.js';

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Welcome Route for browser testing
app.get("/", (req, res) => {
  res.send("<h1>🚀 OTP Server is Active!</h1><p>Send a POST request to <b>/api/auth/send-otp</b> with your email to start.</p>");
});

// Login Page Route (Fix for 'Cannot GET /login')
app.get("/login", (req, res) => {
  res.send(`
    <div style="font-family: Arial; padding: 50px; text-align: center;">
      <h1>🔒 Login Page</h1>
      <p>Please enter your email to receive an OTP.</p>
      <form action="/api/auth/send-otp" method="GET">
        <input type="email" placeholder="Enter Email" style="padding: 10px; width: 250px;"><br><br>
        <button type="submit" style="padding: 10px 20px; background: #4F46E5; color: white; border: none; cursor: pointer;">Send OTP</button>
      </form>
    </div>
  `);
});

// Register Page Route (Fix for 'Cannot GET /register')
app.get("/register", (req, res) => {
  res.send(`
    <div style="font-family: Arial; padding: 50px; text-align: center;">
      <h1>📝 Register Page</h1>
      <p>Create an account by verifying your email.</p>
      <form action="/api/auth/send-otp" method="GET">
        <input type="email" placeholder="Email Address" style="padding: 10px; width: 250px;"><br><br>
        <button type="submit" style="padding: 10px 20px; background: #10B981; color: white; border: none; cursor: pointer;">Create Account</button>
      </form>
    </div>
  `);
});

// Routes
app.use("/api/auth", otpRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server chal raha hai port ${PORT} pe`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/api/auth/send-otp\n`);
});
