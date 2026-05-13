import { useState } from "react";

import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";

function App() {

  const [gameStarted, setGameStarted] = useState(false);
  const [nickname, setNickname] = useState("");

  return (
    <>
      {
        gameStarted
          ? (
            <GameScreen
              nickname={nickname}
              setGameStarted={setGameStarted}
            />
          )
          : (
            <StartScreen
              setGameStarted={setGameStarted}
              nickname={nickname}
              setNickname={setNickname}
            />
          )
      }
    </>
  );
}

export default App;