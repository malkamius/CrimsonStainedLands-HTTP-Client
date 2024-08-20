const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
var settingsPath = path.join(__dirname, 'config', 'settings.json')
var dev_settingsPath = path.join(__dirname, 'config', 'dev_settings.json')
var settings = fs.existsSync(dev_settingsPath)? JSON.parse(fs.readFileSync(dev_settingsPath, 'utf8')) : JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

const WS_PORT = settings.WS_PORT;
const MUD_HOST = settings.MUD_HOST;
const MUD_PORT = settings.MUD_PORT;

const url_map = [
    {request_url: '/', path: 'client.html', content_type: 'text/html'},
    {request_url: '/js/color', path: 'js/color.js', content_type: 'text/javascript'},
    {request_url: '/js/app', path: 'js/app.js', content_type: 'text/javascript'},
    {request_url: '/js/websocket', path: 'js/websocket.js', content_type: 'text/javascript'}
];

const server = http.createServer((req, res) => {
    console.log(req.url);
    for (const element of url_map) {
        if(req.url.toUpperCase() === element.request_url.toUpperCase()) {
            fs.readFile(path.join(__dirname, 'web', element.path), (err, content) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading ' + element.path);
                } else {
                    res.writeHead(200, { 'Content-Type': element.content_type });
                    res.end(content);
                }
            });    
            return;
        }
    }
        
    res.writeHead(404);
    res.end('Not found');

});
const ws = new WebSocket.Server({ server });


ws.on('connection', (ws) => {
    console.log('New WebSocket connection');

    const mudSocket = new net.Socket();

    mudSocket.connect(MUD_PORT, MUD_HOST, () => {
        console.log('Connected to MUD server');
    });

    mudSocket.on('data', (data) => {
        ws.send(data.toString());
    });

    mudSocket.on('close', () => {
        console.log('MUD server connection closed');
        ws.close();
    });

    ws.on('message', (message) => {
        mudSocket.write(message + '\n');
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        mudSocket.destroy();
    });
});

// Start the server
server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${WS_PORT}`);
});