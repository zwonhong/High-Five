const { createClient } = require('redis');

// 도커 환경의 서비스 이름 'redis-db'를 사용합니다.
/** socker에서 사용하는 redis 클라이언트 참조 */
// const client = createClient({ url: 'redis://redis-db:6379' });
// client.connect().catch(console.error); // 초기 연결만 수행

const MAX_USERS = 5;

// 비어있는 방을 찾거나 모든 방이 다 정원이 찬 경우 새로운 방을 생성함 Find an empty room or create a new one if all are full
const findOrCreateRoom = async (client) => {
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

/** 
// 방에 유저를 추가함 Add user to room
const addUserToRoom = async (client, roomId, user) => {
    // 해당 방 데이터를 Redis에서 가져옴
    const data = await client.get(roomId);
    if (!data) return { success: false, message: "Room not found." }; // 방이 존재하지 않으면 null 반환 If room doesn't exist, return null
    
    const room = JSON.parse(data);

    // 중복 닉네임 체크 Check for duplicate nickname
    const isDuplicate = room.users.some(u => u.nickname === user.nickname);
    if (isDuplicate) {
        return { success: false, message: "Already in use." };
    }

    // 인원 초과 체크 (Race Condition defense) Check for room capacity
    if (room.users.length >= MAX_USERS) {
        return { success: false, message: "Room is already full." };
    }

    room.users.push(user);
    if (room.users.length === MAX_USERS) {
        room.isStarted = true; // 방이 꽉 차면 시작 상태로 변경 Set room as ready to start when full
    }

    // 변경된 방 데이터를 Redis에 저장 Save updated room data back to Redis
    await client.set(roomId, JSON.stringify(room));
    return { success: true, room }; // 방 정보를 반환 Return room info;
}; */

// 방에 유저를 추가하는 과정을 Lua 스크립트로 원자적으로 처리하여 레이스 컨디션을 방지합니다. Add user to room atomically using Lua script to prevent race conditions.
const addUserToRoom = async (client, roomId, user) => {
    const luaScript = `
        local data = redis.call('get', KEYS[1])
        if not data then return "ROOM_NOT_FOUND" end
        
        local room = cjson.decode(data)
        
        -- 중복 닉네임 체크
        for _, u in ipairs(room.users) do
            if u.nickname == ARGV[1] then
                return "DUPLICATE"
            end
        end
        
        -- 인원 초과 체크 (MAX_USERS = 5)
        if #room.users >= 5 then
            return "FULL"
        end
        
        -- 유저 추가
        table.insert(room.users, {id = ARGV[2], nickname = ARGV[1]})
        
        -- 5명이 되면 시작 상태로 변경
        if #room.users == 5 then
            room.isStarted = true
        end
        
        redis.call('set', KEYS[1], cjson.encode(room))
        return cjson.encode({success = true, room = room})
    `;

    try {
        const result = await client.eval(luaScript, {
            keys: [roomId],
            arguments: [user.nickname, user.id]
        });

        if (result === "DUPLICATE") return { success: false, message: "Already in use." };
        if (result === "FULL") return { success: false, message: "Room is already full." };
        if (result === "ROOM_NOT_FOUND") return { success: false, message: "Room not found." };

        return JSON.parse(result);
    } catch (err) {
        console.error("[REDIS LUA ERROR]", err);
        return { success: false, message: "Server error during entry." };
    }
};

// 방에서 유저를 제거하고 방이 비게 되면 삭제함 Remove user from room and delete room if empty
const removeUserFromRoom = async (client, roomId, socketId) => {
    const data = await client.get(roomId);
    if (!data) return null; // 방이 존재하지 않으면 null 반환 If room doesn't exist, return null

    const room = JSON.parse(data);
    const initialLength = room.users.length;
    room.users = room.users.filter(u => u.id !== socketId);

    // 인원 변화가 없다면 (지워진 게 없다면) 그냥 리턴 Return if no change in users (no one was removed)
    if (room.users.length === initialLength) return { users: room.users };
    
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