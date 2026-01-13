const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

// Tüm ekranların içeriklerini burada tutuyoruz
// Yapı: { "ekran1": {type, url}, "ekran2": {type, url} }
let screenContents = {};

app.get('/player.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'player.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Belirli bir ekrana içerik gönder
app.post('/update-content', (req, res) => {
    const { screenId, type, url } = req.body;
    if (!screenId) return res.status(400).send("Screen ID gerekli");

    screenContents[screenId] = { type, url };
    
    // Sadece o screenId'ye sahip odaya mesaj gönder
    io.to(screenId).emit('content-changed', screenContents[screenId]);
    
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    // Ekran bağlandığında hangi ID'ye ait olduğunu bildirir
    socket.on('join-screen', (screenId) => {
        socket.join(screenId); // Ekranı kendi ID'sine özel odaya al
        console.log(`Ekran bağlandı: ${screenId}`);
        
        // Eğer bu ekran için daha önce ayarlanmış bir içerik varsa gönder
        if (screenContents[screenId]) {
            socket.emit('content-changed', screenContents[screenId]);
        }
    });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Multi-Screen Sunucu Aktif: ' + PORT);
});
