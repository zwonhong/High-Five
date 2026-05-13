import LeftPanel from "./components/LeftPanel";
import CanvasSection from "./components/CanvasSection";
import UserList from "./components/UserList";

function App() {
  return (
    <div className="container-fluid p-4">

      <div className="row border border-dark p-3">

        <LeftPanel />

        <CanvasSection />

        <UserList />

      </div>

    </div>
  );
}
export default App;
