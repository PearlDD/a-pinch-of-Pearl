// Simple browser fingerprint generator
// Creates a unique-ish ID per browser without external libraries
export function getBrowserFingerprint(): string {
  // Check if we already have one stored
  const stored = localStorage.getItem('apop_fingerprint');
  if (stored) return stored;

  // Generate a new one based on browser properties + random
  const nav = window.navigator;
  const screen = window.screen;

  const data = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2),
    Date.now().toString(36),
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const fingerprint = 'fp_' + Math.abs(hash).toString(36) + '_' + Math.random().toString(36).substring(2, 8);

  localStorage.setItem('apop_fingerprint', fingerprint);
  return fingerprint;
}
