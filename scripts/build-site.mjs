import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const modules = [
  {
    number: "01",
    slug: "agent",
    title: "Agent 探索",
    label: "Agent systems",
    description:
      "从最小 Agent Loop 出发，拆解工具、Memory、Runtime、MCP、Trace 与可靠性工程。",
  },
  {
    number: "02",
    slug: "computer-systems",
    title: "计算机底层",
    label: "Computer systems",
    description:
      "从程序如何运行开始，逐步进入操作系统、网络、编译器与数据库内核。",
  },
  {
    number: "03",
    slug: "backend",
    title: "后端八股",
    label: "Backend foundations",
    detail: "90 个主题",
    description:
      "以问题为入口，串联 Java、Go、JVM、Redis、MySQL、网络与分布式系统。",
  },
];

const notes = [
  {
    number: "01",
    module: "agent",
    group: "核心机制",
    slug: "what-is-agent",
    source: "posts/what-is-agent.md",
    title: "Agent 到底是什么？",
    category: "Agent foundations",
    language: "ZH",
    detail: "边界与组成",
    description:
      "从 LLM 生成答案到闭环行动，找到“调用工具的 LLM”和 Agent 的真正分界线。",
  },
  {
    number: "02",
    module: "agent",
    group: "核心机制",
    slug: "minimal-agent-code",
    source: "posts/minimal-agent-code.md",
    title: "一个 Agent 最少需要多少代码？",
    category: "Agent loop",
    language: "ZH",
    detail: "Python 实现",
    description:
      "从几十行循环开始，逐步加入 Memory、Retry、Timeout 与并行工具调用。",
  },
  {
    number: "03",
    module: "agent",
    group: "核心机制",
    slug: "agent-loop",
    source: "posts/agent-loop.md",
    title: "Agent Loop：AI 为什么能够自己行动？",
    category: "Agent loop",
    language: "ZH",
    detail: "执行追踪",
    description:
      "沿着 Think、Act、Observe、Think 跟踪一次任务，分清模型决策和 Runtime 执行。",
  },
  {
    number: "04",
    module: "agent",
    group: "核心机制",
    slug: "tool-calling-internals",
    source: "posts/tool-calling-internals.md",
    title: "Tool Calling 到底发生了什么？",
    category: "Tool calling",
    language: "ZH",
    detail: "完整链路",
    description:
      "从 JSON Tool Call 一路追踪到注册表、参数校验、函数执行和结果回传。",
  },
  {
    number: "05",
    module: "agent",
    group: "核心机制",
    slug: "agent-runtime",
    source: "posts/agent-runtime.md",
    title: "Agent Runtime 到底是什么？",
    category: "Runtime",
    language: "ZH",
    detail: "系统组件",
    description:
      "拆解 Tool Executor、Context、State、Session、Retry、Timeout 与 Cancellation。",
  },
  {
    number: "06",
    module: "agent",
    group: "核心机制",
    slug: "agent-memory",
    source: "posts/agent-memory.md",
    title: "Agent 的 Memory 到底是不是“记忆”？",
    category: "Memory",
    language: "ZH",
    detail: "存储与检索",
    description:
      "辨析 History、短期与长期 Memory、Vector DB、KV Store 和 Summary Memory。",
  },
  {
    number: "07",
    module: "agent",
    group: "核心机制",
    slug: "context-window-vs-memory",
    source: "posts/context-window-vs-memory.md",
    title: "Context Window 为什么不是 Agent Memory？",
    category: "Context",
    language: "ZH",
    detail: "四个概念",
    description:
      "通过长期运行任务，严格区分 Context、Memory、State 与 Knowledge。",
  },
  {
    number: "08",
    module: "agent",
    group: "核心机制",
    slug: "skill-tool-mcp-cli",
    source: "posts/skill-tool-mcp-cli.md",
    title: "Skill、Tool、MCP、CLI 到底有什么区别？",
    category: "Interfaces",
    language: "ZH",
    detail: "分层比较",
    description:
      "把 Skill、Tool、MCP、CLI 与 API 放进同一项任务，观察它们各自所在的层。",
  },
  {
    number: "09",
    module: "agent",
    group: "核心机制",
    slug: "what-mcp-solves",
    source: "posts/what-mcp-solves.md",
    title: "MCP 到底解决了什么问题？",
    category: "MCP",
    language: "ZH",
    detail: "协议边界",
    description:
      "从大量工具接入的重复成本出发，理解 Discovery、Schema、Transport 和资源模型。",
  },
  {
    number: "10",
    module: "agent",
    group: "核心机制",
    slug: "wrong-tool-selection",
    source: "posts/wrong-tool-selection.md",
    title: "Agent 为什么会调用错误的 Tool？",
    category: "Debugging",
    language: "ZH",
    detail: "故障案例",
    description:
      "从一次选错工具的真实式故障，建立 Prompt 到 Runtime Mapping 的排查路径。",
  },
  {
    number: "11",
    module: "agent",
    group: "核心机制",
    slug: "agent-trace",
    source: "posts/agent-trace.md",
    title: "Agent 为什么需要 Trace？",
    category: "Observability",
    language: "ZH",
    detail: "数据模型",
    description:
      "解释普通日志为何不够，并设计一套可以回放 LLM 与工具调用的 Trace 结构。",
  },
  {
    number: "12",
    module: "agent",
    group: "核心机制",
    slug: "reliable-agent-tools",
    source: "posts/reliable-agent-tools.md",
    title: "如何设计一个可靠的 Agent Tool 系统？",
    category: "Tool systems",
    language: "ZH",
    detail: "生产设计",
    description:
      "围绕校验、权限、超时、重试、幂等、追踪和版本控制构建 Runtime 防线。",
  },
  {
    number: "13",
    module: "agent",
    group: "核心机制",
    slug: "agent-debugging",
    source: "posts/agent-debugging.md",
    title: "Agent 最难 Debug 的地方，为什么不是代码？",
    category: "Debugging",
    language: "ZH",
    detail: "方法论",
    description:
      "面对非确定性决策链，把调试重心从静态代码迁移到可复现的执行轨迹。",
  },
  {
    number: "14",
    module: "agent",
    group: "核心机制",
    slug: "agent-as-program",
    source: "posts/agent-as-program.md",
    title: "Agent 是不是一种新的程序？",
    category: "Programming model",
    language: "ZH",
    detail: "开放讨论",
    description:
      "比较 Function、Process、State、Database、Scheduler 与 Agent 系统中的对应物。",
  },
  {
    number: "15",
    module: "agent",
    group: "生产工程",
    slug: "agent-reliability",
    source: "posts/agent-reliability.md",
    title: "From Demo to Production: Four Reliability Pillars for Agents",
    pageTitle: "Agent Reliability — Dale Yang",
    category: "Agent systems",
    language: "EN",
    detail: "7 sections",
    description:
      "A production architecture for explicit state, bounded execution, verified effects, and recovery.",
  },
  {
    number: "16",
    module: "agent",
    group: "生产工程",
    slug: "tool-use-checklist",
    source: "posts/tool-use-checklist.md",
    title: "A Practical Tool-Use Checklist",
    category: "Tooling",
    language: "EN",
    detail: "9 sections",
    description:
      "How to design tool contracts, authorization, idempotency, verification, and recovery.",
  },
  {
    number: "17",
    module: "agent",
    group: "生产工程",
    slug: "trace-native-evaluation",
    source: "posts/trace-native-evaluation.md",
    title: "Trace-Native Evaluation: From a Score to a Release Gate",
    pageTitle: "Trace-Native Evaluation — Dale Yang",
    category: "Evaluation",
    language: "EN",
    detail: "9 sections",
    description:
      "Connect offline replay, trace diagnosis, production signals, and release gates.",
  },
  {
    number: "18",
    module: "agent",
    group: "生产工程",
    slug: "agent-observability",
    source: "posts/agent-observability.md",
    title: "Agent Observability: Metrics That Expose Failure",
    pageTitle: "Agent Observability — Dale Yang",
    category: "Observability",
    language: "EN",
    detail: "12 sections",
    description:
      "Measure verified outcomes, execution depth, token cost, latency, tools, and human control.",
  },
  {
    number: "01",
    module: "computer-systems",
    group: "代码如何运行",
    slug: "program-startup",
    source: "posts/program-startup.md",
    title: "一个程序启动的时候，操作系统到底做了什么？",
    category: "Program loading",
    language: "ZH",
    detail: "从 Shell 到 main",
    description:
      "从 ./app 追踪 fork、exec、ELF、Loader、虚拟内存、动态链接，直到 main 真正执行。",
  },
  {
    number: "02",
    module: "computer-systems",
    group: "代码如何运行",
    slug: "cpu-execution",
    source: "posts/cpu-execution.md",
    title: "CPU 到底在执行什么？",
    category: "CPU",
    language: "ZH",
    detail: "指令与流水线",
    description:
      "从表达式进入汇编和机器码，解释寄存器、ALU、Pipeline 与 Cache 如何协作。",
  },
  {
    number: "03",
    module: "computer-systems",
    group: "代码如何运行",
    slug: "go-source-to-machine-code",
    source: "posts/go-source-to-machine-code.md",
    title: "一行 Go 代码是怎么变成 CPU 指令的？",
    category: "Compiler",
    language: "ZH",
    detail: "a += b",
    description:
      "沿 Go Source、AST、类型检查、SSA IR、汇编和机器码逐层追踪一条加法语句。",
  },
  {
    number: "04",
    module: "computer-systems",
    group: "代码如何运行",
    slug: "compiler-ir",
    source: "posts/compiler-ir.md",
    title: "编译器为什么需要 IR？",
    category: "Compiler",
    language: "ZH",
    detail: "中间表示",
    description:
      "从多语言、多架构与优化 Pass 出发，理解 IR 如何解耦源语言和目标 CPU。",
  },
  {
    number: "05",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "process-explained",
    source: "posts/process-explained.md",
    title: "进程到底是什么？",
    category: "Process",
    language: "ZH",
    detail: "运行时容器",
    description:
      "从可执行文件到地址空间、文件描述符、栈、堆与 PID，解释程序为何不再只是文件。",
  },
  {
    number: "06",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "thread-explained",
    source: "posts/thread-explained.md",
    title: "线程到底是什么？",
    category: "Thread",
    language: "ZH",
    detail: "调度实体",
    description:
      "连接 Thread、CPU Core、Scheduler、时间片、抢占与上下文切换。",
  },
  {
    number: "07",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "goroutine-vs-thread",
    source: "posts/goroutine-vs-thread.md",
    title: "协程到底比线程轻在哪里？",
    category: "Concurrency",
    language: "ZH",
    detail: "Goroutine 实验",
    description:
      "用 Go 代码与可复现实验比较栈、调度、切换成本和内存占用，而不是只说轻量。",
  },
  {
    number: "08",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "cpu-cache",
    source: "posts/cpu-cache.md",
    title: "CPU 为什么需要 Cache？",
    category: "Memory hierarchy",
    language: "ZH",
    detail: "距离与延迟",
    description:
      "从 CPU 与内存的速度差出发，建立 Register、Cache、RAM、SSD 到网络的延迟层次。",
  },
  {
    number: "09",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "malloc-internals",
    source: "posts/malloc-internals.md",
    title: "malloc 到底干了什么？",
    category: "Memory allocation",
    language: "ZH",
    detail: "1024 字节",
    description:
      "追踪 Allocator、Heap、brk、mmap、虚拟页与物理页，解释分配为何不等于占用。",
  },
  {
    number: "10",
    module: "computer-systems",
    group: "进程、线程与内存",
    slug: "virtual-memory-rss-vss",
    source: "posts/virtual-memory-rss-vss.md",
    title: "为什么一个 100MB 的程序，不一定真的占了 100MB 内存？",
    category: "Virtual memory",
    language: "ZH",
    detail: "RSS 与 VSS",
    description:
      "通过进程观测拆解虚拟地址、驻留集、按需分页、mmap 与 Copy-on-Write。",
  },
  {
    number: "11",
    module: "computer-systems",
    group: "网络请求链路",
    slug: "url-request-journey",
    source: "posts/url-request-journey.md",
    title: "输入一个 URL 后，计算机到底发生了什么？",
    category: "Networking",
    language: "ZH",
    detail: "端到端链路",
    description:
      "从 https://example.com 追踪 DNS、Socket、TCP、TLS、HTTP、内核、网卡、路由器和服务器。",
  },
  {
    number: "12",
    module: "computer-systems",
    group: "网络请求链路",
    slug: "tcp-three-way-handshake",
    source: "posts/tcp-three-way-handshake.md",
    title: "TCP 为什么需要三次握手？",
    category: "TCP",
    language: "ZH",
    detail: "证明两次不够",
    description:
      "从双方收发能力、初始序列号和网络旧报文证明第三次确认的必要性。",
  },
  {
    number: "13",
    module: "computer-systems",
    group: "网络请求链路",
    slug: "http-request-network-stack",
    source: "posts/http-request-network-stack.md",
    title: "一个 HTTP 请求是怎么跑到服务器的？",
    category: "Network stack",
    language: "ZH",
    detail: "逐层封装",
    description:
      "沿 HTTP、TCP、IP、Ethernet、NIC、Router 与 Internet 解释每一层增加的信息。",
  },
  {
    number: "14",
    module: "computer-systems",
    group: "存储与数据库",
    slug: "database-write-path",
    source: "posts/database-write-path.md",
    title: "数据库为什么不能直接把数据写进硬盘？",
    category: "Database storage",
    language: "ZH",
    detail: "INSERT 路径",
    description:
      "追踪 Buffer Pool、WAL、Page Cache、Filesystem、Block Device 与 SSD 的分层写入。",
  },
  {
    number: "15",
    module: "computer-systems",
    group: "存储与数据库",
    slug: "database-wal",
    source: "posts/database-wal.md",
    title: "数据库为什么需要 WAL？",
    category: "Database recovery",
    language: "ZH",
    detail: "断电实验",
    description:
      "设计写入后断电实验，连接 Log、Flush、Commit、Checkpoint 与崩溃恢复。",
  },
  {
    number: "16",
    module: "computer-systems",
    group: "存储与数据库",
    slug: "ssd-internals",
    source: "posts/ssd-internals.md",
    title: "SSD 到底是怎么工作的？",
    category: "Storage",
    language: "ZH",
    detail: "从 write 到 NAND",
    description:
      "沿文件系统、块层、Controller、FTL 与 NAND 追踪写入，解释擦除、映射和写放大。",
  },
  {
    number: "17",
    module: "computer-systems",
    group: "存储与数据库",
    slug: "file-write-path",
    source: "posts/file-write-path.md",
    title: "一个文件到底是怎么存进硬盘的？",
    category: "Filesystem",
    language: "ZH",
    detail: "write(\"hello\")",
    description:
      "从文件描述符、系统调用、Inode、Page Cache 和 Block 一路走到 SSD。",
  },
  {
    number: "01",
    module: "backend",
    group: "完整指南",
    slug: "backend-interview-guide",
    source: "posts/backend-interview-guide.md",
    title: "后端开发八股文指南",
    category: "Backend",
    language: "ZH",
    detail: "90 topics",
    description:
      "Java、Go、JVM、Redis、MySQL、MQ、网络与分布式系统，九个模块、90 个高频知识点。",
  },
];

marked.setOptions({
  gfm: true,
  breaks: false,
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function headingId(value, counts) {
  const plain = value
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim()
    .toLowerCase();
  const base =
    plain
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function renderMarkdown(markdown) {
  const counts = new Map();
  let html = marked
    .parse(markdown)
    .replace(/href="#([^"]+)"/g, 'href="#section-$1"');

  html = html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (_, level, content) =>
      `<h${level} id="section-${headingId(content, counts)}">${content}</h${level}>`,
  );

  return html
    .replace(/\sdisabled=""/g, " disabled")
    .replace(/\salign="(?:left|center|right)"/g, "")
    .replace(
      /<table>([\s\S]*?)<\/table>/g,
      '<div class="table-scroll"><table>$1</table></div>',
    );
}

function moduleStatus(module) {
  const count = notes.filter((note) => note.module === module.slug).length;
  if (count === 0) return module.emptyStatus ?? "即将开始";
  return `${count} 篇文章${module.detail ? ` / ${module.detail}` : ""}`;
}

function documentShell({
  title,
  description,
  body,
  bodyClass,
  assetPrefix = "",
  lang = "en",
}) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f1f1ee">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${assetPrefix}assets/site.css">
</head>
<body class="${bodyClass}">
  <div class="reading-progress" id="readingProgress" aria-hidden="true"></div>
${body}
  <script src="${assetPrefix}assets/site.js" defer></script>
</body>
</html>
`;
}

function renderIndex() {
  const rows = modules
    .map(
      (module) => `
        <a class="note-row module-row" href="sections/${module.slug}.html">
          <span class="note-number">${module.number}</span>
          <span class="note-copy">
            <span class="note-meta">${module.label} / ${moduleStatus(module)}</span>
            <strong>${module.title}</strong>
            <span class="note-description">${module.description}</span>
          </span>
          <span class="note-arrow" aria-hidden="true">↗</span>
        </a>`,
    )
    .join("");

  const body = `
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="Dale Yang home">DY<span>.</span></a>
    <nav aria-label="Primary">
      <a href="#explore">Explore</a>
      <a href="https://github.com/yjd953">GitHub</a>
    </nav>
  </header>

  <main>
    <section class="index-intro">
      <p class="kicker">Dale Yang / Agent engineer</p>
      <h1>Engineering<br>notes<span>.</span></h1>
      <p class="intro-copy">
        从 Agent 如何行动，到程序如何运行，再到后端系统如何落地。
        三条路径，持续向底层追问。
      </p>
    </section>

    <section class="writing-index" id="explore" aria-labelledby="writingTitle">
      <div class="section-label">
        <h2 id="writingTitle">Explore by subject</h2>
        <span>${String(modules.length).padStart(2, "0")} modules</span>
      </div>
      <div class="note-list">${rows}
      </div>
    </section>

    <section class="activity-strip" aria-labelledby="activityTitle">
      <div class="section-label">
        <h2 id="activityTitle">Open source activity</h2>
        <a href="https://github.com/yjd953">View profile ↗</a>
      </div>
      <img src="assets/github-snake.svg" alt="GitHub contribution history">
    </section>
  </main>

  <footer class="site-footer">
    <span>Dale Yang</span>
    <span>Beijing / 2026</span>
  </footer>`;

  return documentShell({
    title: "Dale Yang — Engineering Paths",
    description:
      "Deep notes on Agent systems, computer systems, and backend engineering.",
    body,
    bodyClass: "index-page",
    lang: "zh-CN",
  });
}

function renderSection(module, moduleNotes) {
  const groups = [...new Set(moduleNotes.map((note) => note.group))];
  const contents =
    groups.length > 0
      ? groups
          .map((group) => {
            const rows = moduleNotes
              .filter((note) => note.group === group)
              .map(
                (note) => `
          <a class="note-row" href="../notes/${note.slug}.html">
            <span class="note-number">${note.number}</span>
            <span class="note-copy">
              <span class="note-meta">${note.category} / ${note.language} / ${note.detail}</span>
              <strong>${note.title}</strong>
              <span class="note-description">${note.description}</span>
            </span>
            <span class="note-arrow" aria-hidden="true">↗</span>
          </a>`,
              )
              .join("");

            return `
      <section class="section-group" aria-labelledby="group-${headingId(group, new Map())}">
        <div class="section-label">
          <h2 id="group-${headingId(group, new Map())}">${group}</h2>
          <span>${String(moduleNotes.filter((note) => note.group === group).length).padStart(2, "0")} notes</span>
        </div>
        <div class="note-list">${rows}
        </div>
      </section>`;
          })
          .join("")
      : `
      <section class="empty-state">
        <span class="note-meta">In progress</span>
        <h2>内容正在搭建。</h2>
        <p>这个模块会从基础机制开始，按照可验证、可运行的方式逐篇展开。</p>
      </section>`;

  const body = `
  <header class="site-header">
    <a class="wordmark" href="../" aria-label="Dale Yang home">DY<span>.</span></a>
    <nav aria-label="Primary">
      <a href="../">All modules</a>
      <a href="https://github.com/yjd953">GitHub</a>
    </nav>
  </header>

  <main class="section-layout">
    <header class="section-masthead">
      <a class="back-link" href="../">← All modules</a>
      <p class="kicker">${module.number} / ${module.label}</p>
      <h1>${module.title}<span>.</span></h1>
      <p>${module.description}</p>
    </header>
${contents}
  </main>

  <footer class="site-footer">
    <a href="../">Dale Yang / Engineering paths</a>
    <span>${moduleStatus(module)}</span>
  </footer>`;

  return documentShell({
    title: `${module.title} — Dale Yang`,
    description: module.description,
    body,
    bodyClass: "section-page",
    assetPrefix: "../",
    lang: "zh-CN",
  });
}

function renderArticle(note, content) {
  const module = modules.find((entry) => entry.slug === note.module);
  const sectionUrl = `../sections/${module.slug}.html`;
  const body = `
  <header class="site-header">
    <a class="wordmark" href="../" aria-label="Dale Yang home">DY<span>.</span></a>
    <nav aria-label="Primary">
      <a href="${sectionUrl}">${module.title}</a>
      <a href="https://github.com/yjd953">GitHub</a>
    </nav>
  </header>

  <main class="article-layout">
    <header class="article-masthead">
      <a class="back-link" href="${sectionUrl}">← ${module.title}</a>
      <p class="kicker">${module.number}.${note.number} / ${note.category} / ${note.language}</p>
      <h1>${note.title}</h1>
      <p class="article-deck">${note.description}</p>
    </header>

    <article class="prose">
      ${content}
    </article>
  </main>

  <footer class="site-footer article-footer">
    <a href="${sectionUrl}">${module.title} / ${note.group}</a>
    <a href="https://github.com/yjd953/yjd953/blob/main/${note.source}">View source ↗</a>
  </footer>`;

  return documentShell({
    title: note.pageTitle ?? `${note.title} — Dale Yang`,
    description: note.description,
    body,
    bodyClass: "article-page",
    assetPrefix: "../",
    lang: note.language === "ZH" ? "zh-CN" : "en",
  });
}

await mkdir(join(root, "notes"), { recursive: true });
await mkdir(join(root, "sections"), { recursive: true });
await writeFile(join(root, "index.html"), renderIndex());

for (const module of modules) {
  await writeFile(
    join(root, "sections", `${module.slug}.html`),
    renderSection(
      module,
      notes.filter((note) => note.module === module.slug),
    ),
  );
}

for (const note of notes) {
  const markdown = (await readFile(join(root, note.source), "utf8"))
    .replace(/^#\s+.+\n+/, "")
    .replace(/\n\[Back to notes\]\(\.\.\/\)\s*$/i, "");
  await writeFile(
    join(root, "notes", `${note.slug}.html`),
    renderArticle(note, renderMarkdown(markdown)),
  );
}

console.log(
  `Built index, ${modules.length} module pages, and ${notes.length} article pages.`,
);
