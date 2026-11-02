let audioContext;

function playToneSequence(notes) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioContext ??= new AudioContextClass();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((error) => {
        console.warn('Nu s-a putut porni sunetul vocal:', error);
      });
    }

    const startTime = audioContext.currentTime;
    notes.forEach(({ frequency, start, duration }) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = startTime + start;
      const noteEnd = noteStart + duration;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });
  } catch (error) {
    console.warn('Nu s-a putut reda sunetul vocal:', error);
  }
}

export function playListeningSound() {
  playToneSequence([
    { frequency: 440, start: 0, duration: 0.12 },
    { frequency: 587.33, start: 0.13, duration: 0.16 }
  ]);
}

export function playCommandReceivedSound() {
  playToneSequence([
    { frequency: 523.25, start: 0, duration: 0.13 },
    { frequency: 659.25, start: 0.14, duration: 0.13 },
    { frequency: 783.99, start: 0.28, duration: 0.24 }
  ]);
}
