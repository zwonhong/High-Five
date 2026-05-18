import { useSocketStore } from "../stores/useSocketStore";

function StartNicknameModal({
  onJoinGame,
  errorMessage = '',
}) {

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

  return (

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 1000
      }}
    >

      {/* 팝업 */}
      <div
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "500px",
          height: "300px",
          borderRadius: "40px"
        }}
      >

        {/* 에러 메시지 */}
        {
          errorMessage && (
            <p className="text-danger mb-2" style={{ fontSize: "14px" }}>
              {errorMessage}
            </p>
          )
        }

        {/* 입력창 */}
        <input
          type="text"
          placeholder="닉네임을 입력하세요"
          className="form-control text-center mb-4"
          style={{
            width: "300px",
            height: "60px",
            fontSize: "24px"
          }}

          value={nickname}

          onChange={(e) => setNickname(e.target.value)}
        />

        {/* 입장 버튼 */}
        <button
          className="btn btn-light border border-dark"
          style={{
            width: "180px",
            height: "70px",
            fontSize: "24px",
            borderRadius: "20px"
          }}

          onClick={handleJoinClick}
        >
          게임 입장
        </button>

      </div>

    </div>
  );
}

export default StartNicknameModal;
