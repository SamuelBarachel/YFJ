let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function unlockAudio() {
  try { getAudioContext(); } catch {}
}

export function playChurchBell() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const bells = [
      { freq: 523.25, delay: 0,    vol: 0.3 },
      { freq: 659.25, delay: 0.15, vol: 0.2 },
      { freq: 783.99, delay: 0.3,  vol: 0.25 },
      { freq: 1046.5, delay: 0.1,  vol: 0.15 },
    ];
    bells.forEach(({ freq, delay, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const distGain = ctx.createGain();
      osc.connect(gain);
      gain.connect(distGain);
      distGain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      distGain.gain.value = 0.6;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.8);
      osc.start(now + delay);
      osc.stop(now + delay + 3);
    });
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export function playReminderChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.5);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 1.8);
    });
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

/**
 * New addition: Subscribes the user to Push using Render Env Var
 * This allows the server to send notifications to THIS device.
 */
export async function subscribeUserToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      console.warn('VAPID public key not found in environment variables');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // You will need to create this endpoint on your Render backend
    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
    
    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

export function scheduleNotification(title, body, delayMs, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  const id = setTimeout(() => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        tag: tag || 'yfj-reminder',
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png', tag: tag || 'yfj-reminder' });
    }
    playReminderChime();
  }, delayMs);
  return id;
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.warn);
  }
}
