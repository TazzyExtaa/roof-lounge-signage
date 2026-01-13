const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

// Her ekranın son içeriğini hafızada tutan nesne
let memory = {};

app.post('/update-content', (req, res) => {
    const { screenId, type, url } = req.body;
    if (!screenId || !url) return res.status(400).send("Eksik bilgi");

    memory[screenId] = { type, url }; // Hafızaya kaydet
    io.to(screenId).emit('content-changed', memory[screenId]);
    
    console.log(`Komut Gönderildi: [${screenId}] -> ${url}`);
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    socket.on('join-screen', (screenId) => {
        socket.join(screenId);
        console.log(`Ekran Odaya Girdi: ${screenId}`);
        
        // Ekran bağlandığı an, eğer hafızada bu ID için resim varsa hemen gönder
        if (memory[screenId]) {
            socket.emit('content-changed', memory[screenId]);
        }
    });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => console.log('Sunucu Yayında: ' + PORT));
