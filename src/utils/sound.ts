let audioCtx: AudioContext | null = null;

export const playClickSound = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const t = audioCtx.currentTime;

  // High frequency click (the switch mechanism)
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  
  // Use a bandpass filter to shape the click
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 1;

  osc1.type = 'square';
  osc1.frequency.setValueAtTime(1000, t);
  osc1.frequency.exponentialRampToValueAtTime(100, t + 0.02);
  
  gain1.gain.setValueAtTime(0.15, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  
  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(audioCtx.destination);
  
  osc1.start(t);
  osc1.stop(t + 0.02);

  // Low frequency thud (bottoming out)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(150, t);
  osc2.frequency.exponentialRampToValueAtTime(40, t + 0.03);
  
  gain2.gain.setValueAtTime(0.2, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  
  osc2.start(t);
  osc2.stop(t + 0.03);
};
