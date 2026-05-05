const { Server } = require('socket.io');
const { findOrCreateRoom, addUserToRoom, removeUserFromRoom } = require('./roomManager');

// 모듈로 서버를 내보내기 Export server as module
module.exports = (server) => {
    const io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // 연결 핸들링 Connection Handling
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

        // 채팅 로직 Chat logic
        // 유저가 메시지를 보냈을 때 실행됩니다. When a user sends a message, this runs.
        socket.on('send_chat', (msg) => {
            const roomId = socket.currentRoom;
            const nickname = socket.nickname; // join_auto 시점에 저장했던 닉네임 Use nickname saved at join_auto

            // 방에 속해 있고 메시지가 비어있지 않은 경우에만 전송 Only send if user is in a room and message is not empty
            if (roomId && msg.trim()) {
                io.to(roomId).emit('receive_chat', {
                    sender: socket.nickname, // 입장 시 저장했던 닉네임 활용 Use nickname saved at join_auto
                    message: msg
                });

                // 서버 터미널 모니터링용 로그 Server terminal log for monitoring
                console.log(`[CHAT][${roomId}] ${nickname}: ${msg}`);
            }
        });

        // 연결 종료 핸들링 Disconnection handling
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