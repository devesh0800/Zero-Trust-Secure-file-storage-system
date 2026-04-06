import { GoogleGenerativeAI } from '@google/generative-ai';
import { User, AuditLog, KnownDevice } from '../models/index.js';
import { logSecurityEvent } from './logger.js';
import crypto from 'crypto';

// In-memory store for active challenges (use Redis in production)
// Mapping: userId -> { expectedAnswers: [], expiresAt: timestamp, attempts: number }
const activeChallenges = new Map();

/**
 * AI Verification Engine - Mixed Input Protocol
 * Generates dynamic security questions (MCQ or Input)
 */

export async function generateChallenge(userId, ipAddress) {
    // 1. Fetch user context
    const recentLogs = await AuditLog.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10,
        attributes: ['event_type', 'ip_address', 'created_at']
    });

    const devices = await KnownDevice.findAll({
        where: { user_id: userId },
        order: [['last_used', 'DESC']],
        limit: 3,
        attributes: ['device_name', 'ip_address', 'first_seen', 'last_used']
    });

    const User = AuditLog.sequelize.models.users;
    const user = await User.findByPk(userId);

    let challengeData = null;

    // Use AI to generate 3 questions if API key is available
    if (process.env.GEMINI_API_KEY) {
        try {
            const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const prompt = `
You are the "Security Sentinel," a high-level identity verification AI for the SecureVault Zero-Trust Network. 
Your task is to generate exactly 3 challenging verification questions.

VERIFICATION DATA:
- Recent Logs: ${JSON.stringify(recentLogs)}
- Known Devices: ${JSON.stringify(devices)}
- User Profile: { "username": "${user.username}", "phone_suffix": "${user.phone_number ? user.phone_number.slice(-4) : 'None'}" }

CRITICAL GUIDELINES:
1. Each question must have a 'type': either 'mcq' (options list) or 'input' (user types answer).
2. For Phone Number: Ask for the last 4 digits as an 'input' type.
3. For Username: Ask as an 'input' type.
4. For Activity/Devices: Use 'mcq' with plausible fake options.
5. Use a cold, professional, security-focused tone.

Respond strictly in valid JSON format:
{
  "questions": [
    { "id": "q1", "type": "input", "question": "Question text here" },
    { "id": "q2", "type": "mcq", "question": "Question text", "options": ["A", "B", "C", "D"], "correctOptionIndex": 0 }
  ],
  "expectedAnswers": [
      { "type": "input", "value": "Correct Answer Content" },
      { "type": "mcq", "value": 0 }
  ]
}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            });

            challengeData = JSON.parse(response.text());
        } catch (error) {
            console.error('AI Generation Failed, falling back to heuristic mock:', error);
        }
    }

    // Fallback: Heuristic Challenge Generator (If AI is down or no key)
    if (!challengeData) {
        challengeData = generateFallbackChallenge(devices, recentLogs, user);
    }

    // Store the expected answers securely
    activeChallenges.set(userId, {
        expectedAnswers: challengeData.expectedAnswers,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes to answer
        attempts: 0
    });

    logSecurityEvent('ai_challenge_generated', { userId, ip: ipAddress });

    // Return questions WITHOUT the correct answers to the frontend
    return challengeData.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type || 'mcq',
        options: q.options || []
    }));
}

/**
 * Verify user's answers to the challenge
 */
export async function verifyAnswers(userId, answers) {
    const challenge = activeChallenges.get(userId);

    if (!challenge) {
        throw new Error('No active challenge found or it has expired');
    }

    if (Date.now() > challenge.expiresAt) {
        activeChallenges.delete(userId);
        throw new Error('Challenge expired. Please request a new one.');
    }

    challenge.attempts++;

    const User = AuditLog.sequelize.models.users;
    const user = await User.findByPk(userId);

    let isCorrect = true;

    for (let i = 0; i < challenge.expectedAnswers.length; i++) {
        const expected = challenge.expectedAnswers[i];
        const actual = answers[i];

        if (expected.type === 'mcq') {
            if (parseInt(actual) !== expected.value) isCorrect = false;
        } else if (expected.type === 'pin') {
            const pinMatch = await user.verifySecurityPin(actual);
            if (!pinMatch) isCorrect = false;
        } else if (expected.type === 'input') {
            if (actual?.toString().trim().toLowerCase() !== expected.value?.toString().toLowerCase()) isCorrect = false;
        }
        
        if (!isCorrect) break;
    }

    if (isCorrect) {
        activeChallenges.delete(userId);
        return true;
    }

    if (challenge.attempts >= 3) {
        activeChallenges.delete(userId);
        throw new Error('Authentication failed: Multiple unauthorized synchronization attempts detected.');
    }

    return false;
}

/**
 * Fallback Challenge Generator (Rule-based)
 */
function generateFallbackChallenge(devices, logs, user) {
    const questions = [];
    const expected = [];

    // 1. Username (Input)
    questions.push({ id: 'q1', type: 'input', question: 'Identity Protocol: Enter the unique administrative handle (Username) assigned to this node.' });
    expected.push({ type: 'input', value: user.username });

    // 2. Phone Suffix (Input)
    if (user.phone_number) {
        questions.push({ id: 'q2', type: 'input', question: 'Recovery Link Check: Enter the terminal 4 digits of the mobile device linked to this profile.' });
        expected.push({ type: 'input', value: user.phone_number.slice(-4) });
    } else {
        const defaultDevice = devices[0]?.device_name || 'Authorized Terminal';
        questions.push({ id: 'q2', type: 'mcq', question: 'Hardware Handshake: Identify the specific terminal profile used for your latest secure session.', options: [defaultDevice, 'Node/Android', 'Linux/Core-64', 'iPhone/Secure-iOS'].sort(() => Math.random() - 0.5) });
        const correctIdx = questions[questions.length-1].options.indexOf(defaultDevice);
        expected.push({ type: 'mcq', value: correctIdx });
    }

    // 3. Security PIN (PIN Validation)
    if (user.security_pin_hash) {
        questions.push({ id: 'q3', type: 'pin', question: 'Security Protocol: Enter the 6-digit synchronization code (Security PIN) required for node restoration.' });
        expected.push({ type: 'pin' });
    } else {
        const monthYear = new Date(user.created_at).toLocaleString('default', { month: 'long', year: 'numeric' });
        questions.push({ id: 'q3', type: 'mcq', question: 'Temporal Sync: Identify the specific month and year this Vault node was first commissioned.', options: [monthYear, 'January 2024', 'May 2023', 'December 2023'].sort(() => Math.random() - 0.5) });
        const correctIdx = questions[questions.length-1].options.indexOf(monthYear);
        expected.push({ type: 'mcq', value: correctIdx });
    }

    return { questions, expectedAnswers: expected };
}

export default { generateChallenge, verifyAnswers };
