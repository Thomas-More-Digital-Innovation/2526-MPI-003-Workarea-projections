"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GridPreset from "@/components/grid/GridPreset";

// --- Types -----------------------------------------------------------------
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

interface GridLayout {
  gridLayoutId: number;
  amount: number;
  shape: "circle" | "rectangle" | "square";
  size: "small" | "medium" | "large";
}

interface ImageData {
  imageId: number;
  path: string;
  description: string;
}

interface Step {
  stepId: number;
  step: number;
  imageId?: number;
  gridLayoutId?: number;
  presetId: number;
}

// --- Component --------------------------------------------------------------
export default function ProjectionPage() {
  const router = useRouter();

  // Refs for camera & processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calibration / webcam states
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Grid / detection state
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleStates, setCircleStates] = useState<boolean[]>([]);
  const [gridLayout, setGridLayout] = useState<GridLayout | null>(null);

  // Image state
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [isImageStep, setIsImageStep] = useState(false);

  // Countdown and flow
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isAllStepsComplete, setIsAllStepsComplete] = useState(false);

  // --- Load steps and determine if grid or image ---
  useEffect(() => {
    const loadStepAndContent = async () => {
      const presetId = localStorage.getItem("currentPresetId");
      let stepIndex = Number(localStorage.getItem("currentStepIndex") || "0");

      if (!presetId) {
        if (confirm("No preset selected. Click OK to return to homepage.")) {
          router.push("/");
        }
        return;
      }

      try {
        const api = (globalThis as any)?.electronAPI;
        if (!api?.getStepsByPreset) {
          alert("Cannot load steps - API method not available");
          router.push("/");
          return;
        }

        const steps: Step[] = await api.getStepsByPreset(Number(presetId));
        if (!steps || steps.length === 0) {
          alert("No steps found for this preset");
          router.push("/");
          return;
        }

        if (stepIndex >= steps.length) {
          alert("All steps completed!");
          router.push("/");
          return;
        }

        const currentStep = steps[stepIndex];
        localStorage.setItem("currentStepIndex", stepIndex.toString());

        // Check if this is an image step or grid step
        if (currentStep.imageId) {
          // IMAGE STEP
          setIsImageStep(true);
          
          // Load image data
          const allImages = await api.getImages();
          const imageData = allImages.find((img: ImageData) => img.imageId === currentStep.imageId);
          
          if (!imageData) {
            alert(`Image with ID ${currentStep.imageId} not found`);
            router.push("/");
            return;
          }

          setCurrentImage(imageData);
          
          // Start 5 second timer for image
          setTimeout(() => {
            advanceToNextStep();
          }, 5000);

        } else if (currentStep.gridLayoutId) {
          // GRID STEP
          setIsImageStep(false);
          localStorage.setItem("currentGridLayoutId", currentStep.gridLayoutId.toString());

          if (!api?.getGridLayouts) {
            alert("Cannot load grid layout - API method not available");
            router.push("/");
            return;
          }

          const allGridLayouts = await api.getGridLayouts();
          const gridLayoutFromDb = allGridLayouts.find(
            (layout: any) => layout.gridLayoutId === Number(currentStep.gridLayoutId)
          );

          if (!gridLayoutFromDb) {
            alert(`Grid layout with ID ${currentStep.gridLayoutId} not found in database`);
            router.push("/");
            return;
          }

          const parsedLayout: GridLayout = {
            gridLayoutId: gridLayoutFromDb.gridLayoutId,
            amount: Number(gridLayoutFromDb.amount) || 0,
            shape: (gridLayoutFromDb.shape as GridLayout["shape"]) || "circle",
            size: (gridLayoutFromDb.size as GridLayout["size"]) || "medium",
          };

          setGridLayout(parsedLayout);

          const generatedCircles = generateCirclesFromLayout(parsedLayout);
          setCircles(generatedCircles);
          setCircleStates(new Array(generatedCircles.length).fill(false));
        } else {
          alert("Step has no grid layout or image");
          router.push("/");
          return;
        }
      } catch (err) {
        alert(`Error loading step configuration: ${err}`);
        router.push("/");
      }
    };

    loadStepAndContent();
  }, [router]);

  // --- Function to advance to next step ---
  const advanceToNextStep = async () => {
    const presetId = localStorage.getItem("currentPresetId");
    let stepIndex = Number(localStorage.getItem("currentStepIndex") || "0");
    stepIndex++;

    try {
      const api = (globalThis as any)?.electronAPI;
      const steps = await api.getStepsByPreset(Number(presetId));

      if (stepIndex >= steps.length) {
        console.log("🎉 All steps completed! Showing completion message...");

        // Stop webcam if active
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }

        setIsAllStepsComplete(true);

        setTimeout(() => {
          console.log("⏰ 5 seconds elapsed, returning to homepage...");
          localStorage.removeItem("currentPresetId");
          localStorage.removeItem("currentStepIndex");
          localStorage.removeItem("currentGridLayoutId");
          router.push("/");
        }, 5000);
      } else {
        console.log(`⏭️ Loading step ${stepIndex + 1}...`);
        localStorage.setItem("currentStepIndex", stepIndex.toString());
        globalThis.location.reload();
      }
    } catch (err) {
      console.error("Error checking next step:", err);
      globalThis.location.reload();
    }
  };

  // --- Generate circles based on grid layout ---
  const generateCirclesFromLayout = (layout: GridLayout): Circle[] => {
    const { amount, shape, size } = layout;
    const circles: Circle[] = [];

    const canvasWidth = 1280;
    const canvasHeight = 720;

    let radius = 80;
    if (size === "small") radius = 60;
    else if (size === "medium") radius = 100;
    else if (size === "large") radius = 140;

    let cols = 0;
    let rows = 0;

    if (shape === "square") {
      cols = Math.ceil(Math.sqrt(amount));
      rows = Math.ceil(amount / cols);
    } else if (shape === "rectangle") {
      cols = Math.ceil(Math.sqrt(amount * 1.5));
      rows = Math.ceil(amount / cols);
    } else {
      cols = Math.min(4, amount);
      rows = Math.ceil(amount / cols);
    }

    const horizontalSpacing = canvasWidth / (cols + 1);
    const verticalSpacing = canvasHeight / (rows + 1);

    let id = 0;
    for (let row = 0; row < rows && id < amount; row++) {
      for (let col = 0; col < cols && id < amount; col++) {
        circles.push({
          id,
          x: horizontalSpacing * (col + 1),
          y: verticalSpacing * (row + 1),
          radius,
        });
        id++;
      }
    }

    return circles;
  };

  // --- Load calibration from localStorage ---
  useEffect(() => {
    // Only load calibration if this is NOT an image step
    if (isImageStep) return;

    const savedCalibration = localStorage.getItem("webcamCalibration");
    if (savedCalibration) {
      try {
        setCalibrationData(JSON.parse(savedCalibration));
      } catch (err) {
        console.error("Invalid calibration in storage:", err);
        setCalibrationData(null);
      }
    } else {
      if (confirm("No calibration found. Click OK to go to calibration page, or Cancel to return to homepage.")) {
        router.push("/calibration");
      } else {
        router.push("/");
      }
    }
  }, [router, isImageStep]);

  // --- Start webcam ---
  const startWebcam = useCallback(async () => {
    try {
      if (videoRef.current?.srcObject) {
        const existing = videoRef.current.srcObject as MediaStream;
        existing.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);

        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsWebcamActive(false);
        });
      }
    } catch (error: any) {
      console.error("Error accessing webcam:", error);
      if (error instanceof DOMException && error.name === "NotReadableError") {
        if (confirm("Camera is already in use. Please close the calibration tab first. Click OK to return to homepage.")) {
          router.push("/");
        }
      } else {
        if (confirm("Unable to access webcam. Please check permissions. Click OK to return to homepage.")) {
          router.push("/");
        }
      }
    }
  }, [router]);

  // --- Perspective transform utility ---
  function getPerspectiveTransform(src: { x: number; y: number }[], dst: { x: number; y: number }[]) {
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

  // --- Detection function ---
  const detectObjectsInCircles = useCallback(
    (imageData: Uint8ClampedArray, width: number, height: number) => {
      if (circles.length === 0) return;

      const newCircleStates = circles.map((circle) => {
        let totalPixels = 0;
        let darkPixels = 0;
        const step = 5;

        for (let y = Math.max(0, Math.floor(circle.y - circle.radius)); y <= Math.min(height - 1, Math.floor(circle.y + circle.radius)); y += step) {
          for (let x = Math.max(0, Math.floor(circle.x - circle.radius)); x <= Math.min(width - 1, Math.floor(circle.x + circle.radius)); x += step) {
            const dx = x - circle.x;
            const dy = y - circle.y;
            if (dx * dx + dy * dy <= circle.radius * circle.radius) {
              totalPixels++;
              const idx = (y * width + x) * 4;
              const r = imageData[idx];
              const g = imageData[idx + 1];
              const b = imageData[idx + 2];
              const brightness = (r + g + b) / 3;
              if (brightness < 200) darkPixels++;
            }
          }
        }

        return totalPixels > 0 && darkPixels / totalPixels > 0.3;
      });

      setCircleStates(newCircleStates);
    },
    [circles]
  );

  // --- Frame processing ---
  const processFrame = useCallback(() => {
    if (!calibrationData || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const video = videoRef.current;
    if (!ctx) return;

    if (!video.videoWidth || !video.videoHeight) return;

    const targetWidth = 1280;
    const targetHeight = 720;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const srcPoints = calibrationData.points.map((p) => ({
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
    detectObjectsInCircles(dstData, targetWidth, targetHeight);
  }, [calibrationData, detectObjectsInCircles]);

  // --- Animation loop ---
  useEffect(() => {
    let animationFrameId = 0;

    const animate = () => {
      processFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isWebcamActive && calibrationData && circles.length > 0 && !isImageStep) {
      animate();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isWebcamActive, calibrationData, circles, processFrame, isImageStep]);

  // --- Auto-start webcam when calibration & circles loaded (only for grid steps) ---
  useEffect(() => {
    if (calibrationData && circles.length > 0 && !isImageStep) {
      startWebcam();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    };
  }, [calibrationData, circles, startWebcam, isImageStep]);

  // --- Countdown & step advancement for GRID steps ---
  useEffect(() => {
    // Skip this logic for image steps
    if (isImageStep) return;

    const allGreen = circleStates.length > 0 && circleStates.every((s) => s === true);
    const allRed = circleStates.length > 0 && circleStates.every((s) => s === false);

    if (isDone && allRed) {
      setIsDone(false);
      advanceToNextStep();
      return;
    }

    if (allGreen && !isCountingDown && !isDone) {
      setIsCountingDown(true);
      setCountdown(5);
    } else if (!allGreen && isCountingDown && !isDone) {
      setIsCountingDown(false);
      setCountdown(null);
    }
  }, [circleStates, isCountingDown, isDone, isImageStep]);

  // --- Countdown timer effect ---
  useEffect(() => {
    if (isCountingDown && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : c));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      console.log("Countdown complete!");
      setIsCountingDown(false);
      setCountdown(null);
      setIsDone(true);
    }
  }, [countdown, isCountingDown]);

  // --- ESC handler to exit ---
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // --- Handler for manual clicks from GridPreset ---
  const handleShapeClick = (index: number) => {
    setCircleStates((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  // --- JSX -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* Hidden video (camera source) */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />

      {/* Hidden canvas used for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* CONTENT: Image or Grid */}
      {isImageStep && currentImage ? (
        // IMAGE STEP: Show fullscreen image
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <img
            src={`/${currentImage.path}`}
            alt={currentImage.description}
            className="w-full h-full object-cover"
          />
        </div>
      ) : gridLayout ? (
        // GRID STEP: Show grid preset
        <div className="w-full max-w-[1280px] max-h-[720px]">
          <GridPreset
            shape={gridLayout.shape === "square" ? "circle" : (gridLayout.shape as "circle" | "rectangle")}
            size={gridLayout.size}
            scale={1}
            total={circles.length}
            pagination={true}
            completedStates={circleStates}
            onShapeClick={handleShapeClick}
          />
        </div>
      ) : (
        <div className="p-8 text-center">Laden...</div>
      )}

      {/* Countdown display (only for grid steps) */}
      {!isImageStep && countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-9xl font-bold text-green-500 drop-shadow-[0_0_30px_rgba(0,255,0,0.7)]">{countdown}</div>
        </div>
      )}

      {/* Done display (only for grid steps) */}
      {!isImageStep && isDone && !isAllStepsComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-9xl font-bold text-blue-500 drop-shadow-[0_0_30px_rgba(0,100,255,0.7)]">done</div>
        </div>
      )}

      {/* All steps complete display */}
      {isAllStepsComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-bold text-green-500 drop-shadow-[0_0_30px_rgba(0,255,0,0.7)]">
            alle stappen zijn klaar
          </div>
        </div>
      )}
    </div>
  );
}