// ============================================
// DHRYZN — Google Gemini 3.6 Flash AI Engine (Server-Side Secret Architecture)
// ============================================

const DEFAULT_MODEL = 'gemini-3.6-flash';

/**
 * Check if the backend proxy server is active and online
 */
export async function checkApiStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/gemini/status', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { online: true, proxy: true, model: data.model || DEFAULT_MODEL };
    }
  } catch (e) {
    // Backend proxy offline
  }
  return { online: false, proxy: false, model: DEFAULT_MODEL };
}

/**
 * Send request to Gemini API (Protected via Server-Side Environment Secret)
 */
export async function generateGeminiContent({
  prompt,
  systemInstruction = '',
  model = DEFAULT_MODEL,
  temperature = 0.7,
  maxTokens = 2048,
  contents = null,
  jsonMode = false
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const proxyRes = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        model,
        temperature,
        maxTokens,
        contents,
        jsonMode
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.ok && data.text) {
        return { text: data.text, model: data.model || model, proxy: true };
      }
      if (data.error) {
        throw new Error(data.error);
      }
    } else {
      const errJson = await proxyRes.json().catch(() => ({}));
      throw new Error(errJson.error || `Server HTTP ${proxyRes.status}`);
    }
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }

  throw new Error('Gemini API request failed. Please check backend server.');
}

// ============================================
// Specialized Education & Studybot Services
// ============================================

/**
 * Generate rich, tailored topic explanation using Gemini 3.6 Flash
 */
export async function generateTopicExplanation(topic, style = 'Quick Summary', gradeLevel = 'Grade 10') {
  const styleInstructions = {
    'Quick Summary': `Provide a crisp, high-yield overview in 3 concise sections:
1. **Core Concept** — What it is in clear, simple terms.
2. **Key Mechanism** — How or why it works.
3. **Key Takeaway** — The single most important insight to remember.`,
    
    'Step-by-Step': `Provide a step-by-step breakdown:
• **Step 1: The Foundation** — Basic definition and terminology.
• **Step 2: The Core Mechanism** — How the pieces connect.
• **Step 3: Concrete Walkthrough** — A specific real-world example in action.
• **Step 4: Common Pitfalls** — Mistakes to avoid.
• **Step 5: Pro-Tip** — Memory trick or exam tip.`,

    'Detailed': `Provide an in-depth academic explanation:
• **Introduction & Scope** — Context and significance.
• **Theoretical Framework & Principles** — Deep dive into the underlying rules.
• **Real-World Applications** — How it is used in practice.
• **Nuances & Edge Cases** — Critical distinctions.
• **Summary & Next Concepts** — What to learn next.`,

    'With Examples': `Explain primarily using intuitive examples and analogies:
• **Everyday Analogy** — A memorable real-world comparison.
• **Example 1: Beginner** — The fundamental case.
• **Example 2: Applied / Exam Case** — A typical problem scenario.
• **Interactive Challenge** — A quick thinking question for the student.`
  };

  const systemInstruction = `You are DHRYZN, a brilliant, friendly, and pedagogical AI Study Mentor.
You explain complex concepts with clarity, visual hierarchy, and intuitive examples.
Always tailor explanations to the requested target level (${gradeLevel}) and style (${style}).
Use Markdown formatting: bold keywords, clean bullet points, and concise paragraphs.
Do NOT output conversational filler like "Sure, here is your explanation". Jump straight into the topic heading.`;

  const prompt = `Topic: "${topic}"
Target Grade Level: ${gradeLevel}
Explanation Style: ${style}

${styleInstructions[style] || styleInstructions['Quick Summary']}

Create the explanation now for "${topic}".`;

  try {
    const result = await generateGeminiContent({
      prompt,
      systemInstruction,
      model: DEFAULT_MODEL,
      temperature: 0.6
    });
    return result.text;
  } catch (error) {
    console.error('Gemini explanation error:', error);
    // Intelligent fallback
    return `**${topic} (${style})**\n\n${topic} is a core concept that connects fundamental principles to practical applications.\n\n• **Core Principle**: Understanding the fundamental mechanisms and relationships governing ${topic}.\n• **Key Takeaway**: Master the "why" and "how", not just the definition.\n\n💡 *Tip: Test your understanding with the Generate Quiz feature!*`;
  }
}

/**
 * Chat with Studybot using Backend Proxy Server (/api/gemini/chat)
 */
export async function chatWithStudybot(userMessage, conversationHistory = [], storeProgress = null) {
  const trimmedInput = (userMessage || '').trim();
  const lowerInput = trimmedInput.toLowerCase();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: trimmedInput,
        history: conversationHistory || []
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.text) {
        let action = null;
        if (lowerInput.includes('start quiz') || lowerInput.includes('take quiz') || lowerInput.includes('make me a quiz')) {
          action = { type: 'NAVIGATE_QUIZ', data: { topic: trimmedInput.replace(/start|take|make|quiz|on|about/gi, '').trim() } };
        } else if (lowerInput.includes('practice exam') || lowerInput.includes('mock exam')) {
          action = { type: 'NAVIGATE_EXAM', data: { topic: trimmedInput.replace(/practice|mock|exam|test|on|about/gi, '').trim() } };
        }
        return { text: data.text, action, model: data.model || DEFAULT_MODEL };
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Chat endpoint error:', err);
  }

  // Fallback if network issue
  const isGreetingOnly = /^(hi|hey|hello|oi|yo|halo|p|sup|good\s+morning|good\s+afternoon|good\s+evening|test)[\s!.]*$/i.test(lowerInput);
  if (isGreetingOnly) {
    return {
      text: `Hello there! 👋 I'm **DHRYZN**, your personal AI Study Mentor. How can I help you with your studies today? You can ask me to explain any topic, take a practice quiz, or prepare for exams!`,
      action: null,
      model: DEFAULT_MODEL
    };
  }

  return {
    text: `Let's break down **${trimmedInput}**! 🎓\n\n• **Core Principle**: Understanding the fundamental concepts and operational mechanisms governing ${trimmedInput}.\n• **Key Takeaway**: Master the "why" and "how", not just the definition!\n\n💡 *Would you like me to quiz you on this topic or explain a specific part in more detail?*`,
    action: null,
    model: DEFAULT_MODEL
  };
}

/**
 * Randomize answer options order while preserving the correct answer
 */
export function shuffleQuestionOptions(question) {
  if (!question || !Array.isArray(question.options) || question.options.length < 2) {
    return question;
  }

  const originalCorrectIndex = typeof question.correct === 'number' ? question.correct : 0;
  const items = question.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === originalCorrectIndex
  }));

  // Fisher-Yates shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const shuffledOptions = items.map(item => item.text);
  const newCorrectIndex = items.findIndex(item => item.isCorrect);

  return {
    ...question,
    options: shuffledOptions,
    correct: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

/**
 * Generate customized quiz questions using Gemini 3.6 Flash
 */
export async function generateDynamicQuiz(subject, topic, count = 5, questionType = 'Multiple Choice', difficulty = 'Medium', gradeLevel = 'Grade 10') {
  const isTF = questionType.includes('True');
  const isText = questionType.includes('Short') || questionType.includes('Essay');

  const courseTitle = topic || subject || 'General Study';
  const subjectContext = subject && subject !== topic ? ` in the subject area of ${subject}` : '';

  const systemInstruction = `You are an expert test creator and educator for the course "${courseTitle}"${subjectContext}.
Your goal is to test the student's ACTUAL knowledge, vocabulary, definitions, principles, syntax, grammar, formulas, and concepts of "${courseTitle}".

CRITICAL CONTENT RULES:
1. TEST REAL SUBJECT MATTER DIRECTLY:
   - If the course/topic is a language (e.g. Mandarin, Chinese, Japanese, Spanish, French, German, English, etc.), test actual vocabulary translations, characters/pinyin, grammar rules, sentence comprehension, word orders, and verb tenses.
   - If the course/topic is programming or computer science (e.g. Python, Java, JavaScript, Data Structures, Algorithms), test actual syntax, code logic, return values, data structures, and functions.
   - If the course/topic is science (Biology, Chemistry, Physics), test actual scientific mechanisms, cellular structures, chemical reactions, physical laws, and formulas.
   - If the course/topic is economics, history, or humanities, test actual historical events, economic concepts (supply/demand, inflation, GDP), theories, and definitions.
2. STRICTLY FORBIDDEN: DO NOT generate generic meta-advice, study tips, or questions about "how to learn ${courseTitle}" (e.g., NEVER ask "What is the best way to study Mandarin?"). Ask substantive test questions about ${courseTitle}!
3. RANDOMIZE CORRECT ANSWER POSITIONS:
   - For Multiple Choice, evenly and randomly distribute correct answers across options A, B, C, and D (indices 0, 1, 2, and 3). Do NOT always place the correct answer at index 0.

Difficulty level: ${difficulty}. Grade level: ${gradeLevel}.
Return ONLY a valid JSON array of question objects with NO surrounding commentary.`;

  let formatGuide = '';
  if (isTF) {
    formatGuide = `Each object in the array must have:
- "question": string (statement directly testing knowledge of ${courseTitle})
- "answer": boolean (true or false)
- "explanation": string (why it is true or false)`;
  } else if (isText) {
    formatGuide = `Each object in the array must have:
- "question": string (concept or problem in ${courseTitle})
- "sampleAnswer": string (ideal concise answer)
- "explanation": string (key grading criteria and core principle)`;
  } else {
    formatGuide = `Each object in the array must have:
- "question": string (direct knowledge question on ${courseTitle})
- "options": array of 4 distinct strings (options A, B, C, D)
- "correct": integer (0, 1, 2, or 3 representing the index of the correct option — evenly distribute across 0, 1, 2, 3)
- "explanation": string (why the correct option is right)`;
  }

  const prompt = `Generate exactly ${count} educational ${questionType} questions on "${courseTitle}"${subjectContext}.

Format Requirements:
${formatGuide}

Output JSON format:
[
  ...
]`;

  try {
    const result = await generateGeminiContent({
      prompt,
      systemInstruction,
      model: DEFAULT_MODEL,
      temperature: 0.7,
      jsonMode: true
    });

    const parsed = extractJson(result.text);
    let questionsList = null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      questionsList = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      questionsList = parsed.questions;
    }

    if (questionsList && questionsList.length > 0) {
      // Apply option shuffling to guarantee randomized answer positions
      return questionsList.map(q => isTF || isText ? q : shuffleQuestionOptions(q));
    }
  } catch (error) {
    console.error('Quiz generation error:', error);
  }

  // Domain-Aware Intelligent Fallback Generator
  return fallbackQuestions(subject, topic, count, questionType);
}

/**
 * Generate full-length exam questions using Gemini 3.6 Flash
 */
export async function generateDynamicExam(subject, topic, count = 10, difficulty = 'Hard', gradeLevel = 'Grade 11') {
  return generateDynamicQuiz(subject, topic, count, 'Multiple Choice', difficulty, gradeLevel);
}

/**
 * Helper to safely extract JSON from Gemini text response
 */
function extractJson(text) {
  if (!text) return null;
  let clean = text.trim();

  // Remove markdown ```json ... ``` tags if present
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    // Try finding the first [ or { and matching end
    const startArr = clean.indexOf('[');
    const endArr = clean.lastIndexOf(']');
    if (startArr !== -1 && endArr > startArr) {
      try {
        return JSON.parse(clean.substring(startArr, endArr + 1));
      } catch (e2) {}
    }

    const startObj = clean.indexOf('{');
    const endObj = clean.lastIndexOf('}');
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(clean.substring(startObj, endObj + 1));
      } catch (e3) {}
    }
  }
  return null;
}

/**
 * Domain-Aware Subject Questions Generator for Offline/Fallback
 */
function fallbackQuestions(subject, topic, count, type) {
  const isTF = type.includes('True');
  const isText = type.includes('Short') || type.includes('Essay');
  const target = (topic || subject || 'General').toLowerCase();

  const questions = [];

  // 1. Language: Mandarin / Chinese
  if (target.includes('mandarin') || target.includes('chinese')) {
    const mandarinPool = [
      {
        question: 'What is the correct English translation of the common Mandarin greeting "你好" (Nǐ hǎo)?',
        options: ['Hello', 'Goodbye', 'Thank you', 'Please'],
        correct: 0,
        explanation: '"你好" (Nǐ hǎo) is composed of "你" (you) and "好" (good), literally meaning "You good", commonly translated as "Hello".'
      },
      {
        question: 'Which of the following represents "Thank you" in Mandarin Chinese?',
        options: ['不客气 (Bù kèqì)', '谢谢 (Xièxiè)', '对不起 (Duìbùqǐ)', '再见 (Zàijiàn)'],
        correct: 1,
        explanation: '"谢谢" (Xièxiè) means "Thank you", while "不客气" means "You are welcome".'
      },
      {
        question: 'In Mandarin Chinese phonetics (Pinyin), how many main tones are there (excluding the neutral tone)?',
        options: ['3 tones', '4 tones', '5 tones', '6 tones'],
        correct: 1,
        explanation: 'Standard Mandarin has 4 main tones (1st high flat, 2nd rising, 3rd falling-rising, 4th falling) plus a neutral tone.'
      },
      {
        question: 'Which measure word (量词) is correctly paired with books (书) in Mandarin?',
        options: ['张 (zhāng)', '个 (gè)', '本 (běn)', '只 (zhī)'],
        correct: 2,
        explanation: '"本" (běn) is the standard classifier/measure word for bound volumes such as books, magazines, and notebooks.'
      },
      {
        question: 'What is the meaning of the Mandarin question word "什么" (Shénme)?',
        options: ['Where', 'Who', 'Why', 'What'],
        correct: 3,
        explanation: '"什么" (Shénme) translates to "What" in English.'
      },
      {
        question: 'How do you say "Goodbye" in Mandarin Chinese?',
        options: ['再见 (Zàijiàn)', '早上好 (Zǎoshang hǎo)', '没关系 (Méi guānxi)', '请问 (Qǐngwèn)'],
        correct: 0,
        explanation: '"再见" (Zàijiàn) literally means "see you again" and is the standard farewell.'
      }
    ];

    for (let i = 0; i < count; i++) {
      const q = mandarinPool[i % mandarinPool.length];
      questions.push(shuffleQuestionOptions({ ...q }));
    }
    return questions;
  }

  // 2. Programming / Python / Computer Science
  if (target.includes('python') || target.includes('programming') || target.includes('cs') || target.includes('computer')) {
    const pyPool = [
      {
        question: 'In Python, which keyword is used to define a function?',
        options: ['function', 'def', 'fun', 'define'],
        correct: 1,
        explanation: 'In Python, functions are defined using the "def" keyword followed by the function name.'
      },
      {
        question: 'What is the output of len([10, 20, 30, 40]) in Python?',
        options: ['3', '4', '5', '40'],
        correct: 1,
        explanation: 'The built-in len() function returns the number of elements in the list, which is 4.'
      },
      {
        question: 'Which data structure in Python stores key-value pairs and is mutable?',
        options: ['tuple', 'list', 'dictionary', 'set'],
        correct: 2,
        explanation: 'A dictionary (dict) in Python maps unique keys to values using hash tables.'
      },
      {
        question: 'What is the time complexity of looking up a key in an average Python dictionary?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
        correct: 2,
        explanation: 'Python dictionaries use hash tables, providing average O(1) constant-time key lookups.'
      }
    ];
    for (let i = 0; i < count; i++) {
      const q = pyPool[i % pyPool.length];
      questions.push(shuffleQuestionOptions({ ...q }));
    }
    return questions;
  }

  // 3. Biology / Science
  if (target.includes('biology') || target.includes('bio') || target.includes('cell')) {
    const bioPool = [
      {
        question: 'Which organelle is often referred to as the powerhouse of the eukaryotic cell because it produces ATP?',
        options: ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Endoplasmic reticulum'],
        correct: 1,
        explanation: 'Mitochondria generate most of the chemical energy (ATP) needed to power the cell’s biochemical reactions.'
      },
      {
        question: 'What process do autotrophic plants use to convert sunlight, carbon dioxide, and water into glucose and oxygen?',
        options: ['Cellular Respiration', 'Fermentation', 'Photosynthesis', 'Glycolysis'],
        correct: 2,
        explanation: 'Photosynthesis occurs in chloroplasts, using chlorophyll to convert light energy into chemical energy.'
      },
      {
        question: 'Which molecule carries the primary genetic instructions used in growth, development, functioning, and reproduction?',
        options: ['ATP', 'Lipid', 'Hemoglobin', 'DNA'],
        correct: 3,
        explanation: 'DNA (Deoxyribonucleic Acid) contains the genetic code for all known living organisms.'
      }
    ];
    for (let i = 0; i < count; i++) {
      const q = bioPool[i % bioPool.length];
      questions.push(shuffleQuestionOptions({ ...q }));
    }
    return questions;
  }

  // 4. Economics
  if (target.includes('economics') || target.includes('economy')) {
    const econPool = [
      {
        question: 'What economic principle describes the fundamental concept that resources are limited while human wants are virtually unlimited?',
        options: ['Inflation', 'Scarcity', 'Elasticity', 'Surplus'],
        correct: 1,
        explanation: 'Scarcity is the basic economic problem of having unlimited human wants in a world of limited resources.'
      },
      {
        question: 'According to the law of supply and demand, what generally happens to the market price if demand increases while supply remains constant?',
        options: ['Price decreases', 'Price increases', 'Price remains unchanged', 'Supply drops to zero'],
        correct: 1,
        explanation: 'When demand exceeds supply, competition among buyers drives the equilibrium market price higher.'
      }
    ];
    for (let i = 0; i < count; i++) {
      const q = econPool[i % econPool.length];
      questions.push(shuffleQuestionOptions({ ...q }));
    }
    return questions;
  }

  // 5. General Arbitrary Custom Course Fallback
  const displayTopic = topic || subject || 'Core Concept';
  const displaySubject = subject || topic || 'General';

  for (let i = 1; i <= count; i++) {
    if (isTF) {
      const isTrue = (i % 2 === 1);
      questions.push({
        question: `In ${displaySubject}, the concept of ${displayTopic} governs the core operational relationships and verified rules of the field.`,
        answer: isTrue,
        explanation: `Understanding ${displayTopic} provides the essential conceptual foundation in ${displaySubject}.`
      });
    } else if (isText) {
      questions.push({
        question: `Explain the fundamental principle and practical application of ${displayTopic} in ${displaySubject}.`,
        sampleAnswer: `${displayTopic} defines the primary mechanism and operational rules that govern ${displaySubject}.`,
        explanation: `Demonstrates mastery of core concepts and real-world applicability in ${displaySubject}.`
      });
    } else {
      // Randomized options with correct answer distributed across 0, 1, 2, 3
      const targetCorrect = (i - 1) % 4;
      const opts = [
        `Primary foundational principle and direct mechanism of ${displayTopic}`,
        `A secondary peripheral effect observed only in edge scenarios`,
        `An obsolete historical convention no longer applied in modern ${displaySubject}`,
        `A purely descriptive terminology with no functional impact`
      ];
      // Put the correct answer at targetCorrect
      if (targetCorrect !== 0) {
        [opts[0], opts[targetCorrect]] = [opts[targetCorrect], opts[0]];
      }

      questions.push(shuffleQuestionOptions({
        question: `Which statement most accurately describes the role of ${displayTopic} in ${displaySubject}?`,
        options: opts,
        correct: targetCorrect,
        explanation: `${displayTopic} fundamentally defines how core mechanisms and concepts operate within ${displaySubject}.`
      }));
    }
  }

  return questions;
}
