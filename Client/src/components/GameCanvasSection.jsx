function GameCanvasSection() {
  return (
    <div className="col-7">

      {/* 주제 */}
      <div className="border rounded px-3 py-2 d-inline-block mb-3">
        <strong>주제</strong>
      </div>

      {/* 캔버스 */}
      <div
        className="border d-flex justify-content-center align-items-center"
        style={{
          height: "500px",
          backgroundColor: "#f8f9fa"
        }}
      >
        <div className="text-center">
          <h4>캔버스</h4>
          <p>(그림 그려짐)</p>
        </div>
      </div>

      {/* 툴바 */}
      <div className="row mt-3">

        <div className="col border p-3 text-center">

          <button className="btn btn-dark me-2">
            펜
          </button>

          <button className="btn btn-danger me-2">
            빨강
          </button>

          <button className="btn btn-primary me-2">
            파랑
          </button>

          <button className="btn btn-secondary">
            지우개
          </button>

        </div>

      </div>

    </div>
  );
}

export default GameCanvasSection;