describe('모바일 반응형 및 터치 드로잉 테스트', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173/');
    cy.contains('게임 시작하기').click();
    cy.get('input[placeholder="닉네임을 입력하세요"]').type('수희');
    cy.contains('게임 입장').click();
    cy.contains('주제', { timeout: 8000 }).should('be.visible');
  });

  it('iPhone X 화면에서 게임 UI가 정상 표시되어야 한다', () => {
    cy.viewport('iphone-x');
    cy.contains('주제').should('be.visible');
    cy.get('canvas').should('be.visible');
    cy.get('input[placeholder="채팅 입력"]').should('be.visible');
  });

  it('Galaxy S21 화면에서 게임 UI가 정상 표시되어야 한다', () => {
    cy.viewport(360, 800);
    cy.contains('주제').should('be.visible');
    cy.get('canvas').should('be.visible');
    cy.get('input[placeholder="채팅 입력"]').should('be.visible');
  });

  it('iPad 화면에서 게임 UI가 정상 표시되어야 한다', () => {
    cy.viewport('ipad-2');
    cy.contains('주제').should('be.visible');
    cy.get('canvas').should('be.visible');
    cy.get('input[placeholder="채팅 입력"]').should('be.visible');
  });

  it('모바일에서 캔버스가 존재해야 한다', () => {
    cy.viewport('iphone-x');
    cy.get('canvas').should('be.visible');
  });

  it('모바일에서 캔버스 터치 드로잉이 가능해야 한다', () => {
    cy.viewport('iphone-x');
    cy.get('canvas').then(($canvas) => {
      const canvas = $canvas[0];
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();

      const before = ctx.getImageData(50, 50, 100, 100).data;

      cy.wrap($canvas)
        .trigger('touchstart', { touches: [{ clientX: rect.left + 50, clientY: rect.top + 50 }] })
        .trigger('touchmove', { touches: [{ clientX: rect.left + 100, clientY: rect.top + 100 }] })
        .trigger('touchend')
        .then(() => {
          const after = ctx.getImageData(50, 50, 100, 100).data;
          expect(before).to.not.deep.equal(after);
        });
    });
  });

  it('모바일에서 정답 입력창 터치 후 입력이 가능해야 한다', () => {
    cy.viewport('iphone-x');
    cy.get('input[placeholder="채팅 입력"]')
      .click()
      .type('테스트입력')
      .should('have.value', '테스트입력');
  });

});