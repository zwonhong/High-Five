const rooms = new Map();
const MAX_USERS = 5;

// 비어있는 방을 찾거나 모든 방이 다 정원이 찬 경우 새로운 방을 생성함
const findOrCreateRoom = () => {
    let targetRoomId = null;
    // 모든 방을 순회하며 정원이 남은 방을 찾음
    for (let [roomId, roomData] of rooms) {
        if (roomData.users.length < MAX_USERS) {
            targetRoomId = roomId;
            break;
        }
    } // 모든 방이 다 찼으면 새 방 생성
    if (!targetRoomId) {
        targetRoomId = `room_${Date.now()}`;
        rooms.set(targetRoomId, { users: [] });
        console.log(`[SYSTEM] new room created: ${targetRoomId}`);
    }
    return targetRoomId;
};
// 방에 유저를 추가함
const addUserToRoom = (roomId, user) => {
    const room = rooms.get(roomId);
    if (room) {
        room.users.push(user);
        return room.users;
    }
    return null;
};

// 방에서 유저를 제거하고 방이 비게 되면 삭제함
const removeUserFromRoom = (roomId, socketId) => {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.users = room.users.filter(u => u.id !== socketId);
        if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`[SYSTEM] empty room deleted: ${roomId}`);
            return null;
        }
        return room.users;
    }
};

// 함수 -> 모듈로 내보내기
module.exports = { findOrCreateRoom, addUserToRoom, removeUserFromRoom };