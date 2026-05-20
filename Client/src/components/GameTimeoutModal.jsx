<<<<<<< HEAD
import { useGamePhaseStore } from "../stores/useGamePhaseStore";
=======
import { useEffect } from "react";
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e

function GameTimeoutModal({
  currentRound,
  maxRound,
  onNextRound,
<<<<<<< HEAD
}) {

  const goToStart = useGamePhaseStore((state) => state.goToStart);
=======
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
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e

  return (

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
<<<<<<< HEAD
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 5000
=======
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 3000
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e
      }}
    >

      <div
<<<<<<< HEAD
        className="bg-white d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "320px",
          borderRadius: "30px"
=======
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "300px",
          borderRadius: "40px"
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e
        }}
      >

        <h2>
          !!TIMEOUT!!
        </h2>

        <p className="mt-3">
          아무도 정답을 맞추지 못했습니다
        </p>

<<<<<<< HEAD
        <div className="d-flex gap-3 mt-4">

          {/* 계속하기 / 결과보기 */}
          <button
            className="btn btn-primary"
            onClick={onNextRound}
          >

            {
              currentRound >= maxRound
                ? "결과보기"
                : "계속하기"
            }

          </button>

          {/* 마지막 라운드 전까지만 */}
          {
            currentRound < maxRound && (

              <button
                className="btn btn-danger"

                onClick={() => {

                  console.log("user_exit 전송");

                  // socket.emit("user_exit");

                  goToStart();
                }}
              >
                나가기
              </button>

            )
          }

        </div>
=======
        <p className="mt-4">
          {
            currentRound >= maxRound
              ? "잠시 후 결과 화면으로 이동합니다..."
              : "잠시 후 다음 라운드로 이동합니다..."
          }
        </p>
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e

      </div>

    </div>
  );
}

<<<<<<< HEAD
export default GameTimeoutModal;
=======
export default GameTimeoutModal;
>>>>>>> dc9a23ea0b68739f1272322c62911bc65c5a085e
