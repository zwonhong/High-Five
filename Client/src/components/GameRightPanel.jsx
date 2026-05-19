import { useSocketStore } from "../stores/useSocketStore";

function GameRightPanel({ timeLeft }) {

  const users = useSocketStore((state) => state.users);
  // 플레이어별 점수 { socketId: score }
  const scores = useSocketStore((state) => state.scores);
  // 현재 출제자 { id, nickname }
  const drawer = useSocketStore((state) => state.drawer);

  return (

    <div className="right-panel">

      {/* 유저 목록 */}
      <div className="user-list">

        {
          users.map((user) => (

            <div
              key={user.id}
              className="user-box common-box"
            >

              {/* 출제자 표시 */}
              {drawer?.id === user.id && <span>✏️ </span>}

              {user.nickname}

              <span style={{ marginLeft: "auto", fontSize: "0.85em" }}>
                {scores[user.id] ?? 0}점
              </span>

            </div>

          ))
        }

      </div>

      {/* 타이머 */}
      <div className="timer-box common-box">

        <h3>
          ⏰ {timeLeft}
        </h3>

      </div>

    </div>

  );
}

export default GameRightPanel;
