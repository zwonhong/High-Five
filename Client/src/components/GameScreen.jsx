import "../styles/common.css";
import "../styles/GameScreen.css";

import { useEffect, useState } from "react";

import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameRightPanel from "./GameRightPanel";
import GameResultModal from "./GameResultModal";
import GameNextRoundModal from "./GameNextRoundModal";
import GameEndModal from "./GameEndModal";
import GameTimeoutModal from "./GameTimeoutModal";
import { useSocketStore } from "../stores/useSocketStore";
import { socketClient } from "../socket/socketClient";
import { calcTimeLeftFromEndsAt } from "../utils/roundTimer";

function GameScreen() {

  const nickname = useSocketStore((state) => state.nickname);
  // 서버에서 받은 라운드 정보
  const currentRound = useSocketStore((state) => state.currentRound);
  const totalRounds = useSocketStore((state) => state.totalRounds);
  const timeLeft = useSocketStore((state) => state.timeLeft);
  const setTimeLeft = useSocketStore((state) => state.setTimeLeft);
  const roundEndsAt = useSocketStore((state) => state.roundEndsAt);
  // 최근 정답자 정보 (결과 모달 표시용)
  const correctAnswerInfo = useSocketStore((state) => state.correctAnswerInfo);
  // 게임 종료 데이터 (game_end 수신 시 갱신)
  const gameEndData = useSocketStore((state) => state.gameEndData);

  // 라운드 진행 여부
  const [isRoundEnded, setIsRoundEnded] = useState(false);
  // 결과 모달
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  // 다음 라운드 모달
  const [showNextRoundModal, setShowNextRoundModal] = useState(false);
  // 게임 종료 모달
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  // timeout 모달
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);


  // 타이머 — 서버 roundEndsAt 기준으로 매 tick 재계산 (클라이언트마다 -1 방식 제거)
  useEffect(() => {
    if (!roundEndsAt || isRoundEnded) {
      return;
    }

    const tick = () => {
      setTimeLeft(calcTimeLeftFromEndsAt(roundEndsAt));
    };

    tick();
    const intervalId = setInterval(tick, 250);

    return () => clearInterval(intervalId);
  }, [roundEndsAt, isRoundEnded, setTimeLeft]);

  // 소켓 이벤트 → UI 상태 제어 (데이터 싱크는 useSocketEvents에서 처리)
  useEffect(() => {

    // 라운드 종료 → 타이머 정지, 정답자 유무에 따라 모달 분기
    const onRoundEnd = (data) => {
      setIsRoundEnded(true);
      if (data.roundWinner) {
        setShowGameResultModal(true);
      } else {
        setShowTimeoutModal(true);
      }
    };

    // 다음 라운드 → 모달 닫기 (타이머 초기화는 round_start에서 처리)
    const onNextRound = () => {
      setShowGameResultModal(false);
      setShowTimeoutModal(false);
      setShowNextRoundModal(true);

      setTimeout(() => {
        setShowNextRoundModal(false);
      }, 1500);
    };

    // 라운드 시작 (남은 시간은 useSocketEvents → 스토어에서 동기화)
    const onRoundStart = () => {
      setIsRoundEnded(false);
    };

    // 게임 종료 → 다른 모달 닫고 게임 종료 모달 표시
    const onGameEnd = () => {
      setIsRoundEnded(true);
      setShowGameResultModal(false);
      setShowTimeoutModal(false);
      setShowGameEndModal(true);
    };

    socketClient.on('round_start', onRoundStart);
    socketClient.on('round_end', onRoundEnd);
    socketClient.on('next_round', onNextRound);
    socketClient.on('game_end', onGameEnd);

    return () => {
      socketClient.off('round_start', onRoundStart);
      socketClient.off('round_end', onRoundEnd);
      socketClient.off('next_round', onNextRound);
      socketClient.off('game_end', onGameEnd);
    };

  }, []);

  const handleNextRound = () => {
    setShowGameResultModal(false);
    setShowTimeoutModal(false);
  };

  return (

    <div className="game-wrapper">

      <div className="game-layout">

        <GameLeftPanel />

        <GameCanvasSection
          isRoundEnded={isRoundEnded}
        />

        <GameRightPanel
          timeLeft={timeLeft}
        />

        {
          showGameResultModal && (

            <GameResultModal
              winner={correctAnswerInfo?.nickname ?? nickname}
              currentRound={currentRound}
              maxRound={totalRounds}
              onNextRound={handleNextRound}
              setShowGameResultModal={setShowGameResultModal}
              setShowGameEndModal={setShowGameEndModal}
            />

          )
        }

        {
          showNextRoundModal && (

            <GameNextRoundModal
              round={currentRound}
            />

          )
        }

        {
          showGameEndModal && gameEndData && (

            <GameEndModal
              gameEndData={gameEndData}
            />

          )
        }

        {
          showTimeoutModal && (

            <GameTimeoutModal
              currentRound={currentRound}
              maxRound={totalRounds}
              onNextRound={handleNextRound}
              setShowTimeoutModal={setShowTimeoutModal}
              setShowGameEndModal={setShowGameEndModal}
            />

          )
        }

      </div>

    </div>
  );
}

export default GameScreen;
