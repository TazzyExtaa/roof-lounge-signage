const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.use(express.json());

let screens = {}; 

app.post('/update-content', (req, res) => {
    const { screenId, type, url } = req.body;
    
    // Eğer bu ID ilk kez geliyorsa, başlangıç değerlerini ata
    if (!screens[screenId]) {
        screens[screenId] = { 
            status: 'offline', 
            lastSeen: 'Hiç bağlanmadı',
            url: url,
            type: type
        };
    } else {
        screens[screenId].url = url;
        screens[screenId].type = type;
    }
    
    // İçeriği ilgili odaya (TV'ye) gönder
    io.to(screenId).emit('content-changed', { type, url });
    
    // KRİTİK NOKTA: Tüm admin panellerine listenin güncellendiğini bildir
    io.emit('status-update', screens); 
    
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    let currentScreenId = null;

    socket.on('join-screen', (screenId) => {
        currentScreenId = screenId;
        socket.join(screenId);
        
        if (!screens[screenId]) screens[screenId] = { url: '', type: 'image' };
        
        screens[screenId].status = 'online';
        screens[screenId].lastSeen = new Date().toLocaleTimeString();
        
        io.emit('status-update', screens); 
        if (screens[screenId].url) socket.emit('content-changed', screens[screenId]);
    });

    socket.on('disconnect', () => {
        if (currentScreenId && screens[currentScreenId]) {
            screens[currentScreenId].status = 'offline';
            io.emit('status-update', screens); 
        }
    });

    socket.emit('status-update', screens);
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => console.log('Roof Lounge Server 2.0 Aktif'));
