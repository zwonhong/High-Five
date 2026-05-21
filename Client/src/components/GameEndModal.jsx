import "../styles/GameEndModal.css";
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

      <div className="game-end-overlay">
  
        <div className="game-end-modal">
  
          <h2>
            게임 종료
          </h2>
  
          {/* 우승자 */}
          <h3 className="winner-title">
            🏆 {gameEndData.winner.nickname} 우승!
          </h3>
  
          {/* 최종 점수 */}
          <div className="score-board">
  
            <h4>
              최종 순위
            </h4>
  
            {
              sortedScores.map((scoreData, index) => {
  
                const rank =
                  sortedScores.filter(
                    s => s.score > scoreData.score
                  ).length + 1;
  
                const isTied =
                  sortedScores.filter(
                    s => s.score === scoreData.score
                  ).length > 1;
  
                return (
  
                  <div
                    key={index}
                    className="score-item"
                  >
  
                    {rank}등 - {scoreData.nickname}
                    : {scoreData.score}점
  
                    {isTied ? " (동점)" : ""}
  
                  </div>
  
                );
              })
            }
  
          </div>
  
          <button
            className="restart-button"
            onClick={goToStart}
          >
            처음으로
          </button>
  
        </div>
  
      </div>
  
    );
  }
  
  export default GameEndModal;