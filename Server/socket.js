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
            const result = addUserToRoom(roomId, { id: socket.id, nickname });

            if (result) {
                const { users, isStarted } = result;

                socket.join(roomId);
                socket.currentRoom = roomId;
                socket.nickname = nickname;

                console.log(`[SYSTEM] room update: ${roomId} (users: ${nickname}, total: ${users.length}/5)`);
                io.to(roomId).emit('room_update', { roomId, users });

                if(isStarted) {
                    console.log(`[SYSTEM] room ${roomId} is now ready to start!`);
                    io.to(roomId).emit('game_start', { roomId: roomId, canDraw: true});
                }
            }
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

        // 드로잉 로직 Drawing logic
        socket.on('draw_data', (data) => {
            const roomId = socket.currentRoom;
            if (roomId) {
                // socket.to(roomId)는 나를 제외한 해당 방의 모든 유저에게 전송 socket.to(roomId) sends to all users in the room except myself
                // 내가 그린 건 이미 내 화면에 그려졌으니 중복 방지 to avoid duplication since my drawing is already on my canvas
                socket.to(roomId).emit('receive_draw', data);
            }
        });

        // 캔버스 지우기 로직 Canvas clear logic 
        socket.on('clear_canvas', () => {
            const roomId = socket.currentRoom;
            if (roomId) {
                // 지우기는 모든 유저(나 포함)의 화면을 동시에 지움 Clear everyone's canvas at the same time, including mine
                io.to(roomId).emit('clear_canvas');
            }
        });

        // 연결 종료 핸들링 Disconnection handling
        socket.on('disconnect', () => {
            if (socket.currentRoom) {
                // roomManager.js에서 객체를 받아옴
                const result = removeUserFromRoom(socket.currentRoom, socket.id);
                
                console.log(`[SYSTEM] user disconnected: ${socket.nickname} from room ${socket.currentRoom}`);
                
                if (result) {
                    const { users } = result;
                    // 방에 남은 인원이 있는 경우 if result is not null)
                    io.to(socket.currentRoom).emit('room_update', { 
                        roomId: socket.currentRoom, 
                        users: users
                    });
                } else {
                    // 방이 빈 경우 if result is null
                    console.log(`[SYSTEM] room ${socket.currentRoom} is now empty and has been deleted.`);
                }
            }
        });
    });
};