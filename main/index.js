const WebSocket = require('ws');
const net = require('net');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const session = require('express-session');

// // Database setup
// const db = new sqlite3.Database('./users.db');

// db.serialize(() => {
//   db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)");
// });

// Load settings from JSON file, preferring dev settings if available
var settingsPath = path.join(__dirname, 'config', 'settings.json')
var dev_settingsPath = path.join(__dirname, 'config', 'dev_settings.json')
var settings = fs.existsSync(dev_settingsPath)? JSON.parse(fs.readFileSync(dev_settingsPath, 'utf8')) : JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

// Extract configuration from settings
const WS_PORT = settings.WS_PORT;
const MUD_HOST = settings.MUD_HOST;
const MUD_PORT = settings.MUD_PORT;
const JWT_SECRET = settings.jwt_secret || 'your-secret-key';
const JWT_REFRESH_SECRET = settings.jwt_refresh_secret || 'your-refresh-secret-key';
const certpath = settings.cert_path;
const certdomain = settings.cert_domain;

// Create Express app
const app = express();

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
// Middleware
app.use(express.json());
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
    immediate: true,
    stream: {
      write: (message) => {
        console.log(message.trim());
      }
    }
}));
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

// Serve static files
app.use(express.static(path.join(__dirname, 'web')));

// Optional JWT Middleware
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

// User registration route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
        //     if (err) {
        //         if (err.message.includes('UNIQUE constraint failed')) {
        //             return res.status(400).json({ error: 'Username already exists' });
        //         }
        //         return res.status(500).json({ error: 'Error registering user' });
        //     }
        //     res.status(201).json({ message: 'User registered successfully' });
        // });
        res.status(500).json({ error: 'Error registering user' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    //     if (err) {
    //         return res.status(500).json({ error: 'Error logging in' });
    //     }
    //     if (!user) {
    //         return res.status(400).json({ error: 'User not found' });
    //     }
    //     try {
    //         if (await bcrypt.compare(password, user.password)) {
    //             const accessToken = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    //             const refreshToken = jwt.sign({ username: user.username, id: user.id }, JWT_REFRESH_SECRET);
    //             res.json({ accessToken, refreshToken });
    //         } else {
    //             res.status(400).json({ error: 'Invalid password' });
    //         }
    //     } catch {
    //         res.status(500).json({ error: 'Error logging in' });
    //     }
    // });
    res.status(500).json({ error: 'Error logging in' });
});

// Token refresh route
app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
});

// Logout route
app.delete('/logout', (req, res) => {
    // In a more complex implementation, you might want to blacklist the token here
    req.username = "";
    res.sendStatus(204);
});

function InitializeSession(req) {
    if (!req.session.loggedin) {
        req.session.loggedin = false;
    }
    
    if (!req.session.username) {
        req.session.username = "";
    }
}
// Main route with optional authentication
app.get('/', optionalAuthenticateToken, (req, res) => {
    InitializeSession(req);
    res.render('client', { 
        wsPort: WS_PORT,
        isSecure: req.secure,
        user: req.user, // This will be null if not authenticated
        renderPartial: (name, data) => {
            return ejs.renderFile(path.join(__dirname, 'views', 'partials', `${name}.ejs`), data);
        }
    });
});

// Custom middleware to serve JavaScript files
app.use('/js', (req, res, next) => {
    const normalizedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    var filePath = path.join(__dirname, 'web', 'js', normalizedPath);
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

app.use('/css', (req, res, next) => {
    const normalizedPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    var filePath = path.join(__dirname, 'web', 'css', normalizedPath);
    if(filePath.endsWith(".css"))
    {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                next(); // Pass to the next middleware if file not found
            } else {
                res.contentType('text/css');  // Changed from 'application/javascript'
                res.send(content);
            }
        });
    }
});

app.use('/node_modules/@xterm', express.static(path.join(__dirname, 'node_modules', '@xterm')));
// Create server (HTTPS or HTTP)
const server = createServer(app);

// Create WebSocket server attached to the server
const ws = new WebSocket.Server({ server });

// Handle new WebSocket connections
ws.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    // Optional authentication for WebSocket
    // const token = new URL(req.url, 'https://localhost:3003').searchParams.get('token');
    // if (token) {
    //     jwt.verify(token, JWT_SECRET, (err, decoded) => {
    //         if (!err) {
    //             ws.user = decoded;
    //         }
    //     });
    // }

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
        ws.send(Buffer.from('\nError in MUD server connection: ' + error.message + '\n'), { binary: true });
        ws.close();
    });

    // Forward messages from WebSocket client to MUD server
    ws.on('message', (message) => {
        if (mudSocket.writable) {
            const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
            mudSocket.write(buffer);
        } else {
            console.log('Cannot write to MUD socket - connection might be closed');
            ws.send(Buffer.from('\nError: Cannot send message to MUD server - connection might be closed\n'), { binary: true });
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