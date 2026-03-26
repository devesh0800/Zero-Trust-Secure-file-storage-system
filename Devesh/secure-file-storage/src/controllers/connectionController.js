import connectionService from '../services/connectionService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import notificationService from '../services/notificationService.js';

/**
 * Connection Controller
 * Handles HTTP requests for trusted connections.
 */

/**
 * @route   POST /api/v1/connections/request
 * @desc    Send a connection request to another user
 */
export const sendRequest = asyncHandler(async (req, res) => {
    const { identifier } = req.body; // unique_share_id, email, or username

    const { connection, receiver } = await connectionService.sendRequest(req.user.id, identifier);

    // Send notification to receiver
    try {
        await notificationService.createNotification(
            receiver.id,
            'connection_request',
            `${req.user.username} sent you a connection request.`
        );
    } catch (e) { /* non-critical */ }

    res.status(201).json({
        success: true,
        message: 'Connection request sent.',
        data: connection
    });
});

/**
 * @route   PUT /api/v1/connections/:id/accept
 * @desc    Accept a pending connection request
 */
export const acceptRequest = asyncHandler(async (req, res) => {
    const connection = await connectionService.acceptRequest(req.params.id, req.user.id);

    // Notify sender
    try {
        await notificationService.createNotification(
            connection.sender_id,
            'connection_accepted',
            `${req.user.username} accepted your connection request.`
        );
    } catch (e) { /* non-critical */ }

    res.status(200).json({
        success: true,
        message: 'Connection accepted.',
        data: connection
    });
});

/**
 * @route   PUT /api/v1/connections/:id/reject
 * @desc    Reject a pending connection request
 */
export const rejectRequest = asyncHandler(async (req, res) => {
    const connection = await connectionService.rejectRequest(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Connection rejected.',
        data: connection
    });
});

/**
 * @route   DELETE /api/v1/connections/:id
 * @desc    Remove / revoke a connection
 */
export const revokeConnection = asyncHandler(async (req, res) => {
    const result = await connectionService.revokeConnection(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
});

/**
 * @route   GET /api/v1/connections
 * @desc    Get all connections for the current user
 */
export const getConnections = asyncHandler(async (req, res) => {
    const connections = await connectionService.getConnections(req.user.id);
    res.status(200).json({
        success: true,
        data: connections
    });
});

/**
 * @route   GET /api/v1/connections/:id/safety-number
 * @desc    Get the safety number for a connection (for OOB verification)
 */
export const getSafetyNumber = asyncHandler(async (req, res) => {
    const data = await connectionService.getSafetyNumber(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
});

/**
 * @route   PUT /api/v1/connections/:id/verify
 * @desc    Mark a connection as verified (safety number confirmed)
 */
export const verifyConnection = asyncHandler(async (req, res) => {
    const connection = await connectionService.verifyConnection(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Connection verified with Safety Number.',
        data: connection
    });
});
