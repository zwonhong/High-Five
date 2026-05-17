import "../styles/common.css";
import "../styles/GameScreen.css";

import { useState } from "react";

import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameRightPanel from "./GameRightPanel";
import GameResultModal from "./GameResultModal";

function GameScreen({ nickname, setGameStarted }) {

  const [showGameResultModal, setShowGameResultModal] = useState(false);

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
      user: "young",
      text: "원숭이"
    },
    {
      user: "min",
      text: "오랑우탄"
    }
  ]);

  
  return (

    <div className="game-wrapper">

      <div className="game-layout">

        <GameLeftPanel
          nickname={nickname}
          messages={messages}
        />

        <GameCanvasSection />

        <GameRightPanel
          players={players}
        />

        {
          showGameResultModal && (

            <GameResultModal
              winner={nickname}
              setShowGameResultModal={setShowGameResultModal}
              setGameStarted={setGameStarted}
            />

          )
        }

      </div>

    </div>

  );
}

export default GameScreen;