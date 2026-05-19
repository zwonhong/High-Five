// gameManager.js
// 캐치마인드 방식: 한 명이 그리고 나머지가 채팅으로 정답 맞추기

const { createClient } = require('redis');
const { getRandomTopic } = require('./topics');
const { redisConfig, handleRedisError } = require('./errorHandler');

// ─────────────────────────────────────────
// Redis 연결 (errorHandler의 redisConfig 사용)
// ─────────────────────────────────────────
const gameClient = createClient(redisConfig);
handleRedisError(gameClient);
gameClient.connect().catch(console.error);

// ─────────────────────────────────────────
// 게임 상수 Game Constants
// ─────────────────────────────────────────
const GAME_PHASE = Object.freeze({
    WAITING: 'waiting',
    DRAWING: 'drawing',
    END: 'end',
});

const MAX_ROUNDS = 5;
const TIMER_DURATION = 60;

// ─────────────────────────────────────────
// Redis 헬퍼 - game_ 키 관리
// ─────────────────────────────────────────

const getGameState = async (roomId) => {
    const data = await gameClient.get(`game_${roomId}`);
    return data ? JSON.parse(data) : null;
};

const setGameState = async (roomId, state) => {
    await gameClient.set(`game_${roomId}`, JSON.stringify(state));
};

const deleteGameState = async (roomId) => {
    await gameClient.del(`game_${roomId}`);
};

// ─────────────────────────────────────────
// Redis 헬퍼 - room_ 키 동기화
// ─────────────────────────────────────────

const getRoomState = async (roomId) => {
    const data = await gameClient.get(roomId);
    return data ? JSON.parse(data) : null;
};

const setRoomState = async (roomId, state) => {
    await gameClient.set(roomId, JSON.stringify(state));
};

// ─────────────────────────────────────────
// 게임 시작 Game Start
// socket.js에서 isStarted === true일 때 호출
// ─────────────────────────────────────────

/**
 * 게임 초기화 (주제 배정은 assignTopic에서 별도 처리)
 * @param {string} roomId
 * @param {Array} users - [{ id, nickname }]
 * @returns {object} 게임 시작 정보
 */
const startGame = async (roomId, users) => {
    const gameState = {
        roomId,
        phase: GAME_PHASE.DRAWING,
        players: users,
        totalRounds: MAX_ROUNDS,
        currentRound: 1,
        currentDrawerIndex: 0,
        scores: {},             // socket.js와 필드명 맞춤
        currentTopic: '',
        currentWinner: null,
        usedTopics: [],
        timerStartedAt: Date.now(),
        timerDuration: TIMER_DURATION,
    };

    users.forEach(user => {
        gameState.scores[user.id] = 0;
    });

    await setGameState(roomId, gameState);

    // room_ 키 동기화
    const roomState = await getRoomState(roomId);
    if (roomState) {
        roomState.gamePhase = GAME_PHASE.DRAWING;
        await setRoomState(roomId, roomState);
        console.log(`[GAME] room_ synced: gamePhase=drawing`);
    }

    const drawer = users[0];
    console.log(`[GAME] Game started in room ${roomId} | first drawer: ${drawer.nickname}`);

    return {
        roomId,
        totalRounds: MAX_ROUNDS,
        currentRound: 1,
        drawer,
    };
};

// ─────────────────────────────────────────
// 주제 배정 Assign Topic
// socket.js에서 startGame 이후 별도 호출
// ─────────────────────────────────────────

/**
 * 현재 라운드 주제 랜덤 배정
 * @param {string} roomId
 * @returns {object} 주제 및 라운드 정보
 */
const assignTopic = async (roomId) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const usedTopics = gameState.usedTopics || [];
    const topic = getRandomTopic(usedTopics);

    gameState.currentTopic = topic;
    gameState.currentWinner = null;
    gameState.usedTopics = [...usedTopics, topic];
    gameState.timerStartedAt = Date.now();

    await setGameState(roomId, gameState);

    const drawer = gameState.players[gameState.currentDrawerIndex];
    console.log(`[GAME] [Room ${roomId}] Round ${gameState.currentRound} topic: ${topic} | drawer: ${drawer.nickname}`);

    return {
        topic,
        currentRound: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        drawer,
    };
};

// ─────────────────────────────────────────
// 정답 확인 Check Answer
// ─────────────────────────────────────────

/**
 * 채팅 메시지가 정답인지 확인
 * 정답자 1명 나오면 즉시 라운드 종료
 * @param {string} roomId
 * @param {string} playerId
 * @param {string} message
 * @returns {object} 정답 여부 및 결과
 */
const checkAnswer = async (roomId, playerId, message) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    if (gameState.phase !== GAME_PHASE.DRAWING) return null;

    const drawer = gameState.players[gameState.currentDrawerIndex];

    // 출제자는 정답 불가
    if (drawer.id === playerId) return null;

    // 이미 정답자 나왔으면 무시
    if (gameState.currentWinner) return null;

    // 정답 판정 (대소문자, 공백, 특수문자 무시)
    const normalize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const isCorrect = normalize(message) === normalize(gameState.currentTopic);
    if (!isCorrect) return { isCorrect: false };

    const player = gameState.players.find(p => p.id === playerId);

    // 정답자 1등 점수 부여
    gameState.scores[playerId] = (gameState.scores[playerId] || 0) + 3;
    gameState.currentWinner = player;

    console.log(`[GAME] [Room ${roomId}] ${player.nickname} correct! (+3pts)`);

    await setGameState(roomId, gameState);

    return {
        isCorrect: true,
        player,
        point: 3,
        scores: gameState.scores,
        allCorrect: true,   // 1명 정답 시 즉시 라운드 종료 (socket.js와 호환)
    };
};

// ─────────────────────────────────────────
// 라운드 종료 End Round
// ─────────────────────────────────────────

/**
 * 라운드 종료 처리
 * @param {string} roomId
 * @returns {object} 다음 라운드 or 게임 종료
 */
const endRound = async (roomId) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const { currentRound, totalRounds, players, currentDrawerIndex, scores, currentTopic, currentWinner } = gameState;

    console.log(`[GAME] [Room ${roomId}] Round ${currentRound} ended | winner: ${currentWinner?.nickname || '없음'}`);

    const roundResult = {
        topic: currentTopic,
        roundWinner: currentWinner,
        scores,
        currentRound,
    };

    if (currentRound >= totalRounds) {
        // 게임 종료
        gameState.phase = GAME_PHASE.END;
        const rankings = getRankings(players, scores);
        const winner = rankings[0];  // socket.js와 호환되게 winner 유지

        // room_ 키 동기화
        const roomState = await getRoomState(roomId);
        if (roomState) {
            roomState.isStarted = false;
            roomState.gamePhase = GAME_PHASE.END;
            await setRoomState(roomId, roomState);
            console.log(`[GAME] room_ synced: isStarted=false, gamePhase=end`);
        }

        await deleteGameState(roomId);
        console.log(`[GAME] [Room ${roomId}] Game over! Winner: ${winner?.nickname}`);

        return {
            isGameOver: true,
            roundResult,
            scores,
            winner,      // socket.js에서 result.winner 사용
            rankings,    // 전체 순위
        };
    } else {
        // 다음 라운드
        const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;

        gameState.currentRound = currentRound + 1;
        gameState.currentDrawerIndex = nextDrawerIndex;
        gameState.currentTopic = '';
        gameState.currentWinner = null;
        gameState.phase = GAME_PHASE.DRAWING;

        await setGameState(roomId, gameState);

        const nextDrawer = players[nextDrawerIndex];
        console.log(`[GAME] [Room ${roomId}] Round ${gameState.currentRound} | next drawer: ${nextDrawer.nickname}`);

        return {
            isGameOver: false,
            roundResult,
            nextRound: {
                currentRound: gameState.currentRound,
                totalRounds,
                drawer: nextDrawer,
            },
        };
    }
};

// ─────────────────────────────────────────
// 순위 계산 Get Rankings
// ─────────────────────────────────────────
const getRankings = (players, scores) => {
    return players
        .map(player => ({
            ...player,
            score: scores[player.id] || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
            ...player,
            rank: index + 1,
        }));
};

// ─────────────────────────────────────────
// 타이머 Timer
// ─────────────────────────────────────────
const timers = {};

const startTimer = (roomId, onTimeout) => {
    clearTimer(roomId);

    timers[roomId] = setTimeout(async () => {
        console.log(`[GAME] Timer expired for room ${roomId}`);
        await onTimeout(roomId);
    }, TIMER_DURATION * 1000);

    console.log(`[GAME] Timer started for room ${roomId} (${TIMER_DURATION}s)`);
};

const clearTimer = (roomId) => {
    if (timers[roomId]) {
        clearTimeout(timers[roomId]);
        delete timers[roomId];
        console.log(`[GAME] Timer cleared for room ${roomId}`);
    }
};

// ─────────────────────────────────────────
// 유저 이탈 처리 Player Leave
// socket.js disconnect에서 호출
// ─────────────────────────────────────────

/**
 * 유저 이탈 처리
 * @param {string} roomId
 * @param {string} playerId
 * @param {Array} remainingUsers - 이탈 후 남은 유저 목록
 * @returns {object} 처리 결과
 */
const handlePlayerLeave = async (roomId, playerId, remainingUsers) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const leftPlayer = gameState.players.find(p => p.id === playerId);
    console.log(`[GAME] ${leftPlayer?.nickname} left room ${roomId} | remaining: ${remainingUsers.length}명`);

    // 모두 나간 경우 → 방 폭파
    if (remainingUsers.length === 0) {
        clearTimer(roomId);
        await deleteGameState(roomId);

        const roomState = await getRoomState(roomId);
        if (roomState) {
            roomState.isStarted = false;
            await setRoomState(roomId, roomState);
        }

        console.log(`[GAME] Room ${roomId} destroyed (everyone left)`);
        return { shouldDestroy: true };
    }

    // 남은 사람 있으면 게임 계속
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    delete gameState.scores[playerId];

    // 나간 사람이 출제자였으면 인덱스 보정
    if (!gameState.players[gameState.currentDrawerIndex]) {
        gameState.currentDrawerIndex = 0;
    }

    await setGameState(roomId, gameState);

    return {
        shouldDestroy: false,
        leftPlayer,
        remainingUsers,
    };
};

// ─────────────────────────────────────────
// 모듈 내보내기 Export
// ─────────────────────────────────────────
module.exports = {
    GAME_PHASE,
    TIMER_DURATION,
    startGame,
    assignTopic,
    checkAnswer,
    endRound,
    startTimer,
    clearTimer,
    handlePlayerLeave,
    getGameState,
};