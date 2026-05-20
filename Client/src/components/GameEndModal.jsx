function GameEndModal({
  gameEndData,
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

      <div
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center p-5"
        style={{
          width: "450px",
          borderRadius: "40px"
        }}
      >

        <h2>
          게임 종료
        </h2>

        {/* 최종 순위 */}
        <div className="w-100 mt-4">

          <h4>최종 순위</h4>

          {
            gameEndData.ranking.map((user, index) => (

              <div key={index}>
                {index + 1}등 - {user}
              </div>

            ))
          }

        </div>

        {/* 최종 점수 */}
        <div className="w-100 mt-4">

          <h4>최종 점수</h4>

          {
            gameEndData.finalScores.map((scoreData, index) => (

              <div key={index}>
                {scoreData.user} : {scoreData.score}점
              </div>

            ))
          }

        </div>

        {/* 라운드 결과 */}
        <div className="w-100 mt-4">

          <h4>라운드 결과</h4>

          {
            gameEndData.roundResults.map((result, index) => (

              <div key={index}>
                ROUND {result.round} - {result.winner}
              </div>

            ))
          }

        </div>

        <button
          className="btn btn-primary mt-4"
          onClick={() => {

            setGameStarted(false);
          }}
        >
          처음으로
        </button>

      </div>

    </div>
  );
}

export default GameEndModal;