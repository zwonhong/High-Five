const { Server } = require('socket.io');
const { createClient } = require("redis"); // 멀티 서버를 위한 redis 클라이언트 추가
const { createAdapter } = require("@socket.io/redis-adapter"); // 멀티 서버를 위한 redis 어댑터 추가
const { findOrCreateRoom, addUserToRoom, removeUserFromRoom, markUserInactive, reconnectUser, resetRoomAfterGame } = require('./roomManager');
// errorHandling
const { redisConfig, handleRedisError, emitError } = require('./errorHandler');
const { cleanupGhostUsers, cleanupRoomGhosts } = require('./sessionCleaner');
const { startGame, assignTopic, checkAnswer, endRound, deleteGameState, markPlayerInactive, removePlayerFromGame, reactivatePlayer, TIMER_DURATION } = require('./gameManager');

const reconnectionTimers = new Map(); // socketId -> setTimeout 객체
const roundTimers = new Map(); // roomId → 라운드 타이머 (오케스트레이션 단순화 전까지 socket 측 보관)

// 모듈로 서버를 내보내기 Export server as module
module.exports = async (server) => {
    const io = new Server(server, {
        pingTimeout: 30000,
        pingInterval: 10000,
        cors: { origin: true, methods: ["GET", "POST"] }
    });

    // 1. Redis 연결 설정 (도커 환경의 redis-db 서비스 이름 사용) Redis connection setup (using redis-db service name in Docker environment)
    const pubClient = createClient(redisConfig);
    const subClient = pubClient.duplicate();

    // Redis 에러 핸들링 Redis error handling
    handleRedisError(pubClient);
    handleRedisError(subClient);

    let adapterMounted = false;

    const mountRedisAdapter = async () => {
        if (!pubClient.isReady || !subClient.isReady) return false;

        try {
            io.adapter(createAdapter(pubClient, subClient));
            adapterMounted = true;
            console.log('[SYSTEM] Redis adapter mounted');
            await cleanupGhostUsers(io, pubClient);
            return true;
        } catch (e) {
            console.error('[SYSTEM] Adapter Mount Error:', e);
            adapterMounted = false;
            return false;
        }
    };

    const waitUntilRedisReady = (client) =>
        new Promise((resolve, reject) => {
            if (client.isReady) return resolve();
            const onReady = () => {
                client.off('error', onError);
                resolve();
            };
            const onError = (err) => {
                client.off('ready', onReady);
                reject(err);
            };
            client.once('ready', onReady);
            client.once('error', onError);
        });

    pubClient.on('error', () => { adapterMounted = false; });
    pubClient.on('ready', () => {
        if (!adapterMounted) mountRedisAdapter();
    });
    subClient.on('ready', () => {
        if (!adapterMounted) mountRedisAdapter();
    });

    await pubClient.connect();
    await subClient.connect();
    await Promise.all([waitUntilRedisReady(pubClient), waitUntilRedisReady(subClient)]);
    await mountRedisAdapter();

    const emitRoomUpdate = (roomId, users) => {
        io.to(roomId).emit('room_update', { roomId, users });
    };

    const cancelRoomReconnectionTimers = (users) => {
        if (!users) return;
        for (const u of users) {
            const pending = reconnectionTimers.get(u.id);
            if (pending) {
                clearTimeout(pending);
                reconnectionTimers.delete(u.id);
            }
        }
    };

    const clearTimer = (roomId) => {
        const t = roundTimers.get(roomId);
        if (t) {
            clearTimeout(t);
            roundTimers.delete(roomId);
        }
    };

    const startTimer = (roomId, onTimeout) => {
        clearTimer(roomId);
        roundTimers.set(
            roomId,
            setTimeout(() => {
                Promise.resolve(onTimeout(roomId)).catch((e) => console.error('[TIMER]', e));
            }, TIMER_DURATION * 1000)
        );
    };

    const handlePlayerLeave = async (roomId, _playerId, remainingUsers) => {
        if (remainingUsers.length === 0) {
            clearTimer(roomId);
            await deleteGameState(pubClient, roomId);
        }
    };

    const refreshRoundAfterDrawerChange = async (roomId) => {
        clearTimer(roomId);
        const topicData = await assignTopic(pubClient, roomId);
        if (!topicData) return;

        const { topic, currentRound, totalRounds, drawer } = topicData;
        io.to(roomId).except(drawer.id).emit('round_start', { currentRound, totalRounds, drawer });
        io.to(drawer.id).emit('round_start', { currentRound, totalRounds, drawer, topic });
        startTimer(roomId, handleRoundEnd);
    };

    // 라운드 종료 처리 (타이머 만료 or 모두 정답)
    const handleRoundEnd = async (roomId) => {
        clearTimer(roomId);
        const result = await endRound(pubClient, roomId);
        if (!result) return;

        io.to(roomId).emit('round_end', result.roundResult);

        if (result.isGameOver) {
            const roomRaw = await pubClient.get(roomId);
            if (roomRaw) {
                cancelRoomReconnectionTimers(JSON.parse(roomRaw).users);
            }

            let roomAfterReset = null;
            if (result.roomResetNeeded) {
                roomAfterReset = await resetRoomAfterGame(pubClient, roomId);
            }

            // 게임 종료 후: 10초 유예 중인 끊긴 소켓도 Redis·UI에서 제거 (실제 연결만 남김)
            const roomAfterGhostPurge = await cleanupRoomGhosts(io, pubClient, roomId);
            if (roomAfterGhostPurge) {
                roomAfterReset = roomAfterGhostPurge;
            } else if (roomAfterGhostPurge === null && roomAfterReset) {
                roomAfterReset = null;
            }

            io.to(roomId).emit('game_end', {
                scores: result.scores,
                winner: result.winner,
                roomId,
                users: roomAfterReset?.users,
            });

            if (roomAfterReset) {
                emitRoomUpdate(roomId, roomAfterReset.users);
            }
        } else {
            await new Promise((r) => setTimeout(r, 1500));
            io.to(roomId).emit('next_round', result.nextRound);

            const topicData = await assignTopic(pubClient, roomId);
            if (topicData) {
                const { topic, currentRound, totalRounds, drawer } = topicData;
                io.to(roomId).except(drawer.id).emit('round_start', { currentRound, totalRounds, drawer });
                io.to(drawer.id).emit('round_start', { currentRound, totalRounds, drawer, topic });
                startTimer(roomId, handleRoundEnd);
            }
        }
    };

    // 연결 핸들링 Connection Handling
    io.on('connection', (socket) => {

        socket.on('try_reconnect', async (data) => {
            const { roomId, oldSocketId, nickname } = data;

            if (reconnectionTimers.has(oldSocketId)) {
                // 1. 기존 삭제 대기 타이머 취소
                clearTimeout(reconnectionTimers.get(oldSocketId));
                reconnectionTimers.delete(oldSocketId);

                // 2. Redis 데이터 갱신 (roomManager에서 추가한 함수 사용)
                const room = await reconnectUser(pubClient, roomId, oldSocketId, socket.id);
                
                if (room) {
                    socket.join(roomId);
                    socket.currentRoom = roomId;
                    socket.nickname = nickname;

                    await reactivatePlayer(pubClient, roomId, oldSocketId, socket.id);

                    // 3. 본인 및 방 인원들에게 복구 알림
                    socket.emit('reconnect_success', { roomId, users: room.users });
                    emitRoomUpdate(roomId, room.users);
                    console.log(`[RECONNECT] ${nickname} returned to ${roomId}`);
                }
            } else {
                socket.emit('reconnect_fail', "세션이 만료되었습니다.");
            }
        });

        socket.on('join_auto', async (nickname) => {
            // Redis 연결 상태 확인 Check Redis connection status
            try {
                if (!pubClient.isOpen || !pubClient.isReady) {
                    console.error("[REJECT] Redis not ready. Rejecting join_auto.");
                    return emitError(socket, "Cannot join room: Server maintenance in progress. Please try again later.", true);
                }
            
            
                const roomId = await findOrCreateRoom(pubClient);
                await cleanupRoomGhosts(io, pubClient, roomId);

                const result = await addUserToRoom(pubClient, roomId, { id: socket.id, nickname });

                if (result.success) {
                    const { users, isStarted } = result.room;

                    socket.join(roomId);
                    socket.currentRoom = roomId;
                    socket.nickname = nickname;

                    console.log(`[SYSTEM] room update: ${roomId} (users: ${nickname}, total: ${users.length}/5)`);
                    emitRoomUpdate(roomId, users);

                    if (isStarted) {
                        console.log(`[SYSTEM] room ${roomId} is now ready to start!`);

                        const gameData = await startGame(pubClient, roomId, users);
                        io.to(roomId).emit('game_started', gameData);

                        const topicData = await assignTopic(pubClient, roomId);
                        if (topicData) {
                            const { topic, currentRound, totalRounds, drawer } = topicData;
                            io.to(roomId).except(drawer.id).emit('round_start', { currentRound, totalRounds, drawer });
                            io.to(drawer.id).emit('round_start', { currentRound, totalRounds, drawer, topic });
                            startTimer(roomId, handleRoundEnd);
                        }
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
        socket.on('send_chat', async (payload) => {
            try {
                const roomId = socket.currentRoom;
                const nickname = socket.nickname;
                const now = Date.now();
                const message = typeof payload === 'string' ? payload : (payload?.message ?? '');
                const inAnswer = typeof payload === 'string' ? false : Boolean(payload?.inAnswer);

                // 간단한 스팸 방지 로직 (300ms 이상 간격을 두고 메시지 전송)
                if (socket.lastChatTime && now - socket.lastChatTime < 300) {
                    socket.emit('error_message', "천천히 입력해주세요.");
                    return;
                }
                socket.lastChatTime = now;

                if (roomId && message.trim()) {
                    io.to(roomId).emit('receive_chat', {
                        sender: nickname,
                        message,
                        timestamp: now
                    });
                    console.log(`[CHAT][${roomId}] ${nickname}: ${message}`);

                    // 정답 확인 → 정답 즉시 라운드 종료
                    const answerResult = await checkAnswer(pubClient, roomId, socket.id, message, inAnswer);
                    if (answerResult?.isCorrect) {
                        io.to(roomId).emit('correct_answer', {
                            nickname: answerResult.player.nickname,
                            point: answerResult.point,
                            scores: answerResult.scores,
                        });
                        await handleRoundEnd(roomId);
                    }
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

        // 마지막 stroke 되돌리기 Undo last stroke
        socket.on('undo_draw', () => {
            try {
                const roomId = socket.currentRoom;
                if (roomId) {
                    socket.to(roomId).emit('undo_draw');
                }
            } catch (err) {
                console.error("[UNDO DRAW ERROR]", err);
            }
        });

        // stroke 지우기 (지우개) Erase strokes by id
        socket.on('erase_draw', (data) => {
            try {
                const roomId = socket.currentRoom;
                if (roomId && Array.isArray(data?.strokeIds)) {
                    socket.to(roomId).emit('erase_draw', { strokeIds: data.strokeIds });
                }
            } catch (err) {
                console.error("[ERASE DRAW ERROR]", err);
            }
        });

        // 연결 종료 핸들링 Disconnection handling
        socket.on('disconnect', async (reason) => {
            try {
                if (socket.currentRoom) {
                    const roomId = socket.currentRoom;
                    const socketId = socket.id;
                    const nickname = socket.nickname;

                    // 즉시 지우지 않고 '비활성화' 처리 Mark as inactive instead of immediate removal
                    const room = await markUserInactive(pubClient, roomId, socketId);
                    if (room) {
                        emitRoomUpdate(roomId, room.users);
                    }

                    const { needsRoundRefresh } = await markPlayerInactive(pubClient, roomId, socketId);
                    if (needsRoundRefresh) {
                        await refreshRoundAfterDrawerChange(roomId);
                    }

                    console.log(`[SYSTEM] User marked as inactive: ${socket.nickname} (${reason}) from room ${socket.currentRoom}. Waiting for 10 seconds before final removal.`);
                    
                    const timer = setTimeout(async () => {
                        try {
                            const result = await removeUserFromRoom(pubClient, roomId, socketId);

                            if (result) {
                                const { users } = result;

                                console.log(`[SYSTEM] Room ${roomId} updated. Total: ${users.length}`);

                                const { needsRoundRefresh: needsRefresh } = await removePlayerFromGame(pubClient, roomId, socketId);
                                if (needsRefresh) {
                                    await refreshRoundAfterDrawerChange(roomId);
                                }

                                emitRoomUpdate(roomId, users);

                                await handlePlayerLeave(roomId, socketId, users);
                            } else {
                                console.log(`[SYSTEM] Room ${roomId} is now empty and removed from Redis.`);
                            }
                        } catch (err) {
                            console.error("[CLEANUP ERROR]", err);
                        } finally {
                            reconnectionTimers.delete(socketId);
                        }
                    }, 10000);
                    // 타이머 관리 Map에 저장 (이걸 해야 try_reconnect에서 취소가 가능함)
                    reconnectionTimers.set(socketId, timer);
                } else {
                    // 방에 입장하지 않고 연결만 끊긴 경우
                    console.log(`[SYSTEM] User disconnected before joining any room: ${socket.id} (${reason})`);
                }
            } catch (err) {
                console.error("[DISCONNECT ERROR]", err);
            }
        });
    });
};