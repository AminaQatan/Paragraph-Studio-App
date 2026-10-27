// Tiny, locally synthesized clicks. Audio starts only after a user gesture.
const PREFERENCE_KEY = 'paragraph-studio-sound';
let enabled = true;
let context;
let lastPlayed = -Infinity;
try { enabled = localStorage.getItem(PREFERENCE_KEY) !== 'off'; } catch {}

export async function playClick(kind = 'pop') {
  if (!enabled) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ||= new Audio();
    if (context.state === 'suspended') await context.resume();
    if (!enabled || context.state !== 'running') return;
    const now = context.currentTime;
    if (now - lastPlayed < 0.055) return;
    lastPlayed = now;
    const notes = kind === 'sparkle' ? [659.25, 830.61, 987.77] : kind === 'add' ? [740, 1108] : [kind === 'tab' ? 960 : 820];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.065;
      const duration = kind === 'sparkle' ? 0.14 : 0.105;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.3, start + 0.018);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.065, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch {
    // Audio support or an interrupted audio session must not interrupt writing.
  }
}

export function initClickSounds() {
  const toggle = document.getElementById('sound-btn');
  const label = document.getElementById('sound-label');
  const supported = Boolean(window.AudioContext || window.webkitAudioContext);
  if (!supported) { toggle.disabled = true; toggle.title = 'Click sounds are unavailable in this browser'; enabled = false; }
  const render = () => {
    toggle.setAttribute('aria-pressed', String(enabled));
    label.textContent = enabled ? 'Sound on' : 'Sound off';
    if(supported) toggle.title = enabled ? 'Mute cute click sounds' : 'Turn on cute click sounds';
  };
  render();
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(PREFERENCE_KEY, enabled ? 'on' : 'off'); } catch {}
    render();
    if (enabled) void playClick('add');
  });
  // Capture before sentence tabs are replaced by the writing interface.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('button, [role="button"], a, input, textarea, .paragraph-sentence') : null;
    if (!target || target === toggle || target.matches(':disabled, [aria-disabled="true"]')) return;
    const kind = target.id === 'check-btn' ? 'sparkle' : target.dataset.addRole ? 'add' : target.matches('[role="tab"], #next-btn, #prev-btn') ? 'tab' : 'pop';
    void playClick(kind);
  }, true);
  document.getElementById('sentence-tabs').addEventListener('keydown',event=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) void playClick('tab');
  });
}
