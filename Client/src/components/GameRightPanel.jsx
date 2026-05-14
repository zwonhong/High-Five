function GameRightPanel({ players }) {

  return (

    <div className="right-panel">

      {/* 유저 목록 */}
      <div className="d-flex flex-column align-items-end mb-4">

        {
          players.map((player, index) => (

            <div
              key={index}
              className="border rounded px-4 py-2 mb-2"
            >
              {player}
            </div>

          ))
        }

      </div>

      {/* 타이머 영역 */}
      <div
        className="border rounded d-flex justify-content-center align-items-center"
        style={{
          height: "100px",
          fontSize: "36px",
          fontWeight: "bold"
        }}
      >
        30
      </div>

    </div>

  );
}

export default GameRightPanel;