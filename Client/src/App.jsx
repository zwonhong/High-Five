import { useState } from "react";

import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";

function App() {

  const [gameStarted, setGameStarted] = useState(false);

  return (
    <>
      {
        gameStarted
          ? <GameScreen />
          : <StartScreen setGameStarted={setGameStarted} />
      }
    </>
  );
}

export default App;