require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for the verification success page
app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

// Serve static files from the 'transcripts' folder
app.use('/transcripts', express.static(path.join(__dirname, 'transcripts')));

// Endpoint to view a specific transcript
app.get('/view/:ticketId', (req, res) => {
    const ticketId = req.params.ticketId;
    const transcriptPath = path.join(__dirname, 'transcripts', `ticket-${ticketId}-transcript.html`);

    // Check if the transcript exists
    if (fs.existsSync(transcriptPath)) {
        res.sendFile(transcriptPath);
    } else {
        res.status(404).send('Transcript not found for this ticket.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
