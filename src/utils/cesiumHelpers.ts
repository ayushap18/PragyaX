/**
 * Draw a rotated realistic aircraft silhouette on a canvas and return the data URL.
 */
export function createAircraftCanvas(
  headingDeg: number,
  color: string = '#00FFD1'
): string {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((headingDeg * Math.PI) / 180);

  // Aircraft silhouette — fuselage + swept wings + tail
  ctx.beginPath();
  ctx.moveTo(0, -12);    // nose
  ctx.lineTo(1.5, -8);
  ctx.lineTo(1.5, -3);
  ctx.lineTo(10, 0);     // right wing tip
  ctx.lineTo(10, 2);
  ctx.lineTo(1.5, 1);
  ctx.lineTo(1.5, 6);
  ctx.lineTo(4, 9);      // right tail
  ctx.lineTo(4, 10);
  ctx.lineTo(1, 8);
  ctx.lineTo(0, 10);     // tail center
  ctx.lineTo(-1, 8);
  ctx.lineTo(-4, 10);    // left tail
  ctx.lineTo(-4, 9);
  ctx.lineTo(-1.5, 6);
  ctx.lineTo(-1.5, 1);
  ctx.lineTo(-10, 2);    // left wing tip
  ctx.lineTo(-10, 0);
  ctx.lineTo(-1.5, -3);
  ctx.lineTo(-1.5, -8);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fill();

  // Cockpit highlight
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, -9, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.7;
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL();
}

/**
 * Map earthquake magnitude to color.
 */
export function getMagnitudeColor(mag: number): string {
  if (mag >= 6) return '#FF3333';
  if (mag >= 5) return '#FFA500';
  if (mag >= 4) return '#FFD700';
  return '#00FF41';
}

/**
 * Map earthquake magnitude to radius in meters.
 */
export function getQuakeRadius(mag: number): number {
  if (mag >= 7) return 100000;
  if (mag >= 6) return 50000;
  if (mag >= 5) return 25000;
  if (mag >= 4) return 10000;
  return 5000;
}
