function GameLeftPanel({ nickname, messages }) {

    return (
  
      <div className="left-panel">
  
        {/* 사용자 정보 */}
        <div className="info-box common-box">
  
          <h5>
            사용자 ({nickname})
          </h5>
  
        </div>
  
        {/* 채팅 */}
        <div className="chat-box common-box">
  
          <div className="chat-header">
            채팅
          </div>
  
          <div className="chat-messages">
  
            {
              messages.map((message, index) => (
  
                <div key={index}>
  
                  <strong>{message.user}</strong>
                  : {message.text}
  
                </div>
  
              ))
            }
  
          </div>
  
          <input
            type="text"
            className="form-control"
            placeholder="채팅 입력"
          />
  
        </div>
  
        {/* 가이드 */}
        <div className="guide-box common-box">
  
          <h5>가이드 그림</h5>
  
        </div>
  
      </div>
  
    );
  }
  
  export default GameLeftPanel;