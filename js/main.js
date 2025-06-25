let currentQuestionIndex = 0;
let questionsData = [];
let userScores = []; // 문제별 점수 저장

$(document).ready(function () {
  // 페이지 로드 시 이전 기록(점수, 횟수) 화면에 갱신
  updateStats();

  // 시작 버튼 클릭 시 퀴즈 화면으로 전환하고 문제 불러오기 시작
  $("#startBtn").on("click", function () {
    $("#startContBox").hide();
    $("#quizContainer").show();
    loadQuestions();
  });

  // 기존 채점하기 버튼 기능 유지 (점수 계산 및 저장)
  $("#submitBtn").on("click", function () {
    // 사용자가 선택한 답 확인
    const selectedVal = $('input[name="quiz"]:checked').val();
    if (!selectedVal) {
      alert("정답을 선택해주세요!");
      return;
    }
    const selected = parseInt(selectedVal);
    const correct = questionsData[currentQuestionIndex].answer; // 정답 번호
    const score = selected === correct ? 5 : 0; // 정답5점, 오답0점

    userScores[currentQuestionIndex] = score; // 현재 문제 점수 저장

    // 점수 결과 보여주기
    const totalScore = calculateTotalScore();
    // 문제 화면 숨기고 결과 박스 보이기 전에 점수 텍스트 업데이트
    $("#quizContainer").hide();
    $("#scoreText span").text(totalScore);

    // ■■■ 로컬스토리지 저장 ■■■
    // 기존 점수 리스트 불러오기 (없으면 빈 배열)
    let scores = JSON.parse(localStorage.getItem("scoreList")) || [];
    // 현재 시험 점수 추가
    scores.push(totalScore);
    localStorage.setItem("scoreList", JSON.stringify(scores));

    // 시도 횟수 증가해서 저장 (없으면 0에서 시작)
    let count = parseInt(localStorage.getItem("testCount") || "0");
    localStorage.setItem("testCount", count + 1);

    // 통계 정보 갱신 및 결과 박스 표시
    $("#resultBox").show();
    updateStats();
  });

  // 새로 추가된 다음 문제 버튼 클릭 → 문제 인덱스 증가 후 렌더링
  $("#nextBtn").on("click", function () {
    if (currentQuestionIndex + 1 >= questionsData.length) {
      // 마지막 문제임
      alert("마지막 문제입니다. 채점하기 버튼을 눌러 점수를 확인하세요.");
      return;
    }

    // 다음 문제 인덱스 증가 후 렌더링
    currentQuestionIndex++;
    renderQuestion(questionsData[currentQuestionIndex]);
    $('input[name="quiz"]').prop("checked", false);
  });

  // 다시 시작 버튼 클릭 이벤트
  $("#restartBtn").on("click", function () {
    // 퀴즈 화면 숨기고 시작 화면 보여주기
    $("#quizContainer").hide();
    $("#startContBox").show();
    $('input[name="quiz"]').prop("checked", false);
    $("#resultBox").hide();
    // 문제 인덱스 초기화 및 점수 기록 리셋
    currentQuestionIndex = 0;
    userScores = [];
    // 화면 통계 갱신
    updateStats();
  });
});

// 문제 데이터를 JSON에서 불러와 questionsData에 저장하고 첫 문제를 렌더링하는 함수
// JSON 파일은 data/questions.json 경로에 있어야 함
function loadQuestions() {
  fetch("data/questions.json")
    .then((response) => response.json())
    .then((data) => {
      // 데이터 섞기 함수(셔플)
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // JSON에서 문제 배열 데이터 섞기
      questionsData = shuffle(data);

      currentQuestionIndex = 0;
      userScores = [];

      renderQuestion(questionsData[currentQuestionIndex]);
      $("#resultBox").hide();
    })
    .catch((err) => console.error("문제 불러오기 실패:", err));
}

// 화면에 문제와 선지를 렌더링하는 함수
function renderQuestion(q) {
  // 문제 번호 갱신 (현재 문제 인덱스 + 1)
  $(".question span").text(currentQuestionIndex + 1 + ". ");

  // 기존 텍스트 노드 제거 (문제 번호 제외)
  $(".question")
    .contents()
    .filter(function () {
      return this.nodeType === 3; // 텍스트 노드만 선택
    })
    .remove();

  // 문제 텍스트 추가
  $(".question").append(q.question);

  // 선지 리스트 초기화 및 생성
  const $choices = $(".choices");
  $choices.empty();

  q.choices.forEach((choice, idx) => {
    const num = idx + 1;
    const choiceHtml = `
        <li>
          <input type="radio" name="quiz" value="${num}" id="q${num}">
          <label for="q${num}">${choice}</label>
        </li>
      `;
    $choices.append(choiceHtml);
  });
}

// 문제별 점수 배열을 합산해 총점을 반환하는 함수
function calculateTotalScore() {
  return userScores.reduce((acc, cur) => acc + (cur || 0), 0);
}

// 로컬스토리지에 저장된 점수 기록과 시도 횟수를 가져와 화면에 평균 점수와 횟수를 표시하는 함수
// 평균 점수는 소수점 둘째 자리까지 표시
// 통계 업데이트 (필요시 채점 후 호출)
function updateStats() {
  let scores = JSON.parse(localStorage.getItem("scoreList")) || [];
  let count = parseInt(localStorage.getItem("testCount") || "0");
  let avg =
    scores.length > 0
      ? parseFloat(
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        )
      : 0;

  $("#testCount").text(count);

  $("#avgScore").text(avg);
}
