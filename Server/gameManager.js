// gameManager.js
// 캐치마인드 게임 로직 라이브러리
// Redis/소켓 연결은 socket.js에서 담당, 이 파일은 순수 게임 로직만 관리

const { getRandomTopic } = require('./topics');

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
// 게임 상태 인메모리 저장소
// Game State In-Memory Store
// ─────────────────────────────────────────
const gameKey = (roomId) => `game_${roomId}`;

const getGameState = async (client, roomId) => {
    const data = await client.get(gameKey(roomId));
    return data ? JSON.parse(data) : null;
};

const setGameState = async (client, roomId, state) => {
    await client.set(gameKey(roomId), JSON.stringify(state));
};

const deleteGameState = async (client, roomId) => {
    await client.del(gameKey(roomId));
};

const advanceToNextActiveDrawer = (gameState) => {
    const { players, currentDrawerIndex } = gameState;
    const len = players.length;
    for (let i = 1; i <= len; i++) {
        const idx = (currentDrawerIndex + i) % len;
        if (!players[idx].isDisconnected) {
            gameState.currentDrawerIndex = idx;
            return players[idx];
        }
    }
    return null;
};

// ─────────────────────────────────────────
// 게임 시작 Game Start
// ─────────────────────────────────────────

/**
 * @returns {object} { roomId, totalRounds, currentRound, drawer }
 */
const startGame = async (client, roomId, users) => {
    const gameState = {
        roomId,
        phase: GAME_PHASE.DRAWING,
        players: users,
        totalRounds: MAX_ROUNDS,
        currentRound: 1,
        currentDrawerIndex: 0,
        scores: {},
        currentTopic: '',
        currentWinner: null,
        usedTopics: [],
    };

    users.forEach((user) => {
        gameState.scores[user.id] = 0;
    });

    await setGameState(client, roomId, gameState);

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
// ─────────────────────────────────────────

/**
 * 현재 라운드 주제 랜덤 배정
 * @returns {object|null} { topic, currentRound, totalRounds, drawer }
 */
const assignTopic = async (client, roomId) => {
    const gameState = await getGameState(client, roomId);
    if (!gameState) return null;

    const usedTopics = gameState.usedTopics || [];
    const topic = getRandomTopic(usedTopics);

    gameState.currentTopic = topic;
    gameState.currentWinner = null;
    gameState.usedTopics = [...usedTopics, topic];

    let drawer = gameState.players[gameState.currentDrawerIndex];
    if (drawer?.isDisconnected) {
        drawer = advanceToNextActiveDrawer(gameState);
        if (!drawer) return null;
    }

    await setGameState(client, roomId, gameState);

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
 * @returns {object} { isCorrect, player, point, scores, allCorrect }
 */
const checkAnswer = async (client, roomId, playerId, message, inAnswer = false) => {
    if (!inAnswer) return null;
    const gameState = await getGameState(client, roomId);
    if (!gameState) return null;

    if (gameState.phase !== GAME_PHASE.DRAWING) return null;

    const drawer = gameState.players[gameState.currentDrawerIndex];
    const player = gameState.players.find((p) => p.id === playerId);

    if (!player || player.isDisconnected) return null;

    // 출제자는 정답 불가
    if (drawer?.id === playerId) return null;

    // 이미 정답자 나왔으면 무시
    if (gameState.currentWinner) return null;

    // 정답 판정 (대소문자, 공백, 특수문자 무시)
    const normalize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const isCorrect = normalize(message) === normalize(gameState.currentTopic);
    if (!isCorrect) return { isCorrect: false };

    // 정답자 3점 부여
    gameState.scores[playerId] = (gameState.scores[playerId] || 0) + 3;
    gameState.currentWinner = player;

    await setGameState(client, roomId, gameState);

    console.log(`[GAME] [Room ${roomId}] ${player.nickname} correct! (+3pts)`);

    return {
        isCorrect: true,
        player,
        point: 3,
        scores: gameState.scores,
        allCorrect: true,   // 1명 정답 시 즉시 라운드 종료
    };
};

// ─────────────────────────────────────────
// 라운드 종료 End Round
// ─────────────────────────────────────────

/**
 * 라운드 종료 처리 (정답자 발생 or 타이머 종료)
 * @param {string} roomId
 * @returns {object} { isGameOver, roundResult, nextRound?, scores?, winner?, rankings? }
 */
const getRankings = (players, scores) =>
    players
        .map((player) => ({
            ...player,
            score: scores[player.id] || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
            ...player,
            rank: index + 1,
        }));

const endRound = async (client, roomId) => {
    const gameState = await getGameState(client, roomId);
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
        const winner = rankings[0];

        await deleteGameState(client, roomId);
        console.log(`[GAME] [Room ${roomId}] Game over! Winner: ${winner?.nickname}`);

        return {
            isGameOver: true,
            roundResult,
            scores,
            winner,
            rankings,
            roomResetNeeded: true,
        };
    }

    gameState.currentRound = currentRound + 1;
    gameState.currentDrawerIndex = currentDrawerIndex;
    const nextDrawer = advanceToNextActiveDrawer(gameState);
    if (!nextDrawer) {
        await setGameState(client, roomId, gameState);
        return null;
    }
    gameState.currentTopic = '';
    gameState.currentWinner = null;
    gameState.phase = GAME_PHASE.DRAWING;

    await setGameState(client, roomId, gameState);

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
};

// ─────────────────────────────────────────
// 모듈 내보내기 Export
// ─────────────────────────────────────────
const markPlayerInactive = async (client, roomId, playerId) => {
    const gameState = await getGameState(client, roomId);
    if (!gameState) return { needsRoundRefresh: false };

    const player = gameState.players.find((p) => p.id === playerId);
    if (!player || player.isDisconnected) return { needsRoundRefresh: false };

    player.isDisconnected = true;

    let needsRoundRefresh = false;
    if (gameState.phase === GAME_PHASE.DRAWING) {
        const drawer = gameState.players[gameState.currentDrawerIndex];
        if (drawer?.id === playerId) {
            const next = advanceToNextActiveDrawer(gameState);
            if (next) {
                needsRoundRefresh = true;
                gameState.currentTopic = '';
                gameState.currentWinner = null;
            }
        }
    }

    await setGameState(client, roomId, gameState);
    return { needsRoundRefresh };
};

const removePlayerFromGame = async (client, roomId, playerId) => {
    const gameState = await getGameState(client, roomId);
    if (!gameState) return { needsRoundRefresh: false };

    const idx = gameState.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return { needsRoundRefresh: false };

    const wasDrawer =
        gameState.phase === GAME_PHASE.DRAWING &&
        gameState.players[gameState.currentDrawerIndex]?.id === playerId;

    gameState.players.splice(idx, 1);
    delete gameState.scores[playerId];

    if (gameState.players.length === 0) {
        await deleteGameState(client, roomId);
        return { needsRoundRefresh: false, gameDeleted: true };
    }

    if (gameState.currentDrawerIndex >= gameState.players.length) {
        gameState.currentDrawerIndex = 0;
    } else if (idx < gameState.currentDrawerIndex) {
        gameState.currentDrawerIndex -= 1;
    }

    let needsRoundRefresh = false;
    if (wasDrawer) {
        const next = advanceToNextActiveDrawer(gameState);
        if (next) {
            needsRoundRefresh = true;
            gameState.currentTopic = '';
            gameState.currentWinner = null;
        }
    }

    await setGameState(client, roomId, gameState);
    return { needsRoundRefresh };
};

const reactivatePlayer = async (client, roomId, oldSocketId, newSocketId) => {
    const gameState = await getGameState(client, roomId);
    if (!gameState) return;

    const player = gameState.players.find((p) => p.id === oldSocketId);
    if (!player) return;

    player.id = newSocketId;
    player.isDisconnected = false;

    if (gameState.scores[oldSocketId] !== undefined) {
        gameState.scores[newSocketId] = gameState.scores[oldSocketId];
        delete gameState.scores[oldSocketId];
    }

    await setGameState(client, roomId, gameState);
};

module.exports = {
    GAME_PHASE,
    MAX_ROUNDS,
    TIMER_DURATION,
    startGame,
    assignTopic,
    checkAnswer,
    endRound,
    getGameState,
    deleteGameState,
    markPlayerInactive,
    removePlayerFromGame,
    reactivatePlayer,
};