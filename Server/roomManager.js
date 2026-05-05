const { createClient } = require('redis');

// 도커 환경의 서비스 이름 'redis-db'를 사용합니다.
const client = createClient({ url: 'redis://redis-db:6379' });
client.connect().catch(console.error); // 초기 연결만 수행

const MAX_USERS = 5;

// 비어있는 방을 찾거나 모든 방이 다 정원이 찬 경우 새로운 방을 생성함 Find an empty room or create a new one if all are full
const findOrCreateRoom = async () => {
    // Redis에서 모든 방 키(room:*)를 가져옴
    const keys = await client.keys('room_*');

    let targetRoomId = null;
    
    for (const key of keys) {
        // 각 방의 정보를 가져와서 객체로 변환 Convert each room's info to an object
        const roomData = JSON.parse(await client.get(key));

        // 빈 자리가 있는 방을 찾음 Find a room with available space
        if (roomData.users.length < MAX_USERS && !roomData.isStarted) {
            targetRoomId = key;
            break;
        }
    } // 모든 방이 다 찼으면 새 방 생성 If all rooms are full, create new room
    if (!targetRoomId) {
        targetRoomId = `room_${Date.now()}`;
        const newRoom = { users: [], isStarted: false };
        await client.set(targetRoomId, JSON.stringify(newRoom));
        console.log(`[SYSTEM] new room created: ${targetRoomId}`);
    }
    return targetRoomId;
};
// 방에 유저를 추가함 Add user to room
const addUserToRoom = async (roomId, user) => {
    // 해당 방 데이터를 Redis에서 가져옴
    const data = await client.get(roomId);
    if (!data) return null; // 방이 존재하지 않으면 null 반환 If room doesn't exist, return null
    
    const room = JSON.parse(data);

    room.users.push(user);
    if (room.users.length === MAX_USERS) {
        room.isStarted = true; // 방이 꽉 차면 시작 상태로 변경 Set room as ready to start when full
    }

    // 변경된 방 데이터를 Redis에 저장 Save updated room data back to Redis
    await client.set(roomId, JSON.stringify(room));
    return room; // 방 정보를 반환 Return room info;
};

// 방에서 유저를 제거하고 방이 비게 되면 삭제함 Remove user from room and delete room if empty
const removeUserFromRoom = async (roomId, socketId) => {
    const data = await client.get(roomId);
    if (!data) return null; // 방이 존재하지 않으면 null 반환 If room doesn't exist, return null

    const room = JSON.parse(data);
    room.users = room.users.filter(u => u.id !== socketId);
    
    if (room.users.length === 0) {
        await client.del(roomId); // 방이 비면 Redis에서 삭제 Delete from Redis if room is empty
        console.log(`[SYSTEM] empty room deleted: ${roomId}`);
        return null;
    } else {
        await client.set(roomId, JSON.stringify(room)); // 변경된 방 데이터를 Redis에 저장 Save updated room data back to Redis
        return room; // 방 정보를 반환 Return room info;
    }
};

// 함수 -> 모듈로 내보내기 Export functions as module
module.exports = { findOrCreateRoom, addUserToRoom, removeUserFromRoom };