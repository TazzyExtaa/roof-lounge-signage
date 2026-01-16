const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// KRİTİK: 'uploads' klasörünün tam yolunu belirle ve yoksa oluştur
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir)); // Yüklenen dosyaları dışarı aç
app.use(express.json());

// Multer Ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

let screens = {}; 

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('Dosya seçilmedi.');
    
    const { screenId } = req.body;
    // Dosyanın internet adresini oluştur (Railway URL'si ile uyumlu)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    if (!screens[screenId]) screens[screenId] = { status: 'offline', lastSeen: 'Hiç bağlanmadı' };
    
    screens[screenId].url = fileUrl;
    screens[screenId].type = 'image';

    io.to(screenId).emit('content-changed', { type: 'image', url: fileUrl });
    io.emit('status-update', screens);

    res.json({ success: true, url: fileUrl });
});

io.on('connection', (socket) => {
    socket.on('join-screen', (screenId) => {
        socket.join(screenId);
        if (!screens[screenId]) screens[screenId] = { url: '', type: 'image' };
        screens[screenId].status = 'online';
        screens[screenId].lastSeen = new Date().toLocaleTimeString();
        io.emit('status-update', screens);
        if (screens[screenId].url) socket.emit('content-changed', screens[screenId]);
    });
    
    socket.on('disconnect', () => {
        // Durum güncellemesi eklenebilir
    });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => console.log('Roof Lounge Server Aktif! Port: ' + PORT));
