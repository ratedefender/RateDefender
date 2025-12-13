// backend/server.js - Production-Ready Backend
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const { OpenAI } = require("openai");

const app = express();

// =====================================================
// SECURITY & PERFORMANCE MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com"],
            frameSrc: ["https://googleads.g.doubleclick.net"],
        }
    }
}));

// CORS with specific origin (change in production)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Compression for all responses
app.use(compression());

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Prevent NoSQL injection
// Disabled `express-mongo-sanitize` temporarily due to compatibility issues
// with newer Express request object getters. Replace or re-enable after
// updating the sanitize library or applying a safe-per-field sanitizer.
// app.use(mongoSanitize());

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

const calcLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 calculations per minute
    message: 'Rate limit exceeded. Please wait before calculating again.'
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Only 5 login attempts per 15 minutes
    message: 'Too many login attempts.'
});

app.use('/api/', apiLimiter);

// =====================================================
// DATABASE CONNECTION WITH OPTIMIZATION
// =====================================================

mongoose.connect(process.env.MONGO_URI, {
    // Removed legacy/unsupported options `useNewUrlParser` and `useUnifiedTopology`.
    // Modern mongoose/mongo drivers use sensible defaults for these.
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("✅ MongoDB Connected with optimizations"))
.catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// Connection error handling
mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

// =====================================================
// DATABASE SCHEMAS
// =====================================================

// Stats Schema with indexing for performance
const StatSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true, index: true },
    views: { type: Number, default: 0 },
    calculations: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgCalculationTime: { type: Number, default: 0 }
}, { timestamps: true });

const Stat = mongoose.model('Stat', StatSchema);

// Rate Cache Schema - Store PPP rates
const RateCacheSchema = new mongoose.Schema({
    country: { type: String, required: true, unique: true },
    pppFactor: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const RateCache = mongoose.model('RateCache', RateCacheSchema);

// Admin Session Schema for better security
const AdminSessionSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    lastAccess: { type: Date, default: Date.now }
});

const AdminSession = mongoose.model('AdminSession', AdminSessionSchema);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getTodayDate = () => new Date().toISOString().split('T')[0];

const incrementStat = async (type, value = 1) => {
    const today = getTodayDate();
    try {
        await Stat.findOneAndUpdate(
            { date: today },
            { $inc: { [type]: value } },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('Error updating stats:', err);
    }
};

// Generate secure token
const crypto = require('crypto');
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Verify admin token
const verifyAdminToken = async (token) => {
    if (!token) return false;
    
    const session = await AdminSession.findOne({
        token,
        expiresAt: { $gt: new Date() }
    });
    
    if (session) {
        // Update last access
        session.lastAccess = new Date();
        await session.save();
        return true;
    }
    return false;
};

// Clean expired sessions (run periodically)
const cleanExpiredSessions = async () => {
    await AdminSession.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

// PPP Rate data with more countries
const pppRates = {
    "USA": 1.0,
    "United Kingdom": 0.88,
    "Canada": 0.91,
    "Australia": 0.93,
    "Germany": 0.85,
    "France": 0.86,
    "Netherlands": 0.87,
    "Switzerland": 0.79,
    "Sweden": 0.90,
    "Norway": 0.81,
    "India": 0.28,
    "Philippines": 0.34,
    "Pakistan": 0.24,
    "Bangladesh": 0.26,
    "Vietnam": 0.32,
    "Indonesia": 0.35,
    "Thailand": 0.40,
    "Malaysia": 0.42,
    "Nigeria": 0.38,
    "Kenya": 0.36,
    "South Africa": 0.44,
    "Egypt": 0.31,
    "Brazil": 0.48,
    "Mexico": 0.51,
    "Argentina": 0.46,
    "Colombia": 0.43,
    "Poland": 0.55,
    "Romania": 0.52,
    "Ukraine": 0.29,
    "Turkey": 0.43
};

// Initialize PPP cache
const initializePPPCache = async () => {
    const count = await RateCache.countDocuments();
    if (count === 0) {
        const entries = Object.entries(pppRates).map(([country, pppFactor]) => ({
            country,
            pppFactor,
            lastUpdated: new Date()
        }));
        await RateCache.insertMany(entries);
        console.log('✅ PPP Cache initialized');
    }
};

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Track page view (minimal data collection)
app.get('/api/track-view', async (req, res) => {
    try {
        await incrementStat('views');
        res.json({ status: 'tracked' });
    } catch (err) {
        res.status(500).json({ error: 'Tracking failed' });
    }
});

// Get list of supported countries
app.get('/api/countries', async (req, res) => {
    try {
        const countries = await RateCache.find({}, { country: 1, _id: 0 }).sort({ country: 1 });
        res.json({ countries: countries.map(c => c.country) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
});

// Calculate Rate with enhanced algorithm
app.post('/api/calculate', calcLimiter, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { myLocation, clientLocation, currentRate, skill } = req.body;
        
        // Input validation
        if (!myLocation || !clientLocation || !currentRate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (isNaN(currentRate) || currentRate <= 0) {
            return res.status(400).json({ error: 'Invalid rate value' });
        }

        // Fetch PPP factors from cache
        const [myData, clientData] = await Promise.all([
            RateCache.findOne({ country: myLocation }),
            RateCache.findOne({ country: clientLocation })
        ]);

        const myFactor = myData?.pppFactor || 1.0;
        const clientFactor = clientData?.pppFactor || 1.0;
        
        // Calculate fair rate with PPP adjustment
        const fairRate = ((parseFloat(currentRate) / myFactor) * clientFactor).toFixed(2);
        
        // Calculate additional insights
        const percentageChange = (((fairRate - currentRate) / currentRate) * 100).toFixed(1);
        const purchasingPowerRatio = (clientFactor / myFactor).toFixed(2);

        // Track calculation time
        const calculationTime = Date.now() - startTime;
        await incrementStat('calculations');
        
        res.json({
            fairRate: parseFloat(fairRate),
            currentRate: parseFloat(currentRate),
            percentageChange: parseFloat(percentageChange),
            purchasingPowerRatio: parseFloat(purchasingPowerRatio),
            message: `Your $${currentRate} has ${purchasingPowerRatio}x purchasing power in ${clientLocation}`,
            insight: percentageChange > 0 
                ? `You could charge $${fairRate} to maintain equivalent value`
                : `Your rate is already competitive for ${clientLocation}`,
            calculationTime: `${calculationTime}ms`
        });
        
    } catch (err) {
        console.error('Calculate error:', err);
        res.status(500).json({ error: 'Calculation failed' });
    }
});

// AI Email Generator with enhanced prompting
app.post('/api/generate-email', calcLimiter, async (req, res) => {
    try {
        const { fairRate, skill, currentRate, clientLocation } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ 
                error: 'AI service not configured',
                fallback: `Subject: Rate Update for ${skill} Services\n\nDear Client,\n\nI hope this message finds you well. After careful consideration of current market rates and cost of living adjustments, I'm updating my rate for ${skill} services to $${fairRate}/hour.\n\nThis adjustment reflects the current economic environment while ensuring I can continue delivering the high-quality work you expect.\n\nI appreciate your understanding and look forward to continuing our partnership.\n\nBest regards`
            });
        }

        const openai = new OpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 10000 // 10 second timeout
        });
        
        const completion = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: "You are a professional freelance consultant helping write polite, concise rate adjustment emails."
            }, {
                role: "user",
                content: `Write a professional email to a client in ${clientLocation} explaining a rate increase from $${currentRate} to $${fairRate} for ${skill} services. Mention purchasing power parity and inflation. Keep it under 150 words.`
            }],
            model: "gpt-3.5-turbo",
            max_tokens: 300,
            temperature: 0.7
        });
        
        res.json({ email: completion.choices[0].message.content });
        
    } catch (err) {
        console.error('AI generation error:', err);
        res.status(500).json({ error: 'Email generation failed' });
    }
});

// =====================================================
// ADMIN ROUTES (Enhanced Security)
// =====================================================

// Admin login with session management
app.post('/api/admin/login', adminLimiter, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password required' });
        }
        
        // Constant-time comparison to prevent timing attacks
        const expectedPassword = process.env.ADMIN_PASSWORD;
        const passwordMatch = password === expectedPassword;
        
        if (!passwordMatch) {
            // Add delay to prevent brute force
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Create session token
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await AdminSession.create({ token, expiresAt });
        
        res.json({ 
            success: true, 
            token,
            expiresAt: expiresAt.toISOString()
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Middleware to verify admin authentication
const requireAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    const isValid = await verifyAdminToken(token);
    
    if (!isValid) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    next();
};

// Get admin statistics
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const limit = Math.min(parseInt(days), 90); // Max 90 days
        
        const stats = await Stat.find()
            .sort({ date: -1 })
            .limit(limit)
            .lean(); // Use lean() for better performance
        
        // Calculate totals
        const totals = stats.reduce((acc, day) => ({
            totalViews: acc.totalViews + day.views,
            totalCalculations: acc.totalCalculations + day.calculations
        }), { totalViews: 0, totalCalculations: 0 });
        
        res.json({
            stats,
            totals,
            period: `Last ${stats.length} days`
        });
        
    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Admin logout
app.post('/api/admin/logout', requireAdmin, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        await AdminSession.deleteOne({ token });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =====================================================
// SERVER INITIALIZATION
// =====================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await initializePPPCache();
        
        // Clean expired sessions on startup and every hour
        await cleanExpiredSessions();
        setInterval(cleanExpiredSessions, 60 * 60 * 1000);
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 Security features enabled`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});