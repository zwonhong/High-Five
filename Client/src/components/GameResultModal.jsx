function GameResultModal({
  winner,
  nickname,
  currentRound,
  maxRound,
  onNextRound,
  setGameStarted
}) {

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
          width: "500px",
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

        <div className="d-flex gap-3 mt-4">

          {/* 계속하기 */}
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

          {/* 나가기 */}
          {
            currentRound < maxRound && (

              <button
                className="btn btn-danger"

                onClick={() => {

                  console.log("user_exit 전송");

                  // socket.emit("user_exit");

                  setGameStarted(false);
                }}
              >
                나가기
              </button>

            )
          }

        </div>

      </div>

    </div>

  );
}

export default GameResultModal;