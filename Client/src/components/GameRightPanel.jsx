function GameRightPanel({ players }) {

  return (

    <div className="right-panel">

      {/* 유저 목록 */}
      <div className="user-list">

        {
          players.map((player, index) => (

            <div
              key={index}
              className="user-box common-box"
            >

              {player}

            </div>

          ))
        }

      </div>

      {/* 타이머 */}
      <div className="timer-box common-box">

        30

      </div>

    </div>

  );
}

export default GameRightPanel;