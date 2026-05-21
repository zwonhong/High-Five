import { useState } from "react";

import { useSocketStore } from "../stores/useSocketStore";
import { sendChatMessage } from "../socket/socketActions";

function GameLeftPanel() {

  // 닉네임
  const nickname = useSocketStore((state) => state.nickname);
  // 채팅 메시지 목록 (서버 수신 + 라운드 구분선)
  const chatList = useSocketStore((state) => state.chatList);

  // 현재 입력 중인 채팅
  const [chatInput, setChatInput] = useState("");

  // 정답 모드 여부
  // true 상태에서 다음 채팅 1회만 정답 채팅으로 처리
  const [isAnswerMode, setIsAnswerMode] = useState(false);

  // 정답 버튼 클릭
  const handleAnswerMode = () => {

    setIsAnswerMode(true);

  };

  // 채팅 전송
  const handleSendMessage = () => {

    const success = sendChatMessage(chatInput, isAnswerMode);

    if (!success) {
      return;
    }

    if (isAnswerMode) {
      setIsAnswerMode(false);
    }

    setChatInput("");
  };

  /* 
  socket.on("wrong_message", ({ messageId }) => {

  setMessages((prev) =>

    prev.map((msg) =>

      msg.id === messageId
        ? {
            ...msg,
            isWrong: true
          }
        : msg

    )

  );

}); 
*/
  const handleKeyDown = (e) => {

    // 한글 입력 채팅 error처리용
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (

    <div className="left-panel">

      {/* 사용자 정보 */}
      <div className="info-box common-box">

        <h5>
          {nickname}
        </h5>

      </div>

      {/* 채팅 */}
      <div className="chat-box common-box">

        {/* 정답 버튼 */}
        <button
          className={`chat-send-button ${isAnswerMode ? "answer-active" : ""}`}

          style={{
            width: "60px"
          }}
          onClick={handleAnswerMode}
        >
          정답!
        </button>

        {/* 채팅 목록 */}
        <div className="chat-messages">

          {
            chatList.map((message, index) => {

              // ROUND 구분선
              if (message.type === "round") {

                return (

                  <div
                    key={index}
                    className="round-divider"
                  >
                    -- ROUND {message.round} --
                  </div>

                );
              }

              return (

                <div
                  key={index}
                  className={
                    message.type === "answer"
                      ? `answer-message ${message.isWrong ? "wrong-message" : ""}`
                      : "normal-message"
                  }
                >

                  <div>

                    <strong>{message.sender}</strong>
                    : {message.message}

                  </div>

                </div>

              );
            })
          }

        </div>

        {/* 입력창 */}
        <div className="chat-input-wrapper">

          <input
            type="text"
            className="form-control"

            placeholder={
              isAnswerMode
                ? "정답 입력 중..."
                : "채팅 입력"
            }

            value={chatInput}

            onChange={(e) => setChatInput(e.target.value)}

            onKeyDown={handleKeyDown}
          />

          {/* 전송 버튼 */}
          <button
            className="chat-send-button"
            onClick={handleSendMessage}
          >
            ↑
          </button>

        </div>

      </div>

      {/* 가이드 */}
      <div className="guide-box common-box">

        <h5>가이드 그림</h5>

      </div>

    </div>
  );
}

export default GameLeftPanel;
