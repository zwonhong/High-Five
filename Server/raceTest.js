const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:80"; // Nginx 주소
const ATTEMPT_COUNT = 10; 
const nicknameBase = "Tester_";

console.log(`🚀 [START] ${ATTEMPT_COUNT}개의 동시 접속 테스트를 시작합니다: ${SERVER_URL}`);

for (let i = 0; i < ATTEMPT_COUNT; i++) {
    const nickname = nicknameBase + i;
    
    // 연결 옵션 강화: transports 설정 및 새로운 연결 강제
    const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'], 
        forceNew: true,
        reconnection: false // 테스트용이므로 재연결 시도 방지
    });

    // 1. 연결 성공 시
    socket.on("connect", () => {
        console.log(`📡 [${nickname}] 연결 성공 (ID: ${socket.id}). 입장 요청 중...`);
        socket.emit("join_auto", nickname);
    });

    // 2. 연결 에러 발생 시 (중요: 여기서 왜 안되는지 범인이 찍힙니다)
    socket.on("connect_error", (err) => {
        console.error(`❌ [${nickname}] 연결 실패 사유: ${err.message}`);
    });

    // 3. 입장 성공 시
    socket.on("room_update", (data) => {
        console.log(`✅ [${nickname}] 입장 성공! 현재 방 인원: ${data.users.length}`);
        // 테스트 완료 후 연결 유지 혹은 종료 선택
        // socket.disconnect(); 
    });

    // 4. 서버 에러 발생 시 (중복 닉네임, 인원 초과 등)
    socket.on("error_message", (msg) => {
        console.log(`⚠️ [${nickname}] 서버 거부: ${msg}`);
        socket.disconnect();
    });

    // 5. 연결 해제 시
    socket.on("disconnect", (reason) => {
        if (reason !== "io client disconnect") {
            console.log(`⚠️ [${nickname}] 연결 끊김: ${reason}`);
        }
    });
}