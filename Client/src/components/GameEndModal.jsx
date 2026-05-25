import { useGamePhaseStore } from "../stores/useGamePhaseStore";
import { useSocketStore } from "../stores/useSocketStore";

function GameEndModal({ gameEndData }) {

  const goToStart = useGamePhaseStore((state) => state.goToStart);
  // 게임 시작 시 저장된 플레이어 목록 (socketId → nickname 매핑용)
  const gamePlayers = useSocketStore((state) => state.gamePlayers);

  // scores({ socketId: score })를 닉네임 기준 순위로 변환
  const sortedScores = gamePlayers
    .map((p) => ({ nickname: p.nickname, score: gameEndData.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

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

        {/* 우승자 */}
        <h3 className="mt-3">
          🏆 {gameEndData.winner.nickname} 우승!
        </h3>

        {/* 최종 점수 순위 */}
        <div className="w-100 mt-4">

          <h4>최종 순위</h4>

          {
            sortedScores.map((scoreData, index) => (

              <div key={index}>
                {index + 1}등 - {scoreData.nickname} : {scoreData.score}점
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
