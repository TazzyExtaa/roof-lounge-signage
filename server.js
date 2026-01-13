const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

// Ekran veritabanı (Hafızada tutulur)
let screens = {}; 

app.post('/update-content', (req, res) => {
    const { screenId, type, url } = req.body;
    if (!screens[screenId]) screens[screenId] = {};
    
    screens[screenId] = { ...screens[screenId], type, url };
    io.to(screenId).emit('content-changed', { type, url });
    
    // Admin paneline güncel listeyi gönder
    io.emit('status-update', screens); 
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    let currentScreenId = null;

    socket.on('join-screen', (screenId) => {
        currentScreenId = screenId;
        socket.join(screenId);
        
        if (!screens[screenId]) screens[screenId] = { type: 'image', url: '' };
        screens[screenId].status = 'online';
        screens[screenId].lastSeen = new Date().toLocaleTimeString();
        
        io.emit('status-update', screens); // Admini bilgilendir
        if (screens[screenId].url) socket.emit('content-changed', screens[screenId]);
    });

    socket.on('disconnect', () => {
        if (currentScreenId && screens[currentScreenId]) {
            screens[currentScreenId].status = 'offline';
            io.emit('status-update', screens); // Admini bilgilendir
        }
    });

    // Admin ilk bağlandığında mevcut listeyi alması için
    socket.emit('status-update', screens);
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => console.log('Sistem Aktif: ' + PORT));
