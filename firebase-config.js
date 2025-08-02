// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDxtxvUt94489cQSPiqJH7xW_iLloX8TcQ",
  authDomain: "qna-web2-db.firebaseapp.com",
  projectId: "qna-web2-db",
  storageBucket: "qna-web2-db.firebasestorage.app",
  messagingSenderId: "417261715372",
  appId: "1:417261715372:web:34cc4cde2fb0f3e11e0409"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 참조
const db = firebase.firestore();

// Firestore 설정 (개발 환경용)
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true,
  useFetchStreams: false
}, { merge: true });

// 전역 변수로 db를 사용할 수 있도록 설정
window.db = db;

// 연결 상태 확인
db.enableNetwork().then(() => {
  console.log('Firebase Firestore 연결 성공');
}).catch((error) => {
  console.error('Firebase Firestore 연결 실패:', error);
}); 