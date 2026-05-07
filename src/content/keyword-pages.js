export const keywordPages = [
  {
    path: '/ladybird-github',
    title: 'Ladybird GitHub Guide',
    description:
      'A practical guide to the Ladybird GitHub repository, current project status, build expectations, and what teams should watch before testing an independent browser engine.',
    eyebrow: 'Source guide',
    h1: 'Ladybird GitHub: what to know before you clone or evaluate it',
    intent:
      'For developers who found the repository and want a clear, business-readable view of what is mature, what is moving, and what needs monitoring.',
    lede:
      'The public Ladybird GitHub repository is the right place to study the engine, follow implementation work, and understand how an independent browser is being built. It is not a polished consumer download yet, so teams get more value by turning repository movement into a readiness checklist.',
    sections: [
      {
        heading: 'What the repository represents',
        paragraphs: [
          'Ladybird is a new browser engine and browser application built around web standards rather than a fork of Blink, WebKit, or Gecko. The repository contains the engine libraries, UI work, tests, documentation, and the build tooling needed by contributors.',
          'The project is still pre-alpha. That matters for evaluation: you should treat it as a fast-moving engineering project, not as a drop-in replacement for your daily production browser.',
        ],
        bullets: [
          'Watch engine areas such as LibWeb, LibJS, LibWasm, networking, media, and rendering.',
          'Read monthly project updates before assuming a feature is present or missing.',
          'Track issue policy and build instructions before opening compatibility reports.',
        ],
      },
      {
        heading: 'How Ladybird Best helps',
        paragraphs: [
          'Ladybird Best turns the public project signal into a site-readiness workflow. Instead of asking a product manager to interpret commits, it starts from your URL, flags common independent-engine risks, and gives the team a short action plan.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Ladybird GitHub the official source?',
        answer:
          'Yes. The official source repository is maintained under the LadybirdBrowser organization. Ladybird Best is an independent readiness workspace and is not the official project.',
      },
      {
        question: 'Should I file every broken site as a GitHub issue?',
        answer:
          'No. Read the project issue policy first. For early evaluations, keep your own compatibility notes and only report well-reduced, actionable issues.',
      },
    ],
  },
  {
    path: '/ladybird-where-to-watch',
    title: 'Ladybird Where to Watch',
    description:
      'A disambiguation guide for Ladybird where to watch searches: Ladybird Browser videos, project updates, and the separate Lady Bird film or TV meanings.',
    eyebrow: 'Disambiguation',
    h1: 'Ladybird where to watch: browser updates, demos, and the movie mix-up',
    intent:
      'For visitors who may mean Ladybird Browser project videos or may be looking for the unrelated Lady Bird film and streaming availability.',
    lede:
      '“Ladybird where to watch” can mean two very different things. If you mean the browser, watch official project talks, monthly updates, and demos. If you mean the film or another entertainment title, availability depends on your country and changes often.',
    sections: [
      {
        heading: 'If you mean Ladybird Browser',
        paragraphs: [
          'Start with the official Ladybird site, the project news archive, and the project video channels. Those sources explain the engine roadmap, alpha timing, sponsor updates, and technical progress without mixing it with unrelated entertainment results.',
          'For teams evaluating web compatibility, a paid readiness workflow is usually more useful than passively watching demos because it turns curiosity into a list of fixes for your own site.',
        ],
        bullets: [
          'Watch recent monthly updates before making a build or adoption decision.',
          'Use official source links when sharing the project internally.',
          'Attach your own URL to a readiness workspace if your goal is business planning.',
        ],
      },
      {
        heading: 'If you mean the film or a show',
        paragraphs: [
          'Streaming availability changes by region and by date. Use a local availability search provider such as JustWatch, Reelgood, or the streaming apps available in your country. Do not assume Netflix, Prime Video, Apple TV, or any single service has it today.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is this page about the Lady Bird movie?',
        answer:
          'Only as a clarification. Ladybird Best focuses on the browser project and independent-engine readiness, not entertainment streaming.',
      },
      {
        question: 'Where should developers watch Ladybird progress?',
        answer:
          'Use the official Ladybird website, GitHub repository, project news posts, and official community channels.',
      },
    ],
  },
  {
    path: '/ladybug-or-ladybird',
    title: 'Ladybug or Ladybird Meaning',
    description:
      'A simple guide to ladybug or ladybird wording, regional usage, and why the browser project is called Ladybird.',
    eyebrow: 'Name guide',
    h1: 'Ladybug or ladybird: the name difference and why it matters online',
    intent:
      'For people who are unsure whether Ladybug and Ladybird mean the same insect, the browser, or a brand name.',
    lede:
      'Ladybug and ladybird usually describe the same small beetle. “Ladybug” is more common in American English, while “ladybird” is common in British English. The browser project uses Ladybird as a proper name.',
    sections: [
      {
        heading: 'The language difference',
        paragraphs: [
          'In everyday speech, both words point to the same familiar red-and-black beetle. Search results get messy because the same word also appears in film titles, children’s books, fashion, software projects, and brand names.',
          'When you are evaluating the browser project, use “Ladybird Browser” or “Ladybird GitHub” to avoid insect and entertainment results.',
        ],
      },
      {
        heading: 'How to search more precisely',
        paragraphs: [
          'For engineering topics, add terms such as browser, engine, GitHub, download, OS, Swift, or Netflix. Each qualifier changes the intent, and some intents are really about compatibility planning rather than the insect itself.',
        ],
        bullets: [
          'Use Ladybird Browser for the independent web engine.',
          'Use ladybug or ladybird for language and insect meaning.',
          'Use Lady Bird with a space for the 2017 film in many entertainment databases.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are ladybug and ladybird the same?',
        answer:
          'In common usage, yes. The difference is mostly regional wording, not a different animal.',
      },
      {
        question: 'Does the browser project use Ladybug?',
        answer:
          'No. The independent browser project is named Ladybird.',
      },
    ],
  },
  {
    path: '/ladybird-swift',
    title: 'Ladybird Swift Guide',
    description:
      'What Swift developers should know about Ladybird Browser, macOS expectations, WKWebView today, and independent engine planning.',
    eyebrow: 'Swift teams',
    h1: 'Ladybird Swift: what macOS and iOS developers should know',
    intent:
      'For Swift teams wondering whether Ladybird can be embedded, scripted, or used as an alternative browser engine today.',
    lede:
      'Swift developers often search for Ladybird because macOS is part of the project’s alpha target. The important distinction is that Ladybird is a browser and engine project, not a Swift SDK you can drop into an iOS app today.',
    sections: [
      {
        heading: 'What exists today',
        paragraphs: [
          'Ladybird is primarily an engine and browser effort with a growing mix of C++, Rust, web-platform code, and platform frontends. macOS support is part of the public alpha target, but that does not make it a general-purpose Swift browser component.',
          'For production Apple-platform apps, WKWebView remains the practical embedded web view today. Ladybird is more relevant as an independent-engine signal and future compatibility target.',
        ],
      },
      {
        heading: 'How Swift teams can prepare',
        paragraphs: [
          'The useful work is to reduce browser-specific assumptions in your web app: feature-detect instead of engine-detect, avoid brittle UA gates, test media assumptions, and keep authentication flows standards-based.',
        ],
        bullets: [
          'Audit user-agent checks and Safari-only branches.',
          'Keep passkeys, popups, and OAuth redirects standards-friendly.',
          'Track Ladybird macOS progress before promising support dates.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is there a Ladybird Swift SDK?',
        answer:
          'Not as a stable product interface for app developers. Treat Ladybird as a browser-engine project to monitor, not a Swift package to ship today.',
      },
      {
        question: 'Can I use Ladybird on iOS?',
        answer:
          'Mobile is not the main public priority right now. If you need production iOS web content, plan around Apple’s current platform rules and WKWebView.',
      },
    ],
  },
  {
    path: '/ladybird-browser',
    title: 'Ladybird Browser Readiness',
    description:
      'Understand Ladybird Browser, its independent engine goals, current pre-alpha status, and how to prepare a site for future testing.',
    eyebrow: 'Browser guide',
    h1: 'Ladybird Browser: prepare your site for a truly independent web engine',
    intent:
      'For product, engineering, and growth teams who want the browser story in plain language before investing time in testing.',
    lede:
      'Ladybird Browser is interesting because it is not another skin on an existing engine. It aims to become a complete modern browser with a new standards-driven engine, a multi-process architecture, and no user monetization model.',
    sections: [
      {
        heading: 'Why teams are paying attention',
        paragraphs: [
          'The modern web depends heavily on a small number of browser engines. A credible independent engine creates a healthier compatibility target and a cleaner reason to build sites around standards rather than vendor assumptions.',
          'For a business site, the practical question is not “will every feature work today?” It is “which parts of our site assume today’s dominant engines, and can we reduce those assumptions before independent browsers matter more?”',
        ],
      },
      {
        heading: 'Readiness areas to watch',
        paragraphs: [
          'Good preparation usually starts with HTML structure, CSS feature detection, JavaScript module delivery, authentication redirects, media playback assumptions, PDF handling, and privacy-sensitive third-party tags.',
        ],
        bullets: [
          'Use standards-based feature detection over browser sniffing.',
          'Keep checkout and login flows resilient to popup and redirect differences.',
          'Document media and DRM constraints honestly before promising support.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is Ladybird Browser ready for normal users?',
        answer:
          'The project describes itself as pre-alpha and aimed at developers right now. Treat it as an evaluation target, not a mainstream replacement.',
      },
      {
        question: 'What does Ladybird Best review?',
        answer:
          'It checks URL-level signals, headers, markup hints, media risk, privacy friction, and engine-specific assumptions, then turns the result into a short testing plan.',
      },
    ],
  },
  {
    path: '/ladybird-os',
    title: 'Ladybird OS Clarification',
    description:
      'Clarifies Ladybird OS searches: Ladybird is a browser, its history with SerenityOS, and what that means for testers.',
    eyebrow: 'OS clarification',
    h1: 'Ladybird OS: is Ladybird an operating system?',
    intent:
      'For searchers who have seen SerenityOS references and want to know whether Ladybird is an OS, browser, or both.',
    lede:
      'Ladybird is a browser project, not an operating system. The confusion comes from its history with SerenityOS and shared libraries that helped the browser grow from a larger from-scratch computing project.',
    sections: [
      {
        heading: 'The SerenityOS connection',
        paragraphs: [
          'Many core components historically came from the SerenityOS ecosystem, including web rendering, JavaScript, graphics, Unicode, media, networking, and IPC libraries. Ladybird has since become its own browser-focused initiative.',
          'That history matters because it explains the project culture: a strong interest in understanding the stack deeply, reducing dependency on incumbent engines, and building a browser around standards.',
        ],
      },
      {
        heading: 'What to test instead of an OS',
        paragraphs: [
          'For a website owner, the relevant target is browser compatibility: markup, scripts, network behavior, popups, media, PDFs, storage, and login flows. You do not need to plan around a separate Ladybird operating system.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is there a Ladybird OS download?',
        answer:
          'No. The public Ladybird project is a browser and engine effort. Search for SerenityOS separately if your interest is the operating system lineage.',
      },
      {
        question: 'Does the OS history affect site readiness?',
        answer:
          'Indirectly. It explains why the engine is independent, but your practical checklist should focus on web standards and browser behavior.',
      },
    ],
  },
  {
    path: '/ladybird-download',
    title: 'Ladybird Download Guide',
    description:
      'A careful Ladybird download guide covering pre-alpha status, build-from-source expectations, supported targets, and safe evaluation steps.',
    eyebrow: 'Download guide',
    h1: 'Ladybird download: safe expectations before you try the browser',
    intent:
      'For people looking for a Ladybird download and needing a clear warning that the project is pre-alpha.',
    lede:
      'If you are looking for a polished installer, pause first. Ladybird is in active pre-alpha development and is mainly suitable for developers and early testers who can build from source and tolerate breakage.',
    sections: [
      {
        heading: 'What “download” means right now',
        paragraphs: [
          'The official path is to use the source repository and build instructions. Public project material points toward an alpha release for Linux and macOS, but until stable releases exist, unofficial downloads should be treated carefully.',
          'Do not download random binaries from unfamiliar sites. If your goal is business readiness, start with a compatibility plan before asking engineers to build the browser locally.',
        ],
        bullets: [
          'Use official project links for source and documentation.',
          'Expect developer-focused setup, not a consumer browser installer.',
          'Document which site flows you want to test before building.',
        ],
      },
      {
        heading: 'A better first test for teams',
        paragraphs: [
          'Attach your public URL to a paid readiness review first. It will not replace real browser testing, but it helps you decide whether the next hour should go into build setup, authentication cleanup, media testing, or checkout-flow hardening.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is there an official stable Ladybird download?',
        answer:
          'Not as a mainstream stable browser release. Follow the official site and repository for current build and alpha information.',
      },
      {
        question: 'Can I test my site without building Ladybird first?',
        answer:
          'Yes. Start with a paid readiness review to catch obvious standards, header, media, and flow risks, then move to real browser testing when you need proof.',
      },
    ],
  },
  {
    path: '/ladybird-netflix',
    title: 'Ladybird Netflix Compatibility',
    description:
      'What to know about Ladybird Netflix expectations, DRM, media playback, and why streaming compatibility is a special browser-engine challenge.',
    eyebrow: 'Media compatibility',
    h1: 'Ladybird Netflix: why streaming support is harder than loading a page',
    intent:
      'For visitors wondering whether Ladybird Browser can play Netflix or whether media-heavy sites should expect early support.',
    lede:
      'Netflix compatibility is not just HTML, CSS, and JavaScript. It usually involves media pipelines, encrypted playback, codecs, account flows, performance, and business-side DRM rules that independent browsers must handle carefully.',
    sections: [
      {
        heading: 'Why Netflix is a tough test',
        paragraphs: [
          'A browser can render many ordinary pages before it can satisfy the full stack required by major streaming services. Encrypted Media Extensions, codec support, secure playback paths, and service-specific checks all matter.',
          'That does not make Ladybird less interesting. It simply means streaming sites are among the last compatibility promises a serious browser project should make.',
        ],
      },
      {
        heading: 'How media-heavy teams should prepare',
        paragraphs: [
          'If your product depends on video, audio, DRM, live streaming, captions, or protected downloads, track those risks separately from general page rendering. A clean landing page and a protected player can have completely different readiness profiles.',
        ],
        bullets: [
          'Separate marketing-page readiness from player readiness.',
          'List required codecs, DRM assumptions, subtitles, and fullscreen behavior.',
          'Test purchase, login, and playback as one journey, not isolated pages.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can Ladybird Browser play Netflix today?',
        answer:
          'Do not assume it can. The project is pre-alpha, and DRM-heavy streaming is a specialized compatibility area.',
      },
      {
        question: 'Should I test ordinary video sites differently?',
        answer:
          'Yes. Public video, protected video, live video, and downloadable media each exercise different browser capabilities.',
      },
    ],
  },
]

export function findKeywordPageByPath(pathname) {
  const normalized = normalizePath(pathname)
  return keywordPages.find((page) => page.path === normalized) || null
}

export function normalizePath(pathname) {
  const clean = `/${String(pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')}`
  return clean === '/.' ? '/' : clean
}
