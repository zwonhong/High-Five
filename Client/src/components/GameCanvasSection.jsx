import "../styles/GameCanvasSection.css";
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
  // 현재 라운드 주제 (출제자에게만 표시)
  const topic = useSocketStore((state) => state.topic);
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
  const pendingCanvasStrokes = useSocketStore((state) => state.pendingCanvasStrokes);
  const setPendingCanvasStrokes = useSocketStore((state) => state.setPendingCanvasStrokes);

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

  // 재연결 시 서버 스트로크 (마운트 전 reconnect_success 대비)
  useEffect(() => {
    if (pendingCanvasStrokes === null) return;
    setStrokes(pendingCanvasStrokes);
    setPendingCanvasStrokes(null);
  }, [pendingCanvasStrokes, setPendingCanvasStrokes]);

  // 다른 사람 stroke 수신
  useEffect(() => {

    const onReceiveDraw = (stroke) => {
      setStrokes((prev) => [...prev, stroke]);
    };

    // clear_canvas는 서버가 모든 유저에게 브로드캐스트하므로 나 포함 모두 초기화
    const onClearCanvas = () => {
      clearCanvasLocally();
    };

    // 다른 사람이 undo → 나도 마지막 stroke 제거
    const onUndoDraw = () => {
      setStrokes((prev) => prev.slice(0, -1));
    };

    // 다른 사람이 지우개로 지운 stroke → 나도 동일하게 제거
    const onEraseDraw = ({ strokeIds }) => {
      setStrokes((prev) => prev.filter((s) => !strokeIds.includes(s.id)));
    };

    const onReconnectSuccess = (data) => {
      if (Array.isArray(data?.strokes)) {
        setStrokes(data.strokes);
        setPendingCanvasStrokes(null);
      }
    };

    socketClient.on('receive_draw', onReceiveDraw);
    socketClient.on('clear_canvas', onClearCanvas);
    socketClient.on('undo_draw', onUndoDraw);
    socketClient.on('erase_draw', onEraseDraw);
    socketClient.on('reconnect_success', onReconnectSuccess);

    return () => {
      socketClient.off('receive_draw', onReceiveDraw);
      socketClient.off('clear_canvas', onClearCanvas);
      socketClient.off('undo_draw', onUndoDraw);
      socketClient.off('erase_draw', onEraseDraw);
      socketClient.off('reconnect_success', onReconnectSuccess);
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

  // 마우스 좌표 계산
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

  /* Touch Event(모바일 웹 용) */

const getTouchPosition = (touch) => {

  const canvas = canvasRef.current;

  const rect = canvas.getBoundingClientRect();

  return {

    x: (touch.clientX - rect.left) * (canvas.width / rect.width),

    y: (touch.clientY - rect.top) * (canvas.height / rect.height)

  };

};


const handleTouchStart = (e) => {

  e.preventDefault();

  if (!isDrawer) {
    return;
  }

  const touch = e.touches[0];

  const pos = getTouchPosition(touch);

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


const handleTouchMove = (e) => {

  e.preventDefault();

  if (!isDrawing) {
    return;
  }

  const touch = e.touches[0];

  const newPoint = getTouchPosition(touch);

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


const handleTouchEnd = () => {

  if (!isDrawing || !currentStroke) {
    return;
  }

  setIsDrawing(false);

  const newStroke = {

    id: Date.now(),

    ...currentStroke

  };

  setStrokes((prev) => [

    ...prev,

    newStroke

  ]);

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

  const handleUndo = () => {

    if (!isDrawer) {
      return;
    }

    setStrokes((prev) => prev.slice(0, -1));
    socketClient.emit('undo_draw');
  };

  // 터치 시작
  const handleTouchStart = (e) => {

    if (!isDrawer) return;

    const pos = getTouchPosition(e);

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

  // 터치 이동
  const handleTouchMove = (e) => {

    if (!isDrawing) return;

    const newPoint = getTouchPosition(e);

    setCurrentStroke((prev) => {

      const updatedStroke = {

        ...prev,

        points: [...prev.points, newPoint]

      };

      redrawCanvas(updatedStroke);

      return updatedStroke;
    });
  };

  // 터치 종료 → 마우스와 동일하게 draw_data emit
  const handleTouchEnd = () => {

    handleMouseUp();
  };

  const eraseStroke = (clickPos) => {

    const CLICK_RANGE = 10;

    const toErase = strokes.filter((stroke) =>
      stroke.points.some((point) => {
        const dx = point.x - clickPos.x;
        const dy = point.y - clickPos.y;
        return Math.sqrt(dx * dx + dy * dy) < CLICK_RANGE;
      })
    );

    if (toErase.length === 0) return;

    const strokeIds = toErase.map((s) => s.id);
    setStrokes((prev) => prev.filter((s) => !strokeIds.includes(s.id)));
    socketClient.emit('erase_draw', { strokeIds });
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
    <div className="canvas-section mobile-canvas-area">

      {/* 주제 (출제자에게만 표시) */}
      <div className="topic-box common-box">

        {
          isDrawer && topic
            ? <strong>주제: {topic}</strong>
            : <strong>주제: ???</strong>
        }

      </div>

      <div className="canvas-box common-box">

        <canvas

          ref={canvasRef}

          width={600}
          height={400}

          className={`
            game-canvas
            ${currentTool === "eraser"
              ? "cursor-eraser"
              : (
                isDrawer
                  ? "cursor-draw"
                  : "cursor-disabled"
              )
            }
          `}

          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}

          // 모바일 캔버스 구현
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

      </div>

      <div className="toolbar">

        <button
          className="tool-button"
          onClick={() => {

            setCurrentColor("#000000");

            setCurrentTool("pen");

          }}
        >
          <Pencil
            className="tool-icon"
            strokeWidth={1.5}
          />
        </button>

        <button
          className="tool-button blue"
          onClick={() => {

            setCurrentColor("#0000ff");

            setCurrentTool("pen");

          }}
        >
          <Pencil
            className="tool-icon"
            color="blue"
            strokeWidth={1.5}
          />
        </button>

        <button
          className="tool-button red"
          onClick={() => {

            setCurrentColor("#ff0000");

            setCurrentTool("pen");

          }}
        >
          <Pencil
            className="tool-icon"
            color="red"
            strokeWidth={1.5}
          />
        </button>

        <button
          className="tool-button"
          onClick={() => setCurrentTool("eraser")}
        >
          <Eraser
            className="tool-icon"
            strokeWidth={1.5}
          />
        </button>

        <button
          className="tool-button"
          onClick={handleUndo}
        >
          <Undo2
            className="tool-icon"
            strokeWidth={1.5}
          />
        </button>

      </div>

    </div>

  );
}

export default GameCanvasSection;
