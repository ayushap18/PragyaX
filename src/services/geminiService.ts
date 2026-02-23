import type { VisionAnalysisResponse } from '@/types';

export async function analyzeFrame(params: {
  cameraId: string;
  city: string;
  label: string;
  lat: number;
  lon: number;
  direction: string;
}): Promise<VisionAnalysisResponse> {
  const res = await fetch('/api/vision/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Vision analysis failed: ${res.status}`);
  return res.json();
}
