import "../styles/common.css";
import "../styles/GameScreen.css";

import { useState } from "react";

import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameRightPanel from "./GameRightPanel";
import GameResultModal from "./GameResultModal";
import GameNextRoundModal from "./GameNextRoundModal";
import GameEndModal from "./GameEndModal";

function GameScreen({
  nickname,
  setGameStarted
}) {
  const [currentRound, setCurrentRound] = useState(1);

  // 서버에서 전달받는 값이라고 가정
  const [maxRound, setMaxRound] = useState(3);
  //결과모달(라운드 끝나면 뜨는 팝업)
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  //다음 라운드 모달
  const [showNextRoundModal, setShowNextRoundModal] = useState(false);
  //게임 종료 모달(max_Round 이상인 경우)
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  // 서버에서 받는 최종 결과 데이터(테스트용)
  const [gameEndData, setGameEndData] = useState({
    finalScores: [
      {
        user: "young",
        score: 2
      },
      {
        user: "min",
        score: 1
      }
    ],
    ranking: [
      "young",
      "min"
    ],
    roundResults: [
      {
        round: 1,
        winner: "young"
      },
      {
        round: 2,
        winner: "min"
      },
      {
        round: 3,
        winner: "young"
      }
    ]
  });

  /* // 라운드 시작 서버에 전달
  useEffect(() => {

    socket.emit("round_start");

  }, [socket]); 
  */

  // 테스트용 데이터(유저리스트)
  const [players, setPlayers] = useState([
    "young",
    "min",
    "jisu",
    "haeun"
  ]);

  // 테스트용 데이터(채팅)
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

  // 다음 라운드 시작(계속하기 버튼 누른 경우)
  const handleNextRound = () => {

    // 결과 모달 닫기
    setShowGameResultModal(false);

    // 마지막 라운드라면
    if (currentRound >= maxRound) {

      console.log("모든 라운드 종료");

      /*
      socket.emit("game_end");
      // 서버로부터 game_end 데이터 수신
      socket.on("game_end", (data) => {
        setGameEndData(data);
        setShowGameEndModal(true);
      });
      */

      setShowGameEndModal(true);

      return;
    }
    // 다음 라운드 번호
    const nextRound = currentRound + 1;

    setCurrentRound(nextRound);

    // socket.emit("round_start");

    // 채팅 ROUND 구분선 
    setMessages((prev) => [

      ...prev,

      {
        type: "round",
        round: nextRound
      }

    ]);

    // 다음 라운드 모달 열기
    setShowNextRoundModal(true);

    // 1.5초 후 팝업 자동 닫기
    setTimeout(() => {

      setShowNextRoundModal(false);

    }, 1500);
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
              currentRound={currentRound}
              maxRound={maxRound}
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

        {/* 게임 종료 모달 */}
        {
          showGameEndModal && (

            <GameEndModal
              gameEndData={gameEndData}
              setGameStarted={setGameStarted}
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