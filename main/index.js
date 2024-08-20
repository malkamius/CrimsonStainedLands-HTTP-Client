const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load settings from JSON file, preferring dev settings if available
var settingsPath = path.join(__dirname, 'config', 'settings.json')
var dev_settingsPath = path.join(__dirname, 'config', 'dev_settings.json')
var settings = fs.existsSync(dev_settingsPath)? JSON.parse(fs.readFileSync(dev_settingsPath, 'utf8')) : JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Extract configuration from settings
const WS_PORT = settings.WS_PORT;
const MUD_HOST = settings.MUD_HOST;
const MUD_PORT = settings.MUD_PORT;

// Define URL mappings for serving static files
const url_map = [
    {request_url: '/', path: 'client.html', content_type: 'text/html'},
    {request_url: '/js/color', path: 'js/color.js', content_type: 'text/javascript'},
    {request_url: '/js/app', path: 'js/app.js', content_type: 'text/javascript'},
    {request_url: '/js/websocket', path: 'js/websocket.js', content_type: 'text/javascript'}
];

// Create HTTP server
const server = http.createServer((req, res) => {
    const clientIP = req.socket.remoteAddress || req.headers['x-forwarded-for'];
    let statusCode = 404; // Default to 404 if no match is found

    console.log(`Request from ${clientIP} for ${req.url}`);

    // Check if the requested URL matches any in our url_map
    for (const element of url_map) {
        if(req.url.toUpperCase() === element.request_url.toUpperCase()) {
            // Read and serve the file
            fs.readFile(path.join(__dirname, 'web', element.path), (err, content) => {
                if (err) {
                    statusCode = 500;
                    res.writeHead(statusCode);
                    res.end('Error loading ' + element.path);
                } else {
                    statusCode = 200;
                    res.writeHead(statusCode, { 'Content-Type': element.content_type });
                    res.end(content);
                }
                logRequest(clientIP, req.url, statusCode);
            });    
            return;
        }
    }
    
    // If no match found, return 404
    res.writeHead(statusCode);
    res.end('Not found');
    logRequest(clientIP, req.url, statusCode);
});

// Function to log HTTP requests
function logRequest(ip, url, statusCode) {
    console.log(`${new Date().toISOString()} - ${ip} - ${url} - ${statusCode}`);
}

// Create WebSocket server attached to HTTP server
const ws = new WebSocket.Server({ server });

// Handle new WebSocket connections
ws.on('connection', (ws) => {
    console.log('New WebSocket connection');

    // Create a new socket for MUD server connection
    const mudSocket = new net.Socket();

    // Connect to MUD server
    mudSocket.connect(MUD_PORT, MUD_HOST, () => {
        console.log('Connected to MUD server');
    });

    // Forward data from MUD server to WebSocket client
    mudSocket.on('data', (data) => {
        ws.send(data.toString());
    });

    // Handle MUD server connection close
    mudSocket.on('close', () => {
        console.log('MUD server connection closed');
        ws.close();
    });

    // Forward messages from WebSocket client to MUD server
    ws.on('message', (message) => {
        mudSocket.write(message + '\n');
    });

    // Handle WebSocket connection close
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        mudSocket.destroy();
    });
});

// Start the server
server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${WS_PORT}`);
});