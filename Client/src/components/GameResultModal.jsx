import "../styles/GameResultModal.css";
import { useEffect } from "react";

function GameResultModal({
  winner,
  currentRound,
  maxRound,
  onNextRound,
  setShowGameResultModal,
  setShowGameEndModal
}) {

  useEffect(() => {

    const timer = setTimeout(() => {
  
      if (currentRound >= maxRound) {
  
        setShowGameResultModal(false);
        setShowGameEndModal(true);
  
      } else {
  
        onNextRound();
  
      }
  
    }, 1500);
  
    return () => clearTimeout(timer);
  
  }, [
    currentRound,
    maxRound,
    onNextRound,
    setShowGameResultModal,
    setShowGameEndModal
  ]);

  return (

    <div className="game-result-overlay">

      {/* 팝업 */}
      <div className="game-result-modal">

        {/* 텍스트 */}
        <h2 className="result-title">
          {winner} 정답!
        </h2>

        <p className="round-text">
          ROUND {currentRound} / {maxRound}
        </p>

          {/* 안내 문구 */}
          <div className="result-message">

            {
              currentRound >= maxRound
                ? "잠시 후 결과 화면으로 이동합니다..."
                : "잠시 후 다음 라운드로 이동합니다..."
            }

          </div>

      </div>

    </div>

  );
}

export default GameResultModal;