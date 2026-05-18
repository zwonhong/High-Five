import { useState } from "react";

import StartNicknameModal from "./StartNicknameModal";
import StartLoadingModal from "./StartLoadingModal";

function StartScreen({
  nickname,
  setNickname,
  setGameStarted
}) {

  const [showModal, setShowModal] = useState(false);

  const [isWaiting, setIsWaiting] = useState(false);

  /* useEffect(() => {

  socket.on("game_start", () => {

    console.log("game_start 수신");

    setIsWaiting(false);

    setGameStarted(true);

  });

  return () => {
    socket.off("game_start");
  };

  }, [socket]); 
  */

  const handleJoinGame = () => {

    console.log("입장 버튼 클릭");

    //닉네임 모달 닫고, 로딩 모달 실행
    setShowModal(false);

    setIsWaiting(true);

    // 임시 서버 대기(테스트용)
    setTimeout(() => {

      setIsWaiting(false);
      setGameStarted(true);

    }, 2000);

    /* // 실제 소켓 연결 시
    socket.emit("game_wait", {
      nickname
    });
    */

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
              nickname={nickname}
              setNickname={setNickname}
              onJoinGame={handleJoinGame}
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