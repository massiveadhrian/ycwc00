// ============================================
// DHRYZN — Greeting Utility
// ============================================

import { t } from './i18n.js';

export function getGreeting() {
  const hour = new Date().getHours();
  let emoji, textKey;

  if (hour >= 5 && hour < 12) {
    emoji = '🌅';
    textKey = 'greeting.morning';
  } else if (hour >= 12 && hour < 17) {
    emoji = '☀️';
    textKey = 'greeting.afternoon';
  } else if (hour >= 17 && hour < 21) {
    emoji = '🌙';
    textKey = 'greeting.evening';
  } else {
    emoji = '🌃';
    textKey = 'greeting.night';
  }

  const motivationalKeys = [
    'motivational.1', 'motivational.2', 'motivational.3', 'motivational.4', 'motivational.5',
    'motivational.6', 'motivational.7', 'motivational.8', 'motivational.9', 'motivational.10'
  ];
  const motivational = t(motivationalKeys[Math.floor(Math.random() * motivationalKeys.length)]);

  return { emoji, text: t(textKey), motivational };
}
