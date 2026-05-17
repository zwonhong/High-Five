import { Pencil,Eraser,Undo2 } from "lucide-react";

function GameCanvasSection() {

  return (

    <div className="canvas-section">

      {/* 주제 */}
      <div className="topic-box common-box">

        <strong>주제</strong>

      </div>

      {/* 캔버스 */}
      <div className="canvas-box common-box">

        <div className="text-center">

          <h4>캔버스</h4>

          <p>(그림 그려짐)</p>

        </div>

      </div>

      {/* 툴바 */}
      <div className="toolbar">

        <button className="tool-button">
          <Pencil size={24} strokeWidth={1.5}/>
        </button>

        <button className="tool-button blue">
          <Pencil size={24} color="blue" strokeWidth={1.5}/>
        </button>

        <button className="tool-button red">
          <Pencil size={24} color="red" strokeWidth={1.5}/>
        </button>

        <button className="tool-button">
          <Eraser size={24} strokeWidth={1.5}/>
        </button>

        <button className="tool-button">
          <Undo2 size={24} strokeWidth={1.5}/>
        </button>

      </div>

    </div>

  );
}

export default GameCanvasSection;