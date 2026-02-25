/**
 * Draw a rotated realistic aircraft silhouette on a canvas and return the data URL.
 */
export function createAircraftCanvas(
  headingDeg: number,
  color: string = '#00FFD1'
): string {
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((headingDeg * Math.PI) / 180);

  // Scale up the silhouette by 1.35x for larger icon
  const s = 1.35;

  // Aircraft silhouette — fuselage + swept wings + tail
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);      // nose
  ctx.lineTo(1.5 * s, -8 * s);
  ctx.lineTo(1.5 * s, -3 * s);
  ctx.lineTo(10 * s, 0);       // right wing tip
  ctx.lineTo(10 * s, 2 * s);
  ctx.lineTo(1.5 * s, 1 * s);
  ctx.lineTo(1.5 * s, 6 * s);
  ctx.lineTo(4 * s, 9 * s);    // right tail
  ctx.lineTo(4 * s, 10 * s);
  ctx.lineTo(1 * s, 8 * s);
  ctx.lineTo(0, 10 * s);       // tail center
  ctx.lineTo(-1 * s, 8 * s);
  ctx.lineTo(-4 * s, 10 * s);  // left tail
  ctx.lineTo(-4 * s, 9 * s);
  ctx.lineTo(-1.5 * s, 6 * s);
  ctx.lineTo(-1.5 * s, 1 * s);
  ctx.lineTo(-10 * s, 2 * s);  // left wing tip
  ctx.lineTo(-10 * s, 0);
  ctx.lineTo(-1.5 * s, -3 * s);
  ctx.lineTo(-1.5 * s, -8 * s);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fill();

  // Cockpit highlight
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, -9 * s, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.8;
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL();
}

/**
 * Draw a satellite icon on a canvas and return the data URL.
 * Draws a recognisable satellite silhouette: central body + two solar panels.
 */
export function createSatelliteCanvas(color: string = '#FFA500'): string {
  const size = 28;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Central satellite body — small diamond shape
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 3, cy);
  ctx.lineTo(cx, cy + 4);
  ctx.lineTo(cx - 3, cy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.shadowBlur = 0;

  // Solar panel left — rectangle angled at 45deg
  ctx.save();
  ctx.translate(cx - 3, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-8, -3, 8, 6);
  // Panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.lineTo(-4, 3);
  ctx.stroke();
  ctx.restore();

  // Solar panel right — rectangle angled at 45deg
  ctx.save();
  ctx.translate(cx + 3, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, -3, 8, 6);
  // Panel lines
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.lineTo(4, 3);
  ctx.stroke();
  ctx.restore();

  // Antenna dish on top
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 1, cy - 7);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 1, cy - 8, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.6;
  ctx.fill();

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
