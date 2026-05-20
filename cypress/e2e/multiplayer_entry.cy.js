describe('캐치마인드 5인 멀티플레이어 입장 및 시작 테스트', () => {
  const users = [
    { name: '수희' },
    { name: '수현' },
    { name: '지원' },
    { name: '필주' },
    { name: '서영' }
  ];

  it('5명의 유저가 순차적으로 입장하면 게임이 자동 시작', () => {
    
    // 유저 1~4까지 순차적으로 접속 후 대기실 진입
    users.slice(0, 4).forEach((user) => {
      cy.visit('http://localhost:5175/'); 
      
      // 1. 첫 화면에서 [게임시작하기] 버튼 먼저 클릭
      cy.contains('게임 시작하기').click();

      // 2. 닉네임 입력창에 닉네임 입력
      cy.get('input[placeholder="닉네임을 입력하세요"]').type(user.name);
      
      // 3. [게임 입장] 버튼 클릭하여 입장 
      cy.contains('게임 입장').click(); 
      
      // 다음 유저 입장을 위해 브라우저 기록 싹 비우기
      cy.clearLocalStorage();
      cy.clearCookies();
    });

    //마지막 5번째 유저 입장
    const lastUser = users[4];
    cy.visit('http://localhost:5175/');
    cy.contains('게임 시작하기').click();
    cy.get('input[placeholder="닉네임을 입력하세요"]').type(lastUser.name);
    cy.contains('게임 입장').click();

    // 5명이 다 찼으므로 화면이 전환되는지 검증
    cy.contains('주제', { timeout: 5000 }).should('be.visible');
    cy.contains('가이드 그림').should('be.visible');

     
  });
})