const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.use(express.json());

let currentContent = { type: 'image', url: 'https://via.placeholder.com/1920x1080?text=Roof+Lounge+Aktif' };

app.post('/update-content', (req, res) => {
    currentContent = req.body;
    io.emit('content-changed', currentContent);
    res.sendStatus(200);
});

io.on('connection', (socket) => {
    socket.emit('content-changed', currentContent);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Sunucu portu: ' + PORT);
});