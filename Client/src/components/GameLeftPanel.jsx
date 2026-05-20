import { useState } from "react";

function GameLeftPanel({
  nickname,
  messages,
  setMessages
}) {

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

    // 공백 입력 방지
    if (!chatInput.trim()) {
      return;
    }

    // 일반 채팅 전송
    if (!isAnswerMode) {

      console.log("일반 채팅 전송");

      /* 
      socket.emit("chat_message", {
         type: "normal",
         message: chatInput
      });
      */
      // 임시 테스트용
      setMessages((prev) => [

        ...prev,

        {
          user: nickname,
          text: chatInput,
          type: "normal"
        }

      ]);

    }

    // 정답 채팅 전송
    else {

      console.log("정답 채팅 전송");

      // 메시지 고유 id
      const messageId = Date.now();

      const answerMessage = {

        id: messageId,
        user: nickname,
        text: chatInput,
        type: "answer",
        isWrong: false

      };

      /*
      socket.emit("chat_message", {
        id: messageId,
        type: "answer",
        message: chatInput
      });
      */

      // 임시 UI 테스트용
      setMessages((prev) => [

        ...prev,
        answerMessage

      ]);

      // ===== 임시 wrong_answer 테스트 =====
      // 1초 후 틀린 답 처리

      setTimeout(() => {

        console.log("wrong_answer 수신");

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

      }, 1000);

      // 정답모드는 1회만 유지
      setIsAnswerMode(false);
    }

    // 입력창 초기화
    setChatInput("");
  };

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
            messages.map((message, index) => {

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

                    <strong>{message.user}</strong>
                    : {message.text}

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