// 데이터 저장소 (실제 프로젝트에서는 서버나 데이터베이스를 사용)
let questions = [];
let currentQuestionId = null;

// DOM 요소들
const questionForm = document.getElementById('questionForm');
const questionsList = document.getElementById('questionsList');
const questionModal = document.getElementById('questionModal');
const questionDetail = document.getElementById('questionDetail');
const answerForm = document.getElementById('answerForm');
const answersList = document.getElementById('answersList');
const closeModal = document.querySelector('.close');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 로컬 스토리지에서 데이터 불러오기
    loadData();
    
    // 질문 목록 렌더링
    renderQuestions();
    
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
}

// 질문 등록 처리
function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('questionTitle').value.trim();
    const content = document.getElementById('questionContent').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }
    
    const question = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toLocaleString('ko-KR'),
        answers: []
    };
    
    questions.unshift(question); // 새 질문을 맨 위에 추가
    saveData();
    renderQuestions();
    
    // 폼 초기화
    questionForm.reset();
    
    // 성공 메시지
    showNotification('질문이 성공적으로 등록되었습니다!');
}

// 답변 등록 처리
function handleAnswerSubmit(e) {
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
    
    const answer = {
        id: Date.now(),
        content: content,
        date: new Date().toLocaleString('ko-KR')
    };
    
    // 현재 질문에 답변 추가
    const question = questions.find(q => q.id === currentQuestionId);
    if (question) {
        question.answers.push(answer);
        saveData();
        renderAnswers();
        
        // 폼 초기화
        answerForm.reset();
        
        // 성공 메시지
        showNotification('답변이 성공적으로 등록되었습니다!');
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
        <div class="question-item">
            <div class="question-content" onclick="openQuestionModal(${question.id})">
                <h3>${escapeHtml(question.title)}</h3>
                <p>${escapeHtml(question.content.substring(0, 100))}${question.content.length > 100 ? '...' : ''}</p>
                <div class="question-meta">
                    <span>${question.date}</span>
                    <span class="answer-count">답변 ${question.answers.length}개</span>
                </div>
            </div>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteQuestion(${question.id})" title="질문 삭제">×</button>
        </div>
    `).join('');
}

// 질문 모달 열기
function openQuestionModal(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
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
    const question = questions.find(q => q.id === currentQuestionId);
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
function deleteQuestion(questionId) {
    if (confirm('정말로 이 질문을 삭제하시겠습니까?\n모든 답변도 함께 삭제됩니다.')) {
        // 현재 열린 모달이 삭제하려는 질문이면 모달 닫기
        if (currentQuestionId === questionId) {
            closeQuestionModal();
        }
        
        // 질문 배열에서 해당 질문 제거
        questions = questions.filter(q => q.id !== questionId);
        
        // 데이터 저장 및 목록 다시 렌더링
        saveData();
        renderQuestions();
        
        // 성공 메시지
        showNotification('질문이 삭제되었습니다.');
    }
}

// 질문 모달 닫기
function closeQuestionModal() {
    questionModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 스크롤 복원
    currentQuestionId = null;
}

// 데이터 저장 (로컬 스토리지)
function saveData() {
    localStorage.setItem('qnaQuestions', JSON.stringify(questions));
}

// 데이터 불러오기 (로컬 스토리지)
function loadData() {
    const savedData = localStorage.getItem('qnaQuestions');
    if (savedData) {
        questions = JSON.parse(savedData);
    }
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 알림 메시지 표시
function showNotification(message) {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
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
    
    // slideOut 애니메이션 추가
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
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
    `;
    document.head.appendChild(slideOutStyle);
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