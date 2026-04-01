* CI/CD - 코드가 합쳐지면 자동으로 웹에 반영되도록 설정
* 통합 테스트 - 멀티 유저 / 멀티 룸 테스트
* 버그 리포팅 - 테스트 중 발견된 콘솔 에러나 서버 로그를 모니터링해서 공유
* 문서화

이 md는 삭제하셔도 됩니다.


### Test Guideline
cypress를 설치해두었고, 명령어를 package.json의 "scripts"에 추가해두었습니다. (test:open, test:run)

npm run test:open 명령어로 어떤 테스트를 할 건지 고를 수 있습니다 (GUI 모드).
npm run test:run 명령어로는 화면 없이 터미널에서 빠르게 테스트를 실행할 수 있습니다 (headless 모드).

cypress는 꼭 Test 폴더에서 실행해야 합니다. (cypress.json 파일이 Test 폴더 안에 있기 때문입니다)
다른 폴더에서 실행하면 cypress가 설정 파일을 찾지 못해서 에러가 날 수 있습니다.
생성된 cypress 폴더는 표준을 따르고 있습니다. 되도록 건들지 마시되 cypress/e2e 폴더 안에 테스트 스크립트만 추가해서 명령어로 실행해주세요.
테스트 스크립트는 JavaScript로 작성되어야 합니다.