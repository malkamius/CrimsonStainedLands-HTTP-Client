const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');


const WS_PORT = 4003;
const MUD_HOST = 'kbs-cloud.com';
const MUD_PORT = 4000; // Default Telnet port, change if your MUD uses a different port

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'client.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading client.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});
const ws = new WebSocket.Server({ server });


ws.on('connection', (ws) => {
	try {
		console.log('New WebSocket connection');

		const mudSocket = new net.Socket();

		mudSocket.connect(MUD_PORT, MUD_HOST, () => {
			console.log('Connected to MUD server');
		});

		mudSocket.on('data', (data) => {
			try {
				ws.send(data.toString());
			} catch (error) { 
			}
		});

		mudSocket.on('close', () => {
			try {
				console.log('MUD server connection closed');
			} catch (error) { 
				ws.close();
			}
		});
		
		mudSocket.on('error', function(error) {
			ws.send('Connection closed.\r\n');
			mudSocket.destroy(); 
		});
		ws.on('message', (message) => {
			try {
				mudSocket.write(message + '\n');
			}
			catch (error) { 
			}
		});

		ws.on('close', () => {
			try {
				console.log('WebSocket connection closed');
				mudSocket.destroy(); 
			}
			catch (error) { 
			}
		});
	}
	catch (error) { 
	}
});

// Start the server
server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${WS_PORT}`);
});