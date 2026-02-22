/**
 * Draw a rotated aircraft triangle on a canvas and return the data URL.
 */
export function createAircraftCanvas(
  headingDeg: number,
  color: string = '#00FFD1'
): string {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((headingDeg * Math.PI) / 180);

  // Draw aircraft triangle
  ctx.beginPath();
  ctx.moveTo(0, -8); // nose
  ctx.lineTo(-5, 7); // left wing
  ctx.lineTo(0, 4); // body
  ctx.lineTo(5, 7); // right wing
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
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
