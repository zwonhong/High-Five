// gameManager.js
// 캐치마인드 방식: 한 명이 그리고 나머지가 채팅으로 정답 맞추기

const { createClient } = require('redis');
const { getRandomTopic } = require('./topics');

const client = createClient({ url: 'redis://redis-db:6379' });
client.connect().catch(console.error);

// ─────────────────────────────────────────
// 게임 상수 Game Constants
// ─────────────────────────────────────────
const GAME_PHASE = Object.freeze({
    WAITING: 'waiting',   // 대기 중
    DRAWING: 'drawing',   // 출제자가 그림 그리는 중
    RESULT: 'result',     // 라운드 결과 공개
    END: 'end',           // 게임 종료
});

const MAX_ROUNDS = 5;       // 총 5라운드
const TIMER_DURATION = 60;  // 라운드당 60초

// ─────────────────────────────────────────
// Redis 헬퍼 Redis Helpers
// ─────────────────────────────────────────

const getGameState = async (roomId) => {
    const data = await client.get(`game_${roomId}`);
    return data ? JSON.parse(data) : null;
};

const setGameState = async (roomId, state) => {
    await client.set(`game_${roomId}`, JSON.stringify(state));
};

const deleteGameState = async (roomId) => {
    await client.del(`game_${roomId}`);
};

// ─────────────────────────────────────────
// 게임 시작 Game Start
// ─────────────────────────────────────────

/**
 * 게임 시작 초기화
 * @param {string} roomId - 방 ID
 * @param {Array} users - 플레이어 목록 [{ id, nickname }] (입장 순서대로)
 * @returns {object} 첫 라운드 정보
 *
 * [C → D 호출 시점]
 * socket.js에서 5명 다 찼을 때 (isStarted === true)
 *
 * [D → FE emit 이벤트]
 * game_started: { roomId, totalRounds, currentRound, drawer }
 */
const startGame = async (roomId, users) => {
    const gameState = {
        roomId,
        phase: GAME_PHASE.DRAWING,
        players: users,             // 입장 순서 그대로 사용
        totalRounds: MAX_ROUNDS,
        currentRound: 1,
        currentDrawerIndex: 0,      // 첫 번째 입장한 사람이 첫 출제자
        scores: {},
        currentTopic: '',
        correctPlayers: [],         // 현재 라운드에서 맞춘 플레이어 목록
    };

    // 점수 초기화
    users.forEach(user => {
        gameState.scores[user.id] = 0;
    });

    await setGameState(roomId, gameState);

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
// 주제 설정 Set Topic
// ─────────────────────────────────────────

/**
 * 라운드 시작 시 랜덤 주제 자동 배정
 * @param {string} roomId
 * @returns {object} 주제 설정 결과
 *
 * [C → D 호출 시점]
 * socket.js에서 round_start 직전에 호출
 *
 * [D → FE emit 이벤트]
 * round_start: { currentRound, totalRounds, drawer, topic } → 출제자에게만 topic 전달
 */
const assignTopic = async (roomId) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const drawer = gameState.players[gameState.currentDrawerIndex];

    // 이미 사용한 주제 목록에서 중복 제외하고 랜덤 뽑기
    const usedTopics = gameState.usedTopics || [];
    const topic = getRandomTopic(usedTopics);

    gameState.currentTopic = topic;
    gameState.correctPlayers = [];
    gameState.usedTopics = [...usedTopics, topic];
    await setGameState(roomId, gameState);

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
 * @param {string} roomId
 * @param {string} playerId
 * @param {string} message
 * @returns {object} 정답 여부 및 결과
 *
 * [C → D 호출 시점]
 * socket.js에서 send_chat 이벤트 받았을 때 같이 호출
 *
 * [D → FE emit 이벤트]
 * correct_answer: { nickname, scores } → 정답일 때 전체에게
 */
const checkAnswer = async (roomId, playerId, message) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    if (gameState.phase !== GAME_PHASE.DRAWING) return null;

    const drawer = gameState.players[gameState.currentDrawerIndex];

    // 출제자는 정답 불가
    if (drawer.id === playerId) return null;

    // 이미 맞춘 플레이어 무시
    if (gameState.correctPlayers.includes(playerId)) return null;

    // 정답 확인 (대소문자, 공백 무시)
    const isCorrect = message.trim().toLowerCase() === gameState.currentTopic.trim().toLowerCase();
    if (!isCorrect) return { isCorrect: false };

    const player = gameState.players.find(p => p.id === playerId);
    gameState.correctPlayers.push(playerId);

    // 점수: 1등 3점, 2등 2점, 나머지 1점 / 출제자는 맞춘 사람당 1점
    const correctCount = gameState.correctPlayers.length;
    const point = correctCount === 1 ? 3 : correctCount === 2 ? 2 : 1;
    gameState.scores[playerId] = (gameState.scores[playerId] || 0) + point;
    gameState.scores[drawer.id] = (gameState.scores[drawer.id] || 0) + 1;

    console.log(`[GAME] [Room ${roomId}] ${player.nickname} correct! (+${point}pts)`);

    const guesserCount = gameState.players.length - 1;
    const allCorrect = gameState.correctPlayers.length >= guesserCount;

    await setGameState(roomId, gameState);

    return {
        isCorrect: true,
        player,
        point,
        scores: gameState.scores,
        allCorrect,
    };
};

// ─────────────────────────────────────────
// 라운드 종료 End Round
// ─────────────────────────────────────────

/**
 * 라운드 종료 처리 (타이머 종료 or 모두 정답)
 * @param {string} roomId
 * @returns {object} 다음 라운드 or 게임 종료
 *
 * [C → D 호출 시점]
 * 타이머 종료 or allCorrect === true일 때
 *
 * [D → FE emit 이벤트]
 * round_end: { topic, correctPlayers, scores, currentRound }
 * next_round: { currentRound, totalRounds, drawer }
 * game_end: { scores, winner }
 */
const endRound = async (roomId) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const { currentRound, totalRounds, players, currentDrawerIndex, correctPlayers, scores, currentTopic } = gameState;

    console.log(`[GAME] [Room ${roomId}] Round ${currentRound} ended | correct: ${correctPlayers.length}명`);

    const roundResult = {
        topic: currentTopic,
        correctPlayers,
        scores,
        currentRound,
    };

    if (currentRound >= totalRounds) {
        // 게임 종료
        gameState.phase = GAME_PHASE.END;
        const winner = getWinner(players, scores);
        await deleteGameState(roomId);

        console.log(`[GAME] [Room ${roomId}] Game over! Winner: ${winner.nickname}`);

        return {
            isGameOver: true,
            roundResult,
            scores,
            winner,
        };
    } else {
        // 다음 라운드
        const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
        gameState.currentRound = currentRound + 1;
        gameState.currentDrawerIndex = nextDrawerIndex;
        gameState.currentTopic = '';
        gameState.correctPlayers = [];
        gameState.phase = GAME_PHASE.DRAWING;

        await setGameState(roomId, gameState);

        const nextDrawer = players[nextDrawerIndex];
        console.log(`[GAME] [Room ${roomId}] Round ${gameState.currentRound} | drawer: ${nextDrawer.nickname}`);

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
// 우승자 계산 Get Winner
// ─────────────────────────────────────────
const getWinner = (players, scores) => {
    let winner = players[0];
    let maxScore = scores[players[0].id] || 0;

    players.forEach(player => {
        const score = scores[player.id] || 0;
        if (score > maxScore) {
            maxScore = score;
            winner = player;
        }
    });

    return { ...winner, score: maxScore };
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
// 모두 나가면 방 폭파, 아니면 게임 계속
// ─────────────────────────────────────────

/**
 * 유저 이탈 처리
 * @param {string} roomId
 * @param {string} playerId
 * @param {Array} remainingUsers - 이탈 후 남은 유저 목록
 * @returns {object} 처리 결과
 *
 * [C → D 호출 시점]
 * socket.js의 disconnect 이벤트에서 게임 중일 때 호출
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