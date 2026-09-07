export const QUOTES = [
  "You don't have to finish everything today. Just start.",
  "Small steps still move you forward.",
  "One task at a time.",
  "Progress, not perfection.",
  "Rest is part of the work.",
  "Begin badly; edit later.",
  "The nest is warm. The list is short.",
];

export const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];
