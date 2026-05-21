describe('Chat Feature Test', () => {

  beforeEach(() => {
    cy.visit('http://localhost')

    cy.get('input').eq(0).type('suhui')
    cy.contains('입장').click()
  })

  it('Message Send Test', () => {
    cy.get('#msgInput').type('hello')
    cy.contains('전송').click()

    cy.contains('hello')
  })

  it('Empty Message Block Test', () => {
    cy.get('#msgInput').type(' ')
    cy.contains('전송').click()

    cy.contains(' :  ').should('not.exist')
  })

  it('Long Message Test', () => {
    const longMsg = 'a'.repeat(300)

    cy.get('#msgInput').type(longMsg)
    cy.contains('전송').click()

    cy.contains(longMsg)
  })

  it('Korean Message Test', () => {
    cy.get('#msgInput').type('안녕하세요')
    cy.contains('전송').click()

    cy.contains('안녕하세요')
  })

  it('Emoji Message Test', () => {
    cy.get('#msgInput').type('🐶🍀🎈')
    cy.contains('전송').click()

    cy.contains('🐶🍀🎈')
  })

  it('Enter Key Send Test', () => {
    cy.get('#msgInput').type('enter test{enter}')

    cy.contains('enter test')
  })

  it('Spam Click Test', () => {
    cy.get('#msgInput').type('spam')

    cy.contains('전송').click().click().click()

    cy.contains('spam')
  })

  it('Refresh Test', () => {
    cy.reload()

    cy.contains('입장')
  })

})

describe('Server Stability Test', () => {

  it('Duplicate Nickname Test', () => {

    cy.visit('http://localhost')

    cy.get('input').eq(0).type('suhui')
    cy.contains('입장').click()

    cy.reload()

    cy.get('input').eq(0).type('suhui')
    cy.contains('입장').click()

    cy.contains('suhui')
  })

  it('Reconnect After Refresh Test', () => {

    cy.visit('http://localhost')

    cy.get('input').eq(0).type('reloadUser')
    cy.contains('입장').click()

    cy.reload()

    cy.contains('입장')
  })

  it('Server Connection Test', () => {

    cy.visit('http://localhost')

    cy.get('input').eq(0).type('aliveUser')
    cy.contains('입장').click()

    cy.get('#msgInput').type('server alive test')
    cy.contains('전송').click()

    cy.contains('server alive test')
  })

  it('Korean + Emoji Mixed Test', () => {

    cy.visit('http://localhost')

    cy.get('input').eq(0).type('emojiUser')
    cy.contains('입장').click()

    cy.get('#msgInput').type('안녕하세요 🐶🍀🎈')
    cy.contains('전송').click()
    cy.contains('안녕하세요 🐶🍀🎈')
  })

})