const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];
let knownServers = new Map(); // Za deduplikaciju (jobId -> data)

// Middleware
app.use(express.json());

// WebSocket za main autojoiner
wss.on('connection', (ws) => {
    console.log('✅ Main Autojoiner connected');
    connectedClients.push(ws);

    ws.on('close', () => {
        connectedClients = connectedClients.filter(client => client !== ws);
        console.log('❌ Autojoiner disconnected');
    });
});

// Glavni endpoint - Viode botovi šalju ovdje
app.post('/add', (req, res) => {
    try {
        const data = req.body;
        console.log('📨 Primljen brainrot od bota:', data);

        const jobId = data.jobId || data.job_id;
        if (!jobId) return res.status(400).json({ status: "error", message: "No jobId" });

        // Spremi za deduplikaciju
        knownServers.set(jobId, {
            ...data,
            timestamp: Date.now()
        });

        const message = JSON.stringify({
            type: "new_server",
            name: data.brainrots && data.brainrots[0] ? data.brainrots[0].name : "Unknown",
            money: data.brainrots && data.brainrots[0] ? data.brainrots[0].gen : "0",
            jobid: jobId,
            value: data.brainrots && data.brainrots[0] ? data.brainrots[0].value : 0
        });

        // Pošalji svim main autojoinerima
        let sent = 0;
        connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                sent++;
            }
        });

        console.log(`📤 Poslato ${sent} autojoineru`);
        res.status(200).json({ status: "ok", sent: sent });

    } catch (error) {
        console.error('❌ Greška:', error);
        res.status(500).json({ status: "error" });
    }
});

// Endpoint za get-server (da main može pitati za sledeći server)
app.get('/get-server', (req, res) => {
    // Za sada vraća najnoviji server
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

// Endpoint za record-hop
app.post('/record-hop', (req, res) => {
    console.log('📌 Hop recorded:', req.body);
    res.status(200).json({ status: "ok" });
});

// Registry za bot deduplikaciju (jednostavna verzija)
app.post('/scanner-register', (req, res) => {
    console.log('📋 Bot registered:', req.body);
    res.status(200).json({ status: "ok" });
});

app.get('/scanner-list', (req, res) => {
    res.json({ usernames: [] }); // Za sada prazno, možeš proširiti kasnije
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Prošireni Backend radi na portu ${PORT}`);
});
