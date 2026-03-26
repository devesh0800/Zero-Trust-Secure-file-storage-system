import { User, Connection } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

/**
 * Connection Service
 * Handles trusted peer-to-peer connection logic.
 */

/**
 * Generate a 16-digit Safety Number from two public keys (Anti-MITM).
 */
function generateSafetyNumber(publicKeyA, publicKeyB) {
    const combined = [publicKeyA, publicKeyB].sort().join('');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    // Take first 16 hex chars and format as XXXX-XXXX-XXXX-XXXX
    const digits = hash.substring(0, 16).toUpperCase();
    return `${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8,12)}-${digits.slice(12,16)}`;
}

/**
 * Send a connection request to another user.
 */
export async function sendRequest(senderId, receiverIdentifier) {
    // Find receiver by unique_share_id, email, or username
    const receiver = await User.findOne({
        where: {
            [Op.or]: [
                { unique_share_id: receiverIdentifier },
                { email: receiverIdentifier },
                { username: receiverIdentifier }
            ]
        }
    });

    if (!receiver) {
        throw new AppError('User not found. Check the ID/email and try again.', 404);
    }

    if (receiver.id === senderId) {
        throw new AppError('You cannot connect with yourself.', 400);
    }

    // Check if connection already exists (in either direction)
    const existing = await Connection.findOne({
        where: {
            [Op.or]: [
                { sender_id: senderId, receiver_id: receiver.id },
                { sender_id: receiver.id, receiver_id: senderId }
            ]
        }
    });

    if (existing) {
        if (existing.status === 'active') throw new AppError('Already connected.', 409);
        if (existing.status === 'pending') throw new AppError('Connection request already pending.', 409);
        if (existing.status === 'blocked') throw new AppError('This connection is blocked.', 403);
        // If rejected, allow re-request by updating status
        existing.status = 'pending';
        existing.sender_id = senderId;
        existing.receiver_id = receiver.id;
        await existing.save();
        return { connection: existing, receiver };
    }

    // Generate safety number
    const sender = await User.findByPk(senderId);
    const safetyNumber = generateSafetyNumber(
        sender.public_key || sender.id,
        receiver.public_key || receiver.id
    );

    const connection = await Connection.create({
        sender_id: senderId,
        receiver_id: receiver.id,
        status: 'pending',
        safety_number: safetyNumber
    });

    return { connection, receiver };
}

/**
 * Accept a pending connection request.
 */
export async function acceptRequest(connectionId, userId) {
    const connection = await Connection.findByPk(connectionId);
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.receiver_id !== userId) throw new AppError('Unauthorized.', 403);
    if (connection.status !== 'pending') throw new AppError(`Cannot accept a ${connection.status} request.`, 400);

    connection.status = 'active';
    connection.connected_at = new Date();
    await connection.save();
    return connection;
}

/**
 * Reject a pending connection request.
 */
export async function rejectRequest(connectionId, userId) {
    const connection = await Connection.findByPk(connectionId);
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.receiver_id !== userId) throw new AppError('Unauthorized.', 403);
    if (connection.status !== 'pending') throw new AppError(`Cannot reject a ${connection.status} request.`, 400);

    connection.status = 'rejected';
    await connection.save();
    return connection;
}

/**
 * Revoke / remove an existing connection.
 */
export async function revokeConnection(connectionId, userId) {
    const connection = await Connection.findByPk(connectionId);
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.sender_id !== userId && connection.receiver_id !== userId) {
        throw new AppError('Unauthorized.', 403);
    }
    await connection.destroy();
    return { message: 'Connection removed.' };
}

/**
 * Get all connections for a user (sent + received).
 */
export async function getConnections(userId) {
    const connections = await Connection.findAll({
        where: {
            [Op.or]: [
                { sender_id: userId },
                { receiver_id: userId }
            ]
        },
        include: [
            { model: User, as: 'Sender', attributes: ['id', 'username', 'full_name', 'email', 'unique_share_id', 'profile_pic', 'public_key'] },
            { model: User, as: 'Receiver', attributes: ['id', 'username', 'full_name', 'email', 'unique_share_id', 'profile_pic', 'public_key'] }
        ],
        order: [['created_at', 'DESC']]
    });

    return connections.map(conn => {
        const raw = conn.toJSON();
        // Determine "the other person"
        const peer = raw.sender_id === userId ? raw.Receiver : raw.Sender;
        const direction = raw.sender_id === userId ? 'sent' : 'received';
        return {
            id: raw.id,
            status: raw.status,
            direction,
            safety_number: raw.safety_number,
            is_verified: raw.is_verified,
            connected_at: raw.connected_at,
            created_at: raw.created_at,
            peer
        };
    });
}

/**
 * Get safety number for a specific connection (for verification).
 */
export async function getSafetyNumber(connectionId, userId) {
    const connection = await Connection.findByPk(connectionId);
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.sender_id !== userId && connection.receiver_id !== userId) {
        throw new AppError('Unauthorized.', 403);
    }
    return { safety_number: connection.safety_number };
}

/**
 * Mark a connection as verified (user confirmed safety number out-of-band).
 */
export async function verifyConnection(connectionId, userId) {
    const connection = await Connection.findByPk(connectionId);
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.sender_id !== userId && connection.receiver_id !== userId) {
        throw new AppError('Unauthorized.', 403);
    }
    if (connection.status !== 'active') throw new AppError('Connection must be active to verify.', 400);
    
    connection.is_verified = true;
    await connection.save();
    return connection;
}

export default {
    sendRequest,
    acceptRequest,
    rejectRequest,
    revokeConnection,
    getConnections,
    getSafetyNumber,
    verifyConnection
};
