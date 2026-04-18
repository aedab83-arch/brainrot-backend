const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];
let botRegistry = new Map();        // Za deduplikaciju botova
let knownServers = new Map();       // Za get-server

app.use(express.json());

console.log("🚀 Prošireni Brainrot Backend pokrenut...");

// ====================== WEBSOCKET ======================
wss.on('connection', (ws) => {
    console.log('✅ Main Autojoiner connected');
    connectedClients.push(ws);

    ws.on('close', () => {
        connectedClients = connectedClients.filter(c => c !== ws);
        console.log('❌ Autojoiner disconnected');
    });
});

// ====================== API ENDPOINTS ======================

// 1. Viode botovi šalju brainrote ovdje
app.post('/add', (req, res) => {
    const data = req.body;
    console.log('📨 Primljen brainrot:', data);

    const jobId = data.jobId || data.job_id;
    if (jobId) {
        knownServers.set(jobId, data);
    }

    const message = JSON.stringify({
        type: "new_server",
        name: data.brainrots && data.brainrots[0] ? data.brainrots[0].name : "Unknown",
        money: data.brainrots && data.brainrots[0] ? data.brainrots[0].gen : "0",
        jobid: jobId,
        value: data.brainrots && data.brainrots[0] ? data.brainrots[0].value : 0
    });

    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    res.status(200).json({ status: "ok" });
});

// 2. GET SERVER - za auto hop
app.get('/get-server', (req, res) => {
    let latest = null;
    let latestTime = 0;

    knownServers.forEach((value, key) => {
        if (value.timestamp > latestTime) {
            latestTime = value.timestamp;
            latest = value;
        }
    });

    if (latest) {
        res.json({ job_id: latest.jobId || latest.job_id });
    } else {
        res.json({ job_id: null });
    }
});

// 3. RECORD HOP
app.post('/record-hop', (req, res) => {
    console.log('📌 Hop recorded:', req.body);
    res.status(200).json({ status: "ok" });
});

// 4. BOT REGISTRY - deduplikacija
app.post('/scanner-register', (req, res) => {
    const { username } = req.body;
    if (username) {
        botRegistry.set(username, Date.now());
        console.log(`📋 Bot registered: ${username}`);
    }
    res.status(200).json({ status: "ok" });
});

app.get('/scanner-list', (req, res) => {
    const usernames = Array.from(botRegistry.keys());
    res.json({ usernames: usernames });
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Prošireni Backend radi na portu ${PORT}`);
});
