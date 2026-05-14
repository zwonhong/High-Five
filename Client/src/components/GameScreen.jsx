import "../styles/GameScreen.css";
import { useState } from "react";

import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameRightPanel from "./GameRightPanel";
import GameResultModal from "./GameResultModal";

function GameScreen({ nickname, setGameStarted }) {

  // 결과 모달 표시 여부
  const [showGameResultModal, setShowGameResultModal] = useState(false);

  //player mapping
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

    <div className="game-layout">
  
      {/* 왼쪽 패널 */}
      <GameLeftPanel
        nickname={nickname}
        messages={messages}
      />
  
      {/* 가운데 영역 */}
      <GameCanvasSection />
  
      {/* 오른쪽 패널 */}
      <GameRightPanel players={players} />
  
      {/* 결과 모달 */}
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
    
  );
}

export default GameScreen;