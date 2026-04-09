export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      osc.start(t);
      osc.stop(t + 1.1);
    });
  } catch {}
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function showWebNotification(title, body, icon = '/icon-192.png') {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon, badge: icon, vibrate: [200, 100, 200] });
    } catch {}
  }
}

export function scheduleMeetingReminders(meetings, onReminder) {
  const now = Date.now();
  const timers = [];
  meetings.forEach(m => {
    if (!m.date || !m.timeStart || m.status === 'Cancelled' || m.status === 'Completed') return;
    const [h, min] = m.timeStart.split(':').map(Number);
    const meetingTime = new Date(m.date + 'T00:00:00').getTime() + h * 3600000 + min * 60000;
    const intervals = [
      { label: '1 week before',   ms: 7 * 24 * 3600000 },
      { label: '1 day before',    ms: 24 * 3600000 },
      { label: '1 hour before',   ms: 3600000 },
    ];
    intervals.forEach(({ label, ms }) => {
      const fireAt = meetingTime - ms;
      const delay = fireAt - now;
      if (delay > 0 && delay < 7 * 24 * 3600000 + 60000) {
        const id = setTimeout(() => onReminder(m, label), delay);
        timers.push(id);
      }
    });
  });
  return timers;
}
