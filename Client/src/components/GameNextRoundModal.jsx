function GameNextRoundModal({ round }) {

    return (
  
      <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 3000
      }}
      >
  
        <div
          className="bg-white border border-dark d-flex flex-column justify-content-center align-items-center"
          style={{
            width: "450px",
            height: "300px",
            borderRadius: "40px"
          }}
        >
  
          <h1>
            ROUND {round}
          </h1>
  
          <p className="mt-3">
            다음 라운드를 시작합니다
          </p>
  
        </div>
  
      </div>
    );
  }
  
  export default GameNextRoundModal;