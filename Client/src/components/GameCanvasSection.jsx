import { useEffect, useRef, useState } from "react";

import {
  Pencil,
  Eraser,
  Undo2
} from "lucide-react";

import { socketClient } from "../socket/socketClient";
import { useSocketStore } from "../stores/useSocketStore";

function GameCanvasSection({

  isRoundEnded

}) {

  const PEN_WIDTH = 1.5;
  // canvas ref
  const canvasRef = useRef(null);
  // 그리기 권한 여부 (game_start의 canDraw로 결정)
  const isDrawer = useSocketStore((state) => state.isDrawer);
  // 현재 그림 그리고 있는지
  const [isDrawing, setIsDrawing] = useState(false);
  // 현재 색상
  const [currentColor, setCurrentColor] = useState("#000000");
  // 현재 tool
  const [currentTool, setCurrentTool] = useState("pen");
  // 현재 그리고 있는 stroke
  const [currentStroke, setCurrentStroke] = useState(null);
  // 전체 stroke 저장
  const [strokes, setStrokes] = useState([]);

  // canvas 초기화
  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = PEN_WIDTH;

  }, []);

  // 다른 사람 stroke 수신
  useEffect(() => {

    socketClient.on('receive_draw', (stroke) => {
      setStrokes((prev) => [...prev, stroke]);
    });

    // clear_canvas는 서버가 모든 유저에게 브로드캐스트하므로 나 포함 모두 초기화
    socketClient.on('clear_canvas', () => {
      clearCanvasLocally();
    });

    return () => {
      socketClient.off('receive_draw');
      socketClient.off('clear_canvas');
    };

  }, []);

  // 라운드 종료 시 캔버스 초기화 emit (drawer만)
  useEffect(() => {

    if (!isRoundEnded) {
      return;
    }

    if (isDrawer) {
      socketClient.emit('clear_canvas');
    }

  }, [isRoundEnded, isDrawer]);

  // strokes 변경 시 다시 그리기
  useEffect(() => {

    redrawCanvas();

  }, [strokes]);

  // 좌표 계산
  const getMousePosition = (e) => {

    const canvas = canvasRef.current;

    const rect = canvas.getBoundingClientRect();

    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  // 그리기 시작
  const handleMouseDown = (e) => {

    if (!isDrawer) {
      return;
    }

    const pos = getMousePosition(e);

    if (currentTool === "eraser") {

      eraseStroke(pos);

      return;
    }

    setIsDrawing(true);

    setCurrentStroke({

      points: [pos],

      color: currentColor,

      width: PEN_WIDTH,

      tool: "pen"

    });
  };

  // 그리기 중
  const handleMouseMove = (e) => {

    if (!isDrawing) {
      return;
    }

    const newPoint = getMousePosition(e);

    setCurrentStroke((prev) => {

      const updatedStroke = {

        ...prev,

        points: [

          ...prev.points,

          newPoint

        ]

      };

      redrawCanvas(updatedStroke);

      return updatedStroke;
    });
  };

  // 그리기 종료 → 서버에 stroke 전송
  const handleMouseUp = () => {

    if (!isDrawing || !currentStroke) {
      return;
    }

    setIsDrawing(false);

    const newStroke = {

      id: Date.now(),

      ...currentStroke

    };

    setStrokes((prev) => [...prev, newStroke]);

    socketClient.emit('draw_data', newStroke);

    setCurrentStroke(null);
  };

  // canvas 다시 그리기
  const redrawCanvas = (tempStroke = null) => {

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {

      drawStroke(stroke.points, stroke.color);

    });

    if (tempStroke) {

      drawStroke(tempStroke.points, tempStroke.color);

    }
  };

  // 실제 선 그리기
  const drawStroke = (points, color) => {

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    if (points.length < 2) {
      return;
    }

    ctx.strokeStyle = color;

    ctx.lineWidth = PEN_WIDTH;

    ctx.beginPath();

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {

      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  // undo (서버에 해당 이벤트 없어 로컬 전용)
  const handleUndo = () => {

    if (!isDrawer) {
      return;
    }

    setStrokes((prev) => prev.slice(0, -1));
  };

  // 특정 stroke 지우기 (서버에 해당 이벤트 없어 로컬 전용)
  const eraseStroke = (clickPos) => {

    const CLICK_RANGE = 10;

    const filtered = strokes.filter((stroke) => {

      const hit = stroke.points.some((point) => {

        const dx = point.x - clickPos.x;

        const dy = point.y - clickPos.y;

        return Math.sqrt(dx * dx + dy * dy) < CLICK_RANGE;
      });

      return !hit;
    });

    setStrokes(filtered);
  };

  // 전체 초기화 (clear_canvas 수신 시 호출)
  const clearCanvasLocally = () => {

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setStrokes([]);
  };

  return (

    <div className="canvas-section">

      {/* 주제 */}
      <div className="topic-box common-box">

        <strong>주제</strong>

      </div>

      {/* 캔버스 */}
      <div className="canvas-box common-box">

        <canvas

          ref={canvasRef}

          width={600}

          height={400}

          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "white",

            cursor:

              currentTool === "eraser"
                ? "pointer"
                : (
                  isDrawer
                    ? "crosshair"
                    : "not-allowed"
                )
          }}

          onMouseDown={handleMouseDown}

          onMouseMove={handleMouseMove}

          onMouseUp={handleMouseUp}

          onMouseLeave={handleMouseUp}
        />

      </div>

      {/* 툴바 */}
      <div className="toolbar">

        {/* 검정 펜 */}
        <button
          className="tool-button"

          onClick={() => {

            setCurrentColor("#000000");

            setCurrentTool("pen");
          }}
        >
          <Pencil
            size={24}
            strokeWidth={1.5}
          />
        </button>

        {/* 파랑 펜 */}
        <button
          className="tool-button blue"

          onClick={() => {

            setCurrentColor("#0000ff");

            setCurrentTool("pen");
          }}
        >
          <Pencil
            size={24}
            color="blue"
            strokeWidth={1.5}
          />
        </button>

        {/* 빨강 펜 */}
        <button
          className="tool-button red"

          onClick={() => {

            setCurrentColor("#ff0000");

            setCurrentTool("pen");
          }}
        >
          <Pencil
            size={24}
            color="red"
            strokeWidth={1.5}
          />
        </button>

        {/* 지우개 */}
        <button
          className="tool-button"

          onClick={() => setCurrentTool("eraser")}
        >
          <Eraser
            size={24}
            strokeWidth={1.5}
          />
        </button>

        {/* undo */}
        <button
          className="tool-button"

          onClick={handleUndo}
        >
          <Undo2
            size={24}
            strokeWidth={1.5}
          />
        </button>

      </div>

    </div>

  );
}

export default GameCanvasSection;
