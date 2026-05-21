import { useEffect, useState } from "react";

import StartNicknameModal from "./StartNicknameModal";
import StartLoadingModal from "./StartLoadingModal";
import { useSocketStore } from "../stores/useSocketStore";
import { joinAutoRoom } from "../socket/socketActions";

function StartScreen() {

  // 닉네임
  const nickname = useSocketStore((state) => state.nickname);
  // 서버 에러 메시지 (닉네임 중복, 방 만석 등)
  const errorMessage = useSocketStore((state) => state.errorMessage);
  const clearErrorMessage = useSocketStore((state) => state.clearErrorMessage);

  // 닉네임 모달 표시 여부
  const [showModal, setShowModal] = useState(false);
  // 서버 대기 중 여부 (로딩 모달 표시)
  const [isWaiting, setIsWaiting] = useState(false);

  // 서버에서 error_message 수신 시 대기 상태 해제하고 닉네임 모달로 복귀
  useEffect(() => {
    if (errorMessage && isWaiting) {
      setIsWaiting(false);
      setShowModal(true);
    }
  }, [errorMessage, isWaiting]);

  // 입장 버튼 클릭 시 소켓 emit 후 로딩 대기
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

    <div className="container-fluid p-4">

      <div
        className="border border-dark d-flex justify-content-center align-items-center position-relative"
        style={{
          height: "90vh"
        }}
      >

        {/* 메인 화면 */}
        <div className="d-flex flex-column align-items-center">

          <div
            className="border border-dark rounded-circle d-flex justify-content-center align-items-center"
            style={{
              width: "250px",
              height: "250px"
            }}
          >
            아이콘 영역
          </div>

          <button
            className="btn btn-light border border-dark"
            style={{
              width: "300px",
              height: "80px",
              marginTop: "-20px",
              fontSize: "28px",
              borderRadius: "20px"
            }}

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
