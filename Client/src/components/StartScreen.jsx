import { useState } from "react";
import StartNicknameModal from "./StartNicknameModal";

function StartScreen({ setGameStarted }) {

  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState("");

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

        {/* 모달 */}
        {
          showModal && (
            <StartNicknameModal
              nickname={nickname}
              setNickname={setNickname}
              setGameStarted={setGameStarted}
            />
          )
        }

      </div>

    </div>
  );
}

export default StartScreen;