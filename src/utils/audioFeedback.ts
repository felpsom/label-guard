// Audio feedback utilities for validation system
export class AudioFeedback {
  private static audioContext: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private static playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }

  public static playSuccess() {
    // Beep curto e agudo para aprovação
    this.playTone(800, 0.2);
  }

  public static playError() {
    // Beep longo e grave para reprovação
    this.playTone(300, 0.8);
  }

  public static playWarning() {
    // Beep médio para avisos
    this.playTone(500, 0.4);
  }
}