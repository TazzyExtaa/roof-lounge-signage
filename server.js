const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const multer = require('multer'); // Yeni: Dosya yükleme kütüphanesi
const fs = require('fs');

// 'uploads' klasörü yoksa oluştur
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads')); // Yüklenen dosyalara dışarıdan erişim izni
app.use(express.json());

// Multer Ayarları: Dosyayı orijinal ismiyle kaydet
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

let screens = {}; 

// YENİ: Dosya Yükleme Endpoint'i
app.post('/upload', upload.single('file'), (req, res) => {
    const { screenId } = req.body;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    if (!screens[screenId]) {
        screens[screenId] = { status: 'offline', lastSeen: 'Hiç bağlanmadı' };
    }
    
    screens[screenId].url = fileUrl;
    screens[screenId].type = 'image';

    io.to(screenId).emit('content-changed', { type: 'image', url: fileUrl });
    io.emit('status-update', screens);

    res.json({ success: true, url: fileUrl });
});

// ... (join-screen ve disconnect kısımları aynı kalacak) ...

io.on('connection', (socket) => {
    socket.on('join-screen', (screenId) => {
        socket.join(screenId);
        if (!screens[screenId]) screens[screenId] = { url: '', type: 'image' };
        screens[screenId].status = 'online';
        screens[screenId].lastSeen = new Date().toLocaleTimeString();
        io.emit('status-update', screens);
        if (screens[screenId].url) socket.emit('content-changed', screens[screenId]);
    });
    socket.on('disconnect', () => { /* ... aynı kod ... */ });
    socket.emit('status-update', screens);
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => console.log('Roof Lounge Upload Server Aktif'));
