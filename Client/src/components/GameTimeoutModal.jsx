function GameTimeoutModal({
  currentRound,
  maxRound,
}) {

  return (

    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 5000
      }}
    >

      <div
        className="bg-white d-flex flex-column justify-content-center align-items-center"
        style={{
          width: "450px",
          height: "320px",
          borderRadius: "30px"
        }}
      >

        <h2>
          !!TIMEOUT!!
        </h2>

        <p className="mt-3">
          아무도 정답을 맞추지 못했습니다
        </p>

        <p className="mt-4">
          {
            currentRound >= maxRound
              ? "잠시 후 결과 화면으로 이동합니다..."
              : "잠시 후 다음 라운드로 이동합니다..."
          }
        </p>

      </div>

    </div>
  );
}

export default GameTimeoutModal;
