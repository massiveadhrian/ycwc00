// ============================================
// DHRYZN — Internationalization (i18n)
// ============================================

const translations = {
  English: {
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.subjects': 'Subjects',
    'sidebar.progress': 'Progress',
    'sidebar.history': 'History',
    'sidebar.settings': 'Settings',
    'sidebar.footer': 'DHRYZN v1.0 — AI Study Mentor',

    // Dashboard — Greeting
    'greeting.morning': 'Good Morning',
    'greeting.afternoon': 'Good Afternoon',
    'greeting.evening': 'Good Evening',
    'greeting.night': 'Good Night',

    // Dashboard — Motivational
    'motivational.1': 'Ready to continue your learning journey?',
    'motivational.2': "Let's make today count!",
    'motivational.3': 'Knowledge is your superpower.',
    'motivational.4': 'Every question you answer makes you stronger.',
    'motivational.5': 'Small steps lead to big achievements.',
    'motivational.6': "You're doing great — keep going!",
    'motivational.7': "Learning never stops. Let's go!",
    'motivational.8': 'Your future self will thank you.',
    'motivational.9': 'Consistency is the key to mastery.',
    'motivational.10': "Let's turn curiosity into knowledge.",

    // Dashboard — Stats
    'stat.dayStreak': 'Day Streak',
    'stat.avgAccuracy': 'Avg. Accuracy',
    'stat.questionsAnswered': 'Questions Answered',
    'stat.completedQuizzes': 'Completed Quizzes',

    // Dashboard — Quick Actions
    'action.generateQuiz': 'Generate Quiz',
    'action.generateQuizDesc': 'Test your knowledge with custom quizzes',
    'action.explainTopic': 'Explain Topic',
    'action.explainTopicDesc': 'Get clear explanations on any subject',
    'action.practiceExam': 'Practice Exam',
    'action.practiceExamDesc': 'Simulate real exam conditions',
    'action.reviewMistakes': 'Review Mistakes',
    'action.reviewMistakesDesc': 'Learn from your past errors',

    // Dashboard — Chat
    'chat.title': 'DHRYZN AI Mentor',
    'chat.status': '• Online',
    'chat.greeting': "Hey there! 👋 I'm DHRYZN, your personal study mentor. I'm here to help you learn, practice, and grow. What would you like to work on today?",
    'chat.placeholder': 'What would you like to learn today?',

    // Subjects
    'subjects.title': '📚 Subjects',
    'subjects.desc': 'Choose a subject to start learning, practicing, or testing.',
    'subjects.questionsAnswered': 'questions answered',
    'subjects.addCustom': 'Add Custom Subject',
    'subjects.subjectName': 'Subject Name',
    'subjects.iconEmoji': 'Icon (emoji)',
    'subjects.cancel': 'Cancel',
    'subjects.addSubject': 'Add Subject',

    // Subject Detail
    'subjectDetail.questionsAnswered': 'questions answered',
    'subjectDetail.quizzes': 'quizzes',
    'subjectDetail.exams': 'exams',
    'subjectDetail.generateQuiz': 'Generate Quiz',
    'subjectDetail.createQuiz': 'Create a custom quiz for',
    'subjectDetail.explainTopic': 'Explain Topic',
    'subjectDetail.getExplanations': 'Get detailed explanations',
    'subjectDetail.practiceExam': 'Practice Exam',
    'subjectDetail.simulateExam': 'Simulate a real exam',
    'subjectDetail.pastResults': 'Past Results',
    'subjectDetail.viewHistory': 'View your performance history',
    'subjectDetail.recentActivity': 'Recent Activity',
    'subjectDetail.notFound': 'Subject Not Found',
    'subjectDetail.notFoundDesc': "This subject doesn't exist.",
    'subjectDetail.backToSubjects': 'Back to Subjects',

    // Progress
    'progress.title': '📈 Your Progress',
    'progress.desc': 'Track your learning journey and identify areas for improvement.',
    'progress.dayStreak': 'Day Streak',
    'progress.questionsAnswered': 'Questions Answered',
    'progress.averageAccuracy': 'Average Accuracy',
    'progress.totalStudyTime': 'Total Study Time',
    'progress.masteryLevel': 'Mastery Level',
    'progress.masterySubtitle': 'Overall subject mastery',
    'progress.mastery': 'Mastery',
    'progress.examReadiness': 'Exam Readiness',
    'progress.examReadinessSubtitle': 'How prepared you are',
    'progress.weeklyActivity': 'Weekly Learning Activity',
    'progress.weeklyActivitySubtitle': 'Questions answered per day',
    'progress.strongTopics': 'Strong Topics',
    'progress.strongTopicsSubtitle': 'Areas where you excel',
    'progress.weakTopics': 'Weak Topics',
    'progress.weakTopicsSubtitle': 'Areas to focus on',
    'progress.examTrend': 'Practice Exam Trend',
    'progress.examTrendSubtitle': 'Your score progression over recent exams',
    'progress.readyExam': '🟢 Exam Ready',
    'progress.almostThere': '🟡 Almost There',
    'progress.gettingCloser': '🟠 Getting Closer',
    'progress.keepPracticing': '🔴 Keep Practicing',
    'progress.readyExamDesc': "You're well prepared! Consider taking a practice exam to confirm.",
    'progress.almostThereDesc': "A few more study sessions and you'll be ready. Focus on weak areas.",
    'progress.gettingCloserDesc': "You're making progress! Keep studying consistently.",
    'progress.keepPracticingDesc': "Don't worry — consistent practice will get you there. Start with the basics.",
    'progress.practice': 'Practice',
    'progress.accuracyOn': 'Your accuracy on',
    'progress.accuracyIs': 'is',
    'progress.focusedQuiz': 'A focused quiz session could help improve this area significantly.',
    'progress.takeExam': 'Take a Practice Exam',
    'progress.takeExamDesc': "You're doing great! Try a practice exam to test your overall readiness.",

    // History
    'history.title': '🕒 History',
    'history.quizHistory': '📝 Quiz History',
    'history.examHistory': '🎯 Exam History',
    'history.searchPlaceholder': 'Search by topic or subject...',
    'history.allSubjects': 'All Subjects',
    'history.noQuizzes': 'No quizzes yet',
    'history.noExams': 'No exams yet',
    'history.noResults': 'No results match your filters. Try adjusting your search.',
    'history.startQuiz': 'Start a quiz to see your history here!',
    'history.startExam': 'Start a practice exam to see your history here!',
    'history.generateQuiz': '📝 Generate Quiz',
    'history.startPracticeExam': '🎯 Start Practice Exam',
    'history.correct': 'correct',
    'history.accuracy': 'accuracy',

    // Settings
    'settings.title': '⚙️ Settings',
    'settings.desc': 'Customize your DHRYZN experience.',
    'settings.appearance': 'Appearance',
    'settings.darkTheme': 'Dark Theme',
    'settings.darkThemeDesc': 'Use a dark color scheme for the interface',
    'settings.accentColor': 'Accent Color',
    'settings.accentColorDesc': 'Choose your preferred accent color',
    'settings.language': 'Language',
    'settings.languageDesc': 'Display language for the interface',
    'settings.learningPrefs': 'Learning Preferences',
    'settings.defaultDifficulty': 'Default Difficulty',
    'settings.defaultDifficultyDesc': 'Default difficulty for quizzes and exams',
    'settings.questionType': 'Preferred Question Type',
    'settings.questionTypeDesc': 'Default type for generated quizzes',
    'settings.explanationStyle': 'Explanation Style',
    'settings.explanationStyleDesc': 'How topics are explained by default',
    'settings.dailyGoal': 'Daily Goal',
    'settings.dailyGoalDesc': 'Target study time per day (minutes):',
    'settings.timer': 'Timer in Practice Exams',
    'settings.timerDesc': 'Show countdown timer during practice exams',
    'settings.data': 'Data',
    'settings.resetToDefault': 'Reset to Default',
    'settings.resetDesc': 'Clear all data and return settings to their default values',
    'settings.resetAll': 'Reset All',
    'settings.about': 'About',
    'settings.aboutDesc': 'DHRYZN is your personal AI Study Mentor. Designed to help students learn, practice, and excel through guided learning, quizzes, and exam simulations.',
    'settings.resetModalTitle': '⚠️ Reset All Data?',
    'settings.resetModalDesc': 'This will clear all your quiz history, exam history, progress data, and settings. This action cannot be undone.',
    'settings.cancel': 'Cancel',
    'settings.resetEverything': 'Reset Everything',

    // Toasts
    'toast.themeUpdated': 'Theme updated',
    'toast.accentColorUpdated': 'Accent color updated',
    'toast.languageSaved': 'Language preference saved',
    'toast.dailyGoalUpdated': 'Daily goal updated',
    'toast.dataReset': 'All data has been reset',

    // Quiz
    'quiz.generateTitle': '📝 Generate Quiz',
    'quiz.generateDesc': 'Create a personalized quiz to test your knowledge and reinforce learning.',
    'quiz.subject': 'Subject',
    'quiz.topic': 'Topic',
    'quiz.gradeLevel': 'Grade Level',
    'quiz.difficulty': 'Difficulty',
    'quiz.numQuestions': 'Number of Questions',
    'quiz.questionType': 'Question Type',
    'quiz.cancel': 'Cancel',
    'quiz.startQuiz': '🚀 Start Quiz',
    'quiz.questionOf': 'Question',
    'quiz.of': 'of',
    'quiz.checkAnswer': 'Check Answer',
    'quiz.submitAnswer': 'Submit Answer',
    'quiz.previous': '← Previous',
    'quiz.next': 'Next →',
    'quiz.finish': '🎉 Finish Quiz',
    'quiz.excellent': '🎉 Excellent!',
    'quiz.goodJob': '👏 Good Job!',
    'quiz.keepPracticing': '💪 Keep Practicing!',
    'quiz.excellentDesc': 'You really know your stuff!',
    'quiz.goodJobDesc': "You're on the right track!",
    'quiz.keepPracticingDesc': 'Every attempt makes you stronger!',
    'quiz.correctLabel': 'Correct',
    'quiz.incorrectLabel': 'Incorrect',
    'quiz.timeTaken': 'Time Taken',
    'quiz.reviewAnswers': '📋 Review Answers',
    'quiz.tryAgain': '🔄 Try Again',
    'quiz.dashboard': '🏠 Dashboard',
    'quiz.answerReview': 'Answer Review',
    'quiz.yourAnswer': 'Your answer',
    'quiz.correctAnswer': 'Correct',
    'quiz.notAnswered': 'Not answered',
    'quiz.correctFeedback': '✅ Correct!',
    'quiz.incorrectFeedback': '💡 Nice try!',
    'quiz.questions': 'Questions',
    'quiz.subjectPlaceholder': 'e.g., Chemistry, Japanese, Mathematics',
    'quiz.topicPlaceholder': 'e.g., Stoichiometry, Hiragana, Quadratic Equations',
    'quiz.typePlaceholder': 'Type your answer here...',

    // Date formatting
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.daysAgo': 'days ago',
  },

  Indonesian: {
    // Sidebar
    'sidebar.dashboard': 'Beranda',
    'sidebar.subjects': 'Mata Pelajaran',
    'sidebar.progress': 'Kemajuan',
    'sidebar.history': 'Riwayat',
    'sidebar.settings': 'Pengaturan',
    'sidebar.footer': 'DHRYZN v1.0 — Mentor Belajar AI',

    // Dashboard — Greeting
    'greeting.morning': 'Selamat Pagi',
    'greeting.afternoon': 'Selamat Siang',
    'greeting.evening': 'Selamat Sore',
    'greeting.night': 'Selamat Malam',

    // Dashboard — Motivational
    'motivational.1': 'Siap melanjutkan perjalanan belajarmu?',
    'motivational.2': 'Ayo jadikan hari ini bermakna!',
    'motivational.3': 'Ilmu adalah kekuatan supermu.',
    'motivational.4': 'Setiap pertanyaan yang kamu jawab membuatmu lebih kuat.',
    'motivational.5': 'Langkah kecil menuju pencapaian besar.',
    'motivational.6': 'Kamu hebat — terus semangat!',
    'motivational.7': 'Belajar tak pernah berhenti. Ayo mulai!',
    'motivational.8': 'Dirimu di masa depan akan berterima kasih.',
    'motivational.9': 'Konsistensi adalah kunci penguasaan.',
    'motivational.10': 'Ayo ubah rasa ingin tahu menjadi pengetahuan.',

    // Dashboard — Stats
    'stat.dayStreak': 'Hari Beruntun',
    'stat.avgAccuracy': 'Rata-rata Akurasi',
    'stat.questionsAnswered': 'Pertanyaan Dijawab',
    'stat.completedQuizzes': 'Kuis Selesai',

    // Dashboard — Quick Actions
    'action.generateQuiz': 'Buat Kuis',
    'action.generateQuizDesc': 'Uji pengetahuanmu dengan kuis kustom',
    'action.explainTopic': 'Jelaskan Topik',
    'action.explainTopicDesc': 'Dapatkan penjelasan yang jelas tentang topik apapun',
    'action.practiceExam': 'Latihan Ujian',
    'action.practiceExamDesc': 'Simulasikan kondisi ujian nyata',
    'action.reviewMistakes': 'Tinjau Kesalahan',
    'action.reviewMistakesDesc': 'Belajar dari kesalahan sebelumnya',

    // Dashboard — Chat
    'chat.title': 'DHRYZN Mentor AI',
    'chat.status': '• Daring',
    'chat.greeting': 'Hai! 👋 Aku DHRYZN, mentor belajar pribadimu. Aku di sini untuk membantumu belajar, berlatih, dan berkembang. Apa yang ingin kamu pelajari hari ini?',
    'chat.placeholder': 'Apa yang ingin kamu pelajari hari ini?',

    // Subjects
    'subjects.title': '📚 Mata Pelajaran',
    'subjects.desc': 'Pilih mata pelajaran untuk mulai belajar, berlatih, atau menguji.',
    'subjects.questionsAnswered': 'pertanyaan dijawab',
    'subjects.addCustom': 'Tambah Mata Pelajaran',
    'subjects.subjectName': 'Nama Mata Pelajaran',
    'subjects.iconEmoji': 'Ikon (emoji)',
    'subjects.cancel': 'Batal',
    'subjects.addSubject': 'Tambah',

    // Subject Detail
    'subjectDetail.questionsAnswered': 'pertanyaan dijawab',
    'subjectDetail.quizzes': 'kuis',
    'subjectDetail.exams': 'ujian',
    'subjectDetail.generateQuiz': 'Buat Kuis',
    'subjectDetail.createQuiz': 'Buat kuis kustom untuk',
    'subjectDetail.explainTopic': 'Jelaskan Topik',
    'subjectDetail.getExplanations': 'Dapatkan penjelasan detail',
    'subjectDetail.practiceExam': 'Latihan Ujian',
    'subjectDetail.simulateExam': 'Simulasi ujian nyata',
    'subjectDetail.pastResults': 'Hasil Sebelumnya',
    'subjectDetail.viewHistory': 'Lihat riwayat performamu',
    'subjectDetail.recentActivity': 'Aktivitas Terbaru',
    'subjectDetail.notFound': 'Mata Pelajaran Tidak Ditemukan',
    'subjectDetail.notFoundDesc': 'Mata pelajaran ini tidak ada.',
    'subjectDetail.backToSubjects': 'Kembali ke Mata Pelajaran',

    // Progress
    'progress.title': '📈 Kemajuanmu',
    'progress.desc': 'Lacak perjalanan belajarmu dan identifikasi area yang perlu ditingkatkan.',
    'progress.dayStreak': 'Hari Beruntun',
    'progress.questionsAnswered': 'Pertanyaan Dijawab',
    'progress.averageAccuracy': 'Rata-rata Akurasi',
    'progress.totalStudyTime': 'Total Waktu Belajar',
    'progress.masteryLevel': 'Tingkat Penguasaan',
    'progress.masterySubtitle': 'Penguasaan mata pelajaran keseluruhan',
    'progress.mastery': 'Penguasaan',
    'progress.examReadiness': 'Kesiapan Ujian',
    'progress.examReadinessSubtitle': 'Seberapa siap kamu',
    'progress.weeklyActivity': 'Aktivitas Belajar Mingguan',
    'progress.weeklyActivitySubtitle': 'Pertanyaan dijawab per hari',
    'progress.strongTopics': 'Topik Kuat',
    'progress.strongTopicsSubtitle': 'Area yang kamu kuasai',
    'progress.weakTopics': 'Topik Lemah',
    'progress.weakTopicsSubtitle': 'Area yang perlu difokuskan',
    'progress.examTrend': 'Tren Latihan Ujian',
    'progress.examTrendSubtitle': 'Progres skormu di ujian-ujian terakhir',
    'progress.readyExam': '🟢 Siap Ujian',
    'progress.almostThere': '🟡 Hampir Siap',
    'progress.gettingCloser': '🟠 Semakin Dekat',
    'progress.keepPracticing': '🔴 Terus Berlatih',
    'progress.readyExamDesc': 'Kamu sudah siap! Pertimbangkan untuk mengambil latihan ujian untuk konfirmasi.',
    'progress.almostThereDesc': 'Beberapa sesi belajar lagi dan kamu akan siap. Fokus pada area lemah.',
    'progress.gettingCloserDesc': 'Kamu membuat kemajuan! Terus belajar secara konsisten.',
    'progress.keepPracticingDesc': 'Jangan khawatir — latihan konsisten akan membawamu kesana. Mulai dari dasar.',
    'progress.practice': 'Latihan',
    'progress.accuracyOn': 'Akurasimu pada',
    'progress.accuracyIs': 'adalah',
    'progress.focusedQuiz': 'Sesi kuis terfokus bisa membantu meningkatkan area ini secara signifikan.',
    'progress.takeExam': 'Ikuti Latihan Ujian',
    'progress.takeExamDesc': 'Kamu hebat! Coba latihan ujian untuk menguji kesiapan keseluruhanmu.',

    // History
    'history.title': '🕒 Riwayat',
    'history.quizHistory': '📝 Riwayat Kuis',
    'history.examHistory': '🎯 Riwayat Ujian',
    'history.searchPlaceholder': 'Cari berdasarkan topik atau mata pelajaran...',
    'history.allSubjects': 'Semua Mata Pelajaran',
    'history.noQuizzes': 'Belum ada kuis',
    'history.noExams': 'Belum ada ujian',
    'history.noResults': 'Tidak ada hasil yang cocok. Coba sesuaikan pencarianmu.',
    'history.startQuiz': 'Mulai kuis untuk melihat riwayatmu di sini!',
    'history.startExam': 'Mulai latihan ujian untuk melihat riwayatmu di sini!',
    'history.generateQuiz': '📝 Buat Kuis',
    'history.startPracticeExam': '🎯 Mulai Latihan Ujian',
    'history.correct': 'benar',
    'history.accuracy': 'akurasi',

    // Settings
    'settings.title': '⚙️ Pengaturan',
    'settings.desc': 'Sesuaikan pengalaman DHRYZN-mu.',
    'settings.appearance': 'Tampilan',
    'settings.darkTheme': 'Tema Gelap',
    'settings.darkThemeDesc': 'Gunakan skema warna gelap untuk antarmuka',
    'settings.accentColor': 'Warna Aksen',
    'settings.accentColorDesc': 'Pilih warna aksen favoritmu',
    'settings.language': 'Bahasa',
    'settings.languageDesc': 'Bahasa tampilan untuk antarmuka',
    'settings.learningPrefs': 'Preferensi Belajar',
    'settings.defaultDifficulty': 'Tingkat Kesulitan Default',
    'settings.defaultDifficultyDesc': 'Kesulitan default untuk kuis dan ujian',
    'settings.questionType': 'Tipe Pertanyaan Pilihan',
    'settings.questionTypeDesc': 'Tipe default untuk kuis yang dibuat',
    'settings.explanationStyle': 'Gaya Penjelasan',
    'settings.explanationStyleDesc': 'Cara topik dijelaskan secara default',
    'settings.dailyGoal': 'Target Harian',
    'settings.dailyGoalDesc': 'Target waktu belajar per hari (menit):',
    'settings.timer': 'Timer di Latihan Ujian',
    'settings.timerDesc': 'Tampilkan timer hitung mundur saat latihan ujian',
    'settings.data': 'Data',
    'settings.resetToDefault': 'Atur Ulang ke Default',
    'settings.resetDesc': 'Hapus semua data dan kembalikan pengaturan ke nilai awal',
    'settings.resetAll': 'Atur Ulang Semua',
    'settings.about': 'Tentang',
    'settings.aboutDesc': 'DHRYZN adalah Mentor Belajar AI pribadimu. Dirancang untuk membantu siswa belajar, berlatih, dan unggul melalui pembelajaran terpandu, kuis, dan simulasi ujian.',
    'settings.resetModalTitle': '⚠️ Atur Ulang Semua Data?',
    'settings.resetModalDesc': 'Ini akan menghapus semua riwayat kuis, riwayat ujian, data kemajuan, dan pengaturan. Tindakan ini tidak dapat dibatalkan.',
    'settings.cancel': 'Batal',
    'settings.resetEverything': 'Atur Ulang Semuanya',

    // Toasts
    'toast.themeUpdated': 'Tema diperbarui',
    'toast.accentColorUpdated': 'Warna aksen diperbarui',
    'toast.languageSaved': 'Preferensi bahasa disimpan',
    'toast.dailyGoalUpdated': 'Target harian diperbarui',
    'toast.dataReset': 'Semua data telah diatur ulang',

    // Quiz
    'quiz.generateTitle': '📝 Buat Kuis',
    'quiz.generateDesc': 'Buat kuis personal untuk menguji pengetahuan dan memperkuat pembelajaran.',
    'quiz.subject': 'Mata Pelajaran',
    'quiz.topic': 'Topik',
    'quiz.gradeLevel': 'Tingkat Kelas',
    'quiz.difficulty': 'Kesulitan',
    'quiz.numQuestions': 'Jumlah Pertanyaan',
    'quiz.questionType': 'Tipe Pertanyaan',
    'quiz.cancel': 'Batal',
    'quiz.startQuiz': '🚀 Mulai Kuis',
    'quiz.questionOf': 'Pertanyaan',
    'quiz.of': 'dari',
    'quiz.checkAnswer': 'Periksa Jawaban',
    'quiz.submitAnswer': 'Kirim Jawaban',
    'quiz.previous': '← Sebelumnya',
    'quiz.next': 'Berikutnya →',
    'quiz.finish': '🎉 Selesaikan Kuis',
    'quiz.excellent': '🎉 Luar Biasa!',
    'quiz.goodJob': '👏 Kerja Bagus!',
    'quiz.keepPracticing': '💪 Terus Berlatih!',
    'quiz.excellentDesc': 'Kamu benar-benar menguasainya!',
    'quiz.goodJobDesc': 'Kamu berada di jalur yang tepat!',
    'quiz.keepPracticingDesc': 'Setiap percobaan membuatmu lebih kuat!',
    'quiz.correctLabel': 'Benar',
    'quiz.incorrectLabel': 'Salah',
    'quiz.timeTaken': 'Waktu',
    'quiz.reviewAnswers': '📋 Tinjau Jawaban',
    'quiz.tryAgain': '🔄 Coba Lagi',
    'quiz.dashboard': '🏠 Beranda',
    'quiz.answerReview': 'Tinjauan Jawaban',
    'quiz.yourAnswer': 'Jawabanmu',
    'quiz.correctAnswer': 'Benar',
    'quiz.notAnswered': 'Tidak dijawab',
    'quiz.correctFeedback': '✅ Benar!',
    'quiz.incorrectFeedback': '💡 Coba lagi!',
    'quiz.questions': 'Pertanyaan',
    'quiz.subjectPlaceholder': 'cth., Kimia, Bahasa Jepang, Matematika',
    'quiz.topicPlaceholder': 'cth., Stoikiometri, Hiragana, Persamaan Kuadrat',
    'quiz.typePlaceholder': 'Ketik jawabanmu di sini...',

    // Date formatting
    'date.today': 'Hari ini',
    'date.yesterday': 'Kemarin',
    'date.daysAgo': 'hari yang lalu',
  }
};

let currentLanguage = 'English';

/**
 * Get translated string for the given key.
 * Falls back to English, then to the key itself.
 */
export function t(key) {
  const lang = translations[currentLanguage];
  if (lang && lang[key] !== undefined) return lang[key];
  // Fallback to English
  const en = translations['English'];
  if (en && en[key] !== undefined) return en[key];
  return key;
}

/**
 * Set the current language.
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
  }
}

/**
 * Get the current language.
 */
export function getLanguage() {
  return currentLanguage;
}
