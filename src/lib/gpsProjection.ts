/**
 * GPS Projection: pixel-to-geographic coordinate conversion using pinhole camera model.
 * Projects detected objects from camera image space to estimated lat/lon positions.
 */

interface CameraCalibration {
  lat: number;           // camera GPS latitude
  lon: number;           // camera GPS longitude
  altitudeM: number;     // camera height above ground (meters)
  heading: number;       // compass bearing (0 = north, 90 = east)
  tilt: number;          // downward angle (0 = horizon, 90 = looking straight down)
  fovHorizontal: number; // horizontal field of view (degrees)
  fovVertical: number;   // vertical field of view (degrees)
  resolutionX: number;   // image width in pixels
  resolutionY: number;   // image height in pixels
}

interface ProjectedPoint {
  lat: number;
  lon: number;
  distanceM: number;
  bearing: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const METERS_PER_DEG_LAT = 111320;

/**
 * Project a pixel coordinate (from detection bounding box center) to lat/lon.
 *
 * @param pixelX - horizontal pixel coordinate (0 = left edge)
 * @param pixelY - vertical pixel coordinate (0 = top edge)
 * @param cal - camera calibration parameters
 * @returns projected GPS coordinates with distance and bearing
 */
export function projectPixelToGPS(pixelX: number, pixelY: number, cal: CameraCalibration): ProjectedPoint | null {
  // Normalize pixel coordinates to [-1, 1] range
  const normX = (pixelX / cal.resolutionX) * 2 - 1; // -1 = left, +1 = right
  const normY = (pixelY / cal.resolutionY) * 2 - 1; // -1 = top, +1 = bottom

  // Angular offset from camera center
  const azimuthOffset = normX * (cal.fovHorizontal / 2) * DEG_TO_RAD;
  const elevationOffset = normY * (cal.fovVertical / 2) * DEG_TO_RAD;

  // Actual viewing angle (tilt adjusted by pixel position)
  // tilt = 0 means looking at horizon, tilt = 90 means looking straight down
  const viewElevation = cal.tilt * DEG_TO_RAD + elevationOffset;

  // If looking above horizon, can't intersect ground
  if (viewElevation <= 0) return null;

  // Ground distance using trigonometry
  // d = h / tan(elevation)
  const groundDistanceM = cal.altitudeM / Math.tan(viewElevation);

  // Bearing from camera
  const bearing = cal.heading * DEG_TO_RAD + azimuthOffset;

  // Project to lat/lon using flat-earth approximation (good for < 10km)
  const dLatM = groundDistanceM * Math.cos(bearing);
  const dLonM = groundDistanceM * Math.sin(bearing);

  const metersPerDegLon = METERS_PER_DEG_LAT * Math.cos(cal.lat * DEG_TO_RAD);

  const projectedLat = cal.lat + dLatM / METERS_PER_DEG_LAT;
  const projectedLon = cal.lon + dLonM / metersPerDegLon;

  return {
    lat: projectedLat,
    lon: projectedLon,
    distanceM: groundDistanceM,
    bearing: ((bearing * RAD_TO_DEG) % 360 + 360) % 360,
  };
}

/**
 * Project the center of a bounding box to GPS.
 */
export function projectBBoxCenterToGPS(
  bbox: [number, number, number, number], // [x, y, width, height]
  cal: CameraCalibration
): ProjectedPoint | null {
  const centerX = bbox[0] + bbox[2] / 2;
  const centerY = bbox[1] + bbox[3] / 2;
  return projectPixelToGPS(centerX, centerY, cal);
}

/**
 * Project the bottom center of a bounding box (ground contact point).
 * More accurate for vehicles/people since their feet/wheels touch the ground.
 */
export function projectBBoxGroundPoint(
  bbox: [number, number, number, number],
  cal: CameraCalibration
): ProjectedPoint | null {
  const centerX = bbox[0] + bbox[2] / 2;
  const bottomY = bbox[1] + bbox[3]; // bottom edge
  return projectPixelToGPS(centerX, bottomY, cal);
}

/**
 * Create a default calibration for a PragyaX CCTV camera position.
 */
export function defaultCalibration(
  lat: number,
  lon: number,
  heading: number
): CameraCalibration {
  return {
    lat,
    lon,
    altitudeM: 10,          // typical street camera height
    heading,
    tilt: 30,               // 30° downward tilt
    fovHorizontal: 90,
    fovVertical: 60,
    resolutionX: 1920,
    resolutionY: 1080,
  };
}

export type { CameraCalibration, ProjectedPoint };
