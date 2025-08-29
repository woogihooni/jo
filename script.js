// JavaScript: 전체 로직
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentQuizMode = 'normal'; // 'normal' or 'checked'

const subjectSelectionScreen = document.getElementById('subject-selection-screen');
const checkedSubjectScreen = document.getElementById('checked-subject-screen');
const quizContainer = document.getElementById('quiz-container');

const subjectListDiv = document.getElementById('subject-list');
const checkedSubjectListDiv = document.getElementById('checked-subject-list');

const startNormalQuizBtn = document.getElementById('start-normal-quiz-btn');
const startCheckedQuizBtn = document.getElementById('start-checked-quiz-btn');
const resumeQuizBtn = document.getElementById('resume-quiz-btn');
const exportNotesBtn = document.getElementById('export-notes-btn');
const clearNotesBtn = document.getElementById('clear-notes-btn');

const startCheckedQuizSelectBtn = document.getElementById('start-checked-quiz-select-btn');
const resumeCheckedQuizBtn = document.getElementById('resume-checked-quiz-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');

const goHomeBtn = document.getElementById('go-home-btn');

const currentSubjectTitle = document.getElementById('current-subject-title');
const questionNumberEl = document.getElementById('question-number');
const questionTextEl = document.getElementById('question-text');
const copyProblemBtn = document.getElementById('copy-problem-btn');
const answerArea = document.getElementById('answer-area');
const checkProblemBox = document.getElementById('check-problem-box');
const showAnswerBtn = document.getElementById('show-answer-btn');
const prevQuestionBtn = document.getElementById('prev-question-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const notesInput = document.getElementById('notes-input');
const saveNotesBtn = document.getElementById('save-notes-btn');

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
    subjectSelectionScreen.style.display = 'block';
    checkedSubjectScreen.style.display = 'none';
    quizContainer.style.display = 'none';

    const subjects = [...new Set(allQuestions.map(q => q.subject))];
    subjectListDiv.innerHTML = subjects.map(subject => `
        <label class="subject-item">
            <input type="checkbox" data-subject="${subject}"> ${subject}
        </label>
    `).join('');

    // 로컬 스토리지 데이터 다시 불러오기
    lastNormalQuiz = JSON.parse(localStorage.getItem('last-normal-quiz')) || null;

    if (lastNormalQuiz) {
        resumeQuizBtn.style.display = 'inline-block';
        resumeQuizBtn.textContent = `마지막 문제 이어 풀기(${lastNormalQuiz.subject}, ${lastNormalQuiz.questionNumber})`;
    } else {
        resumeQuizBtn.style.display = 'none';
    }
}

// 체크 문제 과목 선택 화면 로드
function loadCheckedSubjectSelection() {
    subjectSelectionScreen.style.display = 'none';
    checkedSubjectScreen.style.display = 'block';
    quizContainer.style.display = 'none';

    const checkedSubjects = [...new Set(Object.keys(checkedProblems).map(qId => qId.split('-')[0]))];
    
    if (checkedSubjects.length === 0) {
        checkedSubjectListDiv.innerHTML = '<p>체크한 문제가 없습니다.</p>';
        startCheckedQuizSelectBtn.style.display = 'none';
        resumeCheckedQuizBtn.style.display = 'none';
    } else {
        checkedSubjectListDiv.innerHTML = checkedSubjects.map(subject => `
            <label class="subject-item">
                <input type="checkbox" data-subject="${subject}"> ${subject}
            </label>
        `).join('');
        startCheckedQuizSelectBtn.style.display = 'inline-block';
        
        // 로컬 스토리지 데이터 다시 불러오기
        lastCheckedQuiz = JSON.parse(localStorage.getItem('last-checked-quiz')) || null;

        if (lastCheckedQuiz) {
            resumeCheckedQuizBtn.style.display = 'inline-block';
            resumeCheckedQuizBtn.textContent = `마지막 체크문제 이어 풀기(${lastCheckedQuiz.subject}, ${lastCheckedQuiz.questionNumber})`;
        } else {
            resumeCheckedQuizBtn.style.display = 'none';
        }
    }
}

// 문제 풀이 시작
function startQuiz(mode, selectedSubjects) {
    currentQuizMode = mode;
    
    if (mode === 'normal') {
        currentQuestions = allQuestions.filter(q => selectedSubjects.includes(q.subject))
                                       .sort((a, b) => a.subject.localeCompare(b.subject) || a.문제번호 - b.문제번호);
        currentQuestionIndex = 0;
    } else if (mode === 'checked') {
        const checkedQIds = Object.keys(checkedProblems);
        currentQuestions = allQuestions.filter(q => selectedSubjects.includes(q.subject) && checkedQIds.includes(`${q.subject}-${q.문제번호}`));
        if (currentQuestions.length === 0) {
            alert('선택한 과목에 체크된 문제가 없습니다.');
            return;
        }
        currentQuestionIndex = 0;
    } else if (mode === 'resume-normal') {
        const last = lastNormalQuiz;
        currentQuestions = allQuestions.filter(q => q.subject === last.subject).sort((a, b) => a.문제번호 - b.문제번호);
        const lastQuestion = currentQuestions.find(q => q.문제번호 == last.questionNumber);
        if (lastQuestion) currentQuestionIndex = currentQuestions.indexOf(lastQuestion);
        else {
            alert('이전 문제가 존재하지 않습니다. 첫 문제부터 시작합니다.');
            currentQuestionIndex = 0;
        }
    } else if (mode === 'resume-checked') {
        const last = lastCheckedQuiz;
        const checkedQIds = Object.keys(checkedProblems);
        currentQuestions = allQuestions.filter(q => checkedQIds.includes(`${q.subject}-${q.문제번호}`));
        const lastQuestion = currentQuestions.find(q => q.문제번호 == last.questionNumber);
        if (lastQuestion) currentQuestionIndex = currentQuestions.indexOf(lastQuestion);
        else {
            alert('이전 체크 문제가 존재하지 않습니다. 체크 문제 목록의 첫 문제부터 시작합니다.');
            currentQuestionIndex = 0;
        }
    }
    
    subjectSelectionScreen.style.display = 'none';
    checkedSubjectScreen.style.display = 'none';
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
    questionNumberEl.textContent = `문제 ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    questionTextEl.innerHTML = question.question;
    answerArea.innerHTML = '';
    
    // 🛠️ 수정: 정답보기 버튼 활성화
    showAnswerBtn.disabled = false;
    
    notesInput.value = savedNotes[qId] || '';

    question.answers_shown_count = 0;

    checkProblemBox.checked = checkedProblems[qId] !== undefined;

    // 🛠️ 수정: 이전 문제 버튼 활성화/비활성화
    if (currentQuestionIndex === 0) {
        prevQuestionBtn.disabled = true;
    } else {
        prevQuestionBtn.disabled = false;
    }
    
    // 다음 문제 버튼 텍스트 변경
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextQuestionBtn.textContent = "퀴즈 종료";
    } else {
        nextQuestionBtn.textContent = "다음 문제";
    }

    const lastQuizData = { subject: question.subject, questionNumber: question.문제번호 };
    if (currentQuizMode === 'normal' || currentQuizMode === 'resume-normal') {
        localStorage.setItem('last-normal-quiz', JSON.stringify(lastQuizData));
    } else if (currentQuizMode === 'checked' || currentQuizMode === 'resume-checked') {
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
            // 🛠️ 수정: 정답을 모두 보여준 후 정답보기 버튼 비활성화
            showAnswerBtn.disabled = true;
        }
    }
}

// 이벤트 리스너
startNormalQuizBtn.addEventListener('click', () => {
    const selectedSubjects = Array.from(subjectListDiv.querySelectorAll('input:checked')).map(cb => cb.dataset.subject);
    if (selectedSubjects.length > 0) {
        startQuiz('normal', selectedSubjects);
    } else {
        alert('하나 이상의 과목을 선택해주세요.');
    }
});

startCheckedQuizBtn.addEventListener('click', () => loadCheckedSubjectSelection());

startCheckedQuizSelectBtn.addEventListener('click', () => {
    const selectedSubjects = Array.from(checkedSubjectListDiv.querySelectorAll('input:checked')).map(cb => cb.dataset.subject);
    if (selectedSubjects.length > 0) {
        startQuiz('checked', selectedSubjects);
    } else {
        alert('하나 이상의 과목을 선택해주세요.');
    }
});

resumeQuizBtn.addEventListener('click', () => startQuiz('resume-normal', null));

resumeCheckedQuizBtn.addEventListener('click', () => startQuiz('resume-checked', null));

goHomeBtn.addEventListener('click', () => {
    quizContainer.style.display = 'none';
    loadSubjectSelection();
});

backToMainBtn.addEventListener('click', () => loadSubjectSelection());

prevQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
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

copyProblemBtn.addEventListener('click', async () => {
    const question = currentQuestions[currentQuestionIndex];
    const problem_text = question.question.replace(/<span class="blank"><\/span>/g, '( )');
    let contentToCopy = `[${question.subject} - 문제 ${question.문제번호}]`;
    contentToCopy += `\n${problem_text}\n\n`;
    
    if (showAnswerBtn.disabled) {
        const answers = question.answers.map(ans => ans.part).join(', ');
        contentToCopy += `정답: ${answers}`;
    }

    try {
        await navigator.clipboard.writeText(contentToCopy);
        alert('본문이 클립보드에 복사되었습니다.');
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
});

exportNotesBtn.addEventListener('click', async () => {
    if (Object.keys(savedNotes).length === 0) {
        alert('저장된 주의사항이 없습니다.');
        return;
    }
    const notesString = JSON.stringify(savedNotes, null, 2);
    try {
        await navigator.clipboard.writeText(notesString);
        alert('주의사항이 클립보드에 복사되었습니다.');
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
});

clearNotesBtn.addEventListener('click', () => {
    if (Object.keys(savedNotes).length === 0) {
        alert('삭제할 주의사항이 없습니다.');
        return;
    }
    const confirmClear = confirm('주의사항을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmClear) {
        localStorage.removeItem('saved-notes');
        savedNotes = {};
        alert('주의사항이 모두 삭제되었습니다.');
    }
});

// 앱 시작
fetchQuestions();