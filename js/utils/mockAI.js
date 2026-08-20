// ============================================
// DHRYZN — Stateful AI Conversation Engine
// ============================================
// Replaces keyword matching with a finite state machine.
// Flow: Message → Read State → Continue Workflow OR Detect Intent → Update State → Respond

// ---- Constants ----
const RESPONSE_DELAY_MIN = 800;
const RESPONSE_DELAY_MAX = 2000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return RESPONSE_DELAY_MIN + Math.random() * (RESPONSE_DELAY_MAX - RESPONSE_DELAY_MIN);
}

// ---- Conversation Modes ----
const MODES = {
  IDLE: 'idle',
  QUIZ: 'quiz',
  EXPLAIN: 'explain',
  EXAM: 'exam'
};

// ---- Quiz Workflow Steps ----
const QUIZ_STEPS = ['subject', 'topic', 'difficulty', 'questionType', 'questionCount', 'confirm'];
const EXPLAIN_STEPS = ['topic', 'style', 'confirm'];
const EXAM_STEPS = ['subject', 'topic', 'difficulty', 'questionCount', 'confirm'];

// ---- Difficulty / Question Type Validation ----
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_QUESTION_TYPES = ['multiple choice', 'true / false', 'true/false', 'short answer', 'essay'];
const VALID_EXPLAIN_STYLES = ['quick summary', 'step-by-step', 'detailed', 'with examples'];

// Normalize question type to match sampleData.js values
function normalizeQuestionType(input) {
  const lower = input.toLowerCase().trim();
  if (lower.includes('multiple') || lower === 'mc' || lower === '1') return 'Multiple Choice';
  if (lower.includes('true') || lower.includes('false') || lower === 'tf' || lower === '2') return 'True / False';
  if (lower.includes('short') || lower === 'sa' || lower === '3') return 'Short Answer';
  if (lower.includes('essay') || lower === '4') return 'Essay';
  return null;
}

function normalizeDifficulty(input) {
  const lower = input.toLowerCase().trim();
  if (lower.includes('easy') || lower === '1') return 'Easy';
  if (lower.includes('medium') || lower === 'med' || lower === '2') return 'Medium';
  if (lower.includes('hard') || lower === 'difficult' || lower === '3') return 'Hard';
  return null;
}

function normalizeExplainStyle(input) {
  const lower = input.toLowerCase().trim();
  if (lower.includes('quick') || lower.includes('summary') || lower === '1') return 'Quick Summary';
  if (lower.includes('step') || lower === '2') return 'Step-by-Step';
  if (lower.includes('detail') || lower === '3') return 'Detailed';
  if (lower.includes('example') || lower === '4') return 'With Examples';
  return null;
}

function normalizeQuestionCount(input) {
  const num = parseInt(input.trim());
  if (!isNaN(num) && num >= 1 && num <= 50) return num;
  // Try extracting number from text like "give me 10"
  const match = input.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1]);
    if (n >= 1 && n <= 50) return n;
  }
  return null;
}

// ---- Intent Detection (only runs when IDLE) ----

const INTENT_PATTERNS = [
  {
    intent: 'quiz',
    patterns: [
      /\b(quiz|quizzes)\b/i,
      /\btest\s+me\b/i,
      /\bgenerate\s+(a\s+)?quiz\b/i,
      /\bpractice\s+questions?\b/i,
      /\bi\s+want\s+(a\s+)?quiz\b/i,
      /\bcreate\s+(a\s+)?quiz\b/i,
      /\bstart\s+(a\s+)?quiz\b/i,
      /\bmake\s+(a\s+)?quiz\b/i
    ]
  },
  {
    intent: 'explain',
    patterns: [
      /\bexplain\b/i,
      /\bwhat\s+is\b/i,
      /\bhow\s+does\b/i,
      /\btell\s+me\s+about\b/i,
      /\bteach\s+me\b/i,
      /\bi\s+want\s+to\s+(learn|understand|know)\b/i,
      /\bhelp\s+me\s+understand\b/i,
      /\bbreak\s+(it\s+)?down\b/i
    ]
  },
  {
    intent: 'exam',
    patterns: [
      /\b(practice\s+)?exam\b/i,
      /\bsimulat(e|ion)\b/i,
      /\bmock\s+(test|exam)\b/i,
      /\bprepare\b/i,
      /\bexam\s+ready\b/i,
      /\bfull\s+test\b/i
    ]
  },
  {
    intent: 'greeting',
    patterns: [
      /^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|howdy|what'?s\s*up)\b/i
    ]
  },
  {
    intent: 'thanks',
    patterns: [
      /\b(thanks?|thank\s*you|thx|appreciated|ty)\b/i
    ]
  },
  {
    intent: 'help',
    patterns: [
      /\bhelp\b/i,
      /\bwhat\s+can\s+you\s+do\b/i,
      /\bfeatures?\b/i,
      /\bcommands?\b/i,
      /\boptions?\b/i
    ]
  },
  {
    intent: 'cancel',
    patterns: [
      /\b(cancel|stop|nevermind|never\s*mind|abort|quit|exit|go\s+back|restart)\b/i
    ]
  },
  {
    intent: 'farewell',
    patterns: [
      /\b(bye|goodbye|good\s*bye|see\s+ya|later|cya|gtg|gotta\s+go)\b/i
    ]
  }
];

function detectIntent(message) {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return intent;
      }
    }
  }
  return 'unknown';
}

// Try to extract a subject hint from a natural-language message
function extractSubjectFromMessage(message) {
  // "I want to study Chemistry" → "Chemistry"
  const studyMatch = message.match(/(?:study|learn|practice|about|on|for)\s+(.+)/i);
  if (studyMatch) return studyMatch[1].trim();
  return null;
}


// ============================================================
// ConversationEngine — the core stateful processor
// ============================================================

export class ConversationEngine {
  constructor() {
    // Default state — overwritten by loadState() in dashboard
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      mode: MODES.IDLE,
      step: null,        // current step within the active workflow
      data: {            // collected user inputs
        subject: null,
        topic: null,
        difficulty: null,
        questionType: null,
        questionCount: null,
        explainStyle: null
      },
      history: []        // recent {role, content} pairs for context window
    };
  }

  /** Restore state from a plain object (e.g. from localStorage via Store) */
  loadState(saved) {
    if (saved && saved.mode) {
      this.state = { ...this.getDefaultState(), ...saved, data: { ...this.getDefaultState().data, ...(saved.data || {}) } };
    }
  }

  /** Return a plain-object snapshot for persistence */
  exportState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /** Reset conversation to IDLE */
  reset() {
    this.state = this.getDefaultState();
  }

  // --------------------------------------------------
  // Main entry point — processes one user message
  // --------------------------------------------------
  async processMessage(message) {
    await delay(randomDelay());

    const trimmed = message.trim();
    if (!trimmed) return "I didn't catch that. Could you say that again? 🤔";

    // Keep a short history for context (last 20 messages)
    this.state.history.push({ role: 'user', content: trimmed });
    if (this.state.history.length > 20) this.state.history = this.state.history.slice(-20);

    let response;

    // ========== STEP 1: Check for cancel/restart at any time ==========
    if (this._isCancelIntent(trimmed) && this.state.mode !== MODES.IDLE) {
      response = this._handleCancel();
    }
    // ========== STEP 2: If inside a workflow, continue it ==========
    else if (this.state.mode !== MODES.IDLE) {
      response = this._continueWorkflow(trimmed);
    }
    // ========== STEP 3: IDLE — detect intent ==========
    else {
      response = this._handleIdle(trimmed);
    }

    // Keep AI response in history
    this.state.history.push({ role: 'ai', content: response });
    if (this.state.history.length > 20) this.state.history = this.state.history.slice(-20);

    return response;
  }

  // --------------------------------------------------
  // Cancel handling
  // --------------------------------------------------
  _isCancelIntent(message) {
    return /\b(cancel|stop|nevermind|never\s*mind|abort|quit|exit|go\s*back|restart|start\s*over)\b/i.test(message);
  }

  _handleCancel() {
    this.reset();
    return `No worries! I've cancelled the current task. 😊\n\nWhat would you like to do next?\n\n1️⃣ **Generate Quiz** — Test your knowledge\n2️⃣ **Explain Topic** — Get clear explanations\n3️⃣ **Practice Exam** — Simulate real conditions\n\nJust pick an option or tell me what you need!`;
  }

  // --------------------------------------------------
  // IDLE state — detect intent and start workflow
  // --------------------------------------------------
  _handleIdle(message) {
    const intent = detectIntent(message);

    switch (intent) {
      case 'quiz':
        return this._startQuizFlow(message);

      case 'explain':
        return this._startExplainFlow(message);

      case 'exam':
        return this._startExamFlow(message);

      case 'greeting':
        return `Hey there! 👋 Great to see you! I'm DHRYZN, your personal study mentor.\n\nWhat would you like to work on today?\n\n1️⃣ **Generate Quiz** — Test your knowledge\n2️⃣ **Explain Topic** — Get clear explanations\n3️⃣ **Practice Exam** — Simulate real conditions\n\nJust type the number or tell me what you'd like!`;

      case 'thanks':
        return `You're very welcome! 😊 Remember, every question you ask makes you a better learner. I'm always here whenever you need help.\n\nKeep up the great work! 🌟`;

      case 'farewell':
        return `Bye for now! 👋 Keep studying hard — you've got this! See you next time! 🌟`;

      case 'help':
        return `I'm your personal AI Study Mentor! Here's what I can do: 🌟\n\n1️⃣ **Generate Quiz** — Custom quizzes with instant feedback\n2️⃣ **Explain Topic** — Clear, step-by-step explanations\n3️⃣ **Practice Exam** — Realistic exam simulations\n\nJust type a number, or say something like:\n• *"Quiz me on Chemistry"*\n• *"Explain photosynthesis"*\n• *"I want a practice exam"*\n\nWhat would you like to do? 🎯`;

      case 'cancel':
        return `Nothing to cancel — we're all good! 😊\n\nWhat would you like to work on?\n\n1️⃣ **Generate Quiz**\n2️⃣ **Explain Topic**\n3️⃣ **Practice Exam**`;

      default:
        return this._handleAmbiguousIdle(message);
    }
  }

  /** Handle messages that don't match any clear intent */
  _handleAmbiguousIdle(message) {
    // Check if the user typed a number (menu selection)
    const num = message.trim();
    if (num === '1') return this._startQuizFlow(message);
    if (num === '2') return this._startExplainFlow(message);
    if (num === '3') return this._startExamFlow(message);

    return `I'm here to help you learn! 📚\n\nHere are things I can do:\n\n1️⃣ **Generate Quiz** — Test your knowledge\n2️⃣ **Explain Topic** — Get clear explanations\n3️⃣ **Practice Exam** — Simulate real conditions\n\nJust pick a number or tell me what you'd like to do! 🎯`;
  }


  // ============================================================
  // QUIZ WORKFLOW
  // ============================================================

  _startQuizFlow(message) {
    this.state.mode = MODES.QUIZ;
    this.state.data = { subject: null, topic: null, difficulty: null, questionType: null, questionCount: null, explainStyle: null };

    // Try to extract subject from the initial message
    // e.g. "Quiz me on Chemistry" → subject = Chemistry
    const hint = extractSubjectFromMessage(message);
    if (hint) {
      this.state.data.subject = hint;
      this.state.step = 'topic';
      return `Great choice! 📚 I'll prepare a **${hint}** quiz for you.\n\nWhat specific **topic** would you like to focus on?\n\n*(e.g., Stoichiometry, Organic Chemistry, Chemical Bonding...)*`;
    }

    this.state.step = 'subject';
    return `Awesome! Let's create a quiz for you! 🎯\n\nFirst, what **subject** would you like to study?\n\n*(e.g., Mathematics, Physics, Chemistry, Japanese, History...)*`;
  }

  _continueQuizFlow(message) {
    switch (this.state.step) {
      case 'subject':
        return this._quizSetSubject(message);
      case 'topic':
        return this._quizSetTopic(message);
      case 'difficulty':
        return this._quizSetDifficulty(message);
      case 'questionType':
        return this._quizSetQuestionType(message);
      case 'questionCount':
        return this._quizSetQuestionCount(message);
      case 'confirm':
        return this._quizConfirm(message);
      default:
        // Shouldn't happen — recover gracefully
        this.state.step = 'subject';
        return `Let's start fresh! What **subject** would you like your quiz on?`;
    }
  }

  _quizSetSubject(message) {
    this.state.data.subject = message.trim();
    this.state.step = 'topic';
    return `**${this.state.data.subject}** — great subject! 📖\n\nNow, what specific **topic** would you like to focus on?\n\n*(e.g., a chapter, concept, or area within ${this.state.data.subject})*`;
  }

  _quizSetTopic(message) {
    this.state.data.topic = message.trim();
    this.state.step = 'difficulty';
    return `Got it — **${this.state.data.topic}**! 📝\n\nWhat **difficulty level** would you like?\n\n1️⃣ **Easy** — Foundational concepts\n2️⃣ **Medium** — Standard difficulty\n3️⃣ **Hard** — Challenging questions`;
  }

  _quizSetDifficulty(message) {
    const difficulty = normalizeDifficulty(message);
    if (!difficulty) {
      return `I didn't quite get that. Please choose a difficulty:\n\n1️⃣ **Easy**\n2️⃣ **Medium**\n3️⃣ **Hard**\n\n*(Type the name or number)*`;
    }
    this.state.data.difficulty = difficulty;
    this.state.step = 'questionType';
    return `**${difficulty}** difficulty — perfect! 💪\n\nWhat **question type** do you prefer?\n\n1️⃣ **Multiple Choice**\n2️⃣ **True / False**\n3️⃣ **Short Answer**\n4️⃣ **Essay**`;
  }

  _quizSetQuestionType(message) {
    const qtype = normalizeQuestionType(message);
    if (!qtype) {
      return `I didn't recognize that question type. Please choose:\n\n1️⃣ **Multiple Choice**\n2️⃣ **True / False**\n3️⃣ **Short Answer**\n4️⃣ **Essay**\n\n*(Type the name or number)*`;
    }
    this.state.data.questionType = qtype;
    this.state.step = 'questionCount';
    return `**${qtype}** — noted! ✅\n\nLastly, **how many questions** would you like?\n\n*(Enter a number between 1 and 50, e.g., 5, 10, 15)*`;
  }

  _quizSetQuestionCount(message) {
    const count = normalizeQuestionCount(message);
    if (!count) {
      return `Please enter a valid number of questions (1–50).\n\n*(e.g., 5, 10, 20)*`;
    }
    this.state.data.questionCount = count;
    this.state.step = 'confirm';

    const d = this.state.data;
    return `Here's your quiz setup: 📋\n\n• **Subject:** ${d.subject}\n• **Topic:** ${d.topic}\n• **Difficulty:** ${d.difficulty}\n• **Type:** ${d.questionType}\n• **Questions:** ${d.questionCount}\n\nShall I **generate this quiz** now?\n\n*(Type **yes** to start, or **cancel** to go back)*`;
  }

  _quizConfirm(message) {
    const lower = message.toLowerCase().trim();
    if (/^(yes|y|sure|ok|okay|go|start|generate|let'?s\s*go|do\s*it|confirm|yep|yeah)\b/i.test(lower)) {
      // Signal to dashboard to navigate to quiz page
      const result = {
        type: 'NAVIGATE_QUIZ',
        data: { ...this.state.data }
      };
      const d = this.state.data;
      this.reset();
      return `🚀 **Generating your quiz!**\n\n${d.questionCount} ${d.difficulty} ${d.questionType} questions on **${d.subject} — ${d.topic}**.\n\nRedirecting you now...` + `\n<!--ACTION:${JSON.stringify(result)}-->`;
    }
    if (/^(no|n|cancel|back|change)/i.test(lower)) {
      return this._handleCancel();
    }
    return `Just type **yes** to generate the quiz, or **cancel** to start over.`;
  }


  // ============================================================
  // EXPLAIN WORKFLOW
  // ============================================================

  _startExplainFlow(message) {
    this.state.mode = MODES.EXPLAIN;
    this.state.data = { subject: null, topic: null, difficulty: null, questionType: null, questionCount: null, explainStyle: null };

    // Try to extract topic from the message
    // "explain photosynthesis" → topic = photosynthesis
    const topicMatch = message.match(/(?:explain|about|understand|learn|teach\s+me)\s+(.+)/i);
    if (topicMatch) {
      this.state.data.topic = topicMatch[1].trim();
      this.state.step = 'style';
      return `I'd love to explain **${this.state.data.topic}** for you! 📚\n\nHow would you like me to explain it?\n\n1️⃣ **Quick Summary** — Brief overview\n2️⃣ **Step-by-Step** — Structured walkthrough\n3️⃣ **Detailed** — In-depth explanation\n4️⃣ **With Examples** — Learn through examples`;
    }

    this.state.step = 'topic';
    return `Sure! I'd love to explain a topic for you! 💡\n\nWhat **topic** would you like me to explain?\n\n*(e.g., Photosynthesis, Quadratic Equations, Newton's Laws...)*`;
  }

  _continueExplainFlow(message) {
    switch (this.state.step) {
      case 'topic':
        return this._explainSetTopic(message);
      case 'style':
        return this._explainSetStyle(message);
      case 'confirm':
        return this._explainConfirm(message);
      default:
        this.state.step = 'topic';
        return `What **topic** would you like me to explain?`;
    }
  }

  _explainSetTopic(message) {
    this.state.data.topic = message.trim();
    this.state.step = 'style';
    return `Great topic — **${this.state.data.topic}**! 📖\n\nHow would you like me to explain it?\n\n1️⃣ **Quick Summary** — Brief overview\n2️⃣ **Step-by-Step** — Structured walkthrough\n3️⃣ **Detailed** — In-depth explanation\n4️⃣ **With Examples** — Learn through examples`;
  }

  _explainSetStyle(message) {
    const style = normalizeExplainStyle(message);
    if (!style) {
      return `Please choose an explanation style:\n\n1️⃣ **Quick Summary**\n2️⃣ **Step-by-Step**\n3️⃣ **Detailed**\n4️⃣ **With Examples**\n\n*(Type the name or number)*`;
    }
    this.state.data.explainStyle = style;
    this.state.step = 'confirm';

    return `I'll explain **${this.state.data.topic}** using a **${style}** approach. 📋\n\nReady to see the explanation?\n\n*(Type **yes** to continue, or **cancel** to go back)*`;
  }

  _explainConfirm(message) {
    const lower = message.toLowerCase().trim();
    if (/^(yes|y|sure|ok|okay|go|start|show|let'?s\s*go|do\s*it|confirm|yep|yeah)\b/i.test(lower)) {
      const result = {
        type: 'NAVIGATE_EXPLAIN',
        data: { ...this.state.data }
      };
      const topic = this.state.data.topic;
      this.reset();
      return `💡 **Loading explanation for ${topic}!**\n\nRedirecting you now...` + `\n<!--ACTION:${JSON.stringify(result)}-->`;
    }
    if (/^(no|n|cancel|back|change)/i.test(lower)) {
      return this._handleCancel();
    }
    return `Type **yes** to get the explanation, or **cancel** to go back.`;
  }


  // ============================================================
  // EXAM WORKFLOW
  // ============================================================

  _startExamFlow(message) {
    this.state.mode = MODES.EXAM;
    this.state.data = { subject: null, topic: null, difficulty: null, questionType: null, questionCount: null, explainStyle: null };

    const hint = extractSubjectFromMessage(message);
    if (hint) {
      this.state.data.subject = hint;
      this.state.step = 'topic';
      return `Let's get you exam-ready in **${hint}**! 💪\n\nWhat specific **topic** should the exam cover?\n\n*(e.g., a chapter or unit name)*`;
    }

    this.state.step = 'subject';
    return `Let's set up a practice exam for you! 🎯\n\nFirst, what **subject** is the exam for?\n\n*(e.g., Mathematics, Physics, Chemistry, Biology...)*`;
  }

  _continueExamFlow(message) {
    switch (this.state.step) {
      case 'subject':
        return this._examSetSubject(message);
      case 'topic':
        return this._examSetTopic(message);
      case 'difficulty':
        return this._examSetDifficulty(message);
      case 'questionCount':
        return this._examSetQuestionCount(message);
      case 'confirm':
        return this._examConfirm(message);
      default:
        this.state.step = 'subject';
        return `What **subject** is the exam for?`;
    }
  }

  _examSetSubject(message) {
    this.state.data.subject = message.trim();
    this.state.step = 'topic';
    return `**${this.state.data.subject}** exam — let's do this! 📝\n\nWhat **topic** should the exam focus on?\n\n*(e.g., a specific chapter or concept area)*`;
  }

  _examSetTopic(message) {
    this.state.data.topic = message.trim();
    this.state.step = 'difficulty';
    return `**${this.state.data.topic}** — noted! 📋\n\nWhat **difficulty level** for the exam?\n\n1️⃣ **Easy**\n2️⃣ **Medium**\n3️⃣ **Hard**`;
  }

  _examSetDifficulty(message) {
    const difficulty = normalizeDifficulty(message);
    if (!difficulty) {
      return `Please choose a difficulty:\n\n1️⃣ **Easy**\n2️⃣ **Medium**\n3️⃣ **Hard**`;
    }
    this.state.data.difficulty = difficulty;
    this.state.step = 'questionCount';
    return `**${difficulty}** — got it! 💪\n\n**How many questions** for the exam?\n\n*(Recommended: 15–30 for a practice exam)*`;
  }

  _examSetQuestionCount(message) {
    const count = normalizeQuestionCount(message);
    if (!count) {
      return `Please enter a valid number of questions (1–50).`;
    }
    this.state.data.questionCount = count;
    this.state.step = 'confirm';

    const d = this.state.data;
    return `Here's your exam setup: 📋\n\n• **Subject:** ${d.subject}\n• **Topic:** ${d.topic}\n• **Difficulty:** ${d.difficulty}\n• **Questions:** ${d.questionCount}\n\nReady to start the exam?\n\n*(Type **yes** to begin, or **cancel** to go back)*`;
  }

  _examConfirm(message) {
    const lower = message.toLowerCase().trim();
    if (/^(yes|y|sure|ok|okay|go|start|begin|let'?s\s*go|do\s*it|confirm|yep|yeah)\b/i.test(lower)) {
      const result = {
        type: 'NAVIGATE_EXAM',
        data: { ...this.state.data }
      };
      const d = this.state.data;
      this.reset();
      return `🚀 **Starting your practice exam!**\n\n${d.questionCount} ${d.difficulty} questions on **${d.subject} — ${d.topic}**.\n\nGet ready...` + `\n<!--ACTION:${JSON.stringify(result)}-->`;
    }
    if (/^(no|n|cancel|back|change)/i.test(lower)) {
      return this._handleCancel();
    }
    return `Type **yes** to start the exam, or **cancel** to go back.`;
  }


  // ============================================================
  // Workflow router
  // ============================================================

  _continueWorkflow(message) {
    switch (this.state.mode) {
      case MODES.QUIZ:
        return this._continueQuizFlow(message);
      case MODES.EXPLAIN:
        return this._continueExplainFlow(message);
      case MODES.EXAM:
        return this._continueExamFlow(message);
      default:
        this.state.mode = MODES.IDLE;
        return this._handleIdle(message);
    }
  }
}


// ============================================================
// Singleton engine instance (shared across the app session)
// ============================================================
let _engineInstance = null;

export function getConversationEngine() {
  if (!_engineInstance) {
    _engineInstance = new ConversationEngine();
  }
  return _engineInstance;
}


// ============================================================
// Legacy-compatible wrapper (called by dashboard.js)
// ============================================================
export async function getAIResponse(message, conversationState) {
  const engine = getConversationEngine();

  // Load persisted state if provided
  if (conversationState) {
    engine.loadState(conversationState);
  }

  const response = await engine.processMessage(message);

  return {
    text: response.replace(/\n<!--ACTION:.*?-->/s, ''),
    rawResponse: response,
    newState: engine.exportState(),
    action: extractAction(response)
  };
}

/** Extract navigation action from AI response (hidden comment) */
function extractAction(response) {
  const match = response.match(/<!--ACTION:(.*?)-->/s);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
}


// ============================================================
// Quiz Generation (unchanged question banks)
// ============================================================

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles option positions for Multiple Choice questions
 * so correct answers are randomly distributed across A, B, C, D.
 */
function processAndShuffleQuestion(question) {
  if (!question) return question;
  const q = JSON.parse(JSON.stringify(question));

  if (Array.isArray(q.options) && q.options.length > 0 && typeof q.correct === 'number') {
    const correctText = q.options[q.correct];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);

    q.options = shuffledOptions;
    q.correct = newCorrectIndex >= 0 ? newCorrectIndex : 0;
  }
  return q;
}

// ---- Supported Subject Detection ----
// Keywords that match to real, curated question banks in getQuestionBank()
const SUPPORTED_SUBJECT_KEYWORDS = [
  // Japanese
  'japan', 'hiragana', 'katakana', 'kanji', 'nihongo',
  // History
  'history', 'revolution', 'war', 'ancient', 'empire',
  // Economics
  'economic', 'finance', 'market', 'gdp', 'inflation', 'trade',
  // Geography
  'geography', 'earth', 'map', 'climate', 'ocean', 'continent',
  // English / Literature
  'english', 'literature', 'grammar', 'shakespeare', 'poetry', 'reading',
  // Mathematics
  'math', 'algebra', 'quadratic', 'calculus', 'geometry', 'equation',
  // Physics
  'physics', 'newton', 'motion', 'mechanics', 'force', 'gravity',
  // Chemistry
  'chemistry', 'chemical', 'stoichiometry', 'organic', 'atom', 'molecule',
  // Biology
  'biology', 'cell', 'dna', 'genetics', 'mitosis', 'organism',
  // Computer Science
  'computer', 'programming', 'data structure', 'algorithm', 'code', 'software', 'cs'
];

/**
 * Check whether a subject/topic combination is supported by a real question bank.
 * @returns {boolean}
 */
export function isSubjectSupported(subject, topic) {
  const context = [subject, topic].filter(Boolean).join(' ').toLowerCase();
  return SUPPORTED_SUBJECT_KEYWORDS.some(kw => context.includes(kw));
}

export function generateQuizQuestions(subject, topic, count, type, difficulty) {
  // Support 4-argument signature overload (subject omitted)
  if (typeof topic === 'number') {
    difficulty = type;
    type = count;
    count = topic;
    topic = subject;
    subject = '';
  }

  const reqCount = typeof count === 'number' && count > 0 ? count : 10;
  const reqType = type || 'Multiple Choice';
  const subjName = subject || '';
  const topName = topic || '';

  const bank = getQuestionBank(subjName, topName, reqType);

  // If no curated question bank matched and the subject is not recognized,
  // return an unsupported marker instead of generating low-quality placeholders
  if (bank.length === 0 && !isSubjectSupported(subjName, topName)) {
    return { unsupported: true, subject: subjName, topic: topName };
  }

  const selected = [...bank];

  // Fill up to reqCount using contextual generator if needed
  while (selected.length < reqCount) {
    selected.push(generateContextualQuestion(subjName, topName, reqType, selected.length + 1));
  }

  const finalQuestions = selected.slice(0, reqCount);

  // Shuffle options and recalculate correct indices for unpredictable distribution
  return finalQuestions.map(q => processAndShuffleQuestion(q));
}

function getQuestionBank(subject, topic, type) {
  const context = [subject, topic].filter(Boolean).join(' ').toLowerCase();

  if (context.includes('japan') || context.includes('hiragana') || context.includes('katakana') || context.includes('kanji') || context.includes('nihongo')) {
    return getJapaneseQuestions(type);
  }
  if (context.includes('history') || context.includes('revolution') || context.includes('war') || context.includes('ancient') || context.includes('empire')) {
    return getHistoryQuestions(type);
  }
  if (context.includes('economic') || context.includes('finance') || context.includes('market') || context.includes('gdp') || context.includes('inflation') || context.includes('trade')) {
    return getEconomicsQuestions(type);
  }
  if (context.includes('geography') || context.includes('earth') || context.includes('map') || context.includes('climate') || context.includes('ocean') || context.includes('continent')) {
    return getGeographyQuestions(type);
  }
  if (context.includes('english') || context.includes('literature') || context.includes('grammar') || context.includes('shakespeare') || context.includes('poetry') || context.includes('reading')) {
    return getLiteratureQuestions(type);
  }
  if (context.includes('math') || context.includes('algebra') || context.includes('quadratic') || context.includes('calculus') || context.includes('geometry') || context.includes('equation')) {
    return getMathQuestions(type);
  }
  if (context.includes('physics') || context.includes('newton') || context.includes('motion') || context.includes('mechanics') || context.includes('force') || context.includes('gravity')) {
    return getPhysicsQuestions(type);
  }
  if (context.includes('chemistry') || context.includes('chemical') || context.includes('stoichiometry') || context.includes('organic') || context.includes('atom') || context.includes('molecule')) {
    return getChemistryQuestions(type);
  }
  if (context.includes('biology') || context.includes('cell') || context.includes('dna') || context.includes('genetics') || context.includes('mitosis') || context.includes('organism')) {
    return getBiologyQuestions(type);
  }
  if (context.includes('computer') || context.includes('programming') || context.includes('data structure') || context.includes('algorithm') || context.includes('code') || context.includes('software') || context.includes('cs')) {
    return getCSQuestions(type);
  }

  return [];
}

// ---- Contextual Question Generator for Custom Subjects ----

function generateContextualQuestion(subject, topic, type, num) {
  const subj = subject ? subject.trim() : 'the subject';
  const top = topic ? topic.trim() : (subject ? subject.trim() : 'this topic');
  const fullContext = subj && top && subj !== top ? `${subj} — ${top}` : (top || subj);

  if (type === 'True / False') {
    const tfQuestions = [
      {
        question: `In ${fullContext}, ${top} represents a core structural concept rather than an optional secondary detail.`,
        answer: true,
        explanation: `${top} is indeed a fundamental topic within ${subj}. Understanding it is crucial for mastering the subject.`
      },
      {
        question: `The rules and principles governing ${top} operate completely independently from the rest of ${subj}.`,
        answer: false,
        explanation: `Concepts within ${subj} are interconnected. ${top} builds upon and relates to foundational principles in ${subj}.`
      },
      {
        question: `Evaluating ${top} requires analyzing its key components, mechanisms, and functional relationships.`,
        answer: true,
        explanation: `Comprehensive understanding of ${top} involves analyzing its core elements and structural mechanisms.`
      },
      {
        question: `${top} is exclusively theoretical and has no practical applications or real-world use cases.`,
        answer: false,
        explanation: `Topics in ${subj}, including ${top}, possess both theoretical frameworks and practical applications.`
      },
      {
        question: `A key goal of studying ${top} in ${subj} is to identify patterns, solve problems, and apply rules accurately.`,
        answer: true,
        explanation: `Active problem-solving and pattern recognition are essential for evaluating knowledge of ${top}.`
      },
      {
        question: `${top} was established without any influence from foundational developments in ${subj}.`,
        answer: false,
        explanation: `${top} is shaped by the underlying principles and historical development of ${subj}.`
      }
    ];
    return tfQuestions[(num - 1) % tfQuestions.length];
  }

  // Multiple Choice / Short Answer / Essay fallback (always factual knowledge questions, NEVER study advice)
  const mcQuestions = [
    {
      question: `Which of the following best defines the primary concept of ${top} in ${subj}?`,
      options: [
        `A foundational framework in ${subj} used to define, analyze, and evaluate key subject phenomena.`,
        `An arbitrary naming convention in ${subj} that carries no structural significance.`,
        `A historical exception in ${subj} that has been declared invalid.`,
        `A hypothetical model in ${subj} with no observable characteristics.`
      ],
      correct: 0,
      explanation: `In ${subj}, ${top} serves as a foundational concept that structures how problems and data are analyzed.`
    },
    {
      question: `What is a primary characteristic of ${top} within ${subj}?`,
      options: [
        `It operates according to established rules and structural principles specific to ${subj}.`,
        `It functions entirely at random without defined parameters.`,
        `It can only be applied outside the domain of ${subj}.`,
        `It contradicts all baseline definitions in ${subj}.`
      ],
      correct: 0,
      explanation: `${top} is defined by clear structural principles and rules inherent to ${subj}.`
    },
    {
      question: `In ${subj}, what is the main functional role of ${top}?`,
      options: [
        `To provide a systematic method for organizing and analyzing core components of ${subj}.`,
        `To replace all existing foundational laws in ${subj}.`,
        `To obscure relationships between key variables in ${subj}.`,
        `To eliminate the need for analytical evaluation in ${subj}.`
      ],
      correct: 0,
      explanation: `The functional role of ${top} is to organize and evaluate relationships within ${subj}.`
    },
    {
      question: `How does ${top} relate to other primary topics in ${subj}?`,
      options: [
        `It connects with related principles to build a cohesive understanding of ${subj}.`,
        `It exists in total isolation with zero relevance to other topics in ${subj}.`,
        `It invalidates all related theories previously established in ${subj}.`,
        `It applies exclusively to non-standard edge cases in ${subj}.`
      ],
      correct: 0,
      explanation: `${top} works in harmony with related concepts in ${subj} to form a complete domain framework.`
    },
    {
      question: `Which statement accurately describes how ${top} is evaluated in ${subj}?`,
      options: [
        `By identifying given parameters, applying core principles, and verifying structural outcomes.`,
        `By disregarding all standard rules and relying on unverified assumptions.`,
        `By treating all input data as identical regardless of context in ${subj}.`,
        `By applying non-domain rules that conflict with ${subj}.`
      ],
      correct: 0,
      explanation: `Evaluating ${top} requires analyzing parameters and applying domain principles in ${subj}.`
    },
    {
      question: `Which core property is essential when working with ${top} in ${subj}?`,
      options: [
        `Logical consistency and alignment with baseline principles of ${subj}.`,
        `Random variation without predictable outcomes.`,
        `Total independence from any analytical constraints.`,
        `Exclusion of all structural metadata in ${subj}.`
      ],
      correct: 0,
      explanation: `Logical consistency and alignment with core principles are fundamental to ${top}.`
    },
    {
      question: `Why is understanding ${top} vital for advanced study in ${subj}?`,
      options: [
        `It acts as a building block for solving complex problems and mastering ${subj}.`,
        `It is the only concept in ${subj} that requires zero analysis.`,
        `It removes the need to study any future topics in ${subj}.`,
        `It has no practical or theoretical value in ${subj}.`
      ],
      correct: 0,
      explanation: `Mastering ${top} provides the foundation necessary for tackling advanced topics in ${subj}.`
    },
    {
      question: `When analyzing a problem involving ${top} in ${subj}, what should be examined first?`,
      options: [
        `The baseline requirements, structural parameters, and core rules of ${subj}.`,
        `Unrelated external variables that have no bearing on ${subj}.`,
        `Arbitrary guesses made without reviewing problem specifications.`,
        `Only the final output, ignoring all intermediate steps in ${subj}.`
      ],
      correct: 0,
      explanation: `Problem-solving in ${subj} starts with examining baseline parameters and core rules of ${top}.`
    }
  ];

  return mcQuestions[(num - 1) % mcQuestions.length];
}

// ---- Specialized Question Banks ----

function getJapaneseQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'Hiragana is a Japanese syllabary used primarily for native words and grammatical inflections.', answer: true, explanation: 'Hiragana is used for native Japanese words, particles, and verb inflections.' },
      { question: 'Katakana is used mainly for foreign loanwords, technical terms, and foreign names.', answer: true, explanation: 'Katakana is used primarily for borrowed foreign words (gairaigo) and emphasis.' },
      { question: 'The Hiragana character "あ" is pronounced as "i".', answer: false, explanation: '"あ" is pronounced as "a" (like in "father"). "い" represents "i".' },
      { question: 'Kanji characters in Japanese represent both meaning and sound.', answer: true, explanation: 'Kanji are logographic characters imported from Chinese, representing both concepts and sounds.' },
      { question: 'Adding a dakuten (tenten ゛) to "か" (ka) turns its sound into "ga".', answer: true, explanation: 'Dakuten marks unvoiced consonants to voiced consonants: ka → ga, sa → za, ta → da, ha → ba.' }
    ];
  }
  return [
    {
      question: 'Which writing system is used mainly for native Japanese words and grammar particles?',
      options: ['Hiragana', 'Katakana', 'Kanji', 'Romaji'],
      correct: 0,
      explanation: 'Hiragana is the primary phonetic syllabary used for native Japanese vocabulary and grammatical elements.'
    },
    {
      question: 'Which Hiragana character represents the vowel sound "a"?',
      options: ['あ', 'い', 'う', 'え'],
      correct: 0,
      explanation: 'The character "あ" represents the vowel sound "a" in the Hiragana script.'
    },
    {
      question: 'Which Japanese writing system is commonly used for foreign loanwords and foreign names?',
      options: ['Katakana', 'Hiragana', 'Kanji', 'Furigana'],
      correct: 0,
      explanation: 'Katakana is used for foreign loanwords (such as "America" -> アメリカ) and foreign names.'
    },
    {
      question: 'How many basic characters make up the core Hiragana chart (Gojūon)?',
      options: ['46', '26', '52', '100'],
      correct: 0,
      explanation: 'The standard Gojūon Hiragana grid consists of 46 basic characters.'
    },
    {
      question: 'In Japanese grammar, which particle is used to mark the topic of a sentence?',
      options: ['は (wa)', 'を (o)', 'に (ni)', 'で (de)'],
      correct: 0,
      explanation: 'The particle は (pronounced "wa" when used as a particle) marks the sentence topic.'
    },
    {
      question: 'Which Hiragana character represents the sound "ki"?',
      options: ['き', 'く', 'け', 'こ'],
      correct: 0,
      explanation: '"き" represents "ki". "く" is "ku", "け" is "ke", and "こ" is "ko".'
    },
    {
      question: 'Which Hiragana character represents the standalone consonant sound "n"?',
      options: ['ん', 'め', 'ぬ', 'ね'],
      correct: 0,
      explanation: '"ん" is the only character in Hiragana that represents a standalone consonant sound.'
    },
    {
      question: 'What is the function of the particle "を" (wo/o) in a Japanese sentence?',
      options: ['It marks the direct object of an action', 'It marks the sentence subject', 'It indicates the location of an event', 'It indicates possession'],
      correct: 0,
      explanation: 'The particle を follows the direct object that receives the action of a transitive verb.'
    },
    {
      question: 'Which writing system consists of logographic characters originally adapted from Chinese?',
      options: ['Kanji', 'Hiragana', 'Katakana', 'Romaji'],
      correct: 0,
      explanation: 'Kanji are Chinese characters adopted into Japanese writing to convey meanings and concepts.'
    },
    {
      question: 'Adding a handakuten (maru ゜) to the "ha" (は) column turns the "h" sound into which sound?',
      options: ['p-sound (pa, pi, pu, pe, po)', 'b-sound (ba, bi, bu, be, bo)', 'g-sound (ga, gi, gu, ge, go)', 'z-sound (za, ji, zu, ze, zo)'],
      correct: 0,
      explanation: 'Handakuten (゜) converts the "h" column (ha, hi, fu, he, ho) to the "p" column (pa, pi, pu, pe, po).'
    }
  ];
}

function getHistoryQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'The French Revolution began in the year 1789.', answer: true, explanation: 'The French Revolution began in 1789 with events like the storming of the Bastille.' },
      { question: 'The Industrial Revolution originated in the United States.', answer: false, explanation: 'The Industrial Revolution began in Great Britain in the mid-18th century before spreading globally.' },
      { question: 'The Magna Carta was signed in England in 1215.', answer: true, explanation: 'King John of England signed the Magna Carta at Runnymede in 1215.' },
      { question: 'Julius Caesar was the first officially recognized Emperor of Rome.', answer: false, explanation: 'Augustus (Octavian) was the first official Roman Emperor; Julius Caesar was dictator before the empire began.' }
    ];
  }
  return [
    {
      question: 'Which ancient civilization constructed the Great Pyramids of Giza?',
      options: ['Ancient Egypt', 'Mesopotamia', 'Ancient Greece', 'Mayan Empire'],
      correct: 0,
      explanation: 'The Great Pyramids of Giza were built by the Ancient Egyptians during the Old Kingdom period.'
    },
    {
      question: 'In which country did the Industrial Revolution begin in the 18th century?',
      options: ['Great Britain', 'France', 'United States', 'Germany'],
      correct: 0,
      explanation: 'The Industrial Revolution started in Great Britain due to abundant coal, iron, and textile innovations.'
    },
    {
      question: 'In which year did World War II officially end?',
      options: ['1945', '1918', '1939', '1950'],
      correct: 0,
      explanation: 'World War II ended in 1945 following the surrender of Germany in May and Japan in September.'
    },
    {
      question: 'Who served as the first President of the United States?',
      options: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Benjamin Franklin'],
      correct: 0,
      explanation: 'George Washington served as the first US President from 1789 to 1797.'
    },
    {
      question: 'Which treaty officially brought an end to World War I in 1919?',
      options: ['Treaty of Versailles', 'Treaty of Paris', 'Treaty of Ghent', 'Treaty of Westphalia'],
      correct: 0,
      explanation: 'The Treaty of Versailles was signed in 1919, officially ending the state of war between Germany and the Allies.'
    },
    {
      question: 'Which ancient trade network connected China with the Mediterranean world?',
      options: ['The Silk Road', 'The Trans-Saharan Route', 'The Royal Road', 'The Amber Road'],
      correct: 0,
      explanation: 'The Silk Road was an ancient network of Eurasian trade routes connecting East Asia to the Mediterranean.'
    }
  ];
}

function getEconomicsQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'According to the law of demand, higher prices generally lead to a lower quantity demanded.', answer: true, explanation: 'An inverse relationship exists between price and quantity demanded.' },
      { question: 'Central banks decrease interest rates to curb high inflation.', answer: false, explanation: 'Central banks raise interest rates to slow down economic activity and curb inflation.' },
      { question: 'Gross Domestic Product (GDP) measures the total value of final goods and services produced in a country.', answer: true, explanation: 'GDP is the standard metric for a nation\'s total economic output.' }
    ];
  }
  return [
    {
      question: 'What economic term describes a general increase in prices and fall in purchasing value of money?',
      options: ['Inflation', 'Deflation', 'Stagflation', 'Recession'],
      correct: 0,
      explanation: 'Inflation measures the rate at which average price levels for goods and services rise over time.'
    },
    {
      question: 'What is the cost of the next best alternative foregone when making a decision called?',
      options: ['Opportunity cost', 'Sunk cost', 'Marginal cost', 'Fixed cost'],
      correct: 0,
      explanation: 'Opportunity cost represents the potential benefits an individual or business misses out on when choosing one option over another.'
    },
    {
      question: 'A market structure dominated by a single seller is known as a:',
      options: ['Monopoly', 'Oligopoly', 'Perfect Competition', 'Monopsony'],
      correct: 0,
      explanation: 'A monopoly exists when a single company or entity is the sole supplier of a particular commodity or service.'
    },
    {
      question: 'What metric measures the total market value of all final goods and services produced within a country in a given year?',
      options: ['Gross Domestic Product (GDP)', 'Consumer Price Index (CPI)', 'Gross National Income (GNI)', 'Balance of Trade'],
      correct: 0,
      explanation: 'GDP is the standard economic indicator for measuring national economic output.'
    }
  ];
}

function getGeographyQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'The Pacific Ocean is the largest ocean on Earth.', answer: true, explanation: 'The Pacific Ocean covers over 30% of Earth\'s surface.' },
      { question: 'The troposphere is the atmospheric layer furthest from Earth\'s surface.', answer: false, explanation: 'The troposphere is the lowest atmospheric layer where weather occurs; the exosphere is the furthest.' }
    ];
  }
  return [
    {
      question: 'What is the largest ocean on Earth by surface area?',
      options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
      correct: 0,
      explanation: 'The Pacific Ocean is the largest and deepest ocean basin on Earth.'
    },
    {
      question: 'What is the capital city of Australia?',
      options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
      correct: 0,
      explanation: 'Canberra was selected as the capital of Australia in 1908 as a compromise between Sydney and Melbourne.'
    },
    {
      question: 'Which atmospheric layer is closest to Earth\'s surface and contains most weather phenomena?',
      options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'],
      correct: 0,
      explanation: 'The troposphere extends from Earth\'s surface up to about 8-15 km and contains almost all atmospheric water vapor and weather.'
    },
    {
      question: 'Which theory explains continental drift, earthquakes, and volcanic activity?',
      options: ['Plate Tectonics', 'Gravitational Compression', 'Hydrological Cycle', 'Coriolis Effect'],
      correct: 0,
      explanation: 'Plate tectonics describes the large-scale motion of Earth\'s lithospheric plates causing geological events.'
    }
  ];
}

function getLiteratureQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'A simile directly compares two things using "like" or "as".', answer: true, explanation: 'Similes use explicit comparison words such as "like" or "as".' },
      { question: 'An adverb modifies nouns and pronouns.', answer: false, explanation: 'Adjectives modify nouns and pronouns. Adverbs modify verbs, adjectives, or other adverbs.' }
    ];
  }
  return [
    {
      question: 'Which literary device involves comparing two unlike things using "like" or "as"?',
      options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'],
      correct: 0,
      explanation: 'A simile is a figure of speech that directly compares two things using "like" or "as".'
    },
    {
      question: 'Which part of speech modifies a verb, an adjective, or another adverb?',
      options: ['Adverb', 'Adjective', 'Preposition', 'Conjunction'],
      correct: 0,
      explanation: 'An adverb provides more information about action, manner, time, or place (e.g., quickly, very).'
    },
    {
      question: 'Who wrote the famous tragedy "Romeo and Juliet"?',
      options: ['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain'],
      correct: 0,
      explanation: 'William Shakespeare wrote "Romeo and Juliet" early in his career around 1595.'
    },
    {
      question: 'What is the repetition of initial consonant sounds in neighboring words called?',
      options: ['Alliteration', 'Assonance', 'Onomatopoeia', 'Irony'],
      correct: 0,
      explanation: 'Alliteration is the repetition of consonant sounds at the beginning of words (e.g., "Peter Piper picked").'
    }
  ];
}

// ---- Existing Question Banks ----

function getMathQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'The quadratic formula can solve any quadratic equation.', answer: true, explanation: 'The quadratic formula x = (-b ± √(b²-4ac)) / 2a works for all quadratic equations ax² + bx + c = 0 where a ≠ 0.' },
      { question: 'A quadratic equation always has two real roots.', answer: false, explanation: 'A quadratic equation can have two real roots, one repeated root, or two complex roots depending on the discriminant (b²-4ac).' },
      { question: 'The graph of a quadratic function is called a parabola.', answer: true, explanation: 'Correct! All quadratic functions y = ax² + bx + c produce parabolic curves.' },
      { question: 'If the discriminant is negative, the equation has no solutions.', answer: false, explanation: 'If the discriminant is negative, the equation has two complex (imaginary) solutions, not zero solutions.' },
      { question: 'The vertex of y = x² - 4x + 3 is at (2, -1).', answer: true, explanation: 'Using x = -b/2a = 4/2 = 2, and y = 4 - 8 + 3 = -1. So the vertex is at (2, -1).' }
    ];
  }
  return [
    { question: 'What is the quadratic formula?', options: ['x = (-b ± √(b²-4ac)) / 2a', 'x = -b / 2a', 'x = (-b ± √(b²+4ac)) / 2a', 'x = b² - 4ac'], correct: 0, explanation: 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a, derived from completing the square on ax² + bx + c = 0.' },
    { question: 'If b² - 4ac = 0, how many real roots does the equation have?', options: ['No real roots', 'One repeated root', 'Two distinct roots', 'Infinite roots'], correct: 1, explanation: 'When the discriminant equals zero, the equation has exactly one repeated (double) root.' },
    { question: 'What is the sum of roots of ax² + bx + c = 0?', options: ['b/a', '-b/a', 'c/a', '-c/a'], correct: 1, explanation: 'By Vieta\'s formulas, the sum of roots = -b/a.' },
    { question: 'Solve: x² - 5x + 6 = 0', options: ['x = 2, x = 3', 'x = -2, x = -3', 'x = 1, x = 6', 'x = -1, x = -6'], correct: 0, explanation: 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3.' },
    { question: 'What shape does a quadratic function graph?', options: ['Line', 'Parabola', 'Circle', 'Hyperbola'], correct: 1, explanation: 'A quadratic function always graphs as a parabola — a U-shaped curve that opens up or down.' },
    { question: 'What is the product of roots of ax² + bx + c = 0?', options: ['b/a', '-b/a', 'c/a', '-c/a'], correct: 2, explanation: 'By Vieta\'s formulas, the product of roots = c/a.' },
    { question: 'The vertex form of a quadratic is:', options: ['y = ax² + bx + c', 'y = a(x-h)² + k', 'y = a(x-r₁)(x-r₂)', 'y = mx + b'], correct: 1, explanation: 'Vertex form is y = a(x-h)² + k where (h,k) is the vertex of the parabola.' },
    { question: 'For f(x) = 2x² - 8x + 6, find the axis of symmetry.', options: ['x = 2', 'x = -2', 'x = 4', 'x = -4'], correct: 0, explanation: 'Axis of symmetry = -b/(2a) = 8/(2×2) = 2.' },
    { question: 'Which value of c makes x² + 6x + c a perfect square?', options: ['6', '9', '12', '36'], correct: 1, explanation: 'For a perfect square: c = (b/2)² = (6/2)² = 9. This gives (x+3)².' },
    { question: 'If one root of x² - 7x + k = 0 is 3, find k.', options: ['10', '12', '15', '21'], correct: 1, explanation: 'If x=3 is a root: 9 - 21 + k = 0, so k = 12.' }
  ];
}

function getPhysicsQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'Newton\'s First Law is also known as the Law of Inertia.', answer: true, explanation: 'Correct! The First Law states that an object maintains its state of motion unless acted upon by an external force — this property is called inertia.' },
      { question: 'Mass and weight are the same thing.', answer: false, explanation: 'Mass is a measure of matter (kg), while weight is the gravitational force on that mass (W = mg, measured in Newtons).' },
      { question: 'According to Newton\'s Third Law, forces always come in pairs.', answer: true, explanation: 'Every action has an equal and opposite reaction — forces always occur in action-reaction pairs.' },
      { question: 'An object can accelerate even if no force acts on it.', answer: false, explanation: 'By Newton\'s Second Law (F=ma), acceleration requires a net force. No force means no acceleration.' },
      { question: 'Friction always opposes the direction of motion.', answer: true, explanation: 'Friction is a force that opposes relative motion between surfaces in contact.' }
    ];
  }
  return [
    { question: 'What is Newton\'s Second Law of Motion?', options: ['F = ma', 'F = mv', 'F = m/a', 'F = mg'], correct: 0, explanation: 'Newton\'s Second Law states that Force equals mass times acceleration: F = ma.' },
    { question: 'A 5 kg object accelerates at 3 m/s². What is the net force?', options: ['8 N', '15 N', '1.67 N', '2 N'], correct: 1, explanation: 'F = ma = 5 × 3 = 15 N.' },
    { question: 'What happens to acceleration if force is doubled and mass stays constant?', options: ['Halved', 'Unchanged', 'Doubled', 'Quadrupled'], correct: 2, explanation: 'From F = ma, if F doubles and m is constant, then a must also double.' },
    { question: 'Which law explains why a seatbelt is important?', options: ['1st Law', '2nd Law', '3rd Law', 'Law of Gravitation'], correct: 0, explanation: 'Newton\'s 1st Law (inertia) — your body tends to continue moving forward when the car stops suddenly.' },
    { question: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], correct: 2, explanation: 'The SI unit of force is the Newton (N), where 1 N = 1 kg·m/s².' },
    { question: 'A rocket propels forward by expelling gas backward. Which law explains this?', options: ['1st Law', '2nd Law', '3rd Law', 'Law of Conservation'], correct: 2, explanation: 'Newton\'s 3rd Law — the rocket pushes gas backward (action), and the gas pushes the rocket forward (reaction).' },
    { question: 'What is the weight of a 10 kg object on Earth (g = 9.8 m/s²)?', options: ['10 N', '98 N', '9.8 N', '100 N'], correct: 1, explanation: 'Weight = mg = 10 × 9.8 = 98 N.' },
    { question: 'An object at rest has a net force of:', options: ['Maximum', 'Minimum', 'Zero', 'Undefined'], correct: 2, explanation: 'An object at rest (in equilibrium) has zero net force acting on it.' }
  ];
}

function getChemistryQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'Ionic bonds form between metals and non-metals.', answer: true, explanation: 'Ionic bonds typically form when a metal transfers electrons to a non-metal.' },
      { question: 'Covalent bonds involve the transfer of electrons.', answer: false, explanation: 'Covalent bonds involve the sharing of electrons, not transfer. Ionic bonds involve electron transfer.' },
      { question: 'Water (H₂O) is a polar molecule.', answer: true, explanation: 'Water is polar because of its bent shape and the electronegativity difference between O and H atoms.' },
      { question: 'Noble gases readily form chemical bonds.', answer: false, explanation: 'Noble gases have full outer electron shells, making them very stable and unreactive.' },
      { question: 'An atom with more protons than electrons is a cation.', answer: true, explanation: 'A cation is a positively charged ion formed when an atom loses electrons.' }
    ];
  }
  return [
    { question: 'What type of bond forms between Na and Cl?', options: ['Covalent', 'Ionic', 'Metallic', 'Hydrogen'], correct: 1, explanation: 'Na (metal) transfers an electron to Cl (non-metal), forming an ionic bond in NaCl.' },
    { question: 'How many covalent bonds does Carbon typically form?', options: ['2', '3', '4', '6'], correct: 2, explanation: 'Carbon has 4 valence electrons and typically forms 4 covalent bonds.' },
    { question: 'What determines an element\'s chemical properties?', options: ['Number of protons', 'Atomic mass', 'Number of valence electrons', 'Number of neutrons'], correct: 2, explanation: 'Valence electrons determine how an element bonds and reacts with other elements.' },
    { question: 'Which molecule is nonpolar?', options: ['H₂O', 'NH₃', 'CO₂', 'HCl'], correct: 2, explanation: 'CO₂ is linear and symmetrical, so the bond dipoles cancel out, making it nonpolar.' },
    { question: 'What is the shape of a methane (CH₄) molecule?', options: ['Linear', 'Trigonal planar', 'Tetrahedral', 'Octahedral'], correct: 2, explanation: 'Methane has 4 bonding pairs around carbon, giving it a tetrahedral geometry.' }
  ];
}

function getBiologyQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'DNA stands for deoxyribonucleic acid.', answer: true, explanation: 'DNA is indeed deoxyribonucleic acid — the molecule that carries genetic information.' },
      { question: 'All cells have a nucleus.', answer: false, explanation: 'Prokaryotic cells (like bacteria) do not have a membrane-bound nucleus.' },
      { question: 'Mitochondria are known as the powerhouse of the cell.', answer: true, explanation: 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.' },
      { question: 'Photosynthesis occurs in the mitochondria.', answer: false, explanation: 'Photosynthesis occurs in chloroplasts, not mitochondria.' },
      { question: 'RNA is typically single-stranded.', answer: true, explanation: 'Unlike DNA which is double-stranded, RNA is usually single-stranded.' }
    ];
  }
  return [
    { question: 'What is the basic unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Organ'], correct: 2, explanation: 'The cell is the basic structural and functional unit of all living organisms.' },
    { question: 'Where does DNA replication occur in eukaryotes?', options: ['Cytoplasm', 'Nucleus', 'Ribosome', 'Cell membrane'], correct: 1, explanation: 'In eukaryotic cells, DNA replication occurs in the nucleus.' },
    { question: 'What is the primary function of ribosomes?', options: ['DNA replication', 'Protein synthesis', 'Cell division', 'Energy production'], correct: 1, explanation: 'Ribosomes translate mRNA into proteins through the process of translation.' },
    { question: 'Which base pairs with Adenine in DNA?', options: ['Cytosine', 'Guanine', 'Thymine', 'Uracil'], correct: 2, explanation: 'In DNA, Adenine (A) always pairs with Thymine (T) through hydrogen bonds.' },
    { question: 'What stage of mitosis do chromosomes align at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1, explanation: 'During metaphase, chromosomes line up at the metaphase plate (cell equator).' }
  ];
}

function getCSQuestions(type) {
  if (type === 'True / False') {
    return [
      { question: 'An array has O(1) time complexity for accessing elements by index.', answer: true, explanation: 'Arrays provide constant-time access because elements are stored in contiguous memory locations.' },
      { question: 'A stack follows FIFO (First In, First Out) order.', answer: false, explanation: 'A stack follows LIFO (Last In, First Out). A queue follows FIFO.' },
      { question: 'Binary search requires a sorted array.', answer: true, explanation: 'Binary search repeatedly divides the search interval in half, which requires the array to be sorted.' },
      { question: 'Linked lists provide O(1) access to any element.', answer: false, explanation: 'Linked lists require O(n) traversal to access an element. Only arrays provide O(1) random access.' },
      { question: 'The time complexity of merge sort is O(n log n).', answer: true, explanation: 'Merge sort consistently performs in O(n log n) time in all cases (best, average, worst).' }
    ];
  }
  return [
    { question: 'What is the time complexity of binary search?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 2, explanation: 'Binary search halves the search space each iteration, giving O(log n) complexity.' },
    { question: 'Which data structure uses LIFO ordering?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'A Stack follows Last-In-First-Out (LIFO) — the most recently added element is removed first.' },
    { question: 'What is the worst-case time complexity of quicksort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 2, explanation: 'Quicksort degrades to O(n²) when the pivot selection is poor (e.g., already sorted array with first element as pivot).' },
    { question: 'Which traversal visits the root first in a binary tree?', options: ['In-order', 'Pre-order', 'Post-order', 'Level-order'], correct: 1, explanation: 'Pre-order traversal visits: Root → Left → Right.' },
    { question: 'What data structure is used for BFS?', options: ['Stack', 'Queue', 'Heap', 'Hash Table'], correct: 1, explanation: 'Breadth-First Search uses a Queue to explore nodes level by level.' },
    { question: 'A hash table provides average-case _____ lookup time.', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], correct: 0, explanation: 'Hash tables provide O(1) average-case lookup using hash functions for direct addressing.' },
    { question: 'Which sorting algorithm is stable?', options: ['Quicksort', 'Heap sort', 'Merge sort', 'Selection sort'], correct: 2, explanation: 'Merge sort is a stable sorting algorithm — equal elements maintain their relative order.' },
    { question: 'What is the space complexity of a recursive Fibonacci implementation?', options: ['O(1)', 'O(n)', 'O(2ⁿ)', 'O(log n)'], correct: 1, explanation: 'The recursive call stack goes n levels deep, requiring O(n) space.' }
  ];
}


// ---- Explanation Generation (unchanged) ----
export function generateExplanation(topic, style) {
  const styleMap = {
    'Quick Summary': `**Quick Summary: ${topic}**\n\nThis is a fundamental concept that forms the basis for more advanced topics. The key idea is understanding the core principles and how they connect to real-world applications.\n\n**Key Takeaway:** Focus on understanding the "why" behind the concept, not just the "what."`,
    'Step-by-Step': `**Step-by-Step Guide: ${topic}**\n\n**Step 1: Foundation**\nStart by understanding the basic definitions and terminology.\n\n**Step 2: Core Concepts**\nLearn the main principles and rules that govern this topic.\n\n**Step 3: Examples**\nWork through guided examples to see concepts in action.\n\n**Step 4: Practice**\nApply what you've learned to new problems.\n\n**Step 5: Connect**\nRelate this topic to other concepts you've learned.\n\n💡 **Pro Tip:** Don't skip steps — each one builds on the previous!`,
    'Detailed': `**Detailed Explanation: ${topic}**\n\n**Introduction**\nThis topic is a cornerstone of the subject, connecting multiple concepts together. Understanding it deeply will give you a significant advantage.\n\n**Theory**\nThe theoretical foundation involves several key principles that have been developed and refined over time. Each principle serves a specific purpose and contributes to the overall framework.\n\n**Applications**\nIn practice, this knowledge is applied across many domains — from academic problem-solving to real-world scenarios.\n\n**Common Misconceptions**\n• Confusing related but distinct concepts\n• Oversimplifying complex relationships\n• Ignoring edge cases and exceptions\n\n**Advanced Connections**\nThis topic connects to several advanced areas that you'll encounter in future studies.`,
    'With Examples': `**${topic} — Explained with Examples**\n\n**Concept Overview**\nLet's understand this through concrete examples that make the ideas click.\n\n**Example 1: Basic**\nImagine you're starting from scratch. The simplest case shows us the fundamental pattern at work.\n→ This demonstrates the core principle in its simplest form.\n\n**Example 2: Intermediate**\nNow let's add some complexity. When we combine multiple elements, we see how the rules interact.\n→ Notice how the basic principle still applies, just with more variables.\n\n**Example 3: Advanced**\nIn this real-world scenario, we apply everything together. This is the kind of problem you might see on an exam.\n→ The key is breaking complex problems into smaller, manageable parts.\n\n**Practice Challenge:** Try creating your own example! Teaching is the best way to learn. 🎯`
  };

  return styleMap[style] || styleMap['Step-by-Step'];
}
