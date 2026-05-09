// gameManager.js
// socket.js에서 호출되는 게임 로직 모듈

const { createClient } = require('redis');

const client = createClient({ url: 'redis://redis-db:6379' });
client.connect().catch(console.error);

// ─────────────────────────────────────────
// 게임 상태 상수 Game phase constants
// ─────────────────────────────────────────
const GAME_PHASE = Object.freeze({
    WAITING: 'waiting',   // 대기 중
    WORD: 'word',         // 단어 입력 단계
    DRAW: 'draw',         // 그림 그리기 단계
    GUESS: 'guess',       // 단어 맞추기 단계
    RESULT: 'result',     // 결과 공개
});

// ─────────────────────────────────────────
// Redis 게임 상태 관리 헬퍼
// ─────────────────────────────────────────

// 게임 상태 가져오기 Get game state from Redis
const getGameState = async (roomId) => {
    const data = await client.get(`game_${roomId}`);
    return data ? JSON.parse(data) : null;
};

// 게임 상태 저장 Save game state to Redis
const setGameState = async (roomId, state) => {
    await client.set(`game_${roomId}`, JSON.stringify(state));
};

// 게임 상태 삭제 Delete game state from Redis
const deleteGameState = async (roomId) => {
    await client.del(`game_${roomId}`);
};

// ─────────────────────────────────────────
// 게임 시작 Game Start
// socket.js에서 game_start 이벤트 emit 후 호출
// ─────────────────────────────────────────

/**
 * 게임 시작 초기화
 * @param {string} roomId - 방 ID
 * @param {Array} users - 플레이어 목록 [{ id, nickname }]
 * @returns {object} 초기 게임 상태
 * 
 * [C → D 호출 시점]
 * socket.js에서 isStarted === true 될 때 (5명 다 찼을 때)
 * 
 * [D → FE emit 이벤트]
 * game_started: { roomId, currentPlayer, phase: 'word' }
 */
const startGame = async (roomId, users) => {
    // 플레이어 순서 랜덤 섞기 Shuffle player order randomly
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    // 갈틱폰: 라운드 수 = 플레이어 수
    const totalRounds = shuffledUsers.length;

    const gameState = {
        roomId,
        phase: GAME_PHASE.WORD,
        players: shuffledUsers,         // 순서가 정해진 플레이어 목록
        totalRounds,                    // 전체 라운드 수
        currentRound: 0,                // 현재 라운드 (0부터 시작)
        currentPlayerIndex: 0,          // 현재 제출해야 할 플레이어 인덱스
        chain: [],                      // 단어→그림→단어 체인 저장
        /*
            chain 구조 예시:
            [
                { playerId, nickname, type: 'word', content: '고양이' },
                { playerId, nickname, type: 'drawing', content: '<base64 or drawData>' },
                { playerId, nickname, type: 'word', content: '강아지' },
                ...
            ]
        */
        timerDuration: 60,              // 기본 타이머 60초 (추후 조정 가능)
        timerRef: null,                 // 타이머 참조 (서버 사이드)
    };

    await setGameState(roomId, gameState);

    console.log(`[GAME] Game started in room ${roomId} | players: ${shuffledUsers.map(u => u.nickname).join(', ')}`);

    return {
        roomId,
        phase: gameState.phase,
        currentPlayer: shuffledUsers[0],    // 첫 번째 플레이어
        totalRounds,
    };
};

// ─────────────────────────────────────────
// 제출 처리 Submit Handler
// 단어 또는 그림 제출 시 호출
// ─────────────────────────────────────────

/**
 * 플레이어 제출 처리 (단어 or 그림)
 * @param {string} roomId - 방 ID
 * @param {string} playerId - 제출한 플레이어의 socket.id
 * @param {string} content - 제출 내용 (단어 문자열 or 그림 데이터)
 * @returns {object} 다음 단계 정보
 * 
 * [C → D 호출 시점]
 * socket.js에서 submit_answer 이벤트 받았을 때
 * 
 * [D → FE emit 이벤트]
 * - 다음 플레이어 있으면: round_next { currentPlayer, phase, round }
 * - 모든 라운드 끝났으면: game_result { chain, winner }
 */
const submitContent = async (roomId, playerId, content) => {
    const gameState = await getGameState(roomId);
    if (!gameState) {
        console.warn(`[GAME] No game state found for room ${roomId}`);
        return null;
    }

    const { players, currentPlayerIndex, currentRound, totalRounds, phase } = gameState;
    const currentPlayer = players[currentPlayerIndex];

    // 제출한 플레이어가 현재 차례인지 검증 Validate it's the right player's turn
    if (currentPlayer.id !== playerId) {
        console.warn(`[GAME] Wrong player submitted. Expected: ${currentPlayer.nickname}, Got: ${playerId}`);
        return { error: 'NOT_YOUR_TURN' };
    }

    // 체인에 제출 내용 추가 Add submission to chain
    gameState.chain.push({
        playerId: currentPlayer.id,
        nickname: currentPlayer.nickname,
        type: phase === GAME_PHASE.WORD || phase === GAME_PHASE.GUESS ? 'word' : 'drawing',
        content,
    });

    console.log(`[GAME] [Room ${roomId}] ${currentPlayer.nickname} submitted (${phase}): ${phase === GAME_PHASE.DRAW ? '[drawing data]' : content}`);

    // 다음 단계 계산 Calculate next phase
    const nextPlayerIndex = currentPlayerIndex + 1;
    const isGameOver = nextPlayerIndex >= players.length;

    if (isGameOver) {
        // 모든 플레이어가 제출 완료 → 결과 처리
        gameState.phase = GAME_PHASE.RESULT;
        await setGameState(roomId, gameState);

        const result = buildGameResult(gameState);
        await deleteGameState(roomId); // 게임 종료 후 상태 삭제

        console.log(`[GAME] Game over in room ${roomId}`);
        return { phase: GAME_PHASE.RESULT, result };
    } else {
        // 다음 플레이어로 넘기기 Move to next player
        gameState.currentPlayerIndex = nextPlayerIndex;
        gameState.currentRound = currentRound + 1;

        // 단계 교대: word → draw → word → draw ...
        // 갈틱폰 룰: 첫 번째는 단어, 이후 그림/단어 교대
        if (phase === GAME_PHASE.WORD || phase === GAME_PHASE.GUESS) {
            gameState.phase = GAME_PHASE.DRAW;
        } else {
            gameState.phase = GAME_PHASE.GUESS;
        }

        const nextPlayer = players[nextPlayerIndex];
        await setGameState(roomId, gameState);

        console.log(`[GAME] [Room ${roomId}] Next: ${nextPlayer.nickname} | phase: ${gameState.phase}`);

        return {
            phase: gameState.phase,
            currentPlayer: nextPlayer,
            round: gameState.currentRound,
            totalRounds,
        };
    }
};

// ─────────────────────────────────────────
// 결과 계산 Build Game Result
// ─────────────────────────────────────────

/**
 * 게임 결과 계산
 * 첫 단어와 마지막 단어가 얼마나 비슷한지로 결과 구성
 * @param {object} gameState - 최종 게임 상태
 * @returns {object} 결과 데이터
 * 
 * [D → FE emit 이벤트]
 * game_result: { chain, firstWord, lastWord, isMatched }
 */
const buildGameResult = (gameState) => {
    const { chain, roomId } = gameState;

    const firstWord = chain[0]?.content || '';
    const lastWord = chain[chain.length - 1]?.content || '';
    const isMatched = firstWord === lastWord;

    console.log(`[GAME] Result - First: "${firstWord}" | Last: "${lastWord}" | Matched: ${isMatched}`);

    return {
        roomId,
        chain,          // 전체 체인 (FE에서 순서대로 공개)
        firstWord,      // 처음 입력한 단어
        lastWord,       // 마지막에 맞춘 단어
        isMatched,      // 단어가 일치하는지 여부
    };
};

// ─────────────────────────────────────────
// 타이머 관련 Timer (서버 사이드)
// ─────────────────────────────────────────

// 타이머 저장소 (roomId → timeout ref)
const timers = {};

/**
 * 라운드 타이머 시작
 * 시간 초과 시 강제 제출 처리
 * @param {string} roomId
 * @param {function} onTimeout - 타이머 종료 콜백 (io emit 처리는 C에서)
 */
const startTimer = (roomId, duration, onTimeout) => {
    clearTimer(roomId); // 기존 타이머 있으면 제거

    timers[roomId] = setTimeout(async () => {
        console.log(`[GAME] Timer expired for room ${roomId}`);
        await onTimeout(roomId);
    }, duration * 1000);

    console.log(`[GAME] Timer started for room ${roomId} (${duration}s)`);
};

/**
 * 타이머 제거
 * @param {string} roomId
 */
const clearTimer = (roomId) => {
    if (timers[roomId]) {
        clearTimeout(timers[roomId]);
        delete timers[roomId];
    }
};

// ─────────────────────────────────────────
// 게임 강제 종료 (유저 이탈 등)
// ─────────────────────────────────────────

/**
 * 게임 도중 유저 이탈 처리
 * @param {string} roomId
 * @param {string} playerId
 * 
 * [C → D 호출 시점]
 * socket.js의 disconnect 이벤트에서 게임 중일 때 호출
 * 
 * [D → FE emit 이벤트]
 * game_aborted: { reason: 'PLAYER_LEFT', nickname }
 */
const handlePlayerLeave = async (roomId, playerId) => {
    const gameState = await getGameState(roomId);
    if (!gameState) return null;

    const leftPlayer = gameState.players.find(p => p.id === playerId);
    clearTimer(roomId);
    await deleteGameState(roomId);

    console.log(`[GAME] Game aborted in room ${roomId} - ${leftPlayer?.nickname} left`);

    return {
        reason: 'PLAYER_LEFT',
        nickname: leftPlayer?.nickname || 'Unknown',
    };
};

// ─────────────────────────────────────────
// 모듈 내보내기 Export
// ─────────────────────────────────────────
module.exports = {
    GAME_PHASE,
    startGame,
    submitContent,
    buildGameResult,
    startTimer,
    clearTimer,
    handlePlayerLeave,
    getGameState,
};
