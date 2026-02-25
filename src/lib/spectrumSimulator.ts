/**
 * Procedural RF spectrum simulator.
 * Generates realistic signal patterns across the electromagnetic spectrum
 * with known bands (ADS-B, GPS, WiFi, military, satellite) plus noise floor + random events.
 */

interface DetectedSignal {
  frequencyMHz: number;
  bandwidthKHz: number;
  powerDbm: number;
  modulation: 'AM' | 'FM' | 'PSK' | 'QAM' | 'FHSS' | 'UNKNOWN';
  classification: 'CIVILIAN' | 'MILITARY' | 'SATELLITE' | 'UNKNOWN';
  label: string;
  anomalous: boolean;
}

// Known signal sources
const KNOWN_SIGNALS: Omit<DetectedSignal, 'powerDbm' | 'anomalous'>[] = [
  { frequencyMHz: 0.0225, bandwidthKHz: 5, modulation: 'AM', classification: 'MILITARY', label: 'VLF COMMS' },
  { frequencyMHz: 0.1, bandwidthKHz: 10, modulation: 'AM', classification: 'CIVILIAN', label: 'LF NAV' },
  { frequencyMHz: 2.182, bandwidthKHz: 6, modulation: 'AM', classification: 'CIVILIAN', label: 'MARITIME DISTRESS' },
  { frequencyMHz: 5.0, bandwidthKHz: 3, modulation: 'AM', classification: 'CIVILIAN', label: 'WWV TIME' },
  { frequencyMHz: 14.0, bandwidthKHz: 50, modulation: 'AM', classification: 'CIVILIAN', label: 'HAM 20M' },
  { frequencyMHz: 74.0, bandwidthKHz: 200, modulation: 'FM', classification: 'CIVILIAN', label: 'FM BROADCAST' },
  { frequencyMHz: 88.0, bandwidthKHz: 200, modulation: 'FM', classification: 'CIVILIAN', label: 'FM BROADCAST' },
  { frequencyMHz: 100.0, bandwidthKHz: 200, modulation: 'FM', classification: 'CIVILIAN', label: 'FM BROADCAST' },
  { frequencyMHz: 108.0, bandwidthKHz: 50, modulation: 'AM', classification: 'CIVILIAN', label: 'VOR NAV' },
  { frequencyMHz: 121.5, bandwidthKHz: 25, modulation: 'AM', classification: 'CIVILIAN', label: 'GUARD FREQ' },
  { frequencyMHz: 137.0, bandwidthKHz: 100, modulation: 'FM', classification: 'SATELLITE', label: 'NOAA APT' },
  { frequencyMHz: 156.8, bandwidthKHz: 25, modulation: 'FM', classification: 'CIVILIAN', label: 'VHF CH16' },
  { frequencyMHz: 162.4, bandwidthKHz: 50, modulation: 'FM', classification: 'SATELLITE', label: 'AIS SHIP' },
  { frequencyMHz: 243.0, bandwidthKHz: 25, modulation: 'AM', classification: 'MILITARY', label: 'MIL GUARD' },
  { frequencyMHz: 380.0, bandwidthKHz: 200, modulation: 'FHSS', classification: 'MILITARY', label: 'TETRA MIL' },
  { frequencyMHz: 406.0, bandwidthKHz: 10, modulation: 'PSK', classification: 'SATELLITE', label: 'COSPAS-SARSAT' },
  { frequencyMHz: 462.0, bandwidthKHz: 25, modulation: 'FM', classification: 'CIVILIAN', label: 'FRS/GMRS' },
  { frequencyMHz: 700.0, bandwidthKHz: 5000, modulation: 'QAM', classification: 'CIVILIAN', label: 'LTE BAND 12' },
  { frequencyMHz: 850.0, bandwidthKHz: 5000, modulation: 'QAM', classification: 'CIVILIAN', label: 'LTE BAND 5' },
  { frequencyMHz: 978.0, bandwidthKHz: 1000, modulation: 'PSK', classification: 'CIVILIAN', label: 'UAT ADS-B' },
  { frequencyMHz: 1030.0, bandwidthKHz: 500, modulation: 'PSK', classification: 'CIVILIAN', label: 'SSR INTERROG' },
  { frequencyMHz: 1090.0, bandwidthKHz: 500, modulation: 'PSK', classification: 'CIVILIAN', label: 'ADS-B 1090ES' },
  { frequencyMHz: 1176.45, bandwidthKHz: 2000, modulation: 'PSK', classification: 'SATELLITE', label: 'GPS L5' },
  { frequencyMHz: 1227.60, bandwidthKHz: 2000, modulation: 'PSK', classification: 'SATELLITE', label: 'GPS L2' },
  { frequencyMHz: 1381.05, bandwidthKHz: 2000, modulation: 'PSK', classification: 'MILITARY', label: 'GPS L3 MIL' },
  { frequencyMHz: 1544.0, bandwidthKHz: 5000, modulation: 'PSK', classification: 'SATELLITE', label: 'INMARSAT' },
  { frequencyMHz: 1575.42, bandwidthKHz: 2000, modulation: 'PSK', classification: 'SATELLITE', label: 'GPS L1 C/A' },
  { frequencyMHz: 1800.0, bandwidthKHz: 10000, modulation: 'QAM', classification: 'CIVILIAN', label: 'LTE BAND 3' },
  { frequencyMHz: 2400.0, bandwidthKHz: 22000, modulation: 'QAM', classification: 'CIVILIAN', label: 'WIFI 2.4G' },
  { frequencyMHz: 2600.0, bandwidthKHz: 10000, modulation: 'QAM', classification: 'CIVILIAN', label: 'LTE BAND 7' },
  { frequencyMHz: 3500.0, bandwidthKHz: 20000, modulation: 'QAM', classification: 'CIVILIAN', label: '5G NR N78' },
  { frequencyMHz: 5200.0, bandwidthKHz: 40000, modulation: 'QAM', classification: 'CIVILIAN', label: 'WIFI 5G-LO' },
  { frequencyMHz: 5800.0, bandwidthKHz: 40000, modulation: 'QAM', classification: 'CIVILIAN', label: 'WIFI 5G-HI' },
  { frequencyMHz: 8000.0, bandwidthKHz: 5000, modulation: 'FHSS', classification: 'MILITARY', label: 'X-BAND RADAR' },
  { frequencyMHz: 10000.0, bandwidthKHz: 2000, modulation: 'FHSS', classification: 'MILITARY', label: 'X-BAND SAR' },
  { frequencyMHz: 12000.0, bandwidthKHz: 10000, modulation: 'QAM', classification: 'SATELLITE', label: 'SAT KU-BAND' },
  { frequencyMHz: 14250.0, bandwidthKHz: 5000, modulation: 'QAM', classification: 'SATELLITE', label: 'SAT KU-UP' },
  { frequencyMHz: 20000.0, bandwidthKHz: 10000, modulation: 'QAM', classification: 'SATELLITE', label: 'SAT KA-BAND' },
  { frequencyMHz: 26500.0, bandwidthKHz: 5000, modulation: 'QAM', classification: 'MILITARY', label: 'KA-MILSATCOM' },
];

/**
 * Generate a snapshot of the spectrum at the current instant.
 * Returns active signals with jittered power levels.
 */
export function generateSpectrumSnapshot(noiseFloorDbm: number = -110): DetectedSignal[] {
  const signals: DetectedSignal[] = [];
  const now = Date.now();

  for (const sig of KNOWN_SIGNALS) {
    // Some signals are intermittent
    const activity = signalActivity(sig.label, now);
    if (!activity) continue;

    const basePower = signalBasePower(sig);
    const jitter = (Math.random() - 0.5) * 6; // ±3 dBm jitter
    const fadingDb = Math.sin(now / (3000 + sig.frequencyMHz * 0.1)) * 4; // slow fading

    signals.push({
      ...sig,
      powerDbm: basePower + jitter + fadingDb,
      anomalous: false,
    });
  }

  // Random anomalous signal (5% chance per snapshot)
  if (Math.random() < 0.05) {
    const freqMHz = 100 + Math.random() * 5000;
    signals.push({
      frequencyMHz: freqMHz,
      bandwidthKHz: 50 + Math.random() * 500,
      powerDbm: noiseFloorDbm + 30 + Math.random() * 30,
      modulation: 'UNKNOWN',
      classification: 'UNKNOWN',
      label: `UNK-${freqMHz.toFixed(0)}`,
      anomalous: true,
    });
  }

  return signals;
}

function signalActivity(label: string, now: number): boolean {
  // FM broadcast: always on
  if (label.includes('FM BROADCAST') || label.includes('GPS') || label.includes('LTE') || label.includes('WIFI')) return true;
  // ADS-B: always on
  if (label.includes('ADS-B') || label.includes('SSR')) return true;
  // HAM: intermittent (70% duty)
  if (label.includes('HAM')) return Math.sin(now / 7000) > -0.4;
  // Military: intermittent (50% duty, different phases)
  if (label.includes('MIL') || label.includes('RADAR')) return Math.sin(now / 5000 + 1.5) > 0;
  // Satellite: periodic passes
  if (label.includes('NOAA') || label.includes('COSPAS')) return Math.sin(now / 20000) > 0.3;
  // Default: mostly on
  return Math.random() > 0.1;
}

function signalBasePower(sig: { classification: string; frequencyMHz: number }): number {
  // Higher frequencies generally have less propagation → lower received power
  const freqAttenuation = Math.log10(sig.frequencyMHz + 1) * 5;
  const base: Record<string, number> = {
    CIVILIAN: -50,
    MILITARY: -60,
    SATELLITE: -70,
    UNKNOWN: -80,
  };
  return (base[sig.classification] || -70) - freqAttenuation;
}

/**
 * Generate waterfall data (history lines).
 * Returns a 2D array: each row is a frequency bin power level in dBm.
 */
export function generateWaterfallLine(
  signals: DetectedSignal[],
  bins: number = 256,
  rangeStart: number = 0.003,
  rangeEnd: number = 30000,
  noiseFloor: number = -110
): number[] {
  const line = new Array(bins).fill(noiseFloor);
  const logStart = Math.log10(rangeStart);
  const logEnd = Math.log10(rangeEnd);
  const logRange = logEnd - logStart;

  for (const sig of signals) {
    const logFreq = Math.log10(sig.frequencyMHz);
    const binCenter = Math.round(((logFreq - logStart) / logRange) * bins);
    const bwBins = Math.max(1, Math.round((sig.bandwidthKHz / 1000 / sig.frequencyMHz) * bins * 2));

    for (let b = binCenter - bwBins; b <= binCenter + bwBins; b++) {
      if (b >= 0 && b < bins) {
        const dist = Math.abs(b - binCenter) / (bwBins || 1);
        const rolloff = Math.exp(-dist * dist * 3); // gaussian rolloff
        const power = sig.powerDbm * rolloff + noiseFloor * (1 - rolloff);
        line[b] = Math.max(line[b], power + (Math.random() - 0.5) * 3);
      }
    }
  }

  // Add noise
  for (let i = 0; i < bins; i++) {
    line[i] += (Math.random() - 0.5) * 4;
  }

  return line;
}

export type { DetectedSignal };
