function GameCanvasSection() {

  return (

    <div className="canvas-section">

      {/* 주제 */}
      <div className="topic-box">
        <strong>주제</strong>
      </div>

      {/* 캔버스 */}
      <div className="canvas-box">

        <div className="text-center">
          <h4>캔버스</h4>
          <p>(그림 그려짐)</p>
        </div>

      </div>

      {/* 툴바 */}
      <div className="toolbar">

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

  );
}

export default GameCanvasSection;