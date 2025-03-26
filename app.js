const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/stream', async (req, res) => {
    // const vUrl = 'https://pixeldrain.net/api/file/BB6p9QrA?download';
    // const vUrl = req.params.videoLink;
    const vUrl = req.query.videoLink;

    if (!vUrl) {
        return res.status(400).send('Missing video URL');
    }

    const range = req.headers.range;
    if (!range) {
        return res.status(400).send('Requires Range header');
    }

    try {
        // Get video info with a HEAD request
        const headResponse = await axios({
            method: 'HEAD',
            url: vUrl,
            responseType: 'stream'
        });

        const videoSize = parseInt(headResponse.headers['content-length']);
        const CHUNK_SIZE = 10 ** 6; // ~1MB chunks
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, headers);

        // Stream the video chunk
        const videoResponse = await axios({
            method: 'GET',
            url: vUrl,
            responseType: 'stream',
            headers: {
                Range: `bytes=${start}-${end}`
            }
        });

        videoResponse.data.pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error.message);
        res.status(500).send('Error streaming video');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
