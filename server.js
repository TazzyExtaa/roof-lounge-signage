const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

// Her ekranın son halini hafızada tutalım
let screenStore = {};

app.post('/update-content', (req, res) => {
    const { screenId, type, url } = req.body;
    screenStore[screenId] = { type, url }; // Hafızaya kaydet
    
    io.to(screenId).emit('content-changed', { type, url });
    console.log(`${screenId} ekranına içerik gönderildi.`);
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    socket.on('join-screen', (screenId) => {
        socket.join(screenId);
        console.log(`Ekran bağlandı ve odaya girdi: ${screenId}`);
        
        // Eğer bu ekran için daha önce bir resim gönderilmişse, bağlanınca hemen göster
        if (screenStore[screenId]) {
            socket.emit('content-changed', screenStore[screenId]);
        }
    });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Sunucu Hazır: ' + PORT);
});
