const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = [];

console.log("Brainrot Backend pokrenut...");

// WebSocket konekcija (za main autojoiner)
wss.on('connection', (ws) => {
    console.log('✅ Main Autojoiner se konektovao');
    connectedClients.push(ws);

    ws.on('close', () => {
        connectedClients = connectedClients.filter(client => client !== ws);
        console.log('❌ Autojoiner se odjavio');
    });
});

// Prima podatke od Viode botova
app.use(express.json());

app.post('/add', (req, res) => {
    const data = req.body;
    console.log('📨 Primljen brainrot od bota:', data);

    // Proslijedi svim konektovanim autojoinerima
    const message = JSON.stringify({
        type: "new_server",
        name: data.brainrots && data.brainrots[0] ? data.brainrots[0].name : "Unknown",
        money: data.brainrots && data.brainrots[0] ? data.brainrots[0].gen : "0",
        jobid: data.jobId || data.job_id,
        value: data.brainrots && data.brainrots[0] ? data.brainrots[0].value : 0
    });

    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    res.status(200).send({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Backend radi na portu ${PORT}`);
});
