import { useEffect } from "react";

function GameResultModal({
  winner,
  nickname,
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

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 3000
      }}
    >

      {/* 팝업 */}
      <div
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "300px",
          borderRadius: "40px"
        }}
      >

        {/* 텍스트 */}
        <h2>
          {winner} 정답!
        </h2>

        <p className="mt-3">
          ROUND {currentRound} / {maxRound}
        </p>

        <p className="mt-4">
          {
            currentRound >= maxRound
              ? "잠시 후 결과 화면으로 이동합니다..."
              : "잠시 후 다음 라운드로 이동합니다..."
          }
        </p>

      </div>

    </div>

  );
}

export default GameResultModal;