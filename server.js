const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Имитация базы данных
let users = {}; 
let channels = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    // Регистрация / Вход
    socket.on('auth', (data) => {
        if (!users[data.username]) {
            users[data.username] = { 
                ...data, id: null, gifts: [], followers: 0 
            };
        }
        socket.username = data.username;
        socket.emit('auth_success', users[data.username]);
    });

    // Поиск
    socket.on('search_user', (username) => {
        socket.emit('search_result', users[username] || null);
    });

    // Отправка NFT
    socket.on('send_nft', ({ to, nftSrc }) => {
        if (users[to]) {
            users[to].gifts.push(nftSrc);
            io.emit('update_profile', { username: to, data: users[to] });
        }
    });

    // Админ-команды
    socket.on('admin_action', (data) => {
        if (data.type === 'set_id') {
            if (users[data.target]) users[data.target].id = data.value;
        }
        if (data.type === 'boost') {
            if (channels[data.target]) channels[data.target].subs += parseInt(data.value);
        }
        io.emit('refresh_data');
    });

    // Сообщения
    socket.on('send_msg', (msg) => {
        io.emit('new_msg', msg);
    });
});

server.listen(3000, () => console.log('BROKE Server running on port 3000'));