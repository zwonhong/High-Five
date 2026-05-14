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
    <div className="container-fluid p-4">

      {/* 전체 게임 화면 */}
      <div
        className="row border border-dark p-3 position-relative"
        style={{
          minHeight: "90vh"
        }}
      >

        {/* 게임 종료 테스트용 버튼 */}
        <div className="mb-3">
          <button
            className="btn btn-success"
            onClick={() => setShowGameResultModal(true)}
          >
            게임 종료 테스트
          </button>
        </div>

        {/* 왼쪽 패널 */}
        <GameLeftPanel
            nickname={nickname}
            messages={messages}
        />

        {/* 가운데 영역 */}
        <GameCanvasSection />

        {/* 오른쪽 유저 목록 */}
        <GameRightPanel players={players}/>

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

    </div>
  );
}

export default GameScreen;