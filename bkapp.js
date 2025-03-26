const express = require('express');
const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream');
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

app.get('/stream', (req, res) => {
    let vUrl = 'https://pixeldrain.net/api/file/BB6p9QrA?download';
    // let vUrl = 'video.mkv';


    const range = req.headers.range;
    if (!range) {
        res.status(400).send('Requires Range header');
    }

    const videoSize =  fs.statSync(vUrl).size;
    const CHUNK_SIZE = 10 ** 6;
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
    const videoStream = createReadStream(vUrl, { start, end });
    videoStream.pipe(res);
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