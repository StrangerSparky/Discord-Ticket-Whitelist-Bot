require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { storeUserData } = require('../features/verify');

const app = express();
const PORT = 3001;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/callback';

// Check if required env variables are loaded
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing CLIENT_ID or CLIENT_SECRET in environment variables!');
    process.exit(1);
}

// Serve static files from 'public' folder
app.use(express.static('oauth'));

// OAuth2 Authorization URL
app.get('/', (req, res) => {
    const authorizeURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    res.redirect(authorizeURL);
});

// OAuth2 Callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('❌ No authorization code provided!');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = tokenResponse.data;
        if (!access_token) throw new Error('❌ Failed to obtain access token');

        // Get user data using access token
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;
        console.log(`✅ User verified: ${userData.username}#${userData.discriminator}`);

        // Store user data
        await storeUserData(userData);

        // Redirect to success.html
        res.sendFile(path.join(__dirname, 'success.html'));
    } catch (error) {
        console.error('❌ OAuth error:', error.response?.data || error.message);
        res.status(500).send('An error occurred during verification.');
    }
});

// Start OAuth Server
app.listen(PORT, () => {
    console.log(`✅ OAuth server running on http://localhost:${PORT}`);
});
