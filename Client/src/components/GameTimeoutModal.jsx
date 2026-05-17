function GameTimeoutModal({
    currentRound,
    maxRound,
    onNextRound,
    setGameStarted
  }) {
  
    return (
  
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 5000
        }}
      >
  
        <div
          className="bg-white d-flex flex-column justify-content-center align-items-center"
          style={{
            width: "450px",
            height: "320px",
            borderRadius: "30px"
          }}
        >
  
          <h2>
            !!TIMEOUT!!
          </h2>
  
          <p className="mt-3">
            아무도 정답을 맞추지 못했습니다
          </p>
  
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
  
  export default GameTimeoutModal;