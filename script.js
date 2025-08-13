
// HTML 요소 가져오기
const mainTitle = document.getElementById('main-title');
const backButton = document.getElementById('back-button');
const mainCategoryList = document.getElementById('main-category-list');
const subSituationList = document.getElementById('sub-situation-list');
const dialogueList = document.getElementById('dialogue-list');
const subSituationTitle = document.getElementById('sub-situation-title');
const dialogueTitle = document.getElementById('dialogue-title');

// 현재 상태를 저장할 변수
let currentData = null;
let currentMainCategory = null;

// JSON 파일 불러오기
fetch('phrases.json')
    .then(response => response.json())
    .then(data => {
        currentData = data.data; // 데이터 저장
        displayMainCategories(); // 데이터 로드 완료 후 함수 호출
    })
    .catch(error => console.error('Error fetching data:', error));

// 뒤로가기 버튼 클릭 이벤트 (하나의 버튼으로 모든 뒤로가기 처리)
backButton.addEventListener('click', () => {
    if (dialogueList.style.display === 'flex') {
        // 대화 목록 -> 서브 상황 목록
        displaySubSituations(currentMainCategory.main_category_title, currentMainCategory.sub_situations);
    } else if (subSituationList.style.display === 'flex') {
        // 서브 상황 목록 -> 메인 카테고리 목록
        displayMainCategories();
    }
});

// 메인 카테고리 목록을 보여주는 함수
function displayMainCategories() {
    mainTitle.style.display = 'block';
    backButton.style.display = 'none';
    mainCategoryList.style.display = 'flex';
    subSituationList.style.display = 'none';
    dialogueList.style.display = 'none';

    mainCategoryList.innerHTML = '';
    currentData.forEach(category => {
        const button = document.createElement('button');
        button.className = 'main-category-button';
        button.textContent = category.main_category_title;
        button.addEventListener('click', () => {
            currentMainCategory = category;
            displaySubSituations(category.main_category_title, category.sub_situations);
        });
        mainCategoryList.appendChild(button);
    });
}

// 서브 상황 목록을 보여주는 함수
function displaySubSituations(mainCategoryTitle, subSituations) {
    mainTitle.style.display = 'none';
    backButton.style.display = 'block';
    mainCategoryList.style.display = 'none';
    subSituationList.style.display = 'flex';
    dialogueList.style.display = 'none';

    // 메인 카테고리 제목을 상단에 표시
    subSituationTitle.textContent = mainCategoryTitle;

    // 첫 번째 자식(제목)을 제외한 모든 자식 노드(기존 버튼)를 제거합니다.
    let child = subSituationTitle.nextElementSibling;
    while (child) {
        subSituationList.removeChild(child);
        child = subSituationTitle.nextElementSibling;
    }

    subSituations.forEach(situation => {
        const button = document.createElement('button');
        button.className = 'sub-situation-button';
        button.textContent = situation.title;
        button.addEventListener('click', () => {
            displayDialogue(mainCategoryTitle, situation.title, situation.dialogues);
        });
        subSituationList.appendChild(button);
    });
}

// 대화 문장을 보여주는 함수
function displayDialogue(mainTitleText, subTitle, dialogues) {
    mainTitle.style.display = 'none';
    backButton.style.display = 'block';
    mainCategoryList.style.display = 'none';
    subSituationList.style.display = 'none';
    dialogueList.style.display = 'flex';

    dialogueTitle.textContent = `${mainTitleText} - ${subTitle}`;
    
    // 기존 대화 내용을 모두 제거하고 제목만 남깁니다.
    let child = dialogueTitle.nextElementSibling;
    while (child) {
        dialogueList.removeChild(child);
        child = dialogueTitle.nextElementSibling;
    }

    dialogues.forEach(line => {
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'dialogue-box';

        const japaneseHtmlContent = line.japanese_html || line.japanese;
        
        dialogueBox.dataset.originalKorean = line.korean;
        dialogueBox.dataset.originalJapaneseHtml = japaneseHtmlContent;
        dialogueBox.dataset.originalPronunciation = line.pronunciation;

        const koreanContent = document.createElement('div');
        koreanContent.className = 'korean-content';
        koreanContent.innerHTML = `
            <p class="speaker">${line.speaker}</p>
            <hr>
            <p class="korean">${line.korean}</p>
        `;
        
        const japaneseContent = document.createElement('div');
        japaneseContent.className = 'japanese-content';

        const japaneseTextContainer = document.createElement('div');
        japaneseTextContainer.className = 'japanese-text';

        const japaneseEl = document.createElement('p');
        japaneseEl.className = 'japanese';
        japaneseEl.innerHTML = japaneseHtmlContent;

        const pronunciationEl = document.createElement('p');
        pronunciationEl.className = 'pronunciation';
        pronunciationEl.textContent = line.pronunciation;

        japaneseTextContainer.appendChild(japaneseEl);
        japaneseTextContainer.appendChild(pronunciationEl);

        japaneseContent.appendChild(japaneseTextContainer);
        
        dialogueBox.appendChild(koreanContent);
        dialogueBox.appendChild(japaneseContent);

        // 한글 영역 클릭 이벤트: 일본어 문장 전체를 토글
        koreanContent.addEventListener('click', (e) => {
            const isJapaneseVisible = japaneseContent.style.display === 'block';

            if (isJapaneseVisible) {
                // 이미 일본어 문장이 보이면 숨김 (발음도 함께 숨김)
                japaneseContent.style.display = 'none';
                pronunciationEl.style.display = 'none';
            } else {
                // 일본어 문장이 숨겨져 있으면 보이게 하고, 발음은 숨김
                japaneseContent.style.display = 'block';
                pronunciationEl.style.display = 'none';
            }
        });

        // 일본어 문장 클릭 이벤트: 발음만 토글
        japaneseTextContainer.addEventListener('click', (e) => {
            e.stopPropagation(); // 한글 영역 클릭 이벤트 전파 방지
            const currentDisplay = pronunciationEl.style.display;
            pronunciationEl.style.display = (currentDisplay === 'none' || currentDisplay === '') ? 'block' : 'none';
        });

        // 대체 단어 기능 추가
        if (line.replacements && line.replacements.length > 0) {
            const replacementsContainer = document.createElement('div');
            replacementsContainer.className = 'replacements-container';
            
            const firstReplacement = line.replacements[0];
            
            firstReplacement.alternatives.forEach((alt, altIndex) => {
                const button = document.createElement('button');
                button.className = 'replacement-button';
                button.textContent = alt;
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // 대화 박스의 클릭 이벤트 전파 방지
                    
                    const koreanEl = dialogueBox.querySelector('.korean');
                    const japaneseElInBox = japaneseTextContainer.querySelector('.japanese');
                    const pronunciationElInBox = japaneseTextContainer.querySelector('.pronunciation');

                    const currentButtons = replacementsContainer.querySelectorAll('.replacement-button');

                    // 이미 선택된 버튼을 다시 클릭하면 원문으로 돌아가도록 처리
                    if (button.classList.contains('selected')) {
                        koreanEl.textContent = dialogueBox.dataset.originalKorean;
                        japaneseElInBox.innerHTML = dialogueBox.dataset.originalJapaneseHtml;
                        pronunciationElInBox.textContent = dialogueBox.dataset.originalPronunciation;
                        currentButtons.forEach(btn => btn.classList.remove('selected'));
                    } else {
                        // 수정된 교체 로직: 원본 japanese_html에서 대상을 정확히 찾아 교체
                        const japaneseTargetPattern = new RegExp(`<ruby>${firstReplacement.japanese_target}<rt>.*?</rt></ruby>`, 'g');
                        const newJapaneseHtml = dialogueBox.dataset.originalJapaneseHtml.replace(
                            japaneseTargetPattern,
                            firstReplacement.japanese_alternatives_html[altIndex]
                        );

                        // 한글 교체 로직
                        const newKorean = dialogueBox.dataset.originalKorean.replace(firstReplacement.target, alt);
                        
                        // 발음 교체 로직
                        const newPronunciation = dialogueBox.dataset.originalPronunciation.replace(firstReplacement.pronunciation_target, firstReplacement.pronunciation_alternatives[altIndex]);
                        
                        koreanEl.textContent = newKorean;
                        japaneseElInBox.innerHTML = newJapaneseHtml;
                        pronunciationElInBox.textContent = newPronunciation;
                        
                        currentButtons.forEach(btn => btn.classList.remove('selected'));
                        button.classList.add('selected');
                    }
                });
                replacementsContainer.appendChild(button);
            });
            japaneseContent.appendChild(replacementsContainer);
        }
        
        dialogueList.appendChild(dialogueBox);
    });
}

// 초기 화면 표시
displayMainCategories();