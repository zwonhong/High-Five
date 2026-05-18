import "./styles/common.css"

import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import { useGamePhaseStore, GAME_PHASE } from "./stores/useGamePhaseStore";
import { useSocketEvents } from "./hooks/useSocketEvents";

function App() {

  useSocketEvents();

  const gamePhase = useGamePhaseStore((state) => state.gamePhase);

  return (
    <>
      {
        gamePhase === GAME_PHASE.PLAYING
          ? <GameScreen />
          : <StartScreen />
      }
    </>
  );
}

export default App;
