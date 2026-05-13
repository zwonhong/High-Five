import GameLeftPanel from "./GameLeftPanel";
import GameCanvasSection from "./GameCanvasSection";
import GameUserList from "./GameUserList";

function GameScreen() {
  return (
    <div className="container-fluid p-4">

      <div className="row border border-dark p-3">

        <GameLeftPanel />

        <GameCanvasSection />

        <GameUserList />

      </div>

    </div>
  );
}
export default GameScreen;