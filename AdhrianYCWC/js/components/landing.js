// ============================================
// DHRYZN — Landing Page Component (Public Entry Point)
// ============================================

import { openAuthModal } from './authModal.js';

export function renderLandingPage(container, params, store, router) {
  const user = store ? store.get('currentUser') : null;

  container.innerHTML = `
    <div class="landing-page">
      <!-- Top Navigation -->
      <nav class="landing-nav">
        <div class="landing-nav-container">
          <div class="landing-logo" id="landing-brand-logo">
            <div class="landing-logo-icon">D</div>
            <span class="landing-logo-text">DHRYZN</span>
          </div>

          <ul class="landing-nav-links">
            <li><a class="landing-nav-link" href="#landing" data-scroll="hero">Home</a></li>
            <li><a class="landing-nav-link" href="#landing" data-scroll="features">Features</a></li>
            <li><a class="landing-nav-link" href="#landing" data-scroll="how-it-works">How It Works</a></li>
            <li><a class="landing-nav-link" href="#landing" data-scroll="benefits">Why AI</a></li>
          </ul>

          <div class="landing-nav-actions">
            ${user ? `
              <button class="hero-btn-primary" id="nav-dashboard-btn" style="padding: 9px 20px; font-size: 0.92rem;">
                🚀 Go to Dashboard
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" id="nav-login-btn" style="padding: 8px 18px; font-size: 0.9rem;">
                Log In
              </button>
              <button class="hero-btn-primary" id="nav-signup-btn" style="padding: 8px 20px; font-size: 0.9rem;">
                Get Started
              </button>
            `}
          </div>
        </div>
      </nav>

      <div class="landing-content">
        <!-- Hero Section -->
        <section class="landing-hero" id="hero">
          <div class="hero-badge">
            <span>✨</span> Next-Gen AI Study Assistant
          </div>

          <h1 class="hero-title">
            Master Any Subject with Your <br>
            <span class="gradient-text">Personal AI Study Mentor</span>
          </h1>

          <p class="hero-description">
            Supercharge your learning with interactive AI tutoring, intelligent topic breakdowns,
            custom dynamic quizzes, timed exam simulations, and real-time mastery tracking.
          </p>

          <div class="hero-cta-group">
            <button class="hero-btn-primary" id="hero-get-started-btn">
              <span>🚀</span> Get Started Free
            </button>
            <button class="hero-btn-secondary" id="hero-explore-btn">
              <span>📚</span> Explore Dashboard
            </button>
          </div>

          <div class="hero-pills">
            <div class="hero-pill-item"><span class="icon">✓</span> Zero Configuration</div>
            <div class="hero-pill-item"><span class="icon">✓</span> Adaptive Explanations</div>
            <div class="hero-pill-item"><span class="icon">✓</span> Instant Step-by-Step Guidance</div>
            <div class="hero-pill-item"><span class="icon">✓</span> Free to Learn</div>
          </div>

          <!-- Hero Visual Mockup Preview -->
          <div class="hero-mockup-wrapper">
            <div class="hero-mockup-card">
              <div class="mockup-header-bar">
                <div class="mockup-dots">
                  <div class="mockup-dot red"></div>
                  <div class="mockup-dot yellow"></div>
                  <div class="mockup-dot green"></div>
                </div>
                <div class="mockup-title-tab">
                  <span>⚡</span> DHRYZN Interactive Studybot • Gemini AI Active
                </div>
                <div style="font-size: 0.75rem; color: #34D399; font-weight: 600;">● Live Session</div>
              </div>

              <div class="mockup-body">
                <!-- Left: AI Chat Preview -->
                <div class="mockup-chat-panel">
                  <div class="mockup-msg user">
                    <div class="mockup-msg-avatar user">U</div>
                    <div class="mockup-msg-bubble">
                      Can you explain how photosynthesis works simply with a real-world analogy?
                    </div>
                  </div>

                  <div class="mockup-msg ai">
                    <div class="mockup-msg-avatar ai">D</div>
                    <div class="mockup-msg-bubble">
                      Think of <strong>photosynthesis</strong> like <strong>plants cooking their own food using solar power</strong>! ☀️🍃<br><br>
                      • <strong>Solar Collector</strong>: Chlorophyll traps red & blue wavelengths from sunlight.<br>
                      • <strong>Ingredients</strong>: Roots take in $H_2O$ and leaves capture $CO_2$.<br>
                      • <strong>Output</strong>: High-energy <strong>glucose</strong> for growth + clean <strong>oxygen ($O_2$)</strong> released!
                    </div>
                  </div>
                </div>

                <!-- Right: Stats & Quiz Preview -->
                <div class="mockup-stats-panel">
                  <div class="mockup-stat-card">
                    <div class="mockup-stat-info">
                      <div class="mockup-stat-icon" style="background: rgba(124, 92, 255, 0.15); color: #A78BFA;">🔥</div>
                      <div>
                        <div style="font-weight: 700; font-size: 1.1rem;">7 Days</div>
                        <div style="font-size: 0.78rem; color: var(--color-text-secondary);">Current Study Streak</div>
                      </div>
                    </div>
                    <span style="font-size: 0.8rem; color: #34D399; font-weight: 600;">+2 Today</span>
                  </div>

                  <div class="mockup-quiz-preview">
                    <div style="font-weight: 600; color: #F3F4F6; margin-bottom: 6px;">📝 Quick Check:</div>
                    <div style="color: var(--color-text-secondary); font-size: 0.82rem; margin-bottom: 8px;">
                      Why do plant leaves appear green to human eyes?
                    </div>
                    <div class="mockup-quiz-option correct">
                      <span>✓ Chlorophyll reflects green light while absorbing red/blue</span>
                      <span>100%</span>
                    </div>
                    <div class="mockup-quiz-option">
                      <span>• Leaves only absorb green wavelengths</span>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="landing-section" id="features">
          <div class="section-header">
            <span class="section-tag">Features</span>
            <h2 class="section-title">Everything You Need to Excel in Your Studies</h2>
            <p class="section-subtitle">
              Designed with cognitive science principles to turn passive reading into active, lifelong mastery.
            </p>
          </div>

          <div class="features-grid">
            <div class="feature-card" data-route="dashboard">
              <div class="feature-icon-wrapper" style="background: rgba(124, 92, 255, 0.15); color: #A78BFA;">
                🤖
              </div>
              <h3 class="feature-card-title">AI Study Assistant</h3>
              <p class="feature-card-desc">
                An intelligent multi-turn study companion that answers academic questions, provides hints, and clarifies doubts 24/7.
              </p>
              <span class="feature-card-tag">Interactive Chat →</span>
            </div>

            <div class="feature-card" data-route="explain">
              <div class="feature-icon-wrapper" style="background: rgba(96, 165, 250, 0.15); color: #60A5FA;">
                💡
              </div>
              <h3 class="feature-card-title">Explain Topic</h3>
              <p class="feature-card-desc">
                Break down complex concepts into 4 customizable styles: Quick Summary, Step-by-Step, Deep Academic, or Intuitive Analogies.
              </p>
              <span class="feature-card-tag">Tailored Explanations →</span>
            </div>

            <div class="feature-card" data-route="quiz">
              <div class="feature-icon-wrapper" style="background: rgba(52, 211, 153, 0.15); color: #34D399;">
                📝
              </div>
              <h3 class="feature-card-title">Generate Quiz</h3>
              <p class="feature-card-desc">
                Produce targeted practice quizzes on any subject or topic with Multiple Choice, True/False, and Short Answer question types.
              </p>
              <span class="feature-card-tag">Active Recall Testing →</span>
            </div>

            <div class="feature-card" data-route="exam">
              <div class="feature-icon-wrapper" style="background: rgba(251, 146, 60, 0.15); color: #FB923C;">
                🎯
              </div>
              <h3 class="feature-card-title">Practice Exam</h3>
              <p class="feature-card-desc">
                Simulate timed testing environments to test endurance, evaluate exam readiness, and pinpoint knowledge gaps before test day.
              </p>
              <span class="feature-card-tag">Timed Simulation →</span>
            </div>

            <div class="feature-card" data-route="subjects">
              <div class="feature-icon-wrapper" style="background: rgba(248, 113, 113, 0.15); color: #F87171;">
                📚
              </div>
              <h3 class="feature-card-title">Custom Courses</h3>
              <p class="feature-card-desc">
                Add and manage custom subjects and topics tailored specifically to your unique school, AP, IB, or university syllabus.
              </p>
              <span class="feature-card-tag">Personalized Curriculum →</span>
            </div>

            <div class="feature-card" data-route="progress">
              <div class="feature-icon-wrapper" style="background: rgba(167, 139, 250, 0.15); color: #C084FC;">
                📈
              </div>
              <h3 class="feature-card-title">Progress Tracking</h3>
              <p class="feature-card-desc">
                Real-time visual mastery analytics, daily study streaks, subject accuracy breakdowns, and AI-identified weak area detection.
              </p>
              <span class="feature-card-tag">Detailed Analytics →</span>
            </div>
          </div>
        </section>

        <!-- How It Works Section -->
        <section class="landing-section" id="how-it-works">
          <div class="section-header">
            <span class="section-tag">How It Works</span>
            <h2 class="section-title">Your 4-Step Path to Academic Mastery</h2>
            <p class="section-subtitle">
              A frictionless workflow designed to help you absorb, test, and retain knowledge effectively.
            </p>
          </div>

          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">01</div>
              <h3 class="step-title">Choose Your Subject</h3>
              <p class="step-desc">
                Select from built-in STEM and Humanities courses (Math, Physics, CS, History) or create your own custom syllabus.
              </p>
            </div>

            <div class="step-card">
              <div class="step-number">02</div>
              <h3 class="step-title">Ask & Learn with AI</h3>
              <p class="step-desc">
                Chat with DHRYZN to unpack difficult formulas, explore analogies, and receive tailored conceptual breakdowns.
              </p>
            </div>

            <div class="step-card">
              <div class="step-number">03</div>
              <h3 class="step-title">Test Your Understanding</h3>
              <p class="step-desc">
                Generate interactive quizzes and timed practice exams to verify retention and identify areas needing reinforcement.
              </p>
            </div>

            <div class="step-card">
              <div class="step-number">04</div>
              <h3 class="step-title">Track Your Mastery</h3>
              <p class="step-desc">
                Monitor your daily streak, accuracy rates, and weak topics to consistently elevate your study performance.
              </p>
            </div>
          </div>
        </section>

        <!-- Value of AI-Assisted Learning Section -->
        <section class="landing-section" id="benefits">
          <div class="value-container">
            <div class="value-info">
              <span class="section-tag">The AI Advantage</span>
              <h3>Why Active AI Mentorship Outperforms Traditional Studying</h3>
              <p>
                Passive re-reading and endless video tutorials create an illusion of competence. DHRYZN uses active retrieval, immediate feedback, and Socratic questioning to build durable understanding.
              </p>

              <div class="value-points">
                <div class="value-point-item">
                  <div class="value-point-check">✓</div>
                  <div class="value-point-text">
                    <strong>Zero-Judgment Learning Zone</strong>
                    <span>Ask foundational questions as many times as needed until the concept truly clicks.</span>
                  </div>
                </div>

                <div class="value-point-item">
                  <div class="value-point-check">✓</div>
                  <div class="value-point-text">
                    <strong>Instant Corrective Feedback</strong>
                    <span>Understand not just what the right answer is, but the underlying mechanism of why.</span>
                  </div>
                </div>

                <div class="value-point-item">
                  <div class="value-point-check">✓</div>
                  <div class="value-point-text">
                    <strong>Adaptive Difficulty Scaling</strong>
                    <span>Progress smoothly from introductory fundamentals to exam-level multi-step problems.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="value-comparison-card">
              <div class="comparison-header">
                <span>Traditional Studying</span>
                <span style="color: #A78BFA;">DHRYZN AI Study Mentor</span>
              </div>
              <div class="comparison-row">
                <span class="bad">❌ Passive textbook highlighting</span>
                <span class="good">✅ Active recall & dynamic quizzes</span>
              </div>
              <div class="comparison-row">
                <span class="bad">❌ One-size-fits-all explanations</span>
                <span class="good">✅ 4 adaptive explanation styles</span>
              </div>
              <div class="comparison-row">
                <span class="bad">❌ Waiting days for assignment feedback</span>
                <span class="good">✅ Instant step-by-step diagnostic feedback</span>
              </div>
              <div class="comparison-row">
                <span class="bad">❌ Guessing your test readiness</span>
                <span class="good">✅ Real-time mastery & streak analytics</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Final CTA Banner -->
        <div class="landing-cta-banner">
          <h2>Ready to Supercharge Your Learning Journey?</h2>
          <p>
            Join students mastering difficult concepts faster with DHRYZN AI Study Mentor.
            Start practicing now — free and with zero setup required.
          </p>
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <button class="hero-btn-primary" id="final-cta-btn" style="padding: 16px 36px; font-size: 1.1rem;">
              <span>✨</span> Get Started Now — It's Free
            </button>
            <button class="hero-btn-secondary" id="final-explore-btn" style="padding: 16px 32px; font-size: 1.1rem;">
              <span>📖</span> Open Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="landing-footer-container">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="landing-logo-icon" style="width: 28px; height: 28px; font-size: 0.9rem;">D</div>
            <span style="font-weight: 700; color: #FFFFFF;">DHRYZN</span>
            <span class="footer-copy">• AI Study Mentor</span>
          </div>

          <ul class="footer-links">
            <li><a id="footer-dashboard-link">Dashboard</a></li>
            <li><a id="footer-quiz-link">Quizzes</a></li>
            <li><a id="footer-explain-link">Explain Topic</a></li>
            <li><a id="footer-exam-link">Practice Exams</a></li>
          </ul>

          <div class="footer-copy">
            © ${new Date().getFullYear()} DHRYZN. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `;

  // Attach event handlers
  function handleGetStarted() {
    if (user) {
      router.navigate('dashboard');
    } else {
      openAuthModal(store, 'signup', () => {
        router.navigate('dashboard');
      });
    }
  }

  function handleLogin() {
    if (user) {
      router.navigate('dashboard');
    } else {
      openAuthModal(store, 'login', () => {
        router.navigate('dashboard');
      });
    }
  }

  // Brand Logo Click -> Stay on landing or scroll to top
  container.querySelector('#landing-brand-logo')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Nav buttons
  container.querySelector('#nav-signup-btn')?.addEventListener('click', handleGetStarted);
  container.querySelector('#nav-login-btn')?.addEventListener('click', handleLogin);
  container.querySelector('#nav-dashboard-btn')?.addEventListener('click', () => router.navigate('dashboard'));

  // Hero buttons
  container.querySelector('#hero-get-started-btn')?.addEventListener('click', handleGetStarted);
  container.querySelector('#hero-explore-btn')?.addEventListener('click', () => router.navigate('dashboard'));

  // Final CTA buttons
  container.querySelector('#final-cta-btn')?.addEventListener('click', handleGetStarted);
  container.querySelector('#final-explore-btn')?.addEventListener('click', () => router.navigate('dashboard'));

  // Feature cards navigation
  container.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetRoute = card.dataset.route || 'dashboard';
      router.navigate(targetRoute);
    });
  });

  // Smooth scroll links
  container.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-scroll');
      const targetEl = container.querySelector(`#${targetId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Footer links
  container.querySelector('#footer-dashboard-link')?.addEventListener('click', () => router.navigate('dashboard'));
  container.querySelector('#footer-quiz-link')?.addEventListener('click', () => router.navigate('quiz'));
  container.querySelector('#footer-explain-link')?.addEventListener('click', () => router.navigate('explain'));
  container.querySelector('#footer-exam-link')?.addEventListener('click', () => router.navigate('exam'));

  return null;
}
