function StartNicknameModal({
    nickname,
    setNickname,
    setGameStarted
  }) {
  
    return (
  
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.3)"
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
  
          {/* 입력창 */}
          <input
            type="text"
            placeholder="닉네임 입력하기"
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
  
            onClick={() => setGameStarted(true)}
          >
            입장하기
          </button>
  
        </div>
  
      </div>
  
    );
  }
  
  export default StartNicknameModal;