import "../styles/common.css";
import "../styles/GameScreen.css";

import { useState } from "react";

import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameRightPanel from "./GameRightPanel";
import GameResultModal from "./GameResultModal";
import GameNextRoundModal from "./GameNextRoundModal";

function GameScreen({
  nickname,
  setGameStarted
}) {

  const [showGameResultModal, setShowGameResultModal] = useState(false);

  const [showNextRoundModal, setShowNextRoundModal] = useState(false);

  const [currentRound, setCurrentRound] = useState(1);
  /* useEffect(() => {

    socket.emit("round_start");

  }, [socket]); 
  */

  // 테스트용 데이터
  const [players, setPlayers] = useState([
    "young",
    "min",
    "jisu",
    "haeun"
  ]);

  const [messages, setMessages] = useState([
    {
      type: "round",
      round: 1
    },
    {
      user: "young",
      text: "원숭이",
      type: "normal"
    },
    {
      user: "min",
      text: "오랑우탄",
      type: "answer"
    }
  ]);

  //answer_correct 수신 가정
  const handleAnswerCorrect = () => {

    console.log("answer_correct 수신");

    // socket.emit("round_end");

    setShowGameResultModal(true);
  };

  // 다음 라운드 시작
  const handleNextRound = () => {

    // 결과 모달 닫기
    setShowGameResultModal(false);

    // 다음 라운드 번호
    const nextRound = currentRound + 1;

    setCurrentRound(nextRound);

    // socket.emit("round_start");

    // ROUND 구분선 추가
    setMessages((prev) => [

      ...prev,

      {
        type: "round",
        round: nextRound
      }

    ]);

    // 다음 라운드 모달 열기
    setShowNextRoundModal(true);

    // 2초 후 자동 닫기
    setTimeout(() => {

      setShowNextRoundModal(false);

    }, 2000);
  };

  return (

    <div className="game-wrapper">

      <div className="game-layout">

        <GameLeftPanel
          nickname={nickname}
          messages={messages}
          setMessages={setMessages}
        />

        <GameCanvasSection />

        <GameRightPanel
          players={players}
        />

        {
          showGameResultModal && (

            <GameResultModal
              winner={nickname}
              onNextRound={handleNextRound}
              setGameStarted={setGameStarted}
            />

          )
        }

        {/* 다음 라운드 모달 */}
        {
          showNextRoundModal && (

            <GameNextRoundModal
              round={currentRound}
            />

          )
        }

        {/* 임시 테스트 버튼 */}
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