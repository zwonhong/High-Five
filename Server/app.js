const express = require('express');
const http = require('http');
const path = require('path');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// 정적 파일 폴더 설정 (현재 폴더를 기본으로 설정)
app.use(express.static(__dirname)); 

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

setupSocket(server);

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});