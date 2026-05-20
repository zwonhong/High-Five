function StartLoadingModal() {

  return (

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 3000
      }}
    >

      {/* 로딩 팝업 */}
      <div
        className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "300px",
          borderRadius: "40px"
        }}
      >

        {/* 로딩 스피너 */}
        <div
          className="spinner-border mb-4"
          style={{
            width: "4rem",
            height: "4rem"
          }}
        />

        {/* 텍스트 */}
        <h3
          style={{
            fontWeight: "bold"
          }}
        >
          게임 시작 대기 중...
        </h3>

        <p
          className="mt-2"
          style={{
            fontSize: "18px"
          }}
        >
          다른 플레이어를 기다리고 있습니다
        </p>

      </div>

    </div>
  );
}

export default StartLoadingModal;