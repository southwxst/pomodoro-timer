const startBtn = document.getElementById("startBtn");
const toggle = document.getElementById("themeToggle");
const stopBtn = document.getElementById("stopBtn");
const breakBtn = document.getElementById("breakBtn");
const breakTimeInput = document.getElementById("breakTimeInput");
const workTimeInput = document.getElementById("workTimeInput");
const totalTimeP = document.getElementById("totalTimeP");
const todayTotalTimeP = document.getElementById("todayTotalTimeP");
const currentStreak = document.getElementById("currentStreak");
const dailyAvg = document.getElementById("dailyAvg");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const longestStreak = document.getElementById("longestStreak");
const savedTheme = localStorage.getItem("theme");
const isDark = document.documentElement.classList.contains("dark");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}
let totalTimeToday = 0;
const alarm = document.getElementById("alarm");
let lastTotalTime = localStorage.getItem("totalTime") || 0;
let isTimerWorking = false;
let hasEverStarted = false;
let isInitialStart = true;
let inBreak = false;
let today = null;
let t = null; //これを外に出す！ これしないとstopBtnでtimer止められない
let setedNumber = 0;

// ===============================
//    LocalStorage から読み込み
// ===============================
function loadSettings() {
  const savedBreak = localStorage.getItem("breakTime");
  const savedWork = localStorage.getItem("workTime");

  if (savedBreak) breakTime = parseInt(savedBreak, 10);
  if (savedWork) workTime = parseInt(savedWork, 10);
}

let breakTime = 300; // default 5min
let workTime = 1500; // default 25min
loadSettings();
updateDisplayMode();
// ===============================
// 初期表示反映
// ===============================

document.getElementById("breakTime").textContent = `Break : ${formatTime(
  breakTime
)}`;
document.getElementById("workTime").textContent = `Work : ${formatTime(
  workTime
)}`;
document.getElementById("counter").textContent = formatTime(workTime);
breakTimeInput.value = breakTime / 60;
workTimeInput.value = workTime / 60;

totalTimeP.textContent = `Totale time : ${formatTime(
  localStorage.getItem("totalTime") || 0
)} `;
todayTotalTimeP.textContent = `${formatTime(
  localStorage.getItem(now()) || 0
)}/day`;
updateStats();
// ===============================
// 入力が変更されたら反映 + 保存
// ===============================
function updateTimes() {
  breakTime = Math.max(60, breakTimeInput.value * 60);
  workTime = Math.max(60, workTimeInput.value * 60);

  // 画面表示更新
  document.getElementById("breakTime").textContent = `Break : ${formatTime(
    breakTime
  )}`;
  document.getElementById("workTime").textContent = `Work : ${formatTime(
    workTime
  )}`;

  // counter も更新
  setedNumber = workTime;

  document.getElementById("counter").textContent = formatTime(setedNumber);

  // 保存
  localStorage.setItem("breakTime", breakTime);
  localStorage.setItem("workTime", workTime);
}

breakTimeInput.addEventListener("input", () => {
  if (breakTimeInput.value <= 0) breakTimeInput.value = 1;
  if (hasEverStarted) {
    breakTimeInput.value = breakTime / 60;
    return;
  }
  updateTimes();
});

workTimeInput.addEventListener("input", () => {
  if (workTimeInput.value <= 0) workTimeInput.value = 1;
  if (hasEverStarted) {
    workTimeInput.value = workTime / 60;
    return;
  }
  updateTimes();
});

// ===============================
// ボタン動作
// ===============================
startBtn.addEventListener("click", () => {
  // ボタンを押したらアラーム停止
  alarm.pause();
  alarm.currentTime = 0;

  // 次のフェーズを開始（ここで inBreak を false にして作業開始）
  updateDisplayMode();

  if (isTimerWorking) return;
  if (isInitialStart) {
    setedNumber = workTime;
    document.getElementById("counter").textContent = formatTime(setedNumber);
    isInitialStart = false;
  }
  Notification.requestPermission();
  if (setedNumber <= 0) {
    toBreak();
  }
  startTimer();
});

stopBtn.addEventListener("click", () => {
  clearInterval(t);
  isTimerWorking = false;
  if (setedNumber <= 0) {
    toBreak();
  }
});

breakBtn.addEventListener("click", () => {
  alarm.pause();
  alarm.currentTime = 0;

  clearInterval(t);
  isTimerWorking = false;

  if (inBreak) {
    // 休憩 → 作業
    inBreak = false;
    setedNumber = workTime;
    updateDisplayMode();
    document.getElementById("counter").textContent = formatTime(setedNumber);
    startTimer();
  } else {
    // 作業 → 休憩
    toBreak();
  }
});

// ===============================
// タイマー処理
// ===============================
function startTimer() {
  if (isTimerWorking) {
    alert("動いているので待ってください");
    return;
  }
  if (!hasEverStarted) {
    breakTimeInput.style.display = "none";
    workTimeInput.style.display = "none";
    importBtn.style.display = "none";
    exportBtn.style.display = "none";
  }
  updateStats();
  document.getElementById("counter").textContent = formatTime(setedNumber);
  hasEverStarted = true;
  isTimerWorking = true;
  t = setInterval(() => {
    setedNumber--;
    document.getElementById("counter").textContent = formatTime(setedNumber);
    document.title = formatTime(setedNumber);
    if (0 <= setedNumber && !inBreak) {
      localStorage.setItem("totalTime", ++lastTotalTime);
      totalTimeP.textContent = `Totale time : ${formatTime(
        localStorage.getItem("totalTime") || 0
      )} `;
      if (localStorage.getItem(now())) {
        totalTimeToday = localStorage.getItem(now());
        localStorage.setItem(now(), ++totalTimeToday);
        todayTotalTimeP.textContent = `${formatTime(
          localStorage.getItem(now()) || 0
        )}/day`;
      } else {
        totalTimeToday = 0;
        localStorage.setItem(now(), ++totalTimeToday);
        todayTotalTimeP.textContent = `${formatTime(
          localStorage.getItem(now()) || 0
        )}/day`;
      }
    }
    if (setedNumber <= 0) {
      clearInterval(t);
      isTimerWorking = false;

      // ===== 終了した瞬間にアラーム再生 & 通知 =====
      alarm.loop = true;
      alarm.currentTime = 0;
      alarm.play();

      if (inBreak) {
        // 休憩が終わった → 次は作業
        sendNotification("休憩が終わりました！作業を再開しましょう。");
      } else {
        // 作業が終わった → 次は休憩
        sendNotification("作業が終わりました！休憩しましょう。");
      }
    }
  }, 1000);
}

// ===============================
// 時間フォーマット
// ===============================

function formatTime(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;

  let result = "";
  if (h > 0) result += `${h}h`;
  if (m > 0) result += `${m}m`;
  if (s > 0 && h === 0) result += `${s}s`;
  // 秒は「時間が0のときだけ」つけるように調整（不要なら消してOK）

  return result || "0s";
}

function updateDisplayMode() {
  if (inBreak) {
    // 休憩中
    breakBtn.textContent = "Skip break";
    document.getElementById("breakTime").style.display = "none";
    document.getElementById("workTime").style.display = "block";
  } else {
    // 作業中
    breakBtn.textContent = "Break";
    document.getElementById("breakTime").style.display = "block";
    document.getElementById("workTime").style.display = "none";
  }
}
function requestNotificationPermission() {
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}
function sendNotification(message) {
  if (Notification.permission === "granted") {
    new Notification(message);
  }
}
function toBreak() {
  inBreak = true;
  setedNumber = breakTime;
  alarm.pause();
  alarm.currentTime = 0;
  updateDisplayMode();
  startTimer();
}
function now() {
  return new Date().toLocaleDateString("ja-JP");
}
// ===============================
//    Streak & Daily Average 計算
// ===============================

// localStorage に保存されている "YYYY/MM/DD" キーをすべて取得
function getAllWorkDays() {
  const days = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(key)) {
      days.push(key);
    }
  }

  return days.sort(); // 日付順 sort
}

// 連続作業日数を計算
function calcStreak(days) {
  if (days.length === 0) return 0;

  let streak = 1;
  const todayStr = now();

  // 直近の日付から遡って確認
  for (let i = days.length - 1; i > 0; i--) {
    const prev = new Date(days[i - 1]); //日付	中身（例）2025/11/18 = 	1768723200000 2025/11/19	= 1768809600000
    const curr = new Date(days[i]);

    const diff = (curr - prev) / 86400000; // 日数差
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  // 今日が作業ゼロなら streak は0にする
  if (!localStorage.getItem(todayStr)) streak = 0;

  return streak;
}
exportBtn.addEventListener("click", () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // i 番目のやつを返す 1だったらlcoalstorage 1番目のやつを出す
    // この場合localStorage.key(0)したら 'video.mp4'が出てくる
    data[key] = localStorage.getItem(key);
  }
  //  const key = "video1";
  // data[key] = "value";
  // console.logしてみるとこうなる{ video1: "value" }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  //JSON.stringifyはdateをjsonん変化するためのやつ
  //blobは一時的にファイルを作るやつ null2は配列の仕方
  //"application/json",これはオプションで ファイルのMIMEタイプ（種類） を指定します。ブラウザやOSに「これはJSONファイルだよ」と教えるためです。
  const url = URL.createObjectURL(blob); //javascriptじょうでurlを使えるようやつ
  const a = document.createElement("a");
  a.href = url; //htmlのurlを設定する
  a.download = `pomodoro_web${now()}`; //普通にhtmlのdownlod属性
  a.click();

  URL.revokeObjectURL(url); //url消すやつ
});
importBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // 🔹 JSON.parse(text)

      // JSON.parse() は、JSON形式の文字列をオブジェクトに変換する関数です。

      // たとえば：

      // const text = '{"name": "Alice", "age": 25}';
      // const data = JSON.parse(text);
      // console.log(data.name); // "Alice"

      // JSON（ジェイソン）は、ただの「文字列」。
      // JSON.parse() で「文字列 → 実際に使えるオブジェクト」に直します。
      if (confirm("Import settings? This will overwrite existing data.")) {
        for (const [key, value] of Object.entries(data)) {
          // object entires 解説
          //const data = {
          //  name: "Alice",
          // age: 25
          //};
          // 出力
          //[
          //  ["name", "Alice"],
          //  ["age", 25]
          //]

          console.log(Object.entries(data));

          //keyは名前 valueは数字
          localStorage.setItem(key, value);
        }
        location.reload();
      }
    } catch (e) {
      alert("Invalid JSON file.");
    }
  });
  input.click();
});
// 過去の最大ストリークを保存・更新
function updateLongestStreak(current) {
  const saved = Number(localStorage.getItem("longestStreak") || 0);

  if (current > saved) {
    localStorage.setItem("longestStreak", current);
    return current;
  }
  return saved;
}

// 平均計算
function calcDailyAverage(days) {
  if (days.length === 0) return 0;

  let total = 0;

  for (const d of days) {
    total += Number(localStorage.getItem(d) || 0);
  }

  return Math.floor(total / days.length);
}

// メイン更新関数（初期表示用）
function updateStats() {
  const days = getAllWorkDays();

  const current = calcStreak(days);
  const longest = updateLongestStreak(current);
  const avg = calcDailyAverage(days);

  currentStreak.textContent = `Current Streak : ${current} days`;
  longestStreak.textContent = `Longest Streak :${longest} days`;
  dailyAvg.textContent = `Daily Average : ${formatTime(avg)}`;
}

const WEEKS = 53;
const DAYS = 7;

// "YYYY/MM/DD" localStorage → 秒数合計
function getDailySecondsForGraph() {
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(key)) {
      result[key] = Number(localStorage.getItem(key) || 0);
    }
  }
  return result;
}

// 秒数 → 強度レベル（0〜4）
function secondsToLevel(seconds) {
  if (!seconds) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  return 4;
}

// グラフ生成
function generateContributionGraph() {
  const container = document.getElementById("contributionGraph");
  if (!container) return;

  container.innerHTML = "";
  const daily = getDailySecondsForGraph();
  const today = new Date();

  for (let w = 0; w < WEEKS; w++) {
    const col = document.createElement("div");
    col.className = "cg-column";

    for (let d = 0; d < DAYS; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - ((WEEKS - 1 - w) * 7 + (DAYS - 1 - d)));
      //date.setDate(
      // today.getDate() - ((WEEKS - 1 - w) * 7 + d)
      //);

      //setDate
      //      const d = new Date(); // ← 例：2025/11/21
      //d.setDate(5);
      //console.log(d);       // → 2025/11/05 になる

      const key = date.toLocaleDateString("ja-JP");

      const sec = daily[key] || 0;
      const level = secondsToLevel(sec);

      const cell = document.createElement("div");
      cell.className = `cg-cell level-${level}`;
      cell.title = `${key}\n${Math.floor(sec / 60)} 分`;

      col.appendChild(cell);
    }
    container.appendChild(col);
  }
}

window.updateContributionGraph = function () {
  generateContributionGraph();
};

window.addEventListener("DOMContentLoaded", () => {
  generateContributionGraph();
});

toggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  if (localStorage.getItem("theme") === "dark") {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});
