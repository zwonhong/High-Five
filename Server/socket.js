const { Server } = require('socket.io');
const { findOrCreateRoom, addUserToRoom, removeUserFromRoom } = require('./roomManager');

// 모듈로 서버를 내보내기
module.exports = (server) => {
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // 연결 핸들링
    io.on('connection', (socket) => {
        socket.on('join_auto', (nickname) => {
            const roomId = findOrCreateRoom();
            const users = addUserToRoom(roomId, { id: socket.id, nickname });

            socket.join(roomId);
            socket.currentRoom = roomId;
            socket.nickname = nickname;

            console.log(`[SYSTEM] room update: ${roomId} (users: ${nickname}, total: ${users.length}/5)`);
            io.to(roomId).emit('room_update', { roomId, users });
        });

        // 연결 종료 핸들링
        socket.on('disconnect', () => {
            if (socket.currentRoom) {
                const users = removeUserFromRoom(socket.currentRoom, socket.id);
                
                console.log(`[SYSTEM] user disconnected: ${socket.nickname} from room ${socket.currentRoom}`);
                
                if (users) {
                    io.to(socket.currentRoom).emit('room_update', { 
                        roomId: socket.currentRoom, 
                        users 
                    });
                } else {
                    console.log(`[SYSTEM] room ${socket.currentRoom} is now empty and has been deleted.`);
                }
            }
        });
    });
};