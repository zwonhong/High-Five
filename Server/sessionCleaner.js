// sessionCleaner.js

/**
 * Redis에 남아있는 유령 유저(Ghost Users)를 찾아 제거합니다.
 * Removes ghost users from Redis who are no longer connected to the Socket.io server.
 * @param {object} io - Socket.io 서버 인스턴스
 * @param {object} pubClient - Redis 클라이언트
 */
const cleanupGhostUsers = async (io, pubClient) => {
    try {
        console.log("[CLEANUP] Starting ghost user cleanup...");
        
        // 1. Redis에서 모든 방 키를 가져옴 Get all room keys from Redis
        const keys = await pubClient.keys('room_*');
        
        for (const roomId of keys) {
            const data = await pubClient.get(roomId);
            if (!data) continue;

            let room = JSON.parse(data);
            let initialCount = room.users.length;

            // 2. 현재 소켓 서버 어댑터를 통해 연결된 모든 소켓 ID 확인 Check all connected socket IDs through the server adapter
            // 멀티 서버 환경이므로 io.allSockets() 또는 adapter.allRooms 등을 활용해야 함
            // return io.allSockers() or adapter.allRooms() should be used to get all connected socket IDs in a multi-server environment
            const allActiveSockets = await io.allSockets();

            // 3. 현재 활성화된 소켓 목록에 없는 유저는 유령으로 간주하고 필터링
            // Filter out users whose socket IDs are not in the list of active sockets, considering them as ghosts
            room.users = room.users.filter(user => allActiveSockets.has(user.id));

            // 4. 변화가 있다면 Redis 업데이트
            // If there are changes, update Redis
            if (room.users.length !== initialCount) {
                console.warn(`[CLEANUP] room ${roomId}: removed ${initialCount - room.users.length}`);
                
                if (room.users.length === 0) {
                    await pubClient.del(roomId);
                    console.log(`[CLEANUP] room ${roomId} deleted (empty)`);
                } else {
                    await pubClient.set(roomId, JSON.stringify(room));
                    // 방 인원이 변했으므로 클라이언트에 알림 Notify clients of the change in room occupancy
                    io.to(roomId).emit('room_update', { roomId, users: room.users });
                }
            }
        }
        console.log("[CLEANUP] Ghost user cleanup completed.");
    } catch (err) {
        console.error("[CLEANUP ERROR]", err);
    }
};

/**
 * 한 방에서 Redis에는 있으나 소켓이 없는 유저 제거 (게임 종료 후 정리용)
 * @returns {object|null} 갱신된 room, 방 삭제 시 null
 */
const cleanupRoomGhosts = async (io, pubClient, roomId) => {
    const data = await pubClient.get(roomId);
    if (!data) return null;

    const room = JSON.parse(data);
    const before = room.users.length;
    const activeSockets = await io.allSockets();

    room.users = room.users.filter((user) => activeSockets.has(user.id));

    if (room.users.length === before) return room;

    if (room.users.length === 0) {
        await pubClient.del(roomId);
        console.log(`[CLEANUP] room ${roomId} deleted (ghost purge)`);
        return null;
    }

    await pubClient.set(roomId, JSON.stringify(room));
    console.warn(`[CLEANUP] room ${roomId}: removed ${before - room.users.length} ghost(s)`);
    return room;
};

module.exports = { cleanupGhostUsers, cleanupRoomGhosts };