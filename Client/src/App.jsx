function App() {
  return (
    <div className="container-fluid p-4">

      <div className="row border border-dark p-3">

        {/* 왼쪽 패널 */}
        <div className="col-2 d-flex flex-column">

          {/* 사용자 정보 */}
          <div className="border rounded p-3 mb-3 text-center">
            <h5>사용자 (나)</h5>
          </div>

          {/* 채팅 입력란 */}
          <div className="mb-3">

            <div
              className="border rounded-circle d-inline-block px-3 py-2 mb-2"
            >
              채팅
            </div>

            <div
              className="border p-3 mb-2"
              style={{
                height: "150px"
              }}
            >
            </div>

            <input
              type="text"
              className="form-control"
              placeholder="채팅 입력"
            />

          </div>

          {/* 가이드 그림 */}
          <div
            className="border rounded p-3 text-center"
            style={{
              height: "350px"
            }}
          >
            <h5 className="mb-4">가이드그림</h5>
          </div>

        </div>

        {/* 가운데 영역 */}
        <div className="col-7">

          {/* 주제 */}
          <div
            className="border rounded px-3 py-2 d-inline-block mb-3"
          >
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

          {/* 드로잉 툴 */}
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

        {/* 오른쪽 패널 */}
        <div className="col-3">

          {/* 유저 목록 */}
          <div className="d-flex flex-column align-items-end mb-3">

            <div className="border rounded px-4 py-2 mb-2">
              유저2
            </div>

            <div className="border rounded px-4 py-2 mb-2">
              유저3
            </div>

            <div className="border rounded px-4 py-2 mb-2">
              유저4
            </div>

            <div className="border rounded px-4 py-2">
              유저5
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;