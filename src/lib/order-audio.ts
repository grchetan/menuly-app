/**
 * Order Audio & Studio Hindi Speech Queue Service
 * 
 * Provides:
 * 1. Double-bell kitchen chime (880Hz / 1318Hz).
 * 2. Strict FIFO Speech Queue: When multiple tables place orders simultaneously
 *    (e.g. Table 1, Table 2, Table 3), orders are queued and announced sequentially
 *    in the order they were placed ("jo pehle kiya uska pehle"), with zero overlap or truncation.
 * 3. High-volume, crystal-clear studio voice (Google Neural Hindi MP3 with Web Speech fallback).
 * 4. Automatic audio context resume and unlock on first user gesture.
 */

export interface SpeechItem {
  id: string;
  tableNumber: string;
  hindiText: string;
  englishFallback: string;
  createdAt: number;
}

class OrderAudioService {
  private queue: SpeechItem[] = [];
  private isProcessing = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private soundEnabled = true;
  private audioContext: AudioContext | null = null;
  private hasUnlockedAudio = false;

  constructor() {
    if (typeof window !== "undefined") {
      const unlock = () => {
        if (this.hasUnlockedAudio) return;
        this.hasUnlockedAudio = true;
        this.getAudioContext()?.resume().catch(() => {});
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true, passive: true });
      window.addEventListener("keydown", unlock, { once: true, passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      } catch {
        // AudioContext not supported
      }
    }
    return this.audioContext;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.clearQueue();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public playChimeSound() {
    if (typeof window === "undefined" || !this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Tone 1: Energetic Bell Chime (880 Hz / A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.38);

      // Tone 2: Crisp Accent Bell (1318.5 Hz / E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now + 0.12);
      gain2.gain.setValueAtTime(0.55, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch {
      // Ignore audio restrictions
    }
  }

  /**
   * Enqueues an announcement into the FIFO speech queue.
   * If multiple announcements arrive at once, they are sorted by createdAt ASC
   * (earliest order placed speaks first), and played one after another without collision.
   */
  public enqueue(item: SpeechItem) {
    if (!this.soundEnabled) return;
    // Prevent duplicate entries of the same item ID
    if (this.queue.some((q) => q.id === item.id)) return;

    this.queue.push(item);
    // Sort FIFO by creation timestamp: jo pehle order hua uska alert pehle!
    this.queue.sort((a, b) => a.createdAt - b.createdAt);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Clears the active queue and stops any in-flight speech.
   */
  public clearQueue() {
    this.queue = [];
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isProcessing = false;
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const current = this.queue.shift();
    if (!current) {
      this.isProcessing = false;
      return;
    }

    try {
      // 1. Play kitchen double chime
      this.playChimeSound();
      // Wait for chime to resonate before voice starts
      await this.sleep(350);

      // 2. Speak announcement (awaits completion before moving to next in queue)
      await this.speakItem(current);

      // 3. Natural breathing pause between distinct table orders
      await this.sleep(400);
    } catch (err) {
      console.warn("[OrderAudioService] Playback error:", err);
    } finally {
      // Continue next queued announcement in FIFO sequence
      this.processQueue();
    }
  }

  private speakItem(item: SpeechItem): Promise<void> {
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      };

      // Watchdog timeout: Max 8 seconds per voice announcement so queue never hangs
      const watchdog = setTimeout(() => {
        done();
      }, 8000);

      const cleanup = () => {
        clearTimeout(watchdog);
        if (this.currentAudioElement) {
          try {
            this.currentAudioElement.onended = null;
            this.currentAudioElement.onerror = null;
          } catch {}
          this.currentAudioElement = null;
        }
      };

      // Attempt 1: Studio Neural Voice MP3 via /api/voice/tts
      const tryStudioTTS = async (): Promise<boolean> => {
        try {
          const ttsUrl = `/api/voice/tts?text=${encodeURIComponent(item.hindiText)}`;
          const res = await fetch(ttsUrl, { signal: AbortSignal.timeout(4500) });
          if (!res.ok) return false;

          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const audio = new Audio(blobUrl);
          this.currentAudioElement = audio;
          audio.volume = 1.0;

          audio.onended = () => {
            URL.revokeObjectURL(blobUrl);
            done();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            tryFallbackWebSpeech();
          };

          await audio.play();
          return true;
        } catch {
          return false;
        }
      };

      // Attempt 2: Web Speech Synthesis API fallback
      const tryFallbackWebSpeech = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          done();
          return;
        }

        try {
          const synth = window.speechSynthesis;
          const voices = synth.getVoices();

          // Prioritize Indian Hindi voices, then Indian English
          const hindiVoice = voices.find(
            (v) =>
              (v.lang && (v.lang.startsWith("hi") || v.lang.includes("hi-IN"))) ||
              v.name.toLowerCase().includes("hindi")
          );
          const indianEnglishVoice = voices.find(
            (v) =>
              v.lang && (v.lang.toLowerCase() === "en-in" || v.name.toLowerCase().includes("india"))
          );

          const textToSpeak = hindiVoice ? item.hindiText : item.englishFallback || item.hindiText;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.volume = 1.0;
          utterance.rate = 0.90; // articulate, clean pace
          utterance.pitch = 1.04; // bright, high clarity

          if (hindiVoice) {
            utterance.voice = hindiVoice;
            utterance.lang = hindiVoice.lang || "hi-IN";
          } else if (indianEnglishVoice) {
            utterance.voice = indianEnglishVoice;
            utterance.lang = "en-IN";
          } else {
            utterance.lang = "en-US";
          }

          utterance.onend = () => done();
          utterance.onerror = () => done();

          synth.speak(utterance);
        } catch {
          done();
        }
      };

      tryStudioTTS().then((success) => {
        if (!success) {
          tryFallbackWebSpeech();
        }
      });
    });
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const orderAudioService = new OrderAudioService();

/**
 * Format clean, courteous Hindi & English announcement text for a table dine-in order.
 */
export function formatOrderSpeechText(order: {
  tableNumber: string;
  totalItems?: number;
  items?: Array<{ name: string; quantity: number }>;
}): { hindiText: string; englishFallback: string } {
  const table = order.tableNumber || "General";
  const items = order.items || [];
  const dishCount = order.totalItems || items.reduce((sum, it) => sum + it.quantity, 0) || 1;

  if (items.length > 0 && items.length <= 3) {
    const dishList = items.map((it) => `${it.quantity > 1 ? `${it.quantity} ` : ""}${it.name}`).join(", ");
    return {
      hindiText: `ध्यान दें! टेबल नंबर ${table} से नया आर्डर आया है: ${dishList}!`,
      englishFallback: `Attention kitchen! Table number ${table}: New order of ${dishList}!`,
    };
  }

  return {
    hindiText: `ध्यान दें! टेबल नंबर ${table} से ${dishCount} डिश का नया आर्डर आया है!`,
    englishFallback: `Attention kitchen! Table number ${table}: New order of ${dishCount} dishes received!`,
  };
}

/**
 * Format clean Hindi & English announcement text for a table service call / waiter bell.
 */
export function formatServiceCallSpeechText(call: {
  tableNumber: string;
  reason: "waiter" | "water" | "bill" | "cutlery" | "assistance" | string;
}): { hindiText: string; englishFallback: string } {
  const table = call.tableNumber || "General";
  let reasonHindi = "वेटर को बुलाया गया है";
  let reasonEn = "Waiter assistance requested";

  if (call.reason === "water") {
    reasonHindi = "पीने का पानी मंगाया गया है";
    reasonEn = "Drinking water requested";
  } else if (call.reason === "bill") {
    reasonHindi = "बिल मंगाया गया है";
    reasonEn = "Bill requested";
  } else if (call.reason === "cutlery") {
    reasonHindi = "कटलरी मंगाई गई है";
    reasonEn = "Cutlery requested";
  }

  return {
    hindiText: `ध्यान दें! टेबल नंबर ${table} पर ${reasonHindi}!`,
    englishFallback: `Attention! Table number ${table}: ${reasonEn}!`,
  };
}

// Backward-compatibility export
export function playChimeSound() {
  orderAudioService.playChimeSound();
}

export function speakVoiceAnnouncement(hindiText: string, englishFallback?: string) {
  orderAudioService.enqueue({
    id: `announcement_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tableNumber: "Kitchen",
    hindiText,
    englishFallback: englishFallback || hindiText,
    createdAt: Date.now(),
  });
}
