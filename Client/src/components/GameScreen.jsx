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

function GameScreen() {

  const nickname = useSocketStore((state) => state.nickname);
  // 방 인원 목록 ({ id, nickname }[])
  const users = useSocketStore((state) => state.users);
  // 라운드 구분선을 채팅 목록에 추가할 때 사용
  const addChatMessage = useSocketStore((state) => state.addChatMessage);
  // 서버에서 받은 라운드/타이머 설정
  const timeLimit = useSocketStore((state) => state.timeLimit);
  const maxRound = useSocketStore((state) => state.maxRound);

  // 현재 라운드
  const [currentRound, setCurrentRound] = useState(1);
  // 라운드 진행 여부
  const [isRoundEnded, setIsRoundEnded] = useState(false);
  // 타이머
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  // 결과 모달
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  // 다음 라운드 모달
  const [showNextRoundModal, setShowNextRoundModal] = useState(false);
  // 게임 종료 모달
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  // timeout 모달
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  // 게임 종료 데이터 (서버에서 game_end 이벤트로 수신)
  const [gameEndData, setGameEndData] = useState(null);

  // 닉네임 목록 (GameRightPanel용)
  const players = users.map((u) => u.nickname);

  // 타이머
  useEffect(() => {

    // 라운드 종료 상태면 정지
    if (isRoundEnded) {
      return;
    }

    // timeout
    if (timeLeft <= 0) {

      console.log("timeout 전송");

      // socket.emit("timeout");

      setShowTimeoutModal(true);

      setIsRoundEnded(true);

      return;
    }

    const timer = setTimeout(() => {

      setTimeLeft((prev) => prev - 1);

    }, 1000);

    return () => clearTimeout(timer);

  }, [timeLeft, isRoundEnded]);

  // answer_correct 수신 테스트
  const handleAnswerCorrect = () => {
    console.log("answer_correct 수신");

    // socket.emit("round_end");

    // 타이머 정지
    setIsRoundEnded(true);
    // 결과 모달 표시
    setShowGameResultModal(true);
  };

  // 다음 라운드
  const handleNextRound = () => {
    // 결과 모달 닫기
    setShowGameResultModal(false);
    // timeout 모달 닫기
    setShowTimeoutModal(false);
    // 마지막 라운드라면
    if (currentRound >= maxRound) {
      console.log("모든 라운드 종료");

      /*
      socket.emit("game_end");

      socket.on("game_end", (data) => {
        setGameEndData(data);
        setShowGameEndModal(true);
      });
      */

      // 게임 종료 상태 유지
      setIsRoundEnded(true);
      setShowGameEndModal(true);

      return;
    }

    // 다음 라운드 번호
    const nextRound = currentRound + 1;

    setCurrentRound(nextRound);

    // 채팅 라운드 구분선 추가
    addChatMessage({
      type: "round",
      round: nextRound
    });

    // socket.emit("round_start");

    // 라운드 종료 상태 유지
    setIsRoundEnded(true);

    // 다음 라운드 모달 표시
    setShowNextRoundModal(true);

    // 1.5초 후 다음 라운드 시작
    setTimeout(() => {

      // 모달 닫기
      setShowNextRoundModal(false);

      // 타이머 초기화
      setTimeLeft(timeLimit);

      // 렌더 완료 후 타이머 시작
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
          players={players}
          timeLeft={timeLeft}
        />

        {
          showGameResultModal && (

            <GameResultModal
              winner={nickname}
              currentRound={currentRound}
              maxRound={maxRound}
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
              maxRound={maxRound}
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