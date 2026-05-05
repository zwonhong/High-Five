# Node.js 18 버전을 베이스 이미지로 사용
# Use Node.js 18 as the base image
FROM node:18

# 컨테이너 내 작업 디렉토리 설정
# Set the working directory inside the container
WORKDIR /app

# 종속성 설치를 위해 package.json 복사
# Copy package.json for dependency installation
COPY package*.json ./

# 필요한 패키지 설치 (redis, @socket.io/redis-adapter 등 포함)
# Install necessary packages (including redis, @socket.io/redis-adapter, etc.)
RUN npm install

# 나머지 서버 코드 전체 복사
# Copy the rest of the server code
COPY . .

# app.js에서 설정한 3000번 포트를 노출
# Expose port 3000 as defined in app.js
EXPOSE 3000

# 서버 실행
# Start the server
CMD ["node", "app.js"]