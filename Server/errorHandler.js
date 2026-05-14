
// 1. Redis 재연결 전략 설정
// Redis 다운 시 즉시 종료되지 않고, 일정 간격으로 재연결을 시도
const redisConfig = {
    url: "redis://redis-db:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("[REDIS] connection lost");
                return new Error("Redis connection lost after multiple attempts");
            }
            const delay = Math.min(retries * 500, 2000); // 최대 2초 간격
            console.warn(`[REDIS] connection attempt failed. Retrying in ${delay}ms... (Attempt: ${retries})`);
            return delay;
        }
    }
};


// 2. Redis 클라이언트 에러 리스너
// Redis 연결 상태를 모니터링하고 에러 발생 시 로그를 남깁니다.
const handleRedisError = (client) => {
    client.on('error', (err) => {
        // Redis가 다운되었을 때 서버 프로세스가 죽지 않도록 에러만 출력
        console.error(`[REDIS ERROR] Cannot connect to Redis: ${err.message}`);
    });

    client.on('connect', () => console.log('[SYSTEM] Redis connected!'));
    client.on('ready', () => console.log('[SYSTEM] Redis is ready.'));
};


// 3. 클라이언트 전용 에러 전송 전용 함수
// 특정 소켓에게 에러 팝업 메시지 등을 보낼 때 사용합니다.
const emitError = (socket, message, shouldDisconnect = false) => {
    console.error(`[SOCKET ERROR] ID: ${socket.id} | 메시지: ${message}`);
    socket.emit('error_message', message); // 클라이언트(index.html)에서 alert 등으로 띄울 메시지
    
    if (shouldDisconnect) {
        socket.disconnect(); // 심각한 에러 시 강제 연결 해제
    }
};

// 4. 프로세스 레벨 에러 핸들링
// 예기치 못한 에러(Uncaught Exception)로 인해 서버 인스턴스가 통째로 죽는 것을 방지합니다.

const handleProcessError = () => {
    process.on('uncaughtException', (err) => {
        console.error(`[CRITICAL ERROR] 서버 내부 치명적 오류: ${err.stack}`);
        // 서비스 가용성을 위해 서버를 즉시 종료하지 않고 로그만 남김
    });

    process.on('unhandledRejection', (reason) => {
        console.error(`[CRITICAL ERROR] Unhandled Promise Rejection:`, reason);
    });
};

module.exports = { redisConfig, handleRedisError, emitError, handleProcessError };