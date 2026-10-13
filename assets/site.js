const progress = document.querySelector("#readingProgress");

function updateProgress() {
  if (!progress) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

const speechButtons = [...document.querySelectorAll("[data-speech-text]")];
const voiceSelects = [...document.querySelectorAll("[data-speech-voice]")];
const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
let arabicVoices = [];
let activeSpeechToken = 0;
let activeSpeechButton = null;

function getVoiceKey(voice) {
  return `${voice.voiceURI}|${voice.name}|${voice.lang}`;
}

function readSavedVoice() {
  try {
    return window.localStorage.getItem("arabic-speech-voice") ?? "";
  } catch {
    return "";
  }
}

function saveVoice(value) {
  try {
    window.localStorage.setItem("arabic-speech-voice", value);
  } catch {
    // Voice persistence is optional when storage is unavailable.
  }
}

function rankArabicVoice(voice) {
  const lang = voice.lang.toLowerCase();
  if (lang === "ar-sa") return 0;
  if (lang === "ar-001") return 1;
  if (lang === "ar") return 2;
  if (voice.localService) return 3;
  return 4;
}

function feedbackFor(button) {
  return (
    button
      ?.closest("[data-practice-question]")
      ?.querySelector("[data-practice-speech-feedback]") ??
    button?.closest("[data-speech-panel]")?.querySelector("[data-speech-feedback]") ??
    document.querySelector("[data-speech-feedback]")
  );
}

function setFeedback(button, message, state = "ready") {
  const feedback = feedbackFor(button);
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function selectedVoice() {
  const selectedKey = voiceSelects[0]?.value;
  return arabicVoices.find((voice) => getVoiceKey(voice) === selectedKey) ?? null;
}

function syncVoiceSelection(value) {
  for (const select of voiceSelects) {
    if ([...select.options].some((option) => option.value === value)) {
      select.value = value;
    }
  }
  saveVoice(value);

  const voice = selectedVoice();
  const message = voice
    ? `当前音色：${voice.name}（${voice.lang}）`
    : "设备未提供专用阿拉伯语音色，将按 ar-SA 请求浏览器默认语音。";
  for (const feedback of document.querySelectorAll("[data-speech-feedback]")) {
    feedback.textContent = message;
    feedback.dataset.state = "ready";
  }
}

function populateArabicVoices() {
  if (!synth || voiceSelects.length === 0) return;

  arabicVoices = synth
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("ar"))
    .sort(
      (left, right) =>
        rankArabicVoice(left) - rankArabicVoice(right) ||
        left.name.localeCompare(right.name),
    );

  const savedVoice = readSavedVoice();
  const defaultVoice =
    arabicVoices.find((voice) => getVoiceKey(voice) === savedVoice) ??
    arabicVoices[0] ??
    null;

  for (const select of voiceSelects) {
    select.replaceChildren();

    if (arabicVoices.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "浏览器默认（ar-SA）";
      select.append(option);
      continue;
    }

    for (const voice of arabicVoices) {
      const option = document.createElement("option");
      option.value = getVoiceKey(voice);
      option.textContent = `${voice.name} · ${voice.lang}${
        voice.localService ? " · 本机" : ""
      }`;
      select.append(option);
    }
  }

  syncVoiceSelection(defaultVoice ? getVoiceKey(defaultVoice) : "");
}

function finishSpeech(button, message, state = "ready") {
  if (activeSpeechButton === button) {
    button.classList.remove("is-speaking");
    button.removeAttribute("aria-pressed");
    activeSpeechButton = null;
  }
  setFeedback(button, message, state);
}

function speakFromButton(button) {
  if (!synth || !("SpeechSynthesisUtterance" in window)) {
    setFeedback(button, "当前浏览器不支持语音合成，请改用最新版 Chrome、Edge、Firefox 或 Safari。", "error");
    return;
  }

  const text = button.dataset.speechText?.trim();
  if (!text) return;

  activeSpeechToken += 1;
  const token = activeSpeechToken;
  const repeat = Math.max(1, Number.parseInt(button.dataset.speechRepeat ?? "1", 10));
  const rate = Math.min(
    1,
    Math.max(0.45, Number.parseFloat(button.dataset.speechRate ?? "0.72")),
  );
  const voice = selectedVoice();

  synth.cancel();
  if (activeSpeechButton && activeSpeechButton !== button) {
    activeSpeechButton.classList.remove("is-speaking");
    activeSpeechButton.removeAttribute("aria-pressed");
  }

  activeSpeechButton = button;
  button.classList.add("is-speaking");
  button.setAttribute("aria-pressed", "true");
  setFeedback(
    button,
    repeat > 1 ? `准备重复 ${repeat} 次…` : "准备播放…",
  );

  let completed = 0;

  function speakNext() {
    if (token !== activeSpeechToken) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || "ar-SA";
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.addEventListener("start", () => {
      if (token !== activeSpeechToken) return;
      setFeedback(
        button,
        `${voice?.name ?? "浏览器默认阿拉伯语音色"} · ${
          completed + 1
        }/${repeat}`,
      );
    });

    utterance.addEventListener("end", () => {
      if (token !== activeSpeechToken) return;
      completed += 1;
      if (completed < repeat) {
        window.setTimeout(speakNext, 260);
      } else {
        finishSpeech(
          button,
          `播放完成 · ${voice?.name ?? "浏览器默认阿拉伯语音色"}`,
        );
      }
    });

    utterance.addEventListener("error", (event) => {
      if (token !== activeSpeechToken) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      finishSpeech(
        button,
        `播放失败：${event.error || "当前语音服务不可用"}`,
        "error",
      );
    });

    synth.speak(utterance);
  }

  window.setTimeout(speakNext, 40);
}

if (speechButtons.length > 0) {
  if (!synth || !("SpeechSynthesisUtterance" in window)) {
    for (const button of speechButtons) {
      button.disabled = true;
    }
    for (const select of voiceSelects) {
      select.disabled = true;
    }
    setFeedback(
      null,
      "当前浏览器不支持 Web Speech 语音合成。",
      "error",
    );
  } else {
    populateArabicVoices();
    synth.addEventListener("voiceschanged", populateArabicVoices);

    for (const select of voiceSelects) {
      select.addEventListener("change", () => {
        activeSpeechToken += 1;
        synth.cancel();
        syncVoiceSelection(select.value);
      });
    }

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-speech-text]");
      if (!button) return;
      speakFromButton(button);
    });

    window.addEventListener("pagehide", () => {
      activeSpeechToken += 1;
      synth.cancel();
    });
  }
}

const practiceRoot = document.querySelector("[data-arabic-practice]");

if (practiceRoot) {
  const STORAGE_KEY = "arabic-practice-v1";
  const DAILY_SECONDS = 5 * 60;
  const formLabels = {
    isolated: "独立形",
    initial: "词首形",
    medial: "词中形",
    final: "词尾形",
  };
  const formKeys = Object.keys(formLabels);
  const modeLabels = {
    daily: "每日混合训练",
    form: "字形辨认",
    listen: "听音辨字",
    phonetic: "音标辨听",
    mistakes: "错题复习",
  };
  const speechSupported =
    Boolean(synth) && "SpeechSynthesisUtterance" in window;
  const dataElement = practiceRoot.querySelector("[data-arabic-practice-data]");

  let practiceData = { letters: [], phonetics: [] };
  try {
    practiceData = JSON.parse(dataElement?.textContent ?? "{}");
  } catch {
    // The static page can still render even if its embedded data is malformed.
  }

  const ui = {
    storage: practiceRoot.querySelector("[data-practice-storage]"),
    today: practiceRoot.querySelector("[data-practice-today]"),
    streak: practiceRoot.querySelector("[data-practice-streak]"),
    accuracy: practiceRoot.querySelector("[data-practice-accuracy]"),
    mistakes: practiceRoot.querySelector("[data-practice-mistakes]"),
    mistakeBadge: practiceRoot.querySelector("[data-practice-mistake-badge]"),
    dailyBar: practiceRoot.querySelector("[data-practice-daily-bar]"),
    modeLabel: practiceRoot.querySelector("[data-practice-mode-label]"),
    questionCount: practiceRoot.querySelector(
      "[data-practice-question-count]",
    ),
    prompt: practiceRoot.querySelector("[data-practice-prompt]"),
    stimulus: practiceRoot.querySelector("[data-practice-stimulus]"),
    audio: practiceRoot.querySelector("[data-practice-audio]"),
    audioStatus: practiceRoot.querySelector(
      "[data-practice-speech-feedback]",
    ),
    options: practiceRoot.querySelector("[data-practice-options]"),
    start: practiceRoot.querySelector("[data-practice-start]"),
    next: practiceRoot.querySelector("[data-practice-next]"),
    feedback: practiceRoot.querySelector("[data-practice-feedback]"),
    reset: practiceRoot.querySelector("[data-practice-reset]"),
  };
  const modeButtons = [
    ...practiceRoot.querySelectorAll("[data-practice-mode]"),
  ];

  function emptyPracticeState() {
    return {
      version: 1,
      total: { answered: 0, correct: 0 },
      modes: {
        form: { answered: 0, correct: 0 },
        listen: { answered: 0, correct: 0 },
        phonetic: { answered: 0, correct: 0 },
      },
      mistakes: {},
      days: {},
    };
  }

  function nonNegativeNumber(value) {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  function normalizeCounter(value) {
    return {
      answered: nonNegativeNumber(value?.answered),
      correct: nonNegativeNumber(value?.correct),
    };
  }

  let storageAvailable = true;
  try {
    const probeKey = `${STORAGE_KEY}-probe`;
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
  } catch {
    storageAvailable = false;
  }

  function loadPracticeState() {
    const fallback = emptyPracticeState();
    if (!storageAvailable) return fallback;

    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "null",
      );
      if (!parsed || parsed.version !== 1) return fallback;

      return {
        version: 1,
        total: normalizeCounter(parsed.total),
        modes: {
          form: normalizeCounter(parsed.modes?.form),
          listen: normalizeCounter(parsed.modes?.listen),
          phonetic: normalizeCounter(parsed.modes?.phonetic),
        },
        mistakes:
          parsed.mistakes && typeof parsed.mistakes === "object"
            ? parsed.mistakes
            : {},
        days:
          parsed.days && typeof parsed.days === "object" ? parsed.days : {},
      };
    } catch {
      return fallback;
    }
  }

  let practiceState = loadPracticeState();

  function savePracticeState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(practiceState),
      );
    } catch {
      storageAvailable = false;
      ui.storage.textContent = "session only";
    }
  }

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dayRecord(key = dateKey()) {
    const current = practiceState.days[key];
    if (current && typeof current === "object") {
      current.answered = nonNegativeNumber(current.answered);
      current.correct = nonNegativeNumber(current.correct);
      current.seconds = Math.min(
        DAILY_SECONDS,
        nonNegativeNumber(current.seconds),
      );
      return current;
    }

    const next = { answered: 0, correct: 0, seconds: 0 };
    practiceState.days[key] = next;
    return next;
  }

  function formatClock(seconds) {
    const safeSeconds = Math.max(0, Math.min(DAILY_SECONDS, Math.floor(seconds)));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function calculateStreak() {
    const cursor = new Date();
    const today = practiceState.days[dateKey(cursor)];
    if (!today || nonNegativeNumber(today.answered) === 0) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (streak < 365) {
      const record = practiceState.days[dateKey(cursor)];
      if (!record || nonNegativeNumber(record.answered) === 0) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  let activeMode = "daily";
  let currentQuestion = null;
  let questionAnswered = false;
  let lastQuestionId = "";
  let sessionQuestionCount = 0;
  let timerId = null;
  let timerStartedAt = 0;
  let timerBaseSeconds = 0;
  let lastSavedTimerSecond = 0;

  function currentDailySeconds() {
    if (!timerId) {
      return nonNegativeNumber(practiceState.days[dateKey()]?.seconds);
    }
    return Math.min(
      DAILY_SECONDS,
      timerBaseSeconds + (Date.now() - timerStartedAt) / 1000,
    );
  }

  function renderStats() {
    const seconds = currentDailySeconds();
    const total = practiceState.total;
    const accuracy =
      total.answered > 0
        ? `${Math.round((total.correct / total.answered) * 100)}%`
        : "—";
    const mistakeCount = Object.keys(practiceState.mistakes).length;

    ui.today.textContent = `${formatClock(seconds)} / 5:00`;
    ui.streak.textContent = `${calculateStreak()} 天`;
    ui.accuracy.textContent = accuracy;
    ui.mistakes.textContent = `${mistakeCount} 题`;
    ui.mistakeBadge.textContent = String(mistakeCount);
    ui.dailyBar.style.width = `${Math.min(100, (seconds / DAILY_SECONDS) * 100)}%`;
    ui.reset.disabled =
      total.answered === 0 && seconds === 0 && mistakeCount === 0;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const formDescriptors = practiceData.letters
    .filter((letter) => letter.joining === "dual")
    .flatMap((letter) =>
      formKeys.map((form) => ({
        id: `form:${letter.order}:${form}`,
        mode: "form",
        target: letter.order,
        form,
      })),
    );
  const listenDescriptors = practiceData.letters.map((letter) => ({
    id: `listen:${letter.order}`,
    mode: "listen",
    target: letter.order,
  }));
  const phoneticDescriptors = practiceData.phonetics.map((phonetic) => ({
    id: `phonetic:${phonetic.order}`,
    mode: "phonetic",
    target: phonetic.order,
  }));
  const banks = {
    form: formDescriptors,
    listen: listenDescriptors,
    phonetic: phoneticDescriptors,
  };
  const descriptorIndex = new Map(
    [...formDescriptors, ...listenDescriptors, ...phoneticDescriptors].map(
      (descriptor) => [descriptor.id, descriptor],
    ),
  );

  function choicesAround(items, target, count = 4) {
    return shuffle([
      target,
      ...shuffle(items.filter((item) => item !== target)).slice(0, count - 1),
    ]);
  }

  function buildQuestion(descriptor) {
    if (descriptor.mode === "form") {
      const letter = practiceData.letters.find(
        (item) => item.order === descriptor.target,
      );
      if (!letter) return null;

      return {
        id: descriptor.id,
        mode: "form",
        prompt: `请选择 ${letter.glyph} 的${formLabels[descriptor.form]}`,
        stimulus: letter.glyph,
        answer: descriptor.form,
        options: shuffle(
          formKeys.map((form) => ({
            id: form,
            glyph: letter.forms[form],
          })),
        ),
        success: `${letter.glyph} · ${formLabels[descriptor.form]}`,
      };
    }

    if (descriptor.mode === "listen") {
      const letter = practiceData.letters.find(
        (item) => item.order === descriptor.target,
      );
      if (!letter) return null;
      const options = choicesAround(
        practiceData.letters.map((item) => item.order),
        letter.order,
      ).map((order) => {
        const option = practiceData.letters.find(
          (item) => item.order === order,
        );
        return { id: String(order), glyph: option.glyph };
      });

      return {
        id: descriptor.id,
        mode: "listen",
        prompt: "听音后选择对应字母",
        stimulus: "",
        audio: letter.speechName,
        answer: String(letter.order),
        options,
        success: `${letter.glyph} · ${letter.nameZh}`,
      };
    }

    const phonetic = practiceData.phonetics.find(
      (item) => item.order === descriptor.target,
    );
    if (!phonetic) return null;
    const options = choicesAround(
      practiceData.phonetics.map((item) => item.order),
      phonetic.order,
    ).map((order) => {
      const option = practiceData.phonetics.find(
        (item) => item.order === order,
      );
      return { id: String(order), glyph: option.display };
    });

    return {
      id: descriptor.id,
      mode: "phonetic",
      prompt: "听音后选择对应音节",
      stimulus: "",
      audio: phonetic.audio,
      answer: String(phonetic.order),
      options,
      success: `${phonetic.display} · ${phonetic.nameZh}`,
    };
  }

  function availableMistakes() {
    return Object.keys(practiceState.mistakes)
      .map((id) => descriptorIndex.get(id))
      .filter(
        (descriptor) =>
          descriptor &&
          (speechSupported ||
            (descriptor.mode !== "listen" &&
              descriptor.mode !== "phonetic")),
      );
  }

  function selectDescriptor(mode) {
    let pool;
    if (mode === "daily") {
      const availableModes = speechSupported
        ? ["form", "listen", "phonetic"]
        : ["form"];
      pool = banks[randomItem(availableModes)];
    } else if (mode === "mistakes") {
      pool = availableMistakes();
    } else {
      pool = banks[mode] ?? [];
    }

    const withoutLast = pool.filter(
      (descriptor) => descriptor.id !== lastQuestionId,
    );
    return randomItem(withoutLast.length > 0 ? withoutLast : pool);
  }

  function setModeSelection() {
    for (const button of modeButtons) {
      button.setAttribute(
        "aria-selected",
        String(button.dataset.practiceMode === activeMode),
      );
    }
    ui.modeLabel.textContent = modeLabels[activeMode];
  }

  function clearQuestionSurface() {
    currentQuestion = null;
    questionAnswered = false;
    ui.options.replaceChildren();
    ui.stimulus.hidden = false;
    ui.audio.hidden = true;
    ui.audio.dataset.speechText = "";
    ui.audioStatus.textContent = "";
    ui.next.hidden = true;
  }

  function renderLanding() {
    clearQuestionSurface();
    const seconds = currentDailySeconds();
    const remaining = Math.max(0, DAILY_SECONDS - seconds);
    ui.questionCount.textContent = seconds > 0 ? "继续今日进度" : "未开始";
    ui.prompt.textContent =
      remaining > 0
        ? "字形、字母听音和基础音标混合训练"
        : "今天的 5 分钟训练已完成";
    ui.stimulus.lang = "en";
    ui.stimulus.dir = "ltr";
    ui.stimulus.textContent =
      remaining > 0 ? formatClock(remaining) : "DONE";
    ui.start.hidden = remaining === 0;
    ui.start.textContent = seconds > 0 ? "继续训练" : "开始今日训练";
    ui.feedback.dataset.state = "ready";
    ui.feedback.textContent = storageAvailable
      ? "进度只保存在当前浏览器。"
      : "浏览器禁止本地存储，刷新后记录会消失。";
  }

  function renderEmptyMistakes() {
    clearQuestionSurface();
    ui.questionCount.textContent = "0 题";
    ui.prompt.textContent = "当前没有待复习的错题";
    ui.stimulus.lang = "en";
    ui.stimulus.dir = "ltr";
    ui.stimulus.textContent = "0";
    ui.start.hidden = true;
    ui.feedback.dataset.state = "success";
    ui.feedback.textContent = "答错的题目会自动出现在这里。";
  }

  function renderQuestion(question, autoPlay = false) {
    currentQuestion = question;
    questionAnswered = false;
    sessionQuestionCount += 1;
    lastQuestionId = question.id;

    ui.questionCount.textContent = `第 ${sessionQuestionCount} 题`;
    ui.prompt.textContent = question.prompt;
    ui.stimulus.lang = "ar";
    ui.stimulus.dir = "rtl";
    ui.stimulus.textContent = question.stimulus;
    ui.stimulus.hidden = !question.stimulus;
    ui.audio.hidden = !question.audio;
    ui.audio.dataset.speechText = question.audio ?? "";
    ui.audioStatus.textContent = question.audio ? "可重复播放" : "";
    ui.options.replaceChildren();
    ui.start.hidden = true;
    ui.next.hidden = true;
    ui.feedback.dataset.state = "ready";
    ui.feedback.textContent = "选择一个答案。";

    for (const option of question.options) {
      const button = document.createElement("button");
      const glyph = document.createElement("span");
      button.type = "button";
      button.className = "practice-option";
      button.dataset.practiceOption = option.id;
      button.setAttribute("aria-label", option.glyph);
      glyph.lang = "ar";
      glyph.dir = "rtl";
      glyph.textContent = option.glyph;
      button.append(glyph);
      ui.options.append(button);
    }

    if (question.audio && autoPlay && speechSupported) {
      speakFromButton(ui.audio);
    }
  }

  function nextQuestion(autoPlay = true) {
    if (activeMode === "daily" && currentDailySeconds() >= DAILY_SECONDS) {
      finishDaily();
      return;
    }

    const descriptor = selectDescriptor(activeMode);
    if (!descriptor) {
      renderEmptyMistakes();
      return;
    }
    const question = buildQuestion(descriptor);
    if (question) renderQuestion(question, autoPlay);
  }

  function recordAnswer(isCorrect) {
    const question = currentQuestion;
    if (!question) return;

    practiceState.total.answered += 1;
    practiceState.total.correct += isCorrect ? 1 : 0;
    practiceState.modes[question.mode].answered += 1;
    practiceState.modes[question.mode].correct += isCorrect ? 1 : 0;

    const today = dayRecord();
    today.answered += 1;
    today.correct += isCorrect ? 1 : 0;
    today.seconds = currentDailySeconds();

    if (isCorrect) {
      delete practiceState.mistakes[question.id];
    } else {
      const previous = practiceState.mistakes[question.id];
      practiceState.mistakes[question.id] = {
        mode: question.mode,
        misses: nonNegativeNumber(previous?.misses) + 1,
        lastMissedAt: new Date().toISOString(),
      };
    }

    savePracticeState();
    renderStats();
  }

  function answerQuestion(optionId) {
    if (!currentQuestion || questionAnswered) return;
    questionAnswered = true;
    const isCorrect = optionId === currentQuestion.answer;

    for (const button of ui.options.querySelectorAll(
      "[data-practice-option]",
    )) {
      button.disabled = true;
      if (button.dataset.practiceOption === currentQuestion.answer) {
        button.classList.add("is-correct");
      } else if (button.dataset.practiceOption === optionId) {
        button.classList.add("is-wrong");
      }
    }

    recordAnswer(isCorrect);
    ui.feedback.dataset.state = isCorrect ? "success" : "error";
    ui.feedback.textContent = isCorrect
      ? `正确 · ${currentQuestion.success}`
      : `答案 · ${currentQuestion.success}`;
    ui.next.hidden = false;
    ui.next.textContent =
      activeMode === "mistakes" &&
      Object.keys(practiceState.mistakes).length === 0
        ? "完成复习"
        : "下一题";
    ui.next.focus();
  }

  function saveTimerProgress() {
    if (!timerId) return;
    const seconds = currentDailySeconds();
    dayRecord().seconds = seconds;
    savePracticeState();
    lastSavedTimerSecond = Math.floor(seconds);
  }

  function stopTimer() {
    if (!timerId) return;
    saveTimerProgress();
    window.clearInterval(timerId);
    timerId = null;
    timerStartedAt = 0;
    timerBaseSeconds = 0;
    renderStats();
  }

  function finishDaily() {
    stopTimer();
    clearQuestionSurface();
    ui.questionCount.textContent = "今日完成";
    ui.prompt.textContent = "今天的 5 分钟训练已完成";
    ui.stimulus.hidden = false;
    ui.stimulus.lang = "en";
    ui.stimulus.dir = "ltr";
    ui.stimulus.textContent = "DONE";
    ui.start.hidden = true;
    ui.feedback.dataset.state = "success";
    ui.feedback.textContent = "可以继续练单项，错题会保留到复习区。";
  }

  function startDaily() {
    const today = dayRecord();
    if (today.seconds >= DAILY_SECONDS) {
      finishDaily();
      return;
    }

    timerBaseSeconds = today.seconds;
    timerStartedAt = Date.now();
    lastSavedTimerSecond = Math.floor(today.seconds);
    timerId = window.setInterval(() => {
      const seconds = currentDailySeconds();
      renderStats();
      if (Math.floor(seconds) - lastSavedTimerSecond >= 5) {
        saveTimerProgress();
      }
      if (seconds >= DAILY_SECONDS) {
        finishDaily();
      }
    }, 500);
    nextQuestion(true);
  }

  function switchMode(mode) {
    if (!modeLabels[mode]) return;
    if (mode === "daily" && activeMode === "daily" && timerId) return;
    if (mode !== "daily") stopTimer();
    activeMode = mode;
    sessionQuestionCount = 0;
    setModeSelection();

    if (mode === "daily") {
      renderLanding();
    } else if (mode === "mistakes" && availableMistakes().length === 0) {
      renderEmptyMistakes();
    } else {
      nextQuestion(true);
    }
  }

  for (const button of modeButtons) {
    const mode = button.dataset.practiceMode;
    if (!speechSupported && (mode === "listen" || mode === "phonetic")) {
      button.disabled = true;
      button.title = "当前浏览器不支持语音合成";
    }
    button.addEventListener("click", () => switchMode(mode));
  }

  ui.options.addEventListener("click", (event) => {
    const option = event.target.closest("[data-practice-option]");
    if (!option) return;
    answerQuestion(option.dataset.practiceOption);
  });

  ui.start.addEventListener("click", startDaily);
  ui.next.addEventListener("click", () => nextQuestion(true));
  ui.reset.addEventListener("click", () => {
    const confirmed = window.confirm(
      "清除这台浏览器中的阿拉伯语练习进度和错题记录？",
    );
    if (!confirmed) return;

    stopTimer();
    practiceState = emptyPracticeState();
    if (storageAvailable) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    activeMode = "daily";
    sessionQuestionCount = 0;
    lastQuestionId = "";
    setModeSelection();
    renderStats();
    renderLanding();
  });

  window.addEventListener("pagehide", saveTimerProgress);

  ui.storage.textContent = storageAvailable ? "local only" : "session only";
  setModeSelection();
  renderStats();
  renderLanding();
}
