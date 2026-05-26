import "../styles/GameNextRoundModal.css";
function GameNextRoundModal({ round }) {

  return (

    <div className="next-round-overlay">

      <div className="next-round-modal">

        <h1 className="next-round-title">
          ROUND {round}
        </h1>

        <p className="next-round-description">
          다음 라운드를 시작합니다
        </p>

      </div>

    </div>
  );
}

export default GameNextRoundModal;