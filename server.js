const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Database simulation (in production, use MongoDB/PostgreSQL)
let leads = [];
let contactMessages = [];

// API Routes

// Get platform stats
app.get('/api/stats', (req, res) => {
    const stats = {
        totalUsers: 12500,
        projectsCompleted: 38500,
        teamsUsing: 2400,
        satisfactionRate: 98.5
    };
    res.json(stats);
});

// Handle contact form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, company, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store in database (simulated)
        const contactMessage = {
            id: Date.now(),
            name,
            email,
            company: company || 'Not specified',
            message,
            timestamp: new Date().toISOString(),
            status: 'new'
        };

        contactMessages.push(contactMessage);

        // Send notification email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.NOTIFICATION_EMAIL || email,
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Company:</strong> ${company || 'Not specified'}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p>This message was sent from the FlowBoard contact form.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Send confirmation email to user
        const userMailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Thank you for contacting FlowBoard',
            html: `
                <h2>Thank you for reaching out!</h2>
                <p>Dear ${name},</p>
                <p>We've received your message and our team will get back to you within 24 hours.</p>
                <p>Here's a copy of your message:</p>
                <blockquote>${message}</blockquote>
                <p>Best regards,<br>The FlowBoard Team</p>
            `
        };

        await transporter.sendMail(userMailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully' 
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Trial signup endpoint
app.post('/api/signup/trial', async (req, res) => {
    try {
        const { name, email, company, teamSize } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const trialUser = {
            id: Date.now(),
            name,
            email,
            company: company || 'Personal',
            teamSize: teamSize || '1-5',
            plan: 'trial',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            status: 'active'
        };

        leads.push(trialUser);

        // Send welcome email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Welcome to FlowBoard - Your 14-Day Trial',
            html: `
                <h2>Welcome to FlowBoard, ${name}!</h2>
                <p>Your 14-day free trial has been activated. Here's what you can do next:</p>
                <ol>
                    <li><strong>Set up your workspace:</strong> Log in and create your first project</li>
                    <li><strong>Invite team members:</strong> Add your team to collaborate</li>
                    <li><strong>Explore features:</strong> Try out our task management and analytics tools</li>
                </ol>
                <p><strong>Login URL:</strong> <a href="https://app.flowboard.example.com/login">https://app.flowboard.example.com/login</a></p>
                <p><strong>Trial End Date:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <p>Need help getting started? Check out our <a href="https://help.flowboard.example.com">documentation</a> or schedule a <a href="https://calendly.com/flowboard-demo">demo call</a>.</p>
                <p>Best regards,<br>The FlowBoard Team</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Trial account created successfully',
            trialEnd: trialUser.endDate
        });

    } catch (error) {
        console.error('Error creating trial account:', error);
        res.status(500).json({ error: 'Failed to create trial account' });
    }
});

// Demo request endpoint
app.post('/api/demo/request', async (req, res) => {
    try {
        const { name, email, company, preferredDate, timezone } = req.body;

        if (!name || !email || !preferredDate) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const demoRequest = {
            id: Date.now(),
            name,
            email,
            company,
            preferredDate,
            timezone: timezone || 'UTC',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        leads.push(demoRequest);

        // Send confirmation email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'FlowBoard Demo Request Confirmation',
            html: `
                <h2>Demo Request Received</h2>
                <p>Hi ${name},</p>
                <p>We've received your request for a FlowBoard demo on ${new Date(preferredDate).toLocaleString()}.</p>
                <p>Our sales team will contact you within 24 hours to confirm the schedule.</p>
                <p>In the meantime, you can:</p>
                <ul>
                    <li>Watch our <a href="https://youtube.com/flowboard">introductory videos</a></li>
                    <li>Explore our <a href="https://help.flowboard.example.com">feature guides</a></li>
                    <li>Start a <a href="https://app.flowboard.example.com/trial">free trial</a></li>
                </ul>
                <p>Best regards,<br>The FlowBoard Team</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Demo request submitted successfully' 
        });

    } catch (error) {
        console.error('Error processing demo request:', error);
        res.status(500).json({ error: 'Failed to submit demo request' });
    }
});

// Get all leads (admin endpoint - in production, add authentication)
app.get('/api/admin/leads', (req, res) => {
    const stats = {
        totalLeads: leads.length,
        trialUsers: leads.filter(l => l.plan === 'trial').length,
        demoRequests: leads.filter(l => l.status === 'pending').length,
        recentLeads: leads.slice(-10)
    };
    res.json(stats);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});