import { useGamePhaseStore } from "../stores/useGamePhaseStore";

function GameEndModal({
  gameEndData,
}) {

  const goToStart = useGamePhaseStore((state) => state.goToStart);

  return (

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 5000
      }}
    >

      <div
        className="bg-white p-4 d-flex flex-column align-items-center"
        style={{
          width: "600px",
          borderRadius: "30px"
        }}
      >

        <h1>
          게임 종료
        </h1>

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
          onClick={goToStart}
        >
          처음으로
        </button>

      </div>

    </div>
  );
}

export default GameEndModal;
