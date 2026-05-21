import "../styles/StartLoadingModal.css";
function StartLoadingModal() {

  return (

    <div className="start-loading-overlay">

      {/* 로딩 팝업 */}
      <div className="start-loading-modal">

        {/* 로딩 스피너 */}
        <div className="loading-spinner spinner-border" />

        {/* 텍스트 */}
        <h3 className="loading-title">
          게임 시작 대기 중...
        </h3>

        <p className="loading-description">
          다른 플레이어를 기다리고 있습니다
        </p>

      </div>

    </div>
  );
}

export default StartLoadingModal;