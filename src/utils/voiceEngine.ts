"use client";

/**
 * Voice readout engine using Web Speech API.
 * Provides military-style computer voice announcements for critical events.
 * Toggle in settings, default OFF.
 */

class VoiceEngine {
  private enabled = false;
  private speaking = false;
  private queue: string[] = [];

  /** Enable or disable voice readout. */
  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) {
      this.cancel();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /** Speak an utterance. Latest takes priority — cancels current if speaking. */
  speak(text: string) {
    if (!this.enabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel current speech — latest takes priority
    if (this.speaking) {
      window.speechSynthesis.cancel();
      this.queue = [];
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.85;
    utterance.volume = 0.8;

    // Try to select a female English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Female") ||
          v.name.includes("Samantha") ||
          v.name.includes("Victoria") ||
          v.name.includes("Karen") ||
          v.name.includes("Moira"))
    );
    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.speaking = true;
    };
    utterance.onend = () => {
      this.speaking = false;
      // Process queue
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.speak(next);
      }
    };
    utterance.onerror = () => {
      this.speaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  /** Queue a message if currently speaking, otherwise speak immediately. */
  announce(text: string) {
    if (!this.enabled) return;
    if (this.speaking) {
      // Only keep latest in queue (max 1)
      this.queue = [text];
    } else {
      this.speak(text);
    }
  }

  /** Cancel all speech. */
  cancel() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    this.queue = [];
    this.speaking = false;
  }

  // ─── Pre-built announcements ─────────────

  earthquakeAlert(magnitude: number, location: string) {
    this.announce(
      `ALERT. Earthquake magnitude ${magnitude.toFixed(1)} detected. ${location}.`
    );
  }

  squawkAlert(callsign: string, squawk: string) {
    const digits = squawk.split("").join(" ");
    this.announce(
      `WARNING. Aircraft ${callsign}. Squawk ${digits}.`
    );
  }

  satellitePass(name: string, minutes: number) {
    this.announce(
      `NOTICE. Satellite ${name} pass in ${Math.round(minutes)} minutes.`
    );
  }

  modeChange(mode: string) {
    const modeNames: Record<string, string> = {
      NORMAL: "Normal Mode",
      CRT: "CRT Mode",
      NVG: "Night Vision Mode",
      FLIR: "Thermal Imaging Mode",
      DRONE: "Drone Surveillance Mode",
      GREEN: "Green Matrix Mode",
      CHANAKYA: "Chanakya Mode. Strategic intelligence network active.",
    };
    this.announce(modeNames[mode] || `${mode} Mode activated.`);
  }

  geofenceBreach(zoneName: string, entityId: string) {
    this.announce(
      `ALERT. Geofence breach. Entity ${entityId} entered zone ${zoneName}.`
    );
  }

  anomalyDetected(type: string) {
    this.announce(`NOTICE. Anomaly detected. Type: ${type}.`);
  }

  bootComplete() {
    this.announce("PragyaX. Geospatial Intelligence System. Online.");
  }
}

// Singleton instance
export const voiceEngine = new VoiceEngine();
