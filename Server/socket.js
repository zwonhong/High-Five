const { Server } = require('socket.io');
const { createClient } = require("redis"); // 멀티 서버를 위한 redis 클라이언트 추가
const { createAdapter } = require("@socket.io/redis-adapter"); // 멀티 서버를 위한 redis 어댑터 추가
const { findOrCreateRoom, addUserToRoom, removeUserFromRoom } = require('./roomManager');
// errorHandling
const { redisConfig, handleRedisError, emitError } = require('./errorHandler');

// 모듈로 서버를 내보내기 Export server as module
module.exports = async (server) => {
    const io = new Server(server, {
        cors: { origin: true, methods: ["GET", "POST"] }
    });

    // 1. Redis 연결 설정 (도커 환경의 redis-db 서비스 이름 사용) Redis connection setup (using redis-db service name in Docker environment)
    const pubClient = createClient(redisConfig);
    const subClient = pubClient.duplicate();

    // Redis 에러 핸들링 Redis error handling
    handleRedisError(pubClient);
    handleRedisError(subClient);

    let adapterMounted = false;

    // 재연결 시 어댑터를 안전하게 다시 장착하기 위한 함수
    // 어댑터 장착 로직을 별도 함수로 분리
    const mountRedisAdapter = () => {
        // 두 소켓이 모두 'Ready' 상태인지 직접 확인
        if (pubClient.isReady && subClient.isReady) {
            try {
                const adapter = createAdapter(pubClient, subClient);
                io.adapter(adapter);
                isAdapterMounted = true;
                console.log("[SYSTEM] Redis Reconnected & Adapter Swapped!");
            } catch (e) {
                console.error("[SYSTEM] Adapter Mount Error:", e);
            }
        }
    };

    // 두 클라이언트 모두에 'ready' 리스너 등록
    pubClient.on('ready', mountRedisAdapter);
    subClient.on('ready', mountRedisAdapter);

    // [중요] 연결이 끊겼을 때 로그를 찍어 상태를 모니터링합니다.
    pubClient.on('error', () => { isAdapterMounted = false; });

    // 초기 연결 시도
    pubClient.connect().catch(() => {});
    subClient.connect().catch(() => {});


    // 연결 핸들링 Connection Handling
    io.on('connection', (socket) => {

        socket.on('join_auto', async (nickname) => {
            // Redis 연결 상태 확인 Check Redis connection status
            try {
                if (!pubClient.isOpen || !pubClient.isReady) {
                    console.error("[REJECT] Redis not ready. Rejecting join_auto.");
                    return emitError(socket, "Cannot join room: Server maintenance in progress. Please try again later.", true);
                }
            
            
                const roomId = await findOrCreateRoom(pubClient);
                const result = await addUserToRoom(pubClient, roomId, { id: socket.id, nickname });

                if (result.success) {
                    const { users, isStarted } = result.room;

                    socket.join(roomId);
                    socket.currentRoom = roomId;
                    socket.nickname = nickname;

                    console.log(`[SYSTEM] room update: ${roomId} (users: ${nickname}, total: ${users.length}/5)`);
                    io.to(roomId).emit('room_update', { roomId, users });

                    if(isStarted) {
                        console.log(`[SYSTEM] room ${roomId} is now ready to start!`);
                        io.to(roomId).emit('game_start', { roomId: roomId, canDraw: true});
                    }
                } else {
                    // true를 전달하여 중복 닉네임 시 연결을 끊고 다시 입력하게 유도함 Force disconnect on duplicate nickname to prompt re-entry
                    emitError(socket, result.message, false);
                }
            } catch (err) {
                console.error("[JOIN ERROR]", err);
                emitError(socket, "An unexpected error occurred while joining the room. Please try again.", true);
            }
        });

        // 채팅 로직 Chat logic
        // 유저가 메시지를 보냈을 때 실행됩니다. When a user sends a message, this runs.
        socket.on('send_chat', (msg) => {
            try {
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
            } catch (err) {
                console.error("[CHAT ERROR]", err);
            }
        });

        // 드로잉 로직 Drawing logic
        socket.on('draw_data', (data) => {
            try {
                const roomId = socket.currentRoom;
                if (roomId) {
                    // socket.to(roomId)는 나를 제외한 해당 방의 모든 유저에게 전송 socket.to(roomId) sends to all users in the room except myself
                    // 내가 그린 건 이미 내 화면에 그려졌으니 중복 방지 to avoid duplication since my drawing is already on my canvas
                    socket.to(roomId).emit('receive_draw', data);
                }
            } catch (err) {
                console.error("[DRAW ERROR]", err);
            }
        });

        // 캔버스 지우기 로직 Canvas clear logic 
        socket.on('clear_canvas', () => {
            try {
                const roomId = socket.currentRoom;
                if (roomId) {
                    // 지우기는 모든 유저(나 포함)의 화면을 동시에 지움 Clear everyone's canvas at the same time, including mine
                    io.to(roomId).emit('clear_canvas');
                }
            } catch (err) {
                console.error("[CLEAR CANVAS ERROR]", err);
            }
        });

        // 연결 종료 핸들링 Disconnection handling
        socket.on('disconnect', async () => {
            try {
                if (socket.currentRoom) {
                    // roomManager.js에서 객체를 받아옴
                    const result = await removeUserFromRoom(pubClient, socket.currentRoom, socket.id);
                    
                    console.log(`[SYSTEM] user disconnected: ${socket.nickname} from room ${socket.currentRoom}`);
                    
                    if (result) {
                        const { users } = result;
                        // 방에 남은 인원이 있는 경우 if result is not null)
                        io.to(socket.currentRoom).emit('room_update', { 
                            roomId: socket.currentRoom, 
                            users: users
                        });
                    }
                } 
            } catch (err) {
                console.error("[DISCONNECT ERROR]", err);
            }
        });
    });
};