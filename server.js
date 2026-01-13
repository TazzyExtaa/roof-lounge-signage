const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

// Mevcut içerik (Varsayılan resim)
let currentContent = { 
    type: 'image', 
    url: 'https://via.placeholder.com/1920x1080?text=Roof+Lounge+Hazir' 
};

// Admin panelinden gelen güncellemeyi yakala ve yayınla
app.post('/update-content', (req, res) => {
    currentContent = req.body;
    io.emit('content-changed', currentContent);
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    socket.emit('content-changed', currentContent);
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Sunucu portu: ' + PORT);
});
