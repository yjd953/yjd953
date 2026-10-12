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
