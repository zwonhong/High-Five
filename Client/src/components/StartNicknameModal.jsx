import "../styles/StartNicknameModal.css";
import { useSocketStore } from "../stores/useSocketStore";

function StartNicknameModal({
  onJoinGame,
  errorMessage = '',
}) {

  // 닉네임
  const nickname = useSocketStore((state) => state.nickname);
  const setNickname = useSocketStore((state) => state.setNickname);

  const handleJoinClick = () => {

    // 닉네임 공백 방지
    if (!nickname.trim()) {
      return;
    }

    // 부모에서 socket.emit 처리
    onJoinGame();
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleJoinClick();
  };

  return (

    <div className="nickname-overlay">

      <div className="nickname-modal">

        {
          errorMessage && (

            <p className="nickname-error">

              {errorMessage}

            </p>

          )
        }

        <input
          type="text"

          placeholder="닉네임을 입력하세요"

          className="nickname-input form-control"

          value={nickname}

          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          className="nickname-button btn btn-light border border-dark"

          onClick={handleJoinClick}
        >
          게임 입장
        </button>

      </div>

    </div>

  );
}

export default StartNicknameModal;