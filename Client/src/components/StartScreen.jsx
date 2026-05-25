import "../styles/StartScreen.css";
import { useEffect, useState } from "react";

import startPageImg from "../assets/StartPage.png";
import StartNicknameModal from "./StartNicknameModal";
import StartLoadingModal from "./StartLoadingModal";
import { useSocketStore } from "../stores/useSocketStore";
import { joinAutoRoom } from "../socket/socketActions";

function StartScreen() {

  // 닉네임
  const nickname = useSocketStore((state) => state.nickname);

  // 서버 에러 메시지
  const errorMessage = useSocketStore((state) => state.errorMessage);
  const clearErrorMessage = useSocketStore((state) => state.clearErrorMessage);

  // 닉네임 모달 표시 여부
  const [showModal, setShowModal] = useState(false);

  // 서버 대기 중 여부
  const [isWaiting, setIsWaiting] = useState(false);

  // 에러 발생 시 다시 닉네임 모달
  useEffect(() => {
    if (errorMessage && isWaiting) {
      setIsWaiting(false);
      setShowModal(true);
    }
  }, [errorMessage, isWaiting]);

  // 입장 버튼
  const handleJoinGame = () => {

    clearErrorMessage();

    const success = joinAutoRoom(nickname);

    if (!success) {
      return;
    }

    setShowModal(false);
    setIsWaiting(true);
  };

  return (

    <div className="start-screen-wrapper">

      <div className="start-screen-container">

        {/* 하단 제작자 표시 */}
        <div className="made-by">
          made by High-Five
        </div>

        {/* 메인 콘텐츠 */}
        <div className="start-content">

          {/* 원형 로고 영역 */}
          <div className="start-icon-wrapper">

            {/* 원형 텍스트 */}
            <svg
              className="circle-text"
              viewBox="0 0 500 500"
            >

              <defs>

                {/* 위쪽 반원 */}
                <path
                  id="topArc"
                  d="
                    M 35 250
                    A 215 215 0 0 1 465 250
                  "
                  fill="none"
                />

              </defs>

              {/* 위 텍스트 */}
              <text className="arc-text">

                <textPath
                  href="#topArc"
                  startOffset="50%"
                  textAnchor="middle"
                >

                  CATCH MIND

                </textPath>

              </text>

            </svg>

            {/* 아이콘 */}
            <div className="start-icon">

              <img
                src={startPageImg}
                alt="High-Five"
              />

            </div>

          </div>

          {/* 시작 버튼 */}
          <button
            className="start-button"
            onClick={() => setShowModal(true)}
          >

            게임 시작하기

          </button>

        </div>

        {/* 닉네임 모달 */}
        {
          showModal && (

            <StartNicknameModal
              onJoinGame={handleJoinGame}
              errorMessage={errorMessage}
            />

          )
        }

        {/* 로딩 모달 */}
        {
          isWaiting && (
            <StartLoadingModal />
          )
        }

      </div>

    </div>

  );
}

export default StartScreen;

