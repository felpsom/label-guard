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
    // Som de alarme alto e longo para reprovação
    this.playAlarmSequence();
  }

  private static playAlarmSequence() {
    // Sequência de alarme com múltiplos tons altos e graves
    try {
      const ctx = this.getAudioContext();
      
      // Primeiro tom - grave e alto
      setTimeout(() => this.playTone(200, 0.3, 'square'), 0);
      setTimeout(() => this.playTone(400, 0.3, 'square'), 300);
      setTimeout(() => this.playTone(200, 0.3, 'square'), 600);
      setTimeout(() => this.playTone(400, 0.3, 'square'), 900);
      
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }

  public static playWarning() {
    // Beep médio para avisos
    this.playTone(500, 0.4);
  }
}