const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Dosyalar klasörde değil, ana dizinde olduğu için burayı güncelledik:
app.use(express.static(__dirname));

app.use(express.json());

let currentContent = { 
    type: 'image', 
    url: 'https://via.placeholder.com/1920x1080?text=Roof+Lounge+Sistem+Hazir' 
};

// Player sayfasını doğrudan ana dizinden gönder
app.get('/player.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'player.html'));
});

app.post('/update-content', (req, res) => {
    currentContent = req.body;
    io.emit('content-changed', currentContent);
    res.sendStatus(200);
});

io.on('connection', (socket) => {
    socket.emit('content-changed', currentContent);
});

const PORT = process.env.PORT || 8080; // Railway'in verdiği portu kullan
http.listen(PORT, '0.0.0.0', () => {
    console.log('Sunucu aktif, Port: ' + PORT);
});
