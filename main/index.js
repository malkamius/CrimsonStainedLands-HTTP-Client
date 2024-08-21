const WebSocket = require('ws');
const net = require('net');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const express = require('express');
const ejs = require('ejs');
const morgan = require('morgan');

// Load settings from JSON file, preferring dev settings if available
var settingsPath = path.join(__dirname, 'config', 'settings.json')
var dev_settingsPath = path.join(__dirname, 'config', 'dev_settings.json')
var settings = fs.existsSync(dev_settingsPath)? JSON.parse(fs.readFileSync(dev_settingsPath, 'utf8')) : JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Extract configuration from settings
const WS_PORT = settings.WS_PORT;
const MUD_HOST = settings.MUD_HOST;
const MUD_PORT = settings.MUD_PORT;

const certpath = settings.cert_path;
const certdomain = settings.cert_domain;

// Function to create server (HTTPS or HTTP)
function createServer(app) {
    try {
        // Attempt to load SSL/TLS certificate and key
        const privateKey = fs.readFileSync(path.join(certpath, certdomain + '-key.pem'), 'utf8');
        const certificate = fs.readFileSync(path.join(certpath, certdomain + '-crt.pem'), 'utf8');
        const ca = fs.readFileSync(path.join(certpath, certdomain + '-chain-only.pem'), 'utf8');

        const credentials = {
            key: privateKey,
            cert: certificate,
            ca: ca,
            passphrase: settings.passphrase
        };

        console.log("SSL/TLS certificates loaded successfully. Starting HTTPS server.");
        return https.createServer(credentials, app);
    } catch (error) {
        console.warn("Failed to load SSL/TLS certificates:", error.message);
        console.log("Falling back to HTTP server.");
        return http.createServer(app);
    }
}

// Create Express app
const app = express();

// Set up session middleware
app.use(session({
    secret: settings.session_secret_key,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' } // 'auto' will set secure based on connection type
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up logging middleware
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

// Custom middleware to serve JavaScript files
app.use('/js', (req, res, next) => {
    var filePath = path.join(__dirname, 'web', 'js', req.path);
    if(!filePath.endsWith(".js")) filePath = filePath + ".js";
    fs.readFile(filePath, (err, content) => {
        if (err) {
            next(); // Pass to the next middleware if file not found
        } else {
            res.contentType('application/javascript');
            res.send(content);
        }
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'web')));

// Define routes
app.get('/', (req, res) => {
    // Initialize session data if it doesn't exist
    if (!req.session.visits) {
        req.session.visits = 0;
    }
    req.session.visits++;

    res.render('client', { 
        visits: req.session.visits,
        wsPort: WS_PORT,
        isSecure: req.secure
    });
});

// Create server (HTTPS or HTTP)
const server = createServer(app);

// Create WebSocket server attached to the server
const ws = new WebSocket.Server({ server });

// Handle new WebSocket connections
ws.on('connection', (ws) => {
    console.log('New WebSocket connection');

    // Set binary type for incoming WebSocket messages
    ws.binaryType = 'arraybuffer';

    // Create a new socket for MUD server connection
    const mudSocket = new net.Socket();

    // Connect to MUD server
    mudSocket.connect(MUD_PORT, MUD_HOST, () => {
        console.log('Connected to MUD server');
    });

    // Forward data from MUD server to WebSocket client
    mudSocket.on('data', (data) => {
        // Send the raw buffer directly
        ws.send(data, { binary: true });
    });

    // Handle MUD server connection close
    mudSocket.on('close', () => {
        console.log('MUD server connection closed');
        ws.close();
    });

    // Handle errors on MUD socket
    mudSocket.on('error', (error) => {
        console.error('MUD socket error:', error.message);
        if (error.code === 'ECONNRESET') {
            console.log('Connection reset by the MUD server. Attempting to reconnect...');
            // You might want to implement a reconnection strategy here
        }
        ws.send(Buffer.from('Error in MUD server connection: ' + error.message + '\n'), { binary: true });
        ws.close();
    });

    // Forward messages from WebSocket client to MUD server
    ws.on('message', (message) => {
        if (mudSocket.writable) {
            // Ensure the message is a Buffer before writing
            const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
            mudSocket.write(buffer);
        } else {
            console.log('Cannot write to MUD socket - connection might be closed');
            ws.send(Buffer.from('Error: Cannot send message to MUD server - connection might be closed\n'), { binary: true });
        }
    });

    // Handle WebSocket connection close
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        mudSocket.destroy();
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
    });
});

// Start the server
server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`Server running on ${server instanceof https.Server ? 'https' : 'http'}://0.0.0.0:${WS_PORT}`);
});