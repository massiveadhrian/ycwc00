// ============================================
// DHRYZN — State Management Store with Real Persistence & Auth
// ============================================

export function getLocalDateStr(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date();
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class Store {
  constructor() {
    this.listeners = {};
    this.authToken = localStorage.getItem('dhryzn_token') || null;
    this.currentUser = null;
    this.syncTimeout = null;

    // Load local state initially
    this.state = this.loadState();
    this.recalculateDynamicStats();

    // Check backend authentication on startup
    if (this.authToken) {
      this.checkAuth().catch(() => {});
    }
  }

  getDefaultSubjects() {
    return [
      { id: 'math', name: 'Mathematics', icon: '📐', color: '#7C5CFF', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'physics', name: 'Physics', icon: '⚛️', color: '#60A5FA', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#34D399', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'biology', name: 'Biology', icon: '🧬', color: '#F87171', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'english', name: 'English', icon: '📖', color: '#FBBF24', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'cs', name: 'Computer Science', icon: '💻', color: '#A78BFA', isBuiltIn: true, isCustom: false, questionsAnswered: 0 },
      { id: 'history', name: 'History', icon: '🏛️', color: '#FB923C', isBuiltIn: true, isCustom: false, questionsAnswered: 0 }
    ];
  }

  getDefaultState() {
    return {
      currentUser: null,
      authToken: null,
      subjects: this.getDefaultSubjects(),
      quizHistory: [],
      examHistory: [],
      progress: {
        streak: 0,
        completedQuizzes: 0,
        completedQuizCount: 0,
        completedExamCount: 0,
        totalQuestions: 0,
        averageAccuracy: 0,
        studyTimeMinutes: 0,
        mastery: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        strongTopics: [],
        weakTopics: [],
        examReadiness: 0,
        examTrend: []
      },
      settings: {
        theme: 'dark',
        accentColor: '#7C5CFF',
        language: 'English',
        defaultDifficulty: 'Medium',
        preferredQuestionType: 'Multiple Choice',
        explanationStyle: 'Step-by-Step',
        dailyGoal: 30,
        timerEnabled: true,
        geminiModel: 'gemini-3.6-flash'
      },
      chatMessages: [],
      activeQuizSession: null,
      pendingQuizConfig: null,
      pendingExplainConfig: null,
      pendingExamConfig: null
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem('dhryzn_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = this.getDefaultState();
        
        // Merge subjects carefully to ensure isBuiltIn / isCustom flags are preserved
        let subjects = parsed.subjects || defaults.subjects;
        const defaultSubjects = this.getDefaultSubjects();
        
        // Ensure default built-in subjects exist and have correct flags
        subjects = subjects.map(s => {
          const isDefault = defaultSubjects.some(d => d.id === s.id || d.name.toLowerCase() === s.name.toLowerCase());
          return {
            ...s,
            isBuiltIn: isDefault || s.isBuiltIn === true,
            isCustom: !isDefault && (s.isCustom === true || !s.isBuiltIn)
          };
        });

        // Add any missing default subjects
        for (const defSub of defaultSubjects) {
          if (!subjects.some(s => s.id === defSub.id || s.name.toLowerCase() === defSub.name.toLowerCase())) {
            subjects.push({ ...defSub });
          }
        }

        return {
          ...defaults,
          ...parsed,
          subjects,
          currentUser: parsed.currentUser || null,
          authToken: this.authToken
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem('dhryzn_state', JSON.stringify(this.state));
      if (this.state.authToken) {
        localStorage.setItem('dhryzn_token', this.state.authToken);
      } else {
        localStorage.removeItem('dhryzn_token');
      }
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
    this.scheduleBackendSync();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    if (key === 'quizHistory' || key === 'examHistory' || key === 'subjects') {
      this.recalculateDynamicStats();
    }
    this.saveState();
    this.emit(key, value);
  }

  update(key, updater) {
    this.state[key] = updater(this.state[key]);
    if (key === 'quizHistory' || key === 'examHistory' || key === 'subjects') {
      this.recalculateDynamicStats();
    }
    this.saveState();
    this.emit(key, this.state[key]);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // ============================================
  // Dynamic Real Statistics Calculation
  // ============================================

  recalculateDynamicStats() {
    const quizHistory = this.state.quizHistory || [];
    const examHistory = this.state.examHistory || [];
    const allHistory = [...quizHistory, ...examHistory];

    const completedQuizCount = quizHistory.length;
    const completedExamCount = examHistory.length;
    const completedQuizzes = completedQuizCount + completedExamCount;

    let totalQuestions = 0;
    let totalCorrect = 0;
    let studyTimeMinutes = 0;

    const topicStats = {}; // topic -> { correct, total, count }
    const subjectCounts = {}; // subjectName -> count

    allHistory.forEach(item => {
      const total = Number(item.total) || 0;
      const correct = Number(item.correct) || 0;
      totalQuestions += total;
      totalCorrect += correct;

      // Parse duration
      const durationMin = parseInt(item.duration) || 0;
      studyTimeMinutes += durationMin;

      // Subject counts
      const subName = item.subject || 'Other';
      subjectCounts[subName] = (subjectCounts[subName] || 0) + total;

      // Topic accuracy
      const topic = item.topic || subName;
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total += total;
      topicStats[topic].correct += correct;
    });

    // Update questionsAnswered count on each subject dynamically
    if (Array.isArray(this.state.subjects)) {
      this.state.subjects.forEach(subject => {
        subject.questionsAnswered = subjectCounts[subject.name] || 0;
      });
    }

    // Average accuracy
    const averageAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // Real Day Streak calculation based strictly on distinct calendar days
    const streak = this._calculateStreak(allHistory);

    // Weekly Activity: Questions answered Mon-Sun of the current week
    const weeklyActivity = this._calculateWeeklyActivity(allHistory);

    // Strong & Weak topics
    const topicList = Object.keys(topicStats).map(name => {
      const stat = topicStats[name];
      const percent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      return { name, percent, total: stat.total };
    });

    const strongTopics = topicList
      .filter(t => t.percent >= 75)
      .sort((a, b) => b.percent - a.percent);

    const weakTopics = topicList
      .filter(t => t.percent < 70)
      .sort((a, b) => a.percent - b.percent);

    // Mastery level: derived from overall accuracy and topic breadth
    const uniqueTopics = Object.keys(topicStats).length;
    const mastery = totalQuestions > 0
      ? Math.min(100, Math.round(averageAccuracy * 0.7 + Math.min(30, uniqueTopics * 6)))
      : 0;

    // Exam readiness & trend
    const examScores = examHistory.map(e => Number(e.score) || 0);
    const examTrend = [...examScores].reverse(); // oldest to newest for chart

    let examReadiness = 0;
    if (examScores.length > 0) {
      const avgExam = Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length);
      examReadiness = Math.round(avgExam * 0.8 + averageAccuracy * 0.2);
    } else if (totalQuestions > 0) {
      examReadiness = Math.round(averageAccuracy * 0.6);
    }

    this.state.progress = {
      streak,
      completedQuizzes,
      completedQuizCount,
      completedExamCount,
      totalQuestions,
      averageAccuracy,
      studyTimeMinutes,
      mastery,
      weeklyActivity,
      strongTopics,
      weakTopics,
      examReadiness,
      examTrend
    };
  }

  _calculateStreak(history) {
    if (!history || history.length === 0) return 0;

    const dates = new Set();
    history.forEach(item => {
      if (item.date) {
        // Extract YYYY-MM-DD part cleanly
        const raw = String(item.date).trim();
        const datePart = raw.split('T')[0];
        if (datePart && datePart.length === 10 && datePart.includes('-')) {
          dates.add(datePart);
        } else {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            dates.add(getLocalDateStr(d));
          }
        }
      }
    });

    if (dates.size === 0) return 0;

    const todayStr = getLocalDateStr(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    // Must have activity today or yesterday to have an active streak
    let checkDate = new Date();
    if (!dates.has(todayStr)) {
      if (!dates.has(yesterdayStr)) {
        return 0; // streak broken
      }
      checkDate = yesterday;
    }

    let streak = 0;
    while (true) {
      const dateStr = getLocalDateStr(checkDate);
      if (dates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  _calculateWeeklyActivity(history) {
    const weekly = [0, 0, 0, 0, 0, 0, 0]; // Mon (0) to Sun (6)
    const now = new Date();
    
    // Find current week's Monday in local time
    const day = now.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    history.forEach(item => {
      if (item.date) {
        const itemDate = new Date(item.date);
        if (!isNaN(itemDate.getTime()) && itemDate >= monday && itemDate <= sunday) {
          const itemDay = itemDate.getDay();
          const index = itemDay === 0 ? 6 : itemDay - 1; // 0=Mon, 6=Sun
          weekly[index] += Number(item.total) || 0;
        }
      }
    });

    return weekly;
  }

  // ============================================
  // History & Progress Actions
  // ============================================

  addQuizToHistory(quiz) {
    const todayStr = getLocalDateStr(new Date());
    const quizWithDate = {
      id: quiz.id || 'q_' + Date.now(),
      type: 'quiz',
      status: 'completed',
      date: quiz.date || todayStr,
      ...quiz
    };
    this.update('quizHistory', history => [quizWithDate, ...(history || [])]);
  }

  addExamToHistory(exam) {
    const todayStr = getLocalDateStr(new Date());
    const examWithDate = {
      id: exam.id || 'e_' + Date.now(),
      type: 'exam',
      status: 'completed',
      date: exam.date || todayStr,
      ...exam
    };
    this.update('examHistory', history => [examWithDate, ...(history || [])]);
  }

  // ============================================
  // Subject Management (Custom Courses Only Deletable)
  // ============================================

  addSubject(subjectData) {
    const id = 'custom_' + Date.now();
    const newSubject = {
      id,
      name: subjectData.name.trim(),
      icon: subjectData.icon || '📄',
      color: subjectData.color || '#7C5CFF',
      isCustom: true,
      isBuiltIn: false,
      questionsAnswered: 0
    };

    this.update('subjects', subjects => [...(subjects || []), newSubject]);
    return newSubject;
  }

  deleteSubject(subjectId) {
    const subjects = this.state.subjects || [];
    const target = subjects.find(s => s.id === subjectId);

    if (!target) {
      return { success: false, error: 'Subject not found.' };
    }

    // Protection rule: Built-in courses MUST NOT be deletable
    if (target.isBuiltIn || !target.isCustom) {
      return { success: false, error: 'Built-in default courses cannot be deleted.' };
    }

    // Remove the custom subject
    this.set('subjects', subjects.filter(s => s.id !== subjectId));
    return { success: true };
  }

  // ============================================
  // Backend Authentication & Data Synchronization
  // ============================================

  async checkAuth() {
    if (!this.authToken) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          this.currentUser = data.user;
          this.state.currentUser = data.user;
          this.state.authToken = this.authToken;
          await this.loadUserDataFromServer();
          this.emit('auth', this.currentUser);
          return this.currentUser;
        }
      }
    } catch (e) {
      // Backend offline or standalone mode
    }
    return null;
  }

  async signUp(username, email, password) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }

    this.authToken = data.token;
    this.currentUser = data.user;
    this.state.authToken = data.token;
    this.state.currentUser = data.user;

    this.saveState();
    await this.syncToServerNow();
    this.emit('auth', this.currentUser);
    return data.user;
  }

  async login(usernameOrEmail, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Invalid credentials.');
    }

    this.authToken = data.token;
    this.currentUser = data.user;
    this.state.authToken = data.token;
    this.state.currentUser = data.user;

    localStorage.setItem('dhryzn_token', data.token);

    // Fetch user's persistent data from the server
    await this.loadUserDataFromServer();

    this.saveState();
    this.emit('auth', this.currentUser);
    return data.user;
  }

  async logout() {
    if (this.authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });
      } catch (e) {}
    }

    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('dhryzn_token');
    localStorage.removeItem('dhryzn_state');

    this.state = this.getDefaultState();
    this.recalculateDynamicStats();
    this.saveState();
    this.emit('auth', null);
  }

  async loadUserDataFromServer() {
    if (!this.authToken) return;
    try {
      const res = await fetch('/api/user/data', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      if (res.ok) {
        const respData = await res.json();
        if (respData.ok && respData.data) {
          const serverData = respData.data;
          
          // Merge server data with local state
          const defaultSubjects = this.getDefaultSubjects();
          let subjects = serverData.subjects || this.state.subjects;
          
          subjects = subjects.map(s => {
            const isDefault = defaultSubjects.some(d => d.id === s.id || d.name.toLowerCase() === s.name.toLowerCase());
            return {
              ...s,
              isBuiltIn: isDefault || s.isBuiltIn === true,
              isCustom: !isDefault && (s.isCustom === true || !s.isBuiltIn)
            };
          });

          this.state = {
            ...this.state,
            ...serverData,
            subjects,
            currentUser: this.currentUser,
            authToken: this.authToken
          };

          this.recalculateDynamicStats();
          this.saveState();
          this.emit('stateLoaded', this.state);
        }
      }
    } catch (e) {
      console.warn('Failed to load user data from server:', e);
    }
  }

  scheduleBackendSync() {
    if (!this.authToken) return;
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncToServerNow().catch(() => {});
    }, 1000);
  }

  async syncToServerNow() {
    if (!this.authToken) return;
    try {
      const payload = {
        subjects: this.state.subjects,
        quizHistory: this.state.quizHistory,
        examHistory: this.state.examHistory,
        settings: this.state.settings,
        chatMessages: (this.state.chatMessages || []).slice(-20)
      };

      await fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ data: payload })
      });
    } catch (e) {
      console.warn('Backend sync failed:', e);
    }
  }

  reset() {
    this.state = this.getDefaultState();
    this.saveState();
    Object.keys(this.listeners).forEach(key => this.emit(key, this.state[key]));
  }
}
