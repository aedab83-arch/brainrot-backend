const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];

console.log("🚀 Brainrot Backend pokrenut...");

app.use(express.json());

wss.on('connection', (ws) => {
    console.log('✅ Main Autojoiner connected');
    connectedClients.push(ws);

    ws.on('close', () => {
        connectedClients = connectedClients.filter(client => client !== ws);
        console.log('❌ Autojoiner disconnected');
    });
});

app.post('/add', (req, res) => {
    try {
        const data = req.body;
        console.log('📨 Primljen brainrot:', data);

        const message = JSON.stringify({
            type: "new_server",
            name: data.brainrots && data.brainrots[0] ? data.brainrots[0].name : "Unknown",
            money: data.brainrots && data.brainrots[0] ? data.brainrots[0].gen : "0",
            jobid: data.jobId || data.job_id,
            value: data.brainrots && data.brainrots[0] ? data.brainrots[0].value : 0
        });

        let sent = 0;
        connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                sent++;
            }
        });

        console.log(`📤 Poslato ${sent} autojoineru`);
        res.status(200).json({ status: "ok", sent });

    } catch (error) {
        console.error('❌ Greška:', error);
        res.status(500).json({ status: "error" });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Backend radi na portu ${PORT}`);
});
