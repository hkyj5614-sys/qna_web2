// Firebase 데이터베이스 참조
let questions = [];
let currentQuestionId = null;
let isLoading = false;

// DOM 요소들
const questionForm = document.getElementById('questionForm');
const questionsList = document.getElementById('questionsList');
const questionModal = document.getElementById('questionModal');
const questionDetail = document.getElementById('questionDetail');
const answerForm = document.getElementById('answerForm');
const answersList = document.getElementById('answersList');
const closeModal = document.querySelector('.close');

// Firebase 데이터베이스 함수들
async function loadQuestionsFromFirebase() {
    try {
        isLoading = true;
        showLoadingSpinner();
        
        // 네트워크 연결 상태 확인
        await db.enableNetwork();
        
        const snapshot = await db.collection('questions').orderBy('date', 'desc').get();
        questions = [];
        snapshot.forEach(doc => {
            questions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        renderQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
        
        // 오프라인 모드일 때 로컬 캐시 사용
        if (error.code === 'unavailable' || error.code === 'permission-denied') {
            showNotification('오프라인 모드입니다. 로컬 캐시를 사용합니다.', 'warning');
            // 로컬 스토리지에서 데이터 불러오기 (백업)
            loadFromLocalStorage();
        } else {
            showNotification('질문을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    } finally {
        isLoading = false;
        hideLoadingSpinner();
    }
}

// 로컬 스토리지에서 데이터 불러오기 (백업)
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('qnaQuestions');
        if (savedData) {
            questions = JSON.parse(savedData);
            renderQuestions();
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

async function addQuestionToFirebase(questionData) {
    try {
        const docRef = await db.collection('questions').add({
            title: questionData.title,
            content: questionData.content,
            date: new Date().toLocaleString('ko-KR'),
            answers: []
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding question:', error);
        throw error;
    }
}

async function addAnswerToFirebase(questionId, answerData) {
    try {
        const questionRef = db.collection('questions').doc(questionId);
        await questionRef.update({
            answers: firebase.firestore.FieldValue.arrayUnion({
                id: Date.now(),
                content: answerData.content,
                date: new Date().toLocaleString('ko-KR')
            })
        });
    } catch (error) {
        console.error('Error adding answer:', error);
        throw error;
    }
}

async function deleteQuestionFromFirebase(questionId) {
    try {
        await db.collection('questions').doc(questionId).delete();
    } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // Firebase에서 데이터 불러오기
    loadQuestionsFromFirebase();
    
    // 이벤트 리스너 등록
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 질문 등록 폼
    questionForm.addEventListener('submit', handleQuestionSubmit);
    
    // 답변 등록 폼
    answerForm.addEventListener('submit', handleAnswerSubmit);
    
    // 모달 닫기
    closeModal.addEventListener('click', closeQuestionModal);
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === questionModal) {
            closeQuestionModal();
        }
    });
    
    // 질문 목록 이벤트 위임
    questionsList.addEventListener('click', function(event) {
        const questionItem = event.target.closest('.question-item');
        if (!questionItem) return;
        
        const questionId = questionItem.dataset.questionId;
        
        // 질문 내용 클릭 시 모달 열기
        if (event.target.closest('.question-content')) {
            openQuestionModal(questionId);
        }
        
        // 삭제 버튼 클릭 시 질문 삭제
        if (event.target.classList.contains('delete-btn')) {
            event.stopPropagation();
            deleteQuestion(questionId);
        }
    });
}

// 질문 등록 처리
async function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('questionTitle').value.trim();
    const content = document.getElementById('questionContent').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }
    
    try {
        await addQuestionToFirebase({ title, content });
        
        // 폼 초기화
        questionForm.reset();
        
        // 성공 메시지
        showNotification('질문이 성공적으로 등록되었습니다!');
        
        // 질문 목록 새로고침
        await loadQuestionsFromFirebase();
    } catch (error) {
        showNotification('질문 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 답변 등록 처리
async function handleAnswerSubmit(e) {
    e.preventDefault();
    
    const content = document.getElementById('answerContent').value.trim();
    
    if (!content) {
        alert('답변 내용을 입력해주세요.');
        return;
    }
    
    if (!currentQuestionId) {
        alert('질문을 선택해주세요.');
        return;
    }
    
    try {
        await addAnswerToFirebase(currentQuestionId, { content });
        
        // 폼 초기화
        answerForm.reset();
        
        // 성공 메시지
        showNotification('답변이 성공적으로 등록되었습니다!');
        
        // 질문 목록 새로고침하여 답변 수 업데이트
        await loadQuestionsFromFirebase();
        
        // 현재 모달의 답변 목록 새로고침
        const question = questions.find(q => String(q.id) === String(currentQuestionId));
        if (question) {
            renderAnswers();
        }
    } catch (error) {
        showNotification('답변 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 질문 목록 렌더링
function renderQuestions() {
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <p>아직 등록된 질문이 없습니다.</p>
                <p>첫 번째 질문을 작성해보세요!</p>
            </div>
        `;
        return;
    }
    
    questionsList.innerHTML = questions.map(question => `
        <div class="question-item" data-question-id="${question.id}">
            <div class="question-content">
                <h3>${escapeHtml(question.title)}</h3>
                <p>${escapeHtml(question.content.substring(0, 100))}${question.content.length > 100 ? '...' : ''}</p>
                <div class="question-meta">
                    <span>${question.date}</span>
                    <span class="answer-count">답변 ${question.answers.length}개</span>
                </div>
            </div>
            <button class="delete-btn" title="질문 삭제">×</button>
        </div>
    `).join('');
}

// 질문 모달 열기
function openQuestionModal(questionId) {
    console.log('Opening modal for question ID:', questionId, 'Type:', typeof questionId);
    console.log('Available questions:', questions.map(q => ({ id: q.id, type: typeof q.id })));
    
    // 문자열로 변환하여 비교
    const question = questions.find(q => String(q.id) === String(questionId));
    if (!question) {
        console.error('Question not found for ID:', questionId);
        console.error('Available IDs:', questions.map(q => q.id));
        return;
    }
    
    currentQuestionId = questionId;
    
    // 질문 상세 내용 표시
    questionDetail.innerHTML = `
        <h2>${escapeHtml(question.title)}</h2>
        <p>${escapeHtml(question.content)}</p>
        <div class="question-meta">
            <span>작성일: ${question.date}</span>
        </div>
    `;
    
    // 답변 목록 렌더링
    renderAnswers();
    
    // 모달 표시
    questionModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 스크롤 방지
}

// 답변 목록 렌더링
function renderAnswers() {
    const question = questions.find(q => String(q.id) === String(currentQuestionId));
    if (!question) return;
    
    if (question.answers.length === 0) {
        answersList.innerHTML = `
            <div class="empty-state">
                <p>아직 답변이 없습니다.</p>
                <p>첫 번째 답변을 작성해보세요!</p>
            </div>
        `;
        return;
    }
    
    answersList.innerHTML = question.answers.map(answer => `
        <div class="answer-item">
            <p>${escapeHtml(answer.content)}</p>
            <div class="answer-meta">
                <span>${answer.date}</span>
            </div>
        </div>
    `).join('');
}

// 질문 삭제
async function deleteQuestion(questionId) {
    console.log('Deleting question ID:', questionId, 'Type:', typeof questionId);
    if (confirm('정말로 이 질문을 삭제하시겠습니까?\n모든 답변도 함께 삭제됩니다.')) {
        try {
            // 현재 열린 모달이 삭제하려는 질문이면 모달 닫기
            if (String(currentQuestionId) === String(questionId)) {
                closeQuestionModal();
            }
            
            // Firebase에서 질문 삭제
            await deleteQuestionFromFirebase(questionId);
            
            // 성공 메시지
            showNotification('질문이 삭제되었습니다.');
            
            // 질문 목록 새로고침
            await loadQuestionsFromFirebase();
        } catch (error) {
            showNotification('질문 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 질문 모달 닫기
function closeQuestionModal() {
    questionModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 스크롤 복원
    currentQuestionId = null;
}

// 로딩 상태 표시 함수
function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
        ">
            <div style="text-align: center;">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                "></div>
                <p>데이터를 불러오는 중...</p>
            </div>
        </div>
    `;
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.remove();
    }
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 알림 메시지 표시
function showNotification(message, type = 'success') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // 타입에 따른 색상 설정
    let bgColor = '#4CAF50'; // 기본 성공 색상
    if (type === 'error') {
        bgColor = '#ff4757';
    } else if (type === 'warning') {
        bgColor = '#ffa502';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    // 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 키보드 단축키 지원
document.addEventListener('keydown', function(e) {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape' && questionModal.style.display === 'block') {
        closeQuestionModal();
    }
    
    // Ctrl+Enter로 질문 등록
    if (e.ctrlKey && e.key === 'Enter' && document.activeElement.id === 'questionContent') {
        questionForm.dispatchEvent(new Event('submit'));
    }
    
    // Ctrl+Enter로 답변 등록
    if (e.ctrlKey && e.key === 'Enter' && document.activeElement.id === 'answerContent') {
        answerForm.dispatchEvent(new Event('submit'));
    }
}); 