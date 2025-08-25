// JavaScript: 전체 로직
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentQuizMode = 'normal'; // 'normal' or 'checked'

const subjectListDiv = document.getElementById('subject-list');
const subjectSelectionScreen = document.getElementById('subject-selection-screen');
const quizContainer = document.getElementById('quiz-container');

const startNormalQuizBtn = document.getElementById('start-normal-quiz-btn');
const startCheckedQuizBtn = document.getElementById('start-checked-quiz-btn');
const resumeQuizBtn = document.getElementById('resume-quiz-btn');
const resumeCheckedQuizBtn = document.getElementById('resume-checked-quiz-btn');
const goHomeBtn = document.getElementById('go-home-btn');

const currentSubjectTitle = document.getElementById('current-subject-title');
const questionNumberEl = document.getElementById('question-number');
const questionTextEl = document.getElementById('question-text');
const answerArea = document.getElementById('answer-area');
const checkProblemBox = document.getElementById('check-problem-box');
const showAnswerBtn = document.getElementById('show-answer-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const notesInput = document.getElementById('notes-input');
const saveNotesBtn = document.getElementById('save-notes-btn');
const exportNotesBtn = document.getElementById('export-notes-btn');

// 로컬 스토리지 데이터 로드
let checkedProblems = JSON.parse(localStorage.getItem('checked-problems')) || {};
let savedNotes = JSON.parse(localStorage.getItem('saved-notes')) || {};
let lastNormalQuiz = JSON.parse(localStorage.getItem('last-normal-quiz')) || null;
let lastCheckedQuiz = JSON.parse(localStorage.getItem('last-checked-quiz')) || null;

// JSON 파일 불러오기
async function fetchQuestions() {
    try {
        const response = await fetch('quiz.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestions = await response.json();
        loadSubjectSelection();
    } catch (e) {
        console.error("문제 데이터를 불러오는 데 실패했습니다:", e);
        subjectListDiv.innerHTML = "<p>문제를 불러올 수 없습니다. 'quiz.json' 파일이 올바른 위치에 있는지 확인해주세요.</p>";
    }
}

// 과목 선택 화면 로드
function loadSubjectSelection() {
    const subjects = [...new Set(allQuestions.map(q => q.subject))];
    subjectListDiv.innerHTML = subjects.map(subject => `
        <label class="subject-item">
            <input type="checkbox" data-subject="${subject}"> ${subject}
        </label>
    `).join('');

    // 마지막 문제 이어 풀기 버튼 상태 업데이트
    if (lastNormalQuiz) resumeQuizBtn.style.display = 'inline-block';
    if (lastCheckedQuiz) resumeCheckedQuizBtn.style.display = 'inline-block';
}

// 문제 풀이 시작
function startQuiz(mode, subject) {
    currentQuizMode = mode;
    let filteredQuestions = [];

    if (mode === 'normal') {
        const selectedSubjects = Array.from(subjectListDiv.querySelectorAll('input:checked'))
                                     .map(cb => cb.dataset.subject);
        if (selectedSubjects.length === 0) {
            alert('하나 이상의 과목을 선택해주세요.');
            return;
        }
        filteredQuestions = allQuestions.filter(q => selectedSubjects.includes(q.subject));
        currentQuestions = filteredQuestions.sort((a, b) => a.subject.localeCompare(b.subject) || a.문제번호 - b.문제번호);
        currentQuestionIndex = 0;
    } else if (mode === 'checked') {
        const checkedQIds = Object.keys(checkedProblems);
        currentQuestions = allQuestions.filter(q => checkedQIds.includes(`${q.subject}-${q.문제번호}`));
        if (currentQuestions.length === 0) {
            alert('체크된 문제가 없습니다.');
            return;
        }
        currentQuestionIndex = 0;
    } else if (mode === 'resume-normal') {
        const last = lastNormalQuiz;
        const lastSubject = last.subject;
        const lastQNum = last.questionNumber;
        currentQuestions = allQuestions.filter(q => q.subject === lastSubject).sort((a, b) => a.문제번호 - b.문제번호);
        const lastQuestion = currentQuestions.find(q => q.문제번호 == lastQNum);
        currentQuestionIndex = currentQuestions.indexOf(lastQuestion);
    } else if (mode === 'resume-checked') {
        const last = lastCheckedQuiz;
        const lastSubject = last.subject;
        const lastQNum = last.questionNumber;
        currentQuestions = allQuestions.filter(q => Object.keys(checkedProblems).includes(`${q.subject}-${q.문제번호}`));
        const lastQuestion = currentQuestions.find(q => q.문제번호 == lastQNum);
        currentQuestionIndex = currentQuestions.indexOf(lastQuestion);
    }
    
    subjectSelectionScreen.style.display = 'none';
    quizContainer.style.display = 'block';
    displayQuestion();
}

// 문제 표시
function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        alert('모든 문제를 다 풀었습니다!');
        goHomeBtn.click();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    const qId = `${question.subject}-${question.문제번호}`;

    currentSubjectTitle.textContent = question.subject;
    questionNumberEl.textContent = `문제 ${question.문제번호}`;
    questionTextEl.innerHTML = question.question;
    answerArea.innerHTML = '';
    showAnswerBtn.style.display = 'block';
    nextQuestionBtn.style.display = 'none';
    notesInput.value = savedNotes[qId] || '';

    // 체크박스 상태 동기화
    checkProblemBox.checked = checkedProblems[qId] !== undefined;

    // 마지막 문제 저장 (단일 라인)
    const lastQuizData = { subject: question.subject, questionNumber: question.문제번호 };
    if (currentQuizMode === 'normal') {
        localStorage.setItem('last-normal-quiz', JSON.stringify(lastQuizData));
    } else {
        localStorage.setItem('last-checked-quiz', JSON.stringify(lastQuizData));
    }
}

// 정답 보여주기
function showAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    if (question.answers_shown_count === undefined) question.answers_shown_count = 0;

    if (question.answers_shown_count < question.answers.length) {
        const answer = question.answers[question.answers_shown_count];
        const blankRegex = new RegExp(`（\\s*${answer.part.slice(0, 1)}.*?\\s*）`, 'g');
        
        questionTextEl.innerHTML = questionTextEl.innerHTML.replace(blankRegex, `<span class="filled-blank" style="color:#28a745;">${answer.part.slice(2)}</span>`);
        answerArea.innerHTML += `<div>${answer.part}</div>`;

        question.answers_shown_count++;
        if (question.answers_shown_count === question.answers.length) {
            showAnswerBtn.style.display = 'none';
            nextQuestionBtn.style.display = 'block';
        }
    }
}

// 이벤트 리스너
startNormalQuizBtn.addEventListener('click', () => startQuiz('normal', null));
startCheckedQuizBtn.addEventListener('click', () => startQuiz('checked', null));

resumeQuizBtn.addEventListener('click', () => startQuiz('resume-normal', null));
resumeCheckedQuizBtn.addEventListener('click', () => startQuiz('resume-checked', null));

goHomeBtn.addEventListener('click', () => {
    quizContainer.style.display = 'none';
    subjectSelectionScreen.style.display = 'block';
    loadSubjectSelection();
});

nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});

showAnswerBtn.addEventListener('click', showAnswer);

checkProblemBox.addEventListener('change', (e) => {
    const question = currentQuestions[currentQuestionIndex];
    const qId = `${question.subject}-${question.문제번호}`;
    if (e.target.checked) {
        checkedProblems[qId] = true;
    } else {
        delete checkedProblems[qId];
    }
    localStorage.setItem('checked-problems', JSON.stringify(checkedProblems));
});

saveNotesBtn.addEventListener('click', () => {
    const question = currentQuestions[currentQuestionIndex];
    const qId = `${question.subject}-${question.문제번호}`;
    savedNotes[qId] = notesInput.value;
    localStorage.setItem('saved-notes', JSON.stringify(savedNotes));
    alert('내용이 임시 저장되었습니다.');
});

exportNotesBtn.addEventListener('click', () => {
    const notes = JSON.stringify(savedNotes, null, 2);
    const blob = new Blob([notes], {type: "application/json;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '문제_주의사항.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// 앱 시작
fetchQuestions();