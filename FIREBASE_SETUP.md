# Firebase 설정 가이드

## 🔧 Firebase 콘솔에서 해야 할 설정

### 1. Firestore Database 활성화
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 `qna-web2-db` 선택
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. **데이터베이스 만들기** 클릭
5. **테스트 모드에서 시작** 선택 (개발용)
6. **위치 선택** (가까운 지역 선택)

### 2. 보안 규칙 설정
Firestore Database → 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 사용자가 읽기/쓰기 가능 (테스트용)
    match /questions/{questionId} {
      allow read, write: if true;
    }
  }
}
```

### 3. 웹 앱 등록 확인
1. 프로젝트 설정 → 일반 탭
2. **웹 앱** 섹션에서 앱이 등록되어 있는지 확인
3. 등록되지 않았다면 **웹 앱에 Firebase 추가** 클릭

### 4. API 키 확인
1. 프로젝트 설정 → 일반 탭
2. **웹 API 키**가 `firebase-config.js`의 apiKey와 일치하는지 확인

## 🚨 문제 해결

### 오류가 계속 발생하는 경우:
1. **브라우저 캐시 삭제**: Ctrl+Shift+R (강력 새로고침)
2. **개발자 도구 확인**: F12 → Console 탭에서 오류 메시지 확인
3. **네트워크 연결 확인**: 인터넷 연결 상태 확인
4. **Firebase 프로젝트 상태 확인**: Firebase 콘솔에서 프로젝트가 활성 상태인지 확인

### 오프라인 모드
- 인터넷 연결이 없어도 로컬 캐시를 사용하여 작동
- 연결이 복구되면 자동으로 Firebase와 동기화

## 📞 지원
문제가 지속되면 Firebase 콘솔의 지원 섹션을 참조하세요. 