function StartScreen({setGameStarted}) {
    return (
      <div className="container-fluid p-4">
  
        {/* 전체 박스 */}
        <div
          className="border border-dark d-flex justify-content-center align-items-center"
          style={{
            height: "90vh"
          }}
        >
  
          {/* 가운데 영역 */}
          <div className="d-flex flex-column align-items-center">
  
            {/* 원형 아이콘 */}
            <div
              className="border border-dark rounded-circle d-flex justify-content-center align-items-center"
              style={{
                width: "250px",
                height: "250px",
                fontSize: "24px"
              }}
            >
              아이콘 영역
            </div>
  
            {/* 시작 버튼 */}
            <button
              className="btn btn-light border border-dark"
              style={{
                width: "300px",
                height: "80px",
                marginTop: "-20px",
                fontSize: "28px",
                borderRadius: "20px"
              }}

              onClick={() => setGameStarted(true)}
            >
              게임 시작하기
            </button>
  
          </div>
  
        </div>
  
      </div>
    );
  }
  
  export default StartScreen;