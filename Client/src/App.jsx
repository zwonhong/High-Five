import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
function App() {
  const gameStarted = false;

  return (
    <>
      {gameStarted ? <GameScreen /> : <StartScreen />}
    </>
  );
}

export default App;