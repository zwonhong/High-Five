const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173", // Update this to match your frontend URL and port
    origin: "*", // 테스트중에만 허용 Allow all origin only for testing
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
const MAX_USERS = 5; // 한 방에 5명만 Maximum users allowed in the room

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('<h1>High-Five Socket Server is Running!</h1>');
});

// Socket.IO connection handling
io.on('connection', (socket) => {

  const currentUsers = io.engine.clientsCount; // 현재 접속 인원 확인 Check current users
  
  // 5명 초과 시 입장 차단 Block entry if more than 5 users
  if (currentUsers > MAX_USERS) {
    console.log('${socket.id} - 정원 초과 (${currentUsers}/${MAX_USERS})');
    socket.emit('error_message', '방이 꽉 찼습니다.');
    socket.disconnect(true);
    return;
  }

  // 5명 이하일 경우 game-room에 자동 입장 Join game-room if 5 or fewer users
  socket.join('game-room');
  console.log('User connected:', socket.id, '현재 인원: ${currentUsers}/${MAX_USERS}');

  // 모두에게 현재 인원 수 브로드캐스팅 Broadcast current user count to everyone
  io.to('game-room').emit('user_count_update', currentUsers);

  socket.on('disconnect', () => {
    // 퇴장 후 인원수 다시 계산 후 브로드캐스팅 Recalculate user count and broadcasting after disconnection
    const remainingUsers = io.engine.clientsCount;
    console.log('User disconnected: ${socket.id} - 남은 인원: ${remainingUsers}');
    io.to('game-room').emit('user_count_update', remainingUsers);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});