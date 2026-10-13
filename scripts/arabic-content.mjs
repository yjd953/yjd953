import {
  arabicLetters,
  arabicModule,
  arabicSources,
  articulationZones,
  phoneticLessons,
} from "./arabic-data.mjs";

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function speechButton({
  text,
  label,
  repeat = 1,
  rate = 0.72,
  compact = false,
  glyph = "",
}) {
  return `<button class="speech-button${compact ? " speech-button-compact" : ""}" type="button" data-speech-text="${escapeAttribute(text)}" data-speech-repeat="${repeat}" data-speech-rate="${rate}" aria-label="${escapeAttribute(label)}" title="${escapeAttribute(label)}">
  ${glyph ? `<span class="speech-button-glyph" lang="ar" dir="rtl">${glyph}</span>` : '<span class="speech-button-icon" aria-hidden="true">▶</span>'}
  <span>${label}</span>
</button>`;
}

function speechPanel({ eyebrow, title, description, actions }) {
  return `<section class="speech-panel" data-speech-panel aria-label="${escapeAttribute(title)}">
  <div class="speech-panel-copy">
    <span class="speech-panel-eyebrow">${eyebrow}</span>
    <strong>${title}</strong>
    <p>${description}</p>
  </div>
  <div class="speech-settings">
    <label>
      <span>阿拉伯语音色</span>
      <select data-speech-voice aria-label="选择阿拉伯语音色">
        <option value="">正在检测可用音色…</option>
      </select>
    </label>
  </div>
  <div class="speech-actions">
    ${actions.join("\n    ")}
  </div>
  <p class="speech-feedback" data-speech-feedback aria-live="polite">点击播放后，浏览器会优先使用 ar-SA 标准阿拉伯语音色。</p>
</section>`;
}

function formsGrid(letter) {
  const forms = [
    ["独立形", letter.forms.isolated, "单独出现或两侧都不连接"],
    ["词首形", letter.forms.initial, "连接左侧后写字母"],
    ["词中形", letter.forms.medial, "两侧连接时的形态"],
    ["词尾形", letter.forms.final, "连接右侧先写字母"],
  ];

  return `<div class="arabic-form-grid">
${forms
  .map(
    ([label, glyph, note]) => `  <div class="arabic-form-cell">
    <span>${label}</span>
    <b lang="ar" dir="rtl">${glyph}</b>
    <small>${note}</small>
  </div>`,
  )
  .join("\n")}
</div>`;
}

function letterMarkdown(letter) {
  const joiningText =
    letter.joining === "dual"
      ? "双向连接字母：可连接右侧先写字母，也可继续连接左侧后写字母。"
      : "右向连接字母：可接右侧先写字母，但会切断与左侧后写字母的连接。";
  const drillButtons = [
    speechButton({
      text: letter.speechName,
      label: "播放字母名",
    }),
    speechButton({
      text: letter.drill.join(" "),
      label: "播放三短音",
      rate: 0.66,
    }),
    speechButton({
      text: letter.drill.join("، "),
      label: "重复 3 轮",
      repeat: 3,
      rate: 0.62,
    }),
  ];

  if (letter.extraDrill) {
    drillButtons.splice(
      2,
      0,
      speechButton({
        text: letter.extraDrill.join(" "),
        label: "播放长音组",
        rate: 0.66,
      }),
    );
  }

  return `<div class="arabic-stage">
  <div class="arabic-stage-glyph">
    <span class="arabic-glyph" lang="ar" dir="rtl">${letter.glyph}</span>
    <span class="arabic-name" lang="ar" dir="rtl">${letter.nameArabic}</span>
  </div>
  <div class="arabic-stage-copy">
    <span class="note-meta">字母 ${String(letter.order).padStart(2, "0")} / ${letter.transliteration}</span>
    <strong>${letter.nameZh}</strong>
    <p>${letter.role}</p>
  </div>
</div>

${speechPanel({
  eyebrow: "Listen / Web Speech",
  title: `${letter.glyph} 的字母名与基础音节`,
  description:
    "先听字母名，再听同一辅音与 Fatha、Kasra、Damma 的组合。重复播放用于建立口型和时长记忆。",
  actions: drillButtons,
})}

## 基础属性

| 项目 | 内容 |
| --- | --- |
| 字母 | <span class="arabic-inline" lang="ar" dir="rtl">${letter.glyph}</span> |
| 阿拉伯语名称 | <span class="arabic-inline" lang="ar" dir="rtl">${letter.nameArabic}</span> |
| 转写 | ${letter.transliteration} |
| IPA | ${letter.ipa} |
| 发音部位 | ${letter.place} |
| 发音方式 | ${letter.manner} |
| 声带 | ${letter.voiced} |
| 连写类型 | ${joiningText} |

## 四种书写形态

${formsGrid(letter)}

浏览器会根据相邻字母的连接属性自动选择上下文形态。表格使用延长线展示连接端，真正输入时不要把延长线当作字母的一部分。

${letter.joining === "right" ? `> ${letter.glyph} 属于六个基础“断连字母”之一。它出现后，左侧下一个字母必须重新起笔。` : `> ${letter.glyph} 可以双向连接。词首、词中与词尾形的主干会压缩，但区别字母的点位与核心骨架不能丢。`}

## 发音口型与动作

${letter.articulation}

**气流方式：** ${letter.airflow}

练习时按以下顺序：

1. 先不带元音，只建立发音部位；
2. 加 Fatha 读 <span class="arabic-inline" lang="ar" dir="rtl">${letter.drill[0]}</span>；
3. 保持辅音不变，改读 <span class="arabic-inline" lang="ar" dir="rtl">${letter.drill[1]}</span>、<span class="arabic-inline" lang="ar" dir="rtl">${letter.drill[2]}</span>；
4. 用手摸喉部，核对声带是否应当振动；
5. 录下自己的声音，与页面朗读逐次对比。

## 中文近似音：只能定位，不能替代

${letter.approximate}

中文近似音只帮助第一次找到大致口型。阿拉伯语中的齿间音、咽音、小舌音和厚音在普通话里没有等价项，最终必须以发音部位和气流为准。

## 绝对不要这样读

${letter.avoid}

如果页面语音与中文近似提示冲突，应优先遵循 IPA、口腔动作和阿拉伯语音色，不要把汉字注音当成标准答案。

## 写法与识别

${letter.writing}

书写时遵循从右向左的整体方向，先完成主干，再补点。点不是装饰，点的数量和位置直接决定字母身份。

## 相似字母区分

${letter.confusion}

建议把相似字母放在同一行反复辨认，而不是只背单个字母：

<div class="arabic-comparison" lang="ar" dir="rtl">${letter.glyph}　${letter.forms.initial}　${letter.forms.medial}　${letter.forms.final}</div>

## 新手常见误区

${letter.mistakes.map((item) => `- ${item}`).join("\n")}

## 当课检查

- [ ] 能从四种位置形态中认出 <span class="arabic-inline" lang="ar" dir="rtl">${letter.glyph}</span>；
- [ ] 能说出它是否会切断左侧连接；
- [ ] 能按正确发音部位读出 ${letter.ipa}；
- [ ] 能连续读出 <span class="arabic-inline" lang="ar" dir="rtl">${letter.drill.join("　")}</span> 而不改变辅音；
- [ ] 能指出最容易混淆的字母及区别依据。
`;
}

function phoneticMarkdown(lesson) {
  return `<div class="arabic-stage">
  <div class="arabic-stage-glyph">
    <span class="arabic-glyph arabic-glyph-wide" lang="ar" dir="rtl">${lesson.display}</span>
    <span class="arabic-name" lang="ar" dir="rtl">${lesson.nameArabic}</span>
  </div>
  <div class="arabic-stage-copy">
    <span class="note-meta">基础音标 ${String(lesson.order).padStart(2, "0")} / ${lesson.ipa}</span>
    <strong>${lesson.nameZh}</strong>
    <p>${lesson.description}</p>
  </div>
</div>

${speechPanel({
  eyebrow: "Listen / Web Speech",
  title: `${lesson.nameArabic} 听音练习`,
  description:
    "音标不能单独发声时，播放按钮会把它放进最小音节中朗读。这样能听到标记对辅音的真实作用。",
  actions: [
    speechButton({
      text: lesson.speech,
      label: "播放示范",
      rate: 0.65,
    }),
    speechButton({
      text: lesson.speech,
      label: "重复 3 次",
      repeat: 3,
      rate: 0.6,
    }),
  ],
})}

## 符号与作用

| 项目 | 内容 |
| --- | --- |
| 符号 | <span class="arabic-inline arabic-inline-large" lang="ar" dir="rtl">${lesson.symbol}</span> |
| 名称 | <span class="arabic-inline" lang="ar" dir="rtl">${lesson.nameArabic}</span> |
| 读音 | ${lesson.ipa} |
| 书写位置 | ${lesson.placement} |
| 时长 | ${lesson.duration} |

## 发音动作

${lesson.action}

先慢速做准口型，再把时长压回正常。短元音、零元音与长元音的区别必须来自真实时长和口型，不能只靠记符号。

## 最小听辨组

${lesson.drills
  .map(
    (drill) =>
      `${speechButton({
        text: drill,
        label: `播放 ${drill}`,
        compact: true,
        glyph: drill,
        rate: 0.62,
      })}`,
  )
  .join("\n")}

## 中文通俗定位

${lesson.approximate}

中文提示只用于第一次定位，不携带阿拉伯语音值、时长和重音信息。

## 绝对不要这样读

${lesson.avoid}

## 必须会区分

${lesson.contrast}

建议使用“短音一拍、长音两拍、Sukun 零拍元音”的节拍方式练习。节拍只是训练工具，正常语流中不要机械停顿。

## 当课检查

- [ ] 能认出符号并说出它写在字母上方还是下方；
- [ ] 能说明它是否拥有独立声音；
- [ ] 能听辨并复读 <span class="arabic-inline" lang="ar" dir="rtl">${lesson.drills.join("　")}</span>；
- [ ] 能说出最常见的错误读法；
- [ ] 能在不借助中文注音的情况下完成两轮跟读。
`;
}

const sourceList = arabicSources
  .map(
    (source) =>
      `- [${source.label}](${source.url})：${source.use}。`,
  )
  .join("\n");

const foundations = [
  {
    number: "01",
    module: "arabic",
    group: "开始之前",
    slug: "arabic-start-here",
    source: "scripts/arabic-content.mjs",
    title: "零基础应该怎样开始学阿拉伯字母？",
    category: "Learning path",
    language: "ZH + AR",
    detail: "学习顺序与边界",
    description:
      "先建立从右向左、字母骨架、点位、连写与音标的整体地图，再进入逐字训练。",
    arabicType: "foundation",
    markdown: `阿拉伯语不是“把 28 个符号背完”就结束。零基础阶段需要同时建立四条线：

1. **看得见**：认出独立、词首、词中、词尾形；
2. **连得上**：知道哪些字母会切断后续连接；
3. **发得准**：按口腔部位、声带和气流发音；
4. **读得出**：把辅音和 Fatha、Kasra、Damma 等基础音标组合。

${speechPanel({
  eyebrow: "Audio check",
  title: "先确认浏览器可以朗读阿拉伯语",
  description:
    "页面只在你点击按钮后发音。网站不保存录音，也不需要麦克风；朗读由浏览器或操作系统提供的阿拉伯语音色完成。",
  actions: [
    speechButton({
      text: "أَلِف، بَاء، تَاء، ثَاء",
      label: "播放前四个字母名",
      rate: 0.65,
    }),
    speechButton({
      text: "أَلِف، بَاء، تَاء، ثَاء",
      label: "重复 3 次",
      repeat: 3,
      rate: 0.58,
    }),
  ],
})}

## 本板块学什么

本板块严格停留在零基础字母与发音层：

- 28 个基础字母；
- 每个字母的名称、IPA、口腔位置和气流；
- 独立、词首、词中、词尾形；
- 六个基础断连字母；
- Fatha、Kasra、Damma；
- Sukun、Shadda、Tanwin；
- 三组长元音；
- Hamza 与 Maddah。

不展开词汇、句子、语法、方言和复杂诵读规则。示范组合仅用于发音训练，不要求记忆词义。

## 推荐学习顺序

### 第一轮：只认骨架与点

先看字母形状家族：

<div class="arabic-comparison" lang="ar" dir="rtl">ب ت ث　ج ح خ　د ذ　ر ز　س ش　ص ض　ط ظ　ع غ　ف ق</div>

同一骨架依靠点的数量和位置区分。第一轮不要急着追求书写速度。

### 第二轮：加入发音部位

把字母放回口腔地图：

<pre><code>双唇 → 唇齿 → 齿间/齿龈 → 硬腭 → 软腭/小舌 → 咽腔 → 声门</code></pre>

遇到普通话没有的音，不背汉字谐音，直接记“舌头在哪里、气流怎么走、声带是否振动”。

### 第三轮：学习连接

重点先背六个不向左连接的字母：

<div class="arabic-comparison" lang="ar" dir="rtl">ا　د　ذ　ر　ز　و</div>

看见它们，就知道左侧下一个字母要重新起笔。

### 第四轮：加入基础音标

使用同一个字母练习：

<div class="arabic-comparison" lang="ar" dir="rtl">بَ　بِ　بُ　بْ　بَّ　بَا　بِي　بُو</div>

先保持辅音不变，再控制短音、零元音、双辅音和长元音。

## 每课怎样练

1. 看大字形 5 秒，指出点位；
2. 点击字母名播放一次；
3. 不看中文提示复读 3 次；
4. 对照四种形态手写一行；
5. 播放三短音并跟读；
6. 说出一个最容易混淆的字母；
7. 第二天先复习，再进入下一课。

## 关于网页朗读

本站使用浏览器 Web Speech API，优先选择设备中的 \`ar-SA\` 音色，其次选择其他 \`ar-*\` 阿拉伯语音色。实际音色由浏览器和操作系统提供，不同设备的音质、方言色彩和可用音色可能不同。页面会显示实际选中的音色；如果设备没有阿拉伯语音色，仍会提交 \`ar-SA\` 语言标签让浏览器选择后备语音，但不能替代真人教师的纠音。

## 内容核对来源

${sourceList}
`,
  },
  {
    number: "02",
    module: "arabic",
    group: "开始之前",
    slug: "arabic-articulation-map",
    source: "scripts/arabic-content.mjs",
    title: "阿拉伯语发音的口腔地图",
    category: "Pronunciation map",
    language: "ZH + AR",
    detail: "部位 / 气流 / 声带",
    description:
      "从双唇一路走到声门，用发音部位、方式和清浊建立比中文谐音更可靠的声音地图。",
    arabicType: "foundation",
    markdown: `阿拉伯语发音可以用三个问题定位：

1. **哪里形成阻碍？** 双唇、牙齿、齿龈、硬腭、软腭、小舌、咽腔还是声门；
2. **怎样形成阻碍？** 完全闭塞、摩擦、鼻音、边音、颤音还是近音；
3. **声带振不振？** 清音不振动，浊音振动。

## 七个发音区域

| 区域 | 字母 | 零基础定位 |
| --- | --- | --- |
${articulationZones
  .map(
    (zone) =>
      `| ${zone.zone} | <span class="arabic-inline" lang="ar" dir="rtl">${zone.letters}</span> | ${zone.cue} |`,
  )
  .join("\n")}

## 清音与浊音

把手指轻放在喉结附近，比较：

${speechPanel({
  eyebrow: "Voicing",
  title: "清浊最小对比",
  description:
    "播放后摸喉部：清音段声带振动弱或没有，浊音段会有稳定振动。",
  actions: [
    speechButton({ text: "ثَ ذَ، سَ زَ، خَ غَ", label: "播放清浊对比", rate: 0.58 }),
    speechButton({
      text: "ثَ ذَ، سَ زَ، خَ غَ",
      label: "重复 3 次",
      repeat: 3,
      rate: 0.54,
    }),
  ],
})}

| 清音 | 浊音 | 主要差别 |
| --- | --- | --- |
| <span class="arabic-inline" lang="ar">ث</span> /θ/ | <span class="arabic-inline" lang="ar">ذ</span> /ð/ | 齿间位置相同，声带状态不同 |
| <span class="arabic-inline" lang="ar">س</span> /s/ | <span class="arabic-inline" lang="ar">ز</span> /z/ | 齿龈摩擦位置相近 |
| <span class="arabic-inline" lang="ar">خ</span> /x/ | <span class="arabic-inline" lang="ar">غ</span> /ɣ/ | 舌后摩擦位置相近 |

## 塞音、摩擦音与近音

- **塞音**：先完全堵住气流，再释放，如 <span class="arabic-inline" lang="ar">ت د ط ض ك ق</span>；
- **摩擦音**：留窄缝让气流持续擦过，如 <span class="arabic-inline" lang="ar">ث ذ س ز ش ص ظ ف ح خ غ ه</span>；
- **鼻音**：口腔封闭，气流走鼻腔，如 <span class="arabic-inline" lang="ar">م ن</span>；
- **边音**：中央封闭，气流从舌侧通过，如 <span class="arabic-inline" lang="ar">ل</span>；
- **颤音/闪音**：舌尖快速接触齿龈，如 <span class="arabic-inline" lang="ar">ر</span>；
- **近音**：通道变窄但不产生强摩擦，如 <span class="arabic-inline" lang="ar">و ي</span>。

## 四个厚音

<div class="arabic-comparison" lang="ar" dir="rtl">ص　ض　ط　ظ</div>

厚音不是“更大声”，而是在前部主发音动作之外，让舌后部抬起并略向咽部收缩。比较：

<div class="arabic-comparison" lang="ar" dir="rtl">سَ / صَ　دَ / ضَ　تَ / طَ　ذَ / ظَ</div>

练习时先做普通音，再保持前部动作不变，加入舌根后缩。不要靠增加音量、压低嗓音或附加 /o/ 来伪造厚音。

## 三组必须单独训练的声音

### 齿间音

<span class="arabic-inline" lang="ar">ث ذ ظ</span> 必须让舌尖到齿间。舌尖缩回会退化成 /s/、/z/ 或 /d/。

### 咽音

<span class="arabic-inline" lang="ar">ح ع</span> 在咽腔形成主动收窄。普通话没有对应音，不能只背“哈”“阿”。

### 小舌音

<span class="arabic-inline" lang="ar">ق</span> 的闭塞比 <span class="arabic-inline" lang="ar">ك</span> 更靠后；先做 /k/，再把舌后闭塞整体后移。

## 练习纪律

- 疼痛、强烈干咳或喉部挤压说明用力过度；
- 每次只练一个部位，单次 3–5 分钟；
- 先慢后快，先口型后音量；
- 手机录音比主观感觉更可靠；
- 中文近似音只用于起步，不用于最终验收。
`,
  },
  {
    number: "03",
    module: "arabic",
    group: "开始之前",
    slug: "arabic-joining-writing",
    source: "scripts/arabic-content.mjs",
    title: "从右向左与四种连写形态",
    category: "Writing system",
    language: "ZH + AR",
    detail: "方向与连接",
    description:
      "理解阿拉伯字母为什么会变形、哪些字母会断开，以及浏览器如何自动完成上下文塑形。",
    arabicType: "foundation",
    markdown: `阿拉伯语整体从右向左书写，但数字等片段可能按自身方向显示。学习字母时，先把“先写右边，再向左推进”固定下来。

${speechPanel({
  eyebrow: "Connection breakers",
  title: "六个断连字母听音",
  description:
    "它们共享“不向左连接”的书写属性，但读音完全不同。先听名称，再观察下方连接示例。",
  actions: [
    speechButton({
      text: "أَلِف، دَال، ذَال، رَاء، زَاي، وَاو",
      label: "播放六个字母名",
      rate: 0.6,
    }),
    speechButton({
      text: "أَلِف، دَال، ذَال، رَاء، زَاي، وَاو",
      label: "重复 3 次",
      repeat: 3,
      rate: 0.55,
    }),
  ],
})}

## 逻辑字符与视觉字形

同一个 Unicode 字母只输入一次，浏览器根据相邻字符自动选择视觉形态：

<div class="arabic-form-grid">
  <div class="arabic-form-cell"><span>独立</span><b lang="ar">ب</b><small>两侧不连接</small></div>
  <div class="arabic-form-cell"><span>词首</span><b lang="ar">بـ</b><small>右侧起笔，向左连接</small></div>
  <div class="arabic-form-cell"><span>词中</span><b lang="ar">ـبـ</b><small>两侧连接</small></div>
  <div class="arabic-form-cell"><span>词尾</span><b lang="ar">ـب</b><small>从右侧接入后收尾</small></div>
</div>

延长线 \`ـ\` 只用于教学展示连接端，不是 ب 的组成部分。实际文本中输入普通字母，塑形引擎会自动连接。

## 六个断连字母

<div class="arabic-comparison" lang="ar" dir="rtl">ا　د　ذ　ر　ز　و</div>

它们可以接住右侧先写字母，却不能继续连接左侧后写字母：

<pre><code>右侧字母 → [断连字母]   [左侧重新起笔]</code></pre>

Unicode 把这些字母标为 Right_Joining；大多数其他基础字母是 Dual_Joining。

## 四种形态不等于四个字母

<span class="arabic-inline" lang="ar">ب</span>、<span class="arabic-inline" lang="ar">بـ</span>、<span class="arabic-inline" lang="ar">ـبـ</span>、<span class="arabic-inline" lang="ar">ـب</span> 都是同一个字母 ب。认字时抓两层：

1. **骨架**：碗形、三齿、圆环、高竖干；
2. **点位**：上、下、内部，以及点的数量。

## 点要最后补，但不能漏

字母家族：

<div class="arabic-comparison" lang="ar" dir="rtl">ب ت ث　ج ح خ　د ذ　ر ز　س ش　ص ض　ط ظ　ع غ　ف ق</div>

练习建议：

1. 先写一整行同骨架主干；
2. 再逐个补点；
3. 遮住点只认家族；
4. 露出点说出具体字母；
5. 在词首、词中、词尾形之间往返辨认。

## Lām + Alif

<span class="arabic-inline" lang="ar">ل</span> 后接 <span class="arabic-inline" lang="ar">ا</span> 时通常显示为连字 <span class="arabic-inline" lang="ar">لا</span>。它仍然是两个逻辑字母，不是第 29 个基础字母。

## 输入与复制时的注意事项

- 不要从“阿拉伯字母表现形式”区复制孤立的兼容字形；
- 优先输入基础 Unicode 字母，让浏览器塑形；
- 短元音是组合附标，逻辑上跟在辅音后；
- 混合中文、拉丁字母和阿语时，必要时给阿语片段添加 \`dir="rtl"\`；
- 文件名和代码标识符中的双向文本有安全风险，初学阶段不要混用。

## 连写判断练习

按从右向左顺序观察：

<div class="arabic-comparison" lang="ar" dir="rtl">بـتـث　جـحـخ　سـش　صـض　عـغ</div>

再观察断连：

<div class="arabic-comparison" lang="ar" dir="rtl">بـا ت　بـد ت　بـر ت　بـو ت</div>

看见 ا、د、ر、و 后，左侧 ت 都重新起笔。这是连接属性，不是空格。

## 当课检查

- [ ] 能说出整体书写方向；
- [ ] 能解释独立、词首、词中、词尾形；
- [ ] 能背出六个断连字母；
- [ ] 能说明延长线不是字母内容；
- [ ] 能解释 لا 为什么仍是两个字母。
`,
  },
];

function letterGroup(order) {
  if (order <= 7) return "字母 01–07";
  if (order <= 14) return "字母 08–14";
  if (order <= 21) return "字母 15–21";
  return "字母 22–28";
}

const letterNotes = arabicLetters.map((letter, index) => ({
  number: String(index + 4).padStart(2, "0"),
  module: "arabic",
  group: letterGroup(letter.order),
  slug: letter.slug,
  source: "scripts/arabic-data.mjs",
  title: `${letter.glyph}：${letter.nameZh}`,
  category: "Arabic letter",
  language: "ZH + AR",
  detail: `${letter.transliteration} / ${letter.ipa}`,
  description: letter.description,
  arabicType: "letter",
  glyph: letter.glyph,
  markdown: letterMarkdown(letter),
}));

const phoneticNotes = phoneticLessons.map((lesson, index) => ({
  number: String(index + 32).padStart(2, "0"),
  module: "arabic",
  group: "基础音标",
  slug: lesson.slug,
  source: "scripts/arabic-data.mjs",
  title: lesson.nameZh,
  category: "Arabic phonetics",
  language: "ZH + AR",
  detail: `${lesson.symbol} / ${lesson.ipa}`,
  description: lesson.description,
  arabicType: "phonetic",
  glyph: lesson.display,
  markdown: phoneticMarkdown(lesson),
}));

export const arabicNotes = [...foundations, ...letterNotes, ...phoneticNotes];

function serializePracticeData(data) {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function renderArabicSectionPractice() {
  const letterButtons = arabicLetters
    .map((letter) =>
      speechButton({
        text: letter.speechName,
        label: letter.nameZh,
        compact: true,
        glyph: letter.glyph,
        rate: 0.68,
      }),
    )
    .join("\n");
  const phoneticButtons = phoneticLessons
    .map((lesson) =>
      speechButton({
        text: lesson.speech,
        label: lesson.nameZh.split("：")[0],
        compact: true,
        glyph: lesson.display,
        rate: 0.62,
      }),
    )
    .join("\n");
  const practiceData = {
    version: 1,
    letters: arabicLetters.map((letter) => ({
      order: letter.order,
      slug: letter.slug,
      glyph: letter.glyph,
      nameZh: letter.nameZh,
      speechName: letter.speechName,
      joining: letter.joining,
      forms: letter.forms,
    })),
    phonetics: phoneticLessons.slice(0, 5).map((lesson) => ({
      order: lesson.order,
      nameZh: lesson.nameZh,
      display: lesson.display,
      audio:
        {
          1: "بَ",
          2: "بِ",
          3: "بُ",
          4: "أَبْ",
          5: "أَبَّ",
        }[lesson.order] ?? lesson.speech,
    })),
  };

  return `<section class="arabic-practice-band" data-arabic-practice aria-labelledby="arabicPracticeTitle">
    <div class="section-label">
      <h2 id="arabicPracticeTitle">Practice studio</h2>
      <span data-practice-storage>local only</span>
    </div>

    <div class="arabic-practice-summary" aria-label="学习进度">
      <div class="practice-stat">
        <span>今日训练</span>
        <strong data-practice-today>0:00 / 5:00</strong>
      </div>
      <div class="practice-stat">
        <span>连续学习</span>
        <strong data-practice-streak>0 天</strong>
      </div>
      <div class="practice-stat">
        <span>总正确率</span>
        <strong data-practice-accuracy>—</strong>
      </div>
      <div class="practice-stat">
        <span>待复习</span>
        <strong data-practice-mistakes>0 题</strong>
      </div>
    </div>

    <div class="practice-daily-track" aria-hidden="true">
      <span data-practice-daily-bar></span>
    </div>

    <div class="practice-mode-switch" role="tablist" aria-label="练习模式">
      <button type="button" role="tab" aria-selected="true" data-practice-mode="daily">每日 5 分钟</button>
      <button type="button" role="tab" aria-selected="false" data-practice-mode="form">字形辨认</button>
      <button type="button" role="tab" aria-selected="false" data-practice-mode="listen">听音辨字</button>
      <button type="button" role="tab" aria-selected="false" data-practice-mode="phonetic">音标辨听</button>
      <button type="button" role="tab" aria-selected="false" data-practice-mode="mistakes">
        错题 <span data-practice-mistake-badge>0</span>
      </button>
    </div>

    <div class="arabic-practice-tool">
      <div class="practice-question-head">
        <div>
          <span class="note-meta" data-practice-mode-label>每日混合训练</span>
          <span data-practice-question-count>未开始</span>
        </div>
        <button class="practice-reset" type="button" data-practice-reset>清除记录</button>
      </div>

      <div class="practice-question" data-practice-question>
        <p class="practice-prompt" data-practice-prompt>每天练 5 分钟，题目会混合字形、字母听音和基础音标。</p>
        <div class="practice-stimulus" lang="ar" dir="rtl" data-practice-stimulus>٥:٠٠</div>
        <button class="speech-button practice-audio-button" type="button" data-practice-audio data-speech-text="" data-speech-repeat="1" data-speech-rate="0.62" hidden>
          <span class="speech-button-icon" aria-hidden="true">▶</span>
          <span>播放题目</span>
        </button>
        <p class="practice-audio-status" data-practice-speech-feedback aria-live="polite"></p>
        <div class="practice-options" data-practice-options></div>
        <div class="practice-actions">
          <button class="practice-primary" type="button" data-practice-start>开始今日训练</button>
          <button class="practice-primary" type="button" data-practice-next hidden>下一题</button>
        </div>
        <p class="practice-feedback" data-practice-feedback aria-live="polite">进度只保存在当前浏览器。</p>
      </div>
    </div>

    <details class="arabic-audio-reference">
      <summary>自由听音表</summary>
      ${speechPanel({
        eyebrow: "Free listening",
        title: "28 个字母快速听音",
        description:
          "点击任一字母播放字母名；音色由浏览器和操作系统提供。",
        actions: [letterButtons],
      })}
      <div class="arabic-quick-phonetics">
        <span class="note-meta">基础音标</span>
        <div class="speech-actions">${phoneticButtons}</div>
      </div>
    </details>

    <script type="application/json" data-arabic-practice-data>${serializePracticeData(practiceData)}</script>
  </section>`;
}

export { arabicModule };
