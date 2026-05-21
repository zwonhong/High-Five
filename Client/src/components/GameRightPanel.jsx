import "../styles/GameRightPanel.css";
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

              className={`
                user-box
                common-box
                ${user.isDisconnected ? "disconnected-user" : ""}
              `}
            >

              {/* 출제자 */}
              <div className="user-info">

                {
                  drawer?.id === user.id &&
                  <span className="drawer-icon">
                    ✏️
                  </span>
                }

                <span className="user-nickname">
                  {user.nickname}
                </span>

                {
                  user.isDisconnected && (
                    <span className="disconnect-text">
                      (끊김)
                    </span>
                  )
                }

              </div>

              {/* 점수 */}
              <span className="user-score">

                {scores[user.id] ?? 0}점

              </span>

            </div>

          ))
        }

      </div>

      {/* 타이머 */}
      <div className="timer-box common-box">

        <h3 className="timer-text">
          ⏰ {timeLeft}
        </h3>

      </div>

    </div>

  );
}

export default GameRightPanel;