function GameUserList({ players }) {
  return (
    <div className="col-3">

      {/* 유저 목록 */}
      <div className="d-flex flex-column align-items-end mb-3">

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

    </div>
  );
}

export default GameUserList;