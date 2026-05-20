import { useEffect } from "react";

function GameTimeoutModal({
  currentRound,
  maxRound,
  onNextRound,
  setShowTimeoutModal,
  setShowGameEndModal
}) {

  useEffect(() => {

    const timer = setTimeout(() => {

      // 마지막 라운드
      if (currentRound >= maxRound) {
        // timeout 모달 닫기
        setShowTimeoutModal(false);
        // 게임 종료 모달 열기
        setShowGameEndModal(true);
      }

      // 다음 라운드 진행
      else {
        onNextRound();
      }

    }, 1500);
    return () => clearTimeout(timer);
  }, [
    currentRound,
    maxRound,
    onNextRound,
    setShowTimeoutModal,
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

      <div
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "300px",
          borderRadius: "40px"
        }}
      >

        <h2>
          !!TIMEOUT!!
        </h2>

        <p className="mt-3">
          아무도 정답을 맞추지 못했습니다
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

export default GameTimeoutModal;
