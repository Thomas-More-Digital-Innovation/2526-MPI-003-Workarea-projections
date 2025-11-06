'use client';

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
  id: string;
}

interface CalibrationData {
  points: Point[];
  aspectRatio: number;
}

interface Circle {
  id: number;
  x: number;
  y: number;
  radius: number;
}

// Define 8 circles in a grid pattern (2x4) - outside component to avoid recreating
const CIRCLES: Circle[] = [
  { id: 0, x: 160, y: 180, radius: 120 },
  { id: 1, x: 480, y: 180, radius: 120 },
  { id: 2, x: 800, y: 180, radius: 120 },
  { id: 3, x: 1120, y: 180, radius: 120 },
  { id: 4, x: 160, y: 540, radius: 120 },
  { id: 5, x: 480, y: 540, radius: 120 },
  { id: 6, x: 800, y: 540, radius: 120 },
  { id: 7, x: 1120, y: 540, radius: 120 },
];

export default function ProjectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [circleStates, setCircleStates] = useState<boolean[]>(new Array(8).fill(false));
  const router = useRouter();

  // Load calibration from localStorage
  useEffect(() => {
    const savedCalibration = localStorage.getItem('webcamCalibration');
    if (savedCalibration) {
      setCalibrationData(JSON.parse(savedCalibration));
    } else {
      if (confirm('No calibration found. Click OK to go to calibration page, or Cancel to return to homepage.')) {
        router.push('/calibration');
      } else {
        router.push('/');
      }
    }
  }, [router]);

  // Initialize webcam
  const startWebcam = useCallback(async () => {
    try {
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsWebcamActive(false);
        });
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      if (error instanceof DOMException && error.name === 'NotReadableError') {
        if (confirm('Camera is already in use. Please close the calibration tab first. Click OK to return to homepage.')) {
          router.push('/');
        }
      } else {
        if (confirm('Unable to access webcam. Please check permissions. Click OK to return to homepage.')) {
          router.push('/');
        }
      }
    }
  }, [router]);

  // Perspective transform functions
  function getPerspectiveTransform(src: {x:number,y:number}[], dst: {x:number,y:number}[]) {
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
  }
  
  function solveLinearSystem(A: number[][], b: number[]) {
    const n = b.length;
    const aug = A.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
      }
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
      for (let k = i + 1; k < n; k++) {
        const factor = aug[k][i] / aug[i][i];
        for (let j = i; j <= n; j++) aug[k][j] -= factor * aug[i][j];
      }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = aug[i][n];
      for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
      x[i] /= aug[i][i];
    }
    return x;
  }

  // Detect objects in each circle
  const detectObjectsInCircles = useCallback((imageData: Uint8ClampedArray, width: number, height: number) => {
    const newCircleStates = CIRCLES.map(circle => {
      let totalPixels = 0;
      let darkPixels = 0;

      // Sample pixels in a grid within the circle
      const step = 5; // Sample every 5 pixels for performance
      for (let y = circle.y - circle.radius; y <= circle.y + circle.radius; y += step) {
        for (let x = circle.x - circle.radius; x <= circle.x + circle.radius; x += step) {
          // Check if point is within circle
          const dx = x - circle.x;
          const dy = y - circle.y;
          if (dx * dx + dy * dy <= circle.radius * circle.radius) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              totalPixels++;
              const idx = (y * width + x) * 4;
              const r = imageData[idx];
              const g = imageData[idx + 1];
              const b = imageData[idx + 2];
              
              // Calculate brightness
              const brightness = (r + g + b) / 3;
              
              // Consider pixel "dark" if brightness is below threshold (object present)
              if (brightness < 200) {
                darkPixels++;
              }
            }
          }
        }
      }

      // If more than 30% of pixels are dark, consider object detected
      return totalPixels > 0 && (darkPixels / totalPixels) > 0.3;
    });

    setCircleStates(newCircleStates);
  }, []);

  // Apply calibration and detect objects
  const processFrame = useCallback(() => {
    if (!calibrationData || !canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const video = videoRef.current;
    if (!ctx) return;

    // Check if video is ready
    if (!video.videoWidth || !video.videoHeight) return;

    const targetWidth = 1280;
    const targetHeight = 720;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const srcPoints = calibrationData.points.map(p => ({
      x: (p.x / 100) * video.videoWidth,
      y: (p.y / 100) * video.videoHeight,
    }));

    const dstPoints = [
      { x: 0, y: 0 },
      { x: targetWidth, y: 0 },
      { x: targetWidth, y: targetHeight },
      { x: 0, y: targetHeight },
    ];

    const H = getPerspectiveTransform(dstPoints, srcPoints);

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = video.videoWidth;
    srcCanvas.height = video.videoHeight;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    srcCtx?.drawImage(video, 0, 0);

    const srcImage = srcCtx!.getImageData(0, 0, video.videoWidth, video.videoHeight);
    const dstImage = ctx.createImageData(targetWidth, targetHeight);
    const srcData = srcImage.data;
    const dstData = dstImage.data;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const denom = H[6] * x + H[7] * y + H[8];
        const sx = (H[0] * x + H[1] * y + H[2]) / denom;
        const sy = (H[3] * x + H[4] * y + H[5]) / denom;

        const ix = Math.floor(sx);
        const iy = Math.floor(sy);

        if (ix >= 0 && iy >= 0 && ix < video.videoWidth && iy < video.videoHeight) {
          const srcIdx = (iy * video.videoWidth + ix) * 4;
          const dstIdx = (y * targetWidth + x) * 4;
          dstData[dstIdx] = srcData[srcIdx];
          dstData[dstIdx + 1] = srcData[srcIdx + 1];
          dstData[dstIdx + 2] = srcData[srcIdx + 2];
          dstData[dstIdx + 3] = 255;
        }
      }
    }

    ctx.putImageData(dstImage, 0, 0);

    // Detect objects in circles
    detectObjectsInCircles(dstData, targetWidth, targetHeight);
  }, [calibrationData, detectObjectsInCircles]);

  // Draw overlay circles
  const drawOverlay = useCallback(() => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw circles
    CIRCLES.forEach((circle, index) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = circleStates[index] ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 4;
      ctx.stroke();
    });
  }, [circleStates]);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      processFrame();
      drawOverlay();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isWebcamActive && calibrationData) {
      animate();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isWebcamActive, calibrationData, processFrame, drawOverlay]);

  // Auto-start webcam
  useEffect(() => {
    if (calibrationData) {
      startWebcam();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    };
  }, [calibrationData, startWebcam]);

  // ESC key handler to exit to homepage
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Stop the camera
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        // Navigate to homepage
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
      
      {/* Hidden canvas for processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Visible overlay canvas with circles */}
      <canvas
        ref={overlayCanvasRef}
        width={1280}
        height={720}
        className="w-full h-full"
      />
    </div>
  );
}
