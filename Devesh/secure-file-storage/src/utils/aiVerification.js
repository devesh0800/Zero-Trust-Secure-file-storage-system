import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuditLog, KnownDevice } from '../models/index.js';
import { logSecurityEvent } from './logger.js';
import crypto from 'crypto';

// In-memory store for active challenges (use Redis in production)
// Mapping: userId -> { expectedAnswers: [], expiresAt: timestamp, attempts: number }
const activeChallenges = new Map();

/**
 * AI Verification Engine
 * Generates dynamic security questions based on user's recent activity
 */

export async function generateChallenge(userId, ipAddress) {
    // 1. Fetch user's recent context
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

    // We need some mock data fallback in case user is brand new
    // or if the LLM fails/no API key is provided
    let challengeData = null;

    if (process.env.GEMINI_API_KEY) {
        try {
            const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const prompt = `
You are a strict security auditor. I will give you the recent login logs and known devices of a user.
Generate exactly 3 multiple choice questions to verify the user's identity based ONLY on this data.
Make the questions challenging but answerable by the real user.
Never output the raw IP addresses, output the city instead if you can infer it, or ask about the browser/OS.

Log Data: ${JSON.stringify(recentLogs)}
Device Data: ${JSON.stringify(devices)}

Respond strictly in valid JSON format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],
      "correctOptionIndex": 1
    }
  ]
}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
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
        challengeData = generateFallbackChallenge(devices, recentLogs);
    }

    // Store the expected answers securely
    const expectedAnswers = challengeData.questions.map(q => q.correctOptionIndex);
    
    activeChallenges.set(userId, {
        expectedAnswers,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes to answer
        attempts: 0
    });

    logSecurityEvent('ai_challenge_generated', { userId, ip: ipAddress });

    const responsePayload = challengeData.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
    }));

    // For automated testing in development mode only
    if (process.env.NODE_ENV === 'development') {
        return {
            questions: responsePayload,
            debug_correct_indices: expectedAnswers
        };
    }

    // Return questions WITHOUT the correct answers
    return responsePayload;
}

/**
 * Verify user's answers to the challenge
 * @param {string} userId - UUID
 * @param {Array<number>} answers - Array of selected option indices
 * @returns {boolean} True if all correct, False otherwise
 */
export function verifyAnswers(userId, answers) {
    const challenge = activeChallenges.get(userId);

    if (!challenge) {
        throw new Error('No active challenge found or it has expired');
    }

    if (Date.now() > challenge.expiresAt) {
        activeChallenges.delete(userId);
        throw new Error('Challenge expired. Please request a new one.');
    }

    challenge.attempts++;

    // Strict validation: must match exactly
    const isCorrect = 
        answers.length === challenge.expectedAnswers.length &&
        answers.every((ans, index) => ans === challenge.expectedAnswers[index]);

    if (isCorrect) {
        activeChallenges.delete(userId); // Consume the challenge
        return true;
    }

    if (challenge.attempts >= 3) {
        activeChallenges.delete(userId);
        throw new Error('Max attempts reached. Please request a new challenge.');
    }

    return false;
}

/**
 * Fallback Challenge Generator (Rule-based)
 */
function generateFallbackChallenge(devices, logs) {
    const defaultDevice = devices[0]?.device_name || 'Windows/Chrome';
    const fakeDevices = ['MacBook/Safari', 'Linux/Firefox', 'Android/Chrome', 'iPhone/Safari']
        .filter(d => d !== defaultDevice);

    // Question 1: Device
    const options1 = [defaultDevice, fakeDevices[0], fakeDevices[1], fakeDevices[2]].sort(() => Math.random() - 0.5);
    const correct1 = options1.indexOf(defaultDevice);

    // Question 2: Login Count
    const actualLogins = logs.filter(l => l.event_type === 'login_success').length;
    const options2 = [actualLogins, actualLogins + 2, actualLogins + 5, actualLogins + 10].sort(() => Math.random() - 0.5);
    const correct2 = options2.indexOf(actualLogins);

    // Question 3: Recent Activity Time
    const today = new Date().toLocaleDateString();
    const options3 = ['Yesterday', today, 'Last Week', 'Never'].sort(() => Math.random() - 0.5);
    const correct3 = options3.indexOf(today);

    return {
        questions: [
            { id: "q1", question: "Which primary device have you been using to access this account?", options: options1, correctOptionIndex: correct1 },
            { id: "q2", question: "Roughly how many successful logins have you made recently?", options: options2, correctOptionIndex: correct2 },
            { id: "q3", question: "When was your last recorded activity on this account?", options: options3, correctOptionIndex: correct3 }
        ]
    };
}

export default { generateChallenge, verifyAnswers };
