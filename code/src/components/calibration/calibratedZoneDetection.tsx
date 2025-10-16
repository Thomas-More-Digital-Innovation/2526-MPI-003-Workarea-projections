'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Types
interface Point {
  x: number;
  y: number;
}

interface CalibrationPoint {
  x: number;
  y: number;
}

interface Zone {
  id: number;
  x: number;
  y: number;
  radius: number;
  hasObject: boolean;
  pixelCount?: number;
}

// Main Component
export default function CalibratedZoneDetection() {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const calibratedCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const projectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const calibrationLoopRef = useRef<number | null>(null);
  const transformLUTRef = useRef<Float32Array | null>(null);
  const gammaLUTRef = useRef<Uint8Array>(new Uint8Array(256));

  // State
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isCameraCalibrated, setIsCameraCalibrated] = useState(false);
  const [isProjecting, setIsProjecting] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [detectionCount, setDetectionCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [status, setStatus] = useState('Ready to start...');

  // Settings - using refs to avoid stale closures
  const settingsRef = useRef({
    zoneRadius: 80,
    zoneBorder: 4,
    padding: 50,
    gamma: 1.0,
    contrast: 1.0,
    brightness: 0
  });

  const [zoneRadius, setZoneRadius] = useState(80);
  const [zoneBorder, setZoneBorder] = useState(4);
  const [padding, setPadding] = useState(50);
  const [gamma, setGamma] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [brightness, setBrightness] = useState(0);

  // Update settings ref when values change
  useEffect(() => {
    settingsRef.current = { zoneRadius, zoneBorder, padding, gamma, contrast, brightness };
  }, [zoneRadius, zoneBorder, padding, gamma, contrast, brightness]);

  // Calibration points (normalized 0-1)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 }
  ]);

  const [activePoint, setActivePoint] = useState<number | null>(null);

  // Constants
  const MIN_BLOB_SIZE = 1200;
  const BACKGROUND_COLOR = '#ffffff';

  // Update gamma LUT
  useEffect(() => {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.min(255, Math.max(0, Math.pow(i / 255, 1 / gamma) * 255));
    }
    gammaLUTRef.current = lut;
  }, [gamma]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraStarted(true);
        setStatus('Camera started! Click "Start Calibration" to begin.');
      }
    } catch (err) {
      alert('Error accessing camera: ' + (err as Error).message);
    }
  };

  // Start calibration
  const startCalibration = () => {
    setIsCalibrating(true);
    setStatus('Drag the yellow points to match your projection area corners.');
  };

  // Initialize zones
  const initializeZones = useCallback(() => {
    const newZones: Zone[] = [];
    const cols = 4;
    const rows = 2;
    const width = calibratedCanvasRef.current?.width || 0;
    const height = calibratedCanvasRef.current?.height || 0;
    const currentPadding = settingsRef.current.padding;
    const currentRadius = settingsRef.current.zoneRadius;
    const availableWidth = width - (currentPadding * 2);
    const availableHeight = height - (currentPadding * 2);
    const spacingX = availableWidth / (cols + 1);
    const spacingY = availableHeight / (rows + 1);

    let zoneId = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = currentPadding + spacingX * (col + 1);
        const y = currentPadding + spacingY * (row + 1);
        newZones.push({
          id: zoneId++,
          x,
          y,
          radius: currentRadius,
          hasObject: false
        });
      }
    }
    setZones(newZones);
  }, []);

  // Perspective transform
  const getPerspectiveTransform = useCallback((src: Point[], dst: Point[]): number[] => {
    const A: number[][] = [];
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
      A.push([src[i].x, src[i].y, 1, 0, 0, 0, -dst[i].x * src[i].x, -dst[i].x * src[i].y]);
      A.push([0, 0, 0, src[i].x, src[i].y, 1, -dst[i].y * src[i].x, -dst[i].y * src[i].y]);
      b.push(dst[i].x);
      b.push(dst[i].y);
    }

    const h = solveLinearSystem(A, b);
    h.push(1);
    return h;
  }, []);

  const solveLinearSystem = (A: number[][], b: number[]): number[] => {
    const n = b.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }
    return x;
  };

  // Calibration loop
  const startCalibrationLoop = useCallback(() => {
    const video = videoRef.current;
    const calibratedCanvas = calibratedCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    
    if (!video || !calibratedCanvas || !sourceCanvas) return;

    const calCtx = calibratedCanvas.getContext('2d', { willReadFrequently: true });
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    if (!calCtx || !sourceCtx) return;

    sourceCanvas.width = video.videoWidth;
    sourceCanvas.height = video.videoHeight;

    const targetWidth = calibratedCanvas.width;
    const targetHeight = calibratedCanvas.height;
    const transformLUT = transformLUTRef.current!;
    const gammaLUT = gammaLUTRef.current;

    const loop = () => {
      const currentSettings = settingsRef.current;

      sourceCtx.drawImage(video, 0, 0);
      const srcImageData = sourceCtx.getImageData(0, 0, video.videoWidth, video.videoHeight);
      const dstImageData = calCtx.createImageData(targetWidth, targetHeight);

      const srcData = srcImageData.data;
      const dstData = dstImageData.data;
      const srcWidth = video.videoWidth;
      const srcHeight = video.videoHeight;

      let lutIdx = 0;
      for (let dy = 0; dy < targetHeight; dy++) {
        for (let dx = 0; dx < targetWidth; dx++) {
          const sx = transformLUT[lutIdx++];
          const sy = transformLUT[lutIdx++];

          if (sx >= 0 && sx < srcWidth - 1 && sy >= 0 && sy < srcHeight - 1) {
            const x1 = Math.floor(sx);
            const y1 = Math.floor(sy);
            const x2 = x1 + 1;
            const y2 = y1 + 1;

            const fx = sx - x1;
            const fy = sy - y1;
            const fx1 = 1 - fx;
            const fy1 = 1 - fy;

            const w11 = fx1 * fy1;
            const w21 = fx * fy1;
            const w12 = fx1 * fy;
            const w22 = fx * fy;

            const dstIdx = (dy * targetWidth + dx) * 4;
            const idx11 = (y1 * srcWidth + x1) * 4;
            const idx21 = (y1 * srcWidth + x2) * 4;
            const idx12 = (y2 * srcWidth + x1) * 4;
            const idx22 = (y2 * srcWidth + x2) * 4;

            let r = srcData[idx11] * w11 + srcData[idx21] * w21 + srcData[idx12] * w12 + srcData[idx22] * w22;
            let g = srcData[idx11 + 1] * w11 + srcData[idx21 + 1] * w21 + srcData[idx12 + 1] * w12 + srcData[idx22 + 1] * w22;
            let b = srcData[idx11 + 2] * w11 + srcData[idx21 + 2] * w21 + srcData[idx12 + 2] * w12 + srcData[idx22 + 2] * w22;

            r = ((r - 128) * currentSettings.contrast) + 128 + currentSettings.brightness;
            g = ((g - 128) * currentSettings.contrast) + 128 + currentSettings.brightness;
            b = ((b - 128) * currentSettings.contrast) + 128 + currentSettings.brightness;

            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));

            dstData[dstIdx] = gammaLUT[Math.floor(r)];
            dstData[dstIdx + 1] = gammaLUT[Math.floor(g)];
            dstData[dstIdx + 2] = gammaLUT[Math.floor(b)];
            dstData[dstIdx + 3] = 255;
          }
        }
      }

      calCtx.putImageData(dstImageData, 0, 0);
      calibrationLoopRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  // Initialize continuous calibration
  const initializeContinuousCalibration = useCallback(() => {
    const video = videoRef.current;
    const calibratedCanvas = calibratedCanvasRef.current;
    if (!video || !calibratedCanvas) return;

    const targetWidth = video.videoWidth;
    const targetHeight = Math.round(targetWidth * 9 / 16);

    const srcPoints = calibrationPoints.map(p => ({
      x: p.x * video.videoWidth,
      y: p.y * video.videoHeight
    }));

    const dstPoints = [
      { x: 0, y: 0 },
      { x: targetWidth, y: 0 },
      { x: targetWidth, y: targetHeight },
      { x: 0, y: targetHeight }
    ];

    const matrix = getPerspectiveTransform(dstPoints, srcPoints);

    calibratedCanvas.width = targetWidth;
    calibratedCanvas.height = targetHeight;
    
    if (detectionCanvasRef.current) {
      detectionCanvasRef.current.width = targetWidth;
      detectionCanvasRef.current.height = targetHeight;
    }
    
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = targetWidth;
      previewCanvasRef.current.height = targetHeight;
    }

    // Build LUT
    const transformLUT = new Float32Array(targetWidth * targetHeight * 2);
    let idx = 0;
    for (let dy = 0; dy < targetHeight; dy++) {
      for (let dx = 0; dx < targetWidth; dx++) {
        const denom = matrix[6] * dx + matrix[7] * dy + matrix[8];
        transformLUT[idx++] = (matrix[0] * dx + matrix[1] * dy + matrix[2]) / denom;
        transformLUT[idx++] = (matrix[3] * dx + matrix[4] * dy + matrix[5]) / denom;
      }
    }
    transformLUTRef.current = transformLUT;

    initializeZones();
    startCalibrationLoop();
  }, [calibrationPoints, getPerspectiveTransform, initializeZones, startCalibrationLoop]);

  // Save calibration
  const saveCalibration = () => {
    setIsCalibrating(false);
    setIsCameraCalibrated(true);
    setStatus('Camera calibrated! Click "Start Projection" to begin.');
    initializeContinuousCalibration();
  };

  // Reset
  const resetCalibration = () => {
    if (confirm('Reset calibration? This will restart the entire process.')) {
      window.location.reload();
    }
  };

  // Detection loop
  const startDetection = useCallback(() => {
    const calibratedCanvas = calibratedCanvasRef.current;
    const detectionCanvas = detectionCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const projectionCanvas = projectionCanvasRef.current;

    if (!calibratedCanvas || !detectionCanvas || !previewCanvas || !projectionCanvas) return;

    const calCtx = calibratedCanvas.getContext('2d', { willReadFrequently: true });
    const detCtx = detectionCanvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    const projectionCtx = projectionCanvas.getContext('2d');

    if (!calCtx || !detCtx || !previewCtx || !projectionCtx) return;

    const width = calibratedCanvas.width;
    const height = calibratedCanvas.height;
    let frameCount = 0;
    let lastTime = performance.now();

    const loop = () => {
      const currentSettings = settingsRef.current;
      const currentPadding = currentSettings.padding;
      const currentBorder = currentSettings.zoneBorder;

      const currentData = calCtx.getImageData(0, 0, width, height).data;
      const currentZones = zones.map(zone => ({
        ...zone,
        radiusSq: zone.radius * zone.radius,
        pixelCount: 0
      }));

      // Count dark pixels in each zone
      for (let y = currentPadding; y < height - currentPadding; y++) {
        const yIdx = y * width;
        for (let x = currentPadding; x < width - currentPadding; x++) {
          const idx = (yIdx + x) * 4;
          const brightness = (currentData[idx] + currentData[idx + 1] + currentData[idx + 2]) / 3;

          if (brightness < 200) {
            for (let i = 0; i < currentZones.length; i++) {
              const zone = currentZones[i];
              const dx = x - zone.x;
              const dy = y - zone.y;
              if (dx * dx + dy * dy <= zone.radiusSq) {
                zone.pixelCount++;
                break;
              }
            }
          }
        }
      }

      let count = 0;
      currentZones.forEach(zone => {
        zone.hasObject = zone.pixelCount >= MIN_BLOB_SIZE;
        if (zone.hasObject) count++;
      });

      setZones(currentZones);
      setDetectionCount(count);

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // Draw detection view
      detCtx.drawImage(calibratedCanvas, 0, 0);
      detCtx.lineWidth = currentBorder;
      currentZones.forEach(zone => {
        detCtx.strokeStyle = zone.hasObject ? '#00ff00' : '#ff0000';
        detCtx.beginPath();
        detCtx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        detCtx.stroke();

        detCtx.fillStyle = zone.hasObject ? '#00ff00' : '#ff0000';
        detCtx.font = 'bold 16px Arial';
        detCtx.textAlign = 'center';
        detCtx.textBaseline = 'middle';
        detCtx.fillText(zone.id.toString(), zone.x, zone.y);
      });

      // Draw preview
      previewCtx.fillStyle = '#1f2937';
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.lineWidth = currentBorder;
      currentZones.forEach(zone => {
        previewCtx.strokeStyle = zone.hasObject ? '#00ff00' : '#ff0000';
        previewCtx.beginPath();
        previewCtx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        previewCtx.stroke();

        previewCtx.fillStyle = zone.hasObject ? '#00ff00' : '#ff0000';
        previewCtx.font = 'bold 16px Arial';
        previewCtx.textAlign = 'center';
        previewCtx.textBaseline = 'middle';
        previewCtx.fillText(zone.id.toString(), zone.x, zone.y);
      });

      // Draw projection
      projectionCtx.fillStyle = BACKGROUND_COLOR;
      projectionCtx.fillRect(0, 0, projectionCanvas.width, projectionCanvas.height);

      const scaleX = projectionCanvas.width / width;
      const scaleY = projectionCanvas.height / height;
      projectionCtx.lineWidth = currentBorder * 2;

      currentZones.forEach(zone => {
        projectionCtx.strokeStyle = zone.hasObject ? '#00ff00' : '#ff0000';
        projectionCtx.beginPath();
        projectionCtx.arc(zone.x * scaleX, zone.y * scaleY, zone.radius * Math.max(scaleX, scaleY), 0, Math.PI * 2);
        projectionCtx.stroke();
      });

      animationIdRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [zones]);

  // Start/stop projection
  const toggleProjection = () => {
    if (!isProjecting) {
      if (projectionCanvasRef.current) {
        projectionCanvasRef.current.width = window.innerWidth;
        projectionCanvasRef.current.height = window.innerHeight;
      }
      setIsProjecting(true);
      setStatus('Projection active!');
      startDetection();
    } else {
      setIsProjecting(false);
      setStatus('Projection stopped.');
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    }
  };

  // Update zones when settings change
  useEffect(() => {
    if (isCameraCalibrated && calibratedCanvasRef.current) {
      initializeZones();
    }
  }, [padding, zoneRadius, isCameraCalibrated, initializeZones]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (calibrationLoopRef.current) {
        cancelAnimationFrame(calibrationLoopRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <span>🎯</span>
          Calibrated Zone Detection System
        </h1>

        {/* Step 1: Camera Setup */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-400 flex items-center gap-3">
            <span className="bg-green-400 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
            Camera Setup & Calibration
          </h2>

          <div className="bg-gray-700 p-4 rounded-lg mb-4 border-l-4 border-green-400">
            Start the camera, then drag the yellow points to match the corners of your projection area. Click &quot;Save Calibration&quot; when ready.
          </div>

          <div className="bg-black rounded-xl p-5 mb-4 min-h-[400px] flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`max-w-full max-h-[600px] ${isCameraCalibrated ? 'hidden' : 'block'}`}
            />
            <canvas
              ref={calibratedCanvasRef}
              className={`max-w-full max-h-[600px] ${isCameraCalibrated ? 'block' : 'hidden'}`}
            />
            <canvas ref={sourceCanvasRef} className="hidden" />

            {/* Calibration points */}
            {isCalibrating && videoRef.current && (
              <CalibrationPoints
                points={calibrationPoints}
                videoRef={videoRef}
                activePoint={activePoint}
                onPointUpdate={setCalibrationPoints}
                onActivePointChange={setActivePoint}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startCamera}
              disabled={isCameraStarted}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-60 rounded-lg font-semibold transition"
            >
              📷 Start Camera
            </button>
            <button
              onClick={startCalibration}
              disabled={!isCameraStarted || isCalibrating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-60 rounded-lg font-semibold transition"
            >
              🎯 Start Calibration
            </button>
            <button
              onClick={saveCalibration}
              disabled={!isCalibrating}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-60 rounded-lg font-semibold transition"
            >
              ✓ Save Calibration
            </button>
            <button
              onClick={resetCalibration}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Step 2: Zone Detection */}
        <div className={`bg-gray-800 rounded-xl p-6 mb-6 ${!isCameraCalibrated ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-2xl font-semibold mb-4 text-green-400 flex items-center gap-3">
            <span className="bg-green-400 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
            Zone Detection Setup
          </h2>

          <div className="bg-gray-700 p-4 rounded-lg mb-4 border-l-4 border-green-400">
            Configure your detection zones and start the projection. The calibrated camera view will be used for detection.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <SliderControl label="Zone Radius" value={zoneRadius} onChange={setZoneRadius} min={30} max={150} unit="px" />
            <SliderControl label="Zone Border" value={zoneBorder} onChange={setZoneBorder} min={2} max={10} unit="px" />
            <SliderControl label="Edge Padding" value={padding} onChange={setPadding} min={0} max={200} unit="px" />
            <SliderControl label="Gamma" value={gamma} onChange={setGamma} min={0.1} max={3.0} step={0.1} />
            <SliderControl label="Contrast" value={contrast} onChange={setContrast} min={0.5} max={10.0} step={0.1} />
            <SliderControl label="Brightness" value={brightness} onChange={setBrightness} min={-100} max={100} />
          </div>

          <button
            onClick={toggleProjection}
            disabled={!isCameraCalibrated}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-60 rounded-lg font-semibold transition mb-4"
          >
            {isProjecting ? '⏹ Stop Projection' : '⭕ Start Projection'}
          </button>

          <div className="bg-gray-700 p-3 rounded-lg mb-3">
            <strong>Status:</strong> <span className="text-green-400">{status}</span>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              Detections: <span className="text-green-400 font-semibold">{detectionCount}</span>
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              FPS: <span className="text-green-400 font-semibold">{fps}</span>
            </div>
          </div>
        </div>

        {/* Step 3: Preview */}
        <div className={`bg-gray-800 rounded-xl p-6 ${!isCameraCalibrated ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-2xl font-semibold mb-4 text-green-400 flex items-center gap-3">
            <span className="bg-green-400 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
            Detection Preview
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-400">Detection View</h3>
              <canvas ref={detectionCanvasRef} className="w-full rounded-xl bg-black" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-400">Zone Layout</h3>
              <canvas ref={previewCanvasRef} className="w-full rounded-xl bg-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Projection Overlay */}
      {isProjecting && (
        <div className="fixed inset-0 bg-black z-50">
          <canvas ref={projectionCanvasRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}

// Slider Control Component
function SliderControl({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}: <span className="text-green-400">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

// Calibration Points Component
function CalibrationPoints({ points, videoRef, activePoint, onPointUpdate, onActivePointChange }: {
  points: CalibrationPoint[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activePoint: number | null;
  onPointUpdate: (points: CalibrationPoint[]) => void;
  onActivePointChange: (index: number | null) => void;
}) {
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    onActivePointChange(index);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activePoint === null || !videoRef.current) return;

      const video = videoRef.current;
      const rect = video.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const newPoints = [...points];
      newPoints[activePoint] = {
        x: Math.max(0.01, Math.min(0.99, x)),
        y: Math.max(0.01, Math.min(0.99, y))
      };
      onPointUpdate(newPoints);
    };

    const handleMouseUp = () => {
      onActivePointChange(null);
    };

    if (activePoint !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [activePoint, points, videoRef, onPointUpdate, onActivePointChange]);

  if (!videoRef.current) return null;

  const videoRect = videoRef.current.getBoundingClientRect();

  return (
    <>
      {points.map((point, index) => (
        <div
          key={index}
          onMouseDown={(e) => handleMouseDown(index, e)}
          className="absolute w-5 h-5 bg-yellow-400 border-4 border-black rounded-full cursor-move shadow-lg"
          style={{
            left: `${point.x * videoRect.width}px`,
            top: `${point.y * videoRect.height}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        />
      ))}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: videoRect.width, height: videoRect.height }}
      >
        <polygon
          points={points.map(p => `${p.x * videoRect.width},${p.y * videoRect.height}`).join(' ')}
          fill="rgba(255, 204, 0, 0.05)"
          stroke="#ffcc00"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    </>
  );
}