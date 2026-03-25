import { asyncHandler } from '../middlewares/errorHandler.js';
import { generateChallenge, verifyAnswers } from '../utils/aiVerification.js';
import { AppError } from '../middlewares/errorHandler.js';
import { ActionToken } from '../models/index.js';
import crypto from 'crypto';

/**
 * AI Unlock Controller
 * Handles the logic for rendering dynamic security questions
 * and granting password reset tokens
 */

/**
 * @route   GET /api/v1/auth/unlock/challenge
 * @desc    Generate and return 3 dynamic AI questions
 * @access  Private (Restricted Mode Only)
 */
export const getChallenge = asyncHandler(async (req, res) => {
    // Check if user is actually in restricted mode
    if (!req.user.is_restricted) {
        return res.status(400).json({
            success: false,
            message: 'Your account is not in restricted mode'
        });
    }

    try {
        const challengeData = await generateChallenge(req.user.id, req.ip);

        res.status(200).json({
            success: true,
            message: 'Challenge generated successfully',
            data: challengeData
        });
    } catch (error) {
        throw new AppError('Failed to generate security challenge. Please try again later.', 500);
    }
});

/**
 * @route   POST /api/v1/auth/unlock/challenge/verify
 * @desc    Verify answers and issue reset_token
 * @access  Private (Restricted Mode Only)
 */
export const submitChallenge = asyncHandler(async (req, res) => {
    const { answers } = req.body; // Array of option indices [1, 0, 2]

    if (!req.user.is_restricted) {
        return res.status(400).json({
            success: false,
            message: 'Your account is not in restricted mode'
        });
    }

    if (!Array.isArray(answers) || answers.length !== 3) {
        return res.status(400).json({
            success: false,
            message: 'Please provide exactly 3 answers'
        });
    }

    try {
        const isCorrect = verifyAnswers(req.user.id, answers);

        if (!isCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect answers. Please review your account history carefully or request a new challenge.'
            });
        }

        // Generate a 15-minute ActionToken for credential reset
        const resetTokenBytes = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetTokenBytes).digest('hex');

        await ActionToken.create({
            user_id: req.user.id,
            token: tokenHash,
            action_type: 'reset_credentials',
            expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        });

        res.status(200).json({
            success: true,
            message: 'Identity verified successfully. Please proceed to reset your credentials.',
            data: {
                reset_token: resetTokenBytes
            }
        });
        
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Verification failed'
        });
    }
});

export default {
    getChallenge,
    submitChallenge
};
