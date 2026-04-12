import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// Environment-driven configuration

import config, { validateConfig } from './config/config.js';
import { testConnection, syncDatabase } from './config/database.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import logger from './utils/logger.js';
import { csrfTokenSetter, csrfValidator } from './middlewares/csrf.js';
import { intrusionDetection } from './middlewares/intrusionDetection.js';

/**
 * SECURE FILE STORAGE BACKEND
 * Production-grade zero-trust file storage system
 * 
 * Security Features:
 * - AES-256-GCM encryption for all files
 * - Per-file encryption keys
 * - JWT-based authentication with refresh tokens
 * - Account locking after failed login attempts
 * - Rate limiting on all endpoints
 * - Comprehensive audit logging
 * - Input validation and sanitization
 * - CSRF protection
 * - Secure headers via Helmet
 * - HttpOnly cookies
 */

const app = express();

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        // Validate configuration
        console.log('Validating configuration...');
        validateConfig();

        // Ensure upload directories exist
        const dirs = [config.upload.uploadDir, path.join(config.upload.uploadDir, 'temp')];
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✓ Created directory: ${dir}`);
            }
        }

        // Test database connection
        console.log('Testing database connection...');
        await testConnection();

        // Synchronize database models
        // Database schema is initialized. Reverting to safe sync to preserve user data.
        await syncDatabase({ force: false, alter: false });

        console.log('✓ Application initialized successfully\n');
    } catch (error) {
        console.error('✗ Application initialization failed:', error.message);
        process.exit(1);
    }
}

/**
 * Security Middleware
 */

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", '*'],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
const allowedOrigins = config.cors.origin ? config.cors.origin.split(',') : [];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-security-pin']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Cookie parser
app.use(cookieParser(config.cookie.secret));

// Compression
app.use(compression());

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

/**
 * Request logging
 */
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

/**
 * Intrusion Detection System
 * Monitors all requests for attack patterns
 */
app.use(intrusionDetection);

/**
 * CSRF Protection
 */
app.use(csrfTokenSetter);
app.use(`/api/${config.apiVersion}`, csrfValidator);

/**
 * Rate limiting
 */
app.use(`/api/${config.apiVersion}`, apiLimiter);

/**
 * Routes
 */
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Secure File Storage API',
        version: config.apiVersion,
        documentation: `/api/${config.apiVersion}/health`
    });
});

/**
 * Error Handling
 */
app.use(notFound);
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
    await initializeApp();

    const server = app.listen(config.port, () => {
        console.log('='.repeat(50));
        console.log('🚀 SECURE FILE STORAGE BACKEND');
        console.log('='.repeat(50));
        console.log(`Environment: ${config.env}`);
        console.log(`Server running on port: ${config.port}`);
        console.log(`API Version: ${config.apiVersion}`);
        console.log(`API URL: http://localhost:${config.port}/api/${config.apiVersion}`);
        console.log('='.repeat(50));
        console.log('\n✓ Server is ready to accept requests\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('✓ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\n⚠️  SIGINT received, shutting down gracefully...');
        server.close(() => {
            console.log('✓ Server closed');
            process.exit(0);
        });
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Start the server
startServer();

export default app;
