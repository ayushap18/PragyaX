"use client";

import { useFlightPolling } from '@/hooks/useFlightPolling';
import { useEarthquakePolling } from '@/hooks/useEarthquakePolling';
import { useSatellitePolling } from '@/hooks/useSatellitePolling';
import { useAQIPolling } from '@/hooks/useAQIPolling';
import { useIntelBrief } from '@/hooks/useIntelBrief';
import { useDroneControls } from '@/hooks/useDroneControls';
import { useDroneCommentary } from '@/hooks/useDroneCommentary';
import { useEntityClick } from '@/hooks/useEntityClick';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useStatusTicker } from '@/hooks/useStatusTicker';

export default function DataPollingManager() {
  useFlightPolling();
  useEarthquakePolling();
  useSatellitePolling();
  useAQIPolling();
  useIntelBrief();
  useDroneControls();
  useDroneCommentary();
  useEntityClick();
  useBreadcrumbs();
  useStatusTicker();
  return null;
}
