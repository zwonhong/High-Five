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

// 라운드당 타이머 (서버와 동일하게 60초 고정)
const TIME_LIMIT = 60;

function GameScreen() {

  const nickname = useSocketStore((state) => state.nickname);
  // 라운드 구분선을 채팅 목록에 추가할 때 사용
  const addChatMessage = useSocketStore((state) => state.addChatMessage);
  // 서버에서 받은 라운드 정보
  const currentRound = useSocketStore((state) => state.currentRound);
  const totalRounds = useSocketStore((state) => state.totalRounds);
  // 최근 정답자 정보 (결과 모달 표시용)
  const correctAnswerInfo = useSocketStore((state) => state.correctAnswerInfo);
  // 게임 종료 데이터 (game_end 수신 시 갱신)
  const gameEndData = useSocketStore((state) => state.gameEndData);

  // 라운드 진행 여부
  const [isRoundEnded, setIsRoundEnded] = useState(false);
  // 타이머
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  // 결과 모달
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  // 다음 라운드 모달
  const [showNextRoundModal, setShowNextRoundModal] = useState(false);
  // 게임 종료 모달
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  // timeout 모달
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);


  // 타이머
  useEffect(() => {

    // 라운드 종료 상태면 정지
    if (isRoundEnded) {
      return;
    }

    // 클라이언트 타임아웃
    if (timeLeft <= 0) {
      setIsRoundEnded(true);
      setShowTimeoutModal(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);

  }, [timeLeft, isRoundEnded]);

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

    // 다음 라운드 → 모달 닫고 타이머 초기화
    const onNextRound = () => {
      setShowGameResultModal(false);
      setShowTimeoutModal(false);
      setShowNextRoundModal(true);

      setTimeout(() => {
        setShowNextRoundModal(false);
        setTimeLeft(TIME_LIMIT);

        // 렌더 완료 후 타이머 시작
        setTimeout(() => {
          setIsRoundEnded(false);
        }, 0);
      }, 1500);
    };

    // 게임 종료 → 다른 모달 닫고 게임 종료 모달 표시
    const onGameEnd = () => {
      setIsRoundEnded(true);
      setShowGameResultModal(false);
      setShowTimeoutModal(false);
      setShowGameEndModal(true);
    };

    socketClient.on('round_end', onRoundEnd);
    socketClient.on('next_round', onNextRound);
    socketClient.on('game_end', onGameEnd);

    return () => {
      socketClient.off('round_end', onRoundEnd);
      socketClient.off('next_round', onNextRound);
      socketClient.off('game_end', onGameEnd);
    };

  }, []);

  // answer_correct 수신 테스트 (소켓 연결 전 UI 확인용)
  const handleAnswerCorrect = () => {
    console.log("answer_correct 테스트");
    setIsRoundEnded(true);
    setShowGameResultModal(true);
  };

  const handleNextRound = () => {
    setShowGameResultModal(false);
    setShowTimeoutModal(false);

    if (currentRound >= totalRounds) {
      setIsRoundEnded(true);
      setShowGameEndModal(true);
      return;
    }

    // 채팅 라운드 구분선 추가
    addChatMessage({
      type: "round",
      round: currentRound + 1
    });

    setShowNextRoundModal(true);

    setTimeout(() => {
      setShowNextRoundModal(false);
      setTimeLeft(TIME_LIMIT);

      setTimeout(() => {
        setIsRoundEnded(false);
      }, 0);
    }, 1500);
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
            />

          )
        }

        <button
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 9999
          }}
          onClick={handleAnswerCorrect}
        >
          answer_correct 테스트
        </button>

      </div>

    </div>
  );
}

export default GameScreen;
