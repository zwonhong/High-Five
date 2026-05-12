const express = require('express');
const http = require('http');
const path = require('path');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// 정적 파일 폴더 설정 (현재 폴더를 기본으로 설정) Set static file folder (set current folder as default)
app.use(express.static(__dirname)); 

// 서버 실행중 실행경로 확인 Test route to check if the server is running
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});


const start = async () => {
  try {
    await setupSocket(server); // 소켓 설정이 비동기이므로 await로 완료를 기다립니다. Since socket setup is asynchronous, we wait for it to complete with await.
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
}

start();