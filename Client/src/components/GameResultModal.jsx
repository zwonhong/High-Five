function GameResultModal({
    winner,
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
          <h1 className="mb-3">
            WINNER!
          </h1>
  
          <h3 className="mb-5">
            ({winner})
          </h3>
  
          {/* 버튼 영역 */}
          <div>
  
            {/* 계속하기 */}
          <button
            className="btn btn-primary"
            onClick={onNextRound}
          >
            계속하기
          </button>

          {/* 나가기 */}
          <button
            className="btn btn-danger"
            onClick={() => {

              // socket.emit("game_end");

              setGameStarted(false);
            }}
          >
            나가기
          </button>
  
          </div>
  
        </div>
  
      </div>
  
    );
  }
  
  export default GameResultModal;