import { useGamePhaseStore } from "../stores/useGamePhaseStore";

function GameResultModal({
  winner,
  currentRound,
  maxRound,
  onNextRound,
}) {

  const goToStart = useGamePhaseStore((state) => state.goToStart);

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
        </p>

      </div>

    </div>

  );
}

export default GameResultModal;
