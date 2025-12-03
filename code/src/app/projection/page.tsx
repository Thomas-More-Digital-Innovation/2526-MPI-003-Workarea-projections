"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GridPreset from "@/components/grid/GridPreset";
import Toast from "@/components/ui/Toast";

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
  width?: number;  // For rectangular shapes
  height?: number; // For rectangular shapes
  shape?: "circle" | "rectangle"; // To know which detection method to use
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

// Configuration for max circles per page based on shape and size
const GRID_CONFIG = {
  "rectangle-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "rectangle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "rectangle-large": { rows: 2, cols: 2, maxPerPage: 4 },
  "circle-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "circle-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "circle-large": { rows: 1, cols: 4, maxPerPage: 4 },
  "square-small": { rows: 3, cols: 5, maxPerPage: 15 },
  "square-medium": { rows: 2, cols: 4, maxPerPage: 8 },
  "square-large": { rows: 2, cols: 3, maxPerPage: 6 },
} as const;

// --- Component --------------------------------------------------------------
export default function ProjectionPage() {
  const router = useRouter();

  // Refs for camera & processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calibration / webcam states
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Grid / detection state
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleStates, setCircleStates] = useState<boolean[]>([]);
  // Tracks circles that have been permanently completed (page cleared) and
  // should be excluded from further detection and counted as finished.
  const [permanentCompleted, setPermanentCompleted] = useState<boolean[]>([]);
  // Refs that mirror the above arrays so detection can read the latest values
  // synchronously and avoid races with state updates.
  const circleStatesRef = useRef<boolean[]>([]);
  const permanentCompletedRef = useRef<boolean[]>([]);

  const updateCircleStates = (newStates: boolean[]) => {
    circleStatesRef.current = newStates;
    setCircleStates(newStates);
  };

  const updatePermanentCompleted = (newStates: boolean[]) => {
    permanentCompletedRef.current = newStates;
    setPermanentCompleted(newStates);
  };
  const [gridLayout, setGridLayout] = useState<GridLayout | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  // Ref to track the last programmatic advance target and timestamp so we can
  // ignore child page-change callbacks that try to revert shortly afterwards.
  const programmaticTargetRef = useRef<number | null>(null);
  const programmaticTimeRef = useRef<number | null>(null);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Image state
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [isImageStep, setIsImageStep] = useState(false);

  // Image processing / detection tuning - hardcoded values
  const exposure = 1; // multiplier
  const gamma = 1; // gamma correction (1 = linear)
  const contrast = 1; // contrast multiplier (1 = no change)
  const brightnessOffset = 0; // additive offset
  // detection tuning - hardcoded to requested values
  const detectionThreshold = 201;
  const detectionRatio = 0.3;

  // Countdown and flow
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isAllStepsComplete, setIsAllStepsComplete] = useState(false);
  const [waitingForClear, setWaitingForClear] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "error") => {
    setToast({ message, type });
  };

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
          showToast("Cannot load steps - API method not available", "error");
          router.push("/");
          return;
        }

        const steps: Step[] = await api.getStepsByPreset(Number(presetId));
        if (!steps || steps.length === 0) {
          showToast("No steps found for this preset", "error");
          router.push("/");
          return;
        }

        if (stepIndex >= steps.length) {
          showToast("All steps completed!", "success");
          router.push("/");
          return;
        }

        const currentStep = steps[stepIndex];
        localStorage.setItem("currentStepIndex", stepIndex.toString());

        // Check if this is an image step or grid step
        // Use explicit null/undefined checks so falsy numeric ids (0) are handled correctly
        if (currentStep.imageId !== null && currentStep.imageId !== undefined) {
          // IMAGE STEP
          setIsImageStep(true);
          
          // Load image data
          const allImages = await api.getImages();
          const imageData = allImages.find((img: ImageData) => img.imageId === currentStep.imageId);
          
          if (!imageData) {
            showToast(`Image with ID ${currentStep.imageId} not found`, "error");
            router.push("/");
            return;
          }

          setCurrentImage(imageData);
          
          // Start 5 second timer for image
          setTimeout(() => {
            advanceToNextStep();
          }, 5000);

        } else if (currentStep.gridLayoutId !== null && currentStep.gridLayoutId !== undefined) {
          // GRID STEP
          setIsImageStep(false);
          localStorage.setItem("currentGridLayoutId", currentStep.gridLayoutId.toString());

          if (!api?.getGridLayouts) {
            showToast("Cannot load grid layout - API method not available", "error");
            router.push("/");
            return;
          }

          const allGridLayouts = await api.getGridLayouts();
          const gridLayoutFromDb = allGridLayouts.find(
            (layout: any) => layout.gridLayoutId === Number(currentStep.gridLayoutId)
          );

          if (!gridLayoutFromDb) {
            showToast(`Grid layout with ID ${currentStep.gridLayoutId} not found in database`, "error");
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

          // Calculate total pages needed for this grid layout
          const key = `${parsedLayout.shape}-${parsedLayout.size}` as keyof typeof GRID_CONFIG;
          const config = GRID_CONFIG[key];
          const maxPerPage = config.maxPerPage;
          const calculatedTotalPages = Math.ceil(parsedLayout.amount / maxPerPage);
          setTotalPages(calculatedTotalPages);

          // Generate ALL circles for the entire grid layout
          const generatedCircles = generateCirclesFromLayout(parsedLayout, maxPerPage);
          setCircles(generatedCircles);
          updateCircleStates(new Array(parsedLayout.amount).fill(false));
          updatePermanentCompleted(new Array(parsedLayout.amount).fill(false));
          setCurrentPage(0); // Reset to first page for new step
          setIsAutoAdvancing(false);
          
          // Clear any existing page advance timeout
          if (pageAdvanceTimeoutRef.current) {
            clearTimeout(pageAdvanceTimeoutRef.current);
            pageAdvanceTimeoutRef.current = null;
          }

          console.log(`📊 Loaded grid: ${parsedLayout.amount} circles, ${calculatedTotalPages} pages, ${maxPerPage} per page`);
        } else {
          showToast("Step has no grid layout or image", "error");
          router.push("/");
          return;
        }
      } catch (err) {
        showToast(`Error loading step configuration: ${err}`, "error");
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
        console.log("🎉 All steps completed! Restarting preset from step 1...");

        // Stop webcam if active
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }

        // Reset the step index to 0 so the preset will replay from the first step
        localStorage.setItem("currentStepIndex", "0");
        // Clear any cached grid layout marker so the reload starts clean
        localStorage.removeItem("currentGridLayoutId");

        // Reload the page to re-initiate the preset loop
        globalThis.location.reload();
        return;
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
  const generateCirclesFromLayout = (layout: GridLayout, maxPerPage: number): Circle[] => {
    const { amount } = layout;
    const circles: Circle[] = [];

    const canvasWidth = 1280;
    const canvasHeight = 720;

    // This generates circles for ONE page at a time
    // The GridPreset component will handle showing the correct subset
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

 const detectObjectsInCircles = useCallback(
    (imageData: Uint8ClampedArray, width: number, height: number) => {
      if (!gridLayout) return;

      // Get current page configuration
      const key = `${gridLayout.shape}-${gridLayout.size}` as keyof typeof GRID_CONFIG;
      const config = GRID_CONFIG[key];
      const maxPerPage = config.maxPerPage;
      
      const startIndex = currentPage * maxPerPage;
      const endIndex = Math.min(startIndex + maxPerPage, gridLayout.amount);
      const currentPageCount = endIndex - startIndex;

      // Generate circles for current page only
      const pageCircles = generateCirclesForPage(gridLayout, currentPageCount, maxPerPage);

      const newCircleStates = [...circleStatesRef.current];
      let hasChanges = false;

      pageCircles.forEach((circle, localIndex) => {
        const globalIndex = startIndex + localIndex;

        // Skip detection for permanently completed circles
        if (permanentCompletedRef.current[globalIndex]) return;
        // METHOD 1: Brightness/Darkness Detection 
        let totalPixels = 0;
        let darkPixels = 0;
        const step = 2; // Reduced step for better sampling
        // METHOD 2: Edge Detection (detects object boundaries)
        let edgePixels = 0;
        // METHOD 3: Variance Detection (uniform vs varied regions)
        let sumBrightness = 0;
        let sumBrightnessSq = 0;
        // METHOD 4: Color Variance (detect non-white objects)
        let colorVariance = 0;
        // METHOD 5: Center-weighted detection (more weight to center)
        let centerDarkPixels = 0;
        let centerTotalPixels = 0;

        // Collect pixel data
        const pixelData: number[] = [];

        if (circle.shape === "rectangle" && circle.width && circle.height) {
          // Rectangle detection
          const halfWidth = circle.width / 2;
          const halfHeight = circle.height / 2;
          const quarterWidth = circle.width / 4;
          const quarterHeight = circle.height / 4;
          
          for (let y = Math.max(0, Math.floor(circle.y - halfHeight)); y <= Math.min(height - 1, Math.floor(circle.y + halfHeight)); y += step) {
            for (let x = Math.max(0, Math.floor(circle.x - halfWidth)); x <= Math.min(width - 1, Math.floor(circle.x + halfWidth)); x += step) {
              totalPixels++;
              const idx = (y * width + x) * 4;
              const r = imageData[idx];
              const g = imageData[idx + 1];
              const b = imageData[idx + 2];
              const brightness = (r + g + b) / 3;
              
              // Method 1: Darkness
              if (brightness < detectionThreshold) darkPixels++;
              
              // Method 2: Edge detection (Sobel-like)
              if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
                const idxLeft = (y * width + (x - 1)) * 4;
                const idxRight = (y * width + (x + 1)) * 4;
                const idxTop = ((y - 1) * width + x) * 4;
                const idxBottom = ((y + 1) * width + x) * 4;
                
                const bLeft = (imageData[idxLeft] + imageData[idxLeft + 1] + imageData[idxLeft + 2]) / 3;
                const bRight = (imageData[idxRight] + imageData[idxRight + 1] + imageData[idxRight + 2]) / 3;
                const bTop = (imageData[idxTop] + imageData[idxTop + 1] + imageData[idxTop + 2]) / 3;
                const bBottom = (imageData[idxBottom] + imageData[idxBottom + 1] + imageData[idxBottom + 2]) / 3;
                
                const gradX = Math.abs(bRight - bLeft);
                const gradY = Math.abs(bBottom - bTop);
                const gradient = Math.sqrt(gradX * gradX + gradY * gradY);
                
                if (gradient > 30) edgePixels++;
              }
              
              // Method 3: Variance
              sumBrightness += brightness;
              sumBrightnessSq += brightness * brightness;
              pixelData.push(brightness);
              
              // Method 4: Color variance
              const avgColor = (r + g + b) / 3;
              colorVariance += Math.abs(r - avgColor) + Math.abs(g - avgColor) + Math.abs(b - avgColor);
              
              // Method 5: Center-weighted
              const distX = Math.abs(x - circle.x);
              const distY = Math.abs(y - circle.y);
              if (distX < quarterWidth && distY < quarterHeight) {
                centerTotalPixels++;
                if (brightness < detectionThreshold) centerDarkPixels++;
              }
            }
          }
        } else {
          // Circle detection
          const quarterRadius = circle.radius / 2;
          
          for (let y = Math.max(0, Math.floor(circle.y - circle.radius)); y <= Math.min(height - 1, Math.floor(circle.y + circle.radius)); y += step) {
            for (let x = Math.max(0, Math.floor(circle.x - circle.radius)); x <= Math.min(width - 1, Math.floor(circle.x + circle.radius)); x += step) {
              const dx = x - circle.x;
              const dy = y - circle.y;
              const distSq = dx * dx + dy * dy;
              
              if (distSq <= circle.radius * circle.radius) {
                totalPixels++;
                const idx = (y * width + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];
                const brightness = (r + g + b) / 3;
                
                // Method 1: Darkness
                if (brightness < detectionThreshold) darkPixels++;
                
                // Method 2: Edge detection
                if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
                  const idxLeft = (y * width + (x - 1)) * 4;
                  const idxRight = (y * width + (x + 1)) * 4;
                  const idxTop = ((y - 1) * width + x) * 4;
                  const idxBottom = ((y + 1) * width + x) * 4;
                  
                  const bLeft = (imageData[idxLeft] + imageData[idxLeft + 1] + imageData[idxLeft + 2]) / 3;
                  const bRight = (imageData[idxRight] + imageData[idxRight + 1] + imageData[idxRight + 2]) / 3;
                  const bTop = (imageData[idxTop] + imageData[idxTop + 1] + imageData[idxTop + 2]) / 3;
                  const bBottom = (imageData[idxBottom] + imageData[idxBottom + 1] + imageData[idxBottom + 2]) / 3;
                  
                  const gradX = Math.abs(bRight - bLeft);
                  const gradY = Math.abs(bBottom - bTop);
                  const gradient = Math.sqrt(gradX * gradX + gradY * gradY);
                  
                  if (gradient > 30) edgePixels++;
                }
                
                // Method 3: Variance
                sumBrightness += brightness;
                sumBrightnessSq += brightness * brightness;
                pixelData.push(brightness);
                
                // Method 4: Color variance
                const avgColor = (r + g + b) / 3;
                colorVariance += Math.abs(r - avgColor) + Math.abs(g - avgColor) + Math.abs(b - avgColor);
                
                // Method 5: Center-weighted
                if (distSq <= quarterRadius * quarterRadius) {
                  centerTotalPixels++;
                  if (brightness < detectionThreshold) centerDarkPixels++;
                }
              }
            }
          }
        }
        // Calculate detection metrics
        
        // Method 1: Basic darkness ratio
        const darknessRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
        const method1Detected = darknessRatio > detectionRatio;
        
        // Method 2: Edge detection ratio
        const edgeRatio = totalPixels > 0 ? edgePixels / totalPixels : 0;
        const method2Detected = edgeRatio > 0.15; // 15% of pixels showing edges
        
        // Method 3: Brightness variance (high variance = object present)
        const mean = totalPixels > 0 ? sumBrightness / totalPixels : 0;
        const variance = totalPixels > 0 ? (sumBrightnessSq / totalPixels - mean * mean) : 0;
        const method3Detected = variance > 1000; // Significant brightness variation
        
        // Method 4: Color variance (colored objects vs white background)
        const avgColorVariance = totalPixels > 0 ? colorVariance / totalPixels : 0;
        const method4Detected = avgColorVariance > 20; // Colors differ from grayscale
        
        // Method 5: Center-weighted detection (object in center)
        const centerDarknessRatio = centerTotalPixels > 0 ? centerDarkPixels / centerTotalPixels : 0;
        const method5Detected = centerDarknessRatio > (detectionRatio + 0.1); // Stricter for center
        
        // Combined detection decision (voting system)
        const detectionVotes = [
          method1Detected ? 2 : 0,  // Darkness gets 2 votes (most reliable)
          method2Detected ? 1 : 0,  // Edge detection gets 1 vote
          method3Detected ? 1 : 0,  // Variance gets 1 vote
          method4Detected ? 1 : 0,  // Color variance gets 1 vote
          method5Detected ? 2 : 0,  // Center-weighted gets 2 votes (very reliable)
        ];
        
        const totalVotes = detectionVotes.reduce((a, b) => a + b, 0);
        const isDetected = totalVotes >= 3; // Need at least 3 votes to detect
        
        // Enhanced logging for debugging
        if (isDetected || newCircleStates[globalIndex]) {
          console.log(`🔍 Circle ${globalIndex} detection:`, {
            page: currentPage + 1,
            darkness: `${(darknessRatio * 100).toFixed(1)}% (${method1Detected ? '✓' : '✗'})`,
            edges: `${(edgeRatio * 100).toFixed(1)}% (${method2Detected ? '✓' : '✗'})`,
            variance: `${variance.toFixed(0)} (${method3Detected ? '✓' : '✗'})`,
            colorVar: `${avgColorVariance.toFixed(1)} (${method4Detected ? '✓' : '✗'})`,
            centerDark: `${(centerDarknessRatio * 100).toFixed(1)}% (${method5Detected ? '✓' : '✗'})`,
            votes: totalVotes,
            detected: isDetected
          });
        }

        if (newCircleStates[globalIndex] !== isDetected) {
          newCircleStates[globalIndex] = isDetected;
          hasChanges = true;
          console.log(`🔴 Circle ${globalIndex} (page ${currentPage + 1}) changed to ${isDetected}`);
        }
      });

      if (hasChanges) {
        updateCircleStates(newCircleStates);
      }
    },
    [gridLayout, currentPage]
  );

  // Helper function to generate circles for a specific page
  // Replace the generateCirclesForPage function with this corrected version:

// Replace the generateCirclesForPage function with this corrected version:

const generateCirclesForPage = (layout: GridLayout, count: number, maxPerPage: number): Circle[] => {
  const circles: Circle[] = [];
  const { shape, size } = layout;

  const canvasWidth = 1280;
  const canvasHeight = 720;

  // Get the grid configuration to match the actual layout
  const key = `${shape}-${size}` as keyof typeof GRID_CONFIG;
  const config = GRID_CONFIG[key];
  const cols = config.cols;
  const rows = config.rows;

  // Convert vw units to pixels for detection
  // At 1280px canvas width, 1vw = 12.8px
  const vwToPx = canvasWidth / 100;
  
  // Match the Shape component's size calculations
  let widthVw = 10;
  let heightVw = 10;
  
  if (shape === "circle" || shape === "square") {
    if (size === "small") { widthVw = 10; heightVw = 10; }
    else if (size === "medium") { widthVw = 15; heightVw = 15; }
    else if (size === "large") { widthVw = 20; heightVw = 20; }
  } else if (shape === "rectangle") {
    if (size === "small") { widthVw = 12; heightVw = 6; }
    else if (size === "medium") { widthVw = 18; heightVw = 9; }
    else if (size === "large") { widthVw = 24; heightVw = 12; }
  }
  
  const width = widthVw * vwToPx;
  const height = heightVw * vwToPx;
  const radius = Math.min(width, height) / 2;

  // The CSS Grid uses gaps which affect visual positioning
  // For rectangles: 3rem (48px) row gap, 1rem (16px) col gap
  // For circles: 1rem (16px) for both
  const remToPx = 16;
  const rowGapPx = shape === "rectangle" ? 6 * remToPx : 2 * remToPx; // Increased vertical spacing
  const colGapPx = 1 * remToPx;
  
  // Calculate total space taken by gaps
  const totalRowGaps = (rows - 1) * rowGapPx;
  const totalColGaps = (cols - 1) * colGapPx;
  
  // For rectangles, the visual layout uses justify-content and align-content center
  // which centers the entire grid within the canvas
  // Space available for cells after subtracting gaps
  const availableWidth = canvasWidth - totalColGaps;
  const availableHeight = canvasHeight - totalRowGaps;
  
  // Each cell's size in the available space
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;
  
  // Calculate the total grid size including gaps
  const totalGridWidth = (cellWidth * cols) + totalColGaps;
  const totalGridHeight = (cellHeight * rows) + totalRowGaps;
  
  // Calculate offset to center the grid (matching CSS justify-content/align-content: center)
  const gridOffsetX = (canvasWidth - totalGridWidth) / 2;
  const gridOffsetY = (canvasHeight - totalGridHeight) / 2;

  let id = 0;
  for (let row = 0; row < rows && id < count; row++) {
    for (let col = 0; col < cols && id < count; col++) {
      // Position calculation:
      // Start with grid offset, then add cell position and gaps
      const cellStartX = gridOffsetX + (col * cellWidth) + (col * colGapPx);
      const cellStartY = gridOffsetY + (row * cellHeight) + (row * rowGapPx);
      const x = cellStartX + cellWidth / 2;
      const y = cellStartY + cellHeight / 2;
      
      circles.push({
        id,
        x,
        y,
        radius,
        width,
        height,
        shape: shape === "square" ? "circle" : shape,
      });
      id++;
      
      // Debug log for first shape to verify calculations
      if (id === 1) {
        console.log(`📐 Grid config: ${shape}-${size}`);
        console.log(`   Canvas: ${canvasWidth}×${canvasHeight}px, Grid: ${rows}r×${cols}c`);
        console.log(`   Row gap: ${rowGapPx}px, Col gap: ${colGapPx}px`);
        console.log(`   Total gaps: rows=${totalRowGaps}px, cols=${totalColGaps}px`);
        console.log(`   Grid size: ${totalGridWidth.toFixed(1)}×${totalGridHeight.toFixed(1)}px`);
        console.log(`   Grid offset: (${gridOffsetX.toFixed(1)}, ${gridOffsetY.toFixed(1)})`);
        console.log(`   Cell: ${cellWidth.toFixed(1)}×${cellHeight.toFixed(1)}px`);
        console.log(`   Shape size: ${width.toFixed(1)}×${height.toFixed(1)}px`);
        console.log(`   First shape center: (${x.toFixed(1)}, ${y.toFixed(1)})`);
      }
    }
  }

  return circles;
};

  // --- Frame processing ---
  const processFrame = useCallback(() => {
    if (!calibrationData || !canvasRef.current || !videoRef.current || !gridLayout) return;

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
          // Read source pixel
          let r = srcData[srcIdx];
          let g = srcData[srcIdx + 1];
          let b = srcData[srcIdx + 2];

          // Apply exposure (scale)
          r = r * exposure;
          g = g * exposure;
          b = b * exposure;

          // Apply additive brightness offset
          r = r + brightnessOffset;
          g = g + brightnessOffset;
          b = b + brightnessOffset;

          // Apply contrast about mid-point 128
          r = (r - 128) * contrast + 128;
          g = (g - 128) * contrast + 128;
          b = (b - 128) * contrast + 128;

          // Apply gamma correction (avoid division by zero)
          const gInv = gamma > 0 ? 1 / gamma : 1;
          r = 255 * Math.pow(Math.max(0, Math.min(255, r)) / 255, gInv);
          g = 255 * Math.pow(Math.max(0, Math.min(255, g)) / 255, gInv);
          b = 255 * Math.pow(Math.max(0, Math.min(255, b)) / 255, gInv);

          // Clamp and write back
          dstData[dstIdx] = Math.max(0, Math.min(255, Math.round(r)));
          dstData[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g)));
          dstData[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b)));
          dstData[dstIdx + 3] = 255;
        }
      }
    }

    ctx.putImageData(dstImage, 0, 0);
    
    // NOTE: Previously we drew red debug outlines on the canvas to visualize
    // detection areas. Those overlays are not required in the projection view
    // — keep the canvas image only and let the GridPreset DOM elements render
    // the visible shapes (black / completed-green). Skipping debug drawing here.
    
    detectObjectsInCircles(dstData, targetWidth, targetHeight);
  }, [calibrationData, detectObjectsInCircles, gridLayout, currentPage]);

  // --- Animation loop ---
  useEffect(() => {
    let animationFrameId = 0;

    const animate = () => {
      processFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isWebcamActive && calibrationData && gridLayout && !isImageStep) {
      animate();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isWebcamActive, calibrationData, gridLayout, processFrame, isImageStep]);

  // --- Auto-start webcam when calibration loaded (only for grid steps) ---
  useEffect(() => {
    if (calibrationData && gridLayout && !isImageStep) {
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
  }, [calibrationData, gridLayout, startWebcam, isImageStep]);

  // --- Auto page advancement and step logic ---
  useEffect(() => {
    // Skip this logic for image steps
    if (isImageStep || !gridLayout) return;

    const key = `${gridLayout.shape}-${gridLayout.size}` as keyof typeof GRID_CONFIG;
    const config = GRID_CONFIG[key];
    const maxPerPage = config.maxPerPage;
    
    const startIndex = currentPage * maxPerPage;
    const endIndex = Math.min(startIndex + maxPerPage, gridLayout.amount);

    // Use ref-backed arrays to avoid races between detection (which writes refs)
    // and React state updates. Compute current page / global completion from
    // the latest ref values.
    const refStates = circleStatesRef.current;
    const refPermanent = permanentCompletedRef.current;

    const currentPageStates = refStates.slice(startIndex, endIndex);
    const currentPagePermanent = refPermanent.slice(startIndex, endIndex);
    const currentPageCompleted =
      currentPageStates.length > 0 && currentPageStates.every((s, i) => s === true || currentPagePermanent[i] === true);
    const currentPageEmpty = currentPageStates.length > 0 && currentPageStates.every((s) => s === false);

    // Check if ALL circles (across all pages) are completed either by detection or permanently
    const allCirclesCompleted = refStates.length > 0 && refStates.every((s, i) => s === true || refPermanent[i] === true);
    const allCirclesEmpty = refStates.length > 0 && refStates.every((s) => s === false);

    const completedCount = refStates.filter(Boolean).length + refPermanent.filter(Boolean).length;
    console.log(`🔍 DEBUG: Page ${currentPage + 1}/${totalPages}, Completed:${completedCount}/${gridLayout.amount}, PageComplete:${currentPageCompleted}, AllComplete:${allCirclesCompleted}, Counting:${isCountingDown}, Waiting:${waitingForClear}, Done:${isDone}`);

    // FINAL STEP: If all circles completed and we're done, wait for all to be cleared
    if (isDone && !isAllStepsComplete) {
      if (allCirclesEmpty) {
        console.log("✅ All circles cleared after completion! Moving to next step...");
        setIsDone(false);
        advanceToNextStep();
      }
      return;
    }

    // If waiting for clear and page is cleared, advance to next page
    if (waitingForClear && currentPageEmpty && currentPage < totalPages - 1) {
      console.log(`➡️ Page cleared! Advancing from page ${currentPage + 1} to page ${currentPage + 2}`);
      
      // Mark the cleared circles as permanently completed and clear live detections
      {
        const permCopy = [...permanentCompletedRef.current];
        for (let i = startIndex; i < endIndex; i++) permCopy[i] = true;
        updatePermanentCompleted(permCopy);
      }
      {
        const liveCopy = [...circleStatesRef.current];
        for (let i = startIndex; i < endIndex; i++) liveCopy[i] = false;
        updateCircleStates(liveCopy);
      }
      
      // Mark this as a programmatic advance so child pagination doesn't immediately
      // overwrite it (GridPreset is uncontrolled and may emit its own page 0 on mount).
      const target = currentPage + 1;
      programmaticTargetRef.current = target;
      programmaticTimeRef.current = Date.now();
      setCurrentPage(target);
      // Clear the programmatic marker after a longer window to avoid late reverts
      setTimeout(() => {
        if (programmaticTargetRef.current === target) {
          programmaticTargetRef.current = null;
          programmaticTimeRef.current = null;
        }
      }, 5000);
      setWaitingForClear(false);
      return;
    }

    // PAGE FLOW: Current page completed (but not all circles)
    if (currentPageCompleted && !allCirclesCompleted && currentPage < totalPages - 1 && !isCountingDown && !waitingForClear) {
      console.log(`🔄 Page ${currentPage + 1}/${totalPages} completed. Starting 5-second countdown...`);
      console.log(`📊 Progress: ${completedCount}/${gridLayout.amount} circles completed`);
      setIsCountingDown(true);
      setCountdown(5);
    }
    // Cancel countdown if page is no longer completed
    else if (isCountingDown && !currentPageCompleted && !allCirclesCompleted && !waitingForClear) {
      console.log(`⏸️ Page no longer completed. Stopping countdown.`);
      setIsCountingDown(false);
      setCountdown(null);
    }

    // FINAL COMPLETION: All circles are completed
    if (allCirclesCompleted && !isCountingDown && !isDone && !waitingForClear) {
      console.log(`🎉 ALL ${gridLayout.amount} circles completed! Starting 5-second countdown...`);
      setIsCountingDown(true);
      setCountdown(5);
    } 
    // Cancel final countdown if not all circles completed anymore
    else if (isCountingDown && !allCirclesCompleted && !currentPageCompleted && !waitingForClear) {
      console.log(`⏸️ Not all circles completed anymore. Stopping countdown.`);
      setIsCountingDown(false);
      setCountdown(null);
    }
  }, [circleStates, isCountingDown, isDone, isImageStep, gridLayout, currentPage, totalPages, waitingForClear, isAllStepsComplete]);

  // --- Countdown timer effect ---
  useEffect(() => {
    console.log(`⏱️ Countdown effect: isCountingDown=${isCountingDown}, countdown=${countdown}`);
    
    if (isCountingDown && countdown !== null && countdown > 0) {
      console.log(`⏱️ Setting timer for countdown ${countdown}`);
      const timer = setTimeout(() => {
        console.log(`⏱️ Timer fired, decrementing from ${countdown}`);
        setCountdown((c) => {
          const newVal = c !== null ? c - 1 : c;
          console.log(`⏱️ Countdown updated: ${c} -> ${newVal}`);
          return newVal;
        });
      }, 1000);
      return () => {
        console.log(`⏱️ Cleaning up timer`);
        clearTimeout(timer);
      };
    } else if (countdown === 0 && isCountingDown) {
      console.log("⏱️ Countdown reached 0!");
      setIsCountingDown(false);
      setCountdown(null);
      
      // Check if this was the final completion or just a page. Consider both
      // live detections and permanently completed markers.
      const allCirclesCompleted =
        circleStates.length > 0 && circleStates.every((s, i) => s === true || permanentCompleted[i] === true);
      
      if (allCirclesCompleted) {
        // Final completion - wait for all circles to be cleared
        console.log("⏳ Final completion - Waiting for all circles to be cleared...");
        setIsDone(true);
      } else {
        // Page completion - wait for current page to be cleared
        console.log("⏳ Page completion - Waiting for current page to be cleared...");
        setWaitingForClear(true);
      }
    }
  }, [countdown, isCountingDown, circleStates, permanentCompleted]);


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
  const handleShapeClick = (globalIndex: number) => {
    const copy = [...circleStatesRef.current];
    copy[globalIndex] = !copy[globalIndex];
    updateCircleStates(copy);
  };

  // --- Handler for page changes ---
  const handlePageChange = (page: number) => {
    // If a programmatic advance recently set a target, ignore child callbacks
    // that attempt to revert back to an earlier page within a short timeframe.
    const progTarget = programmaticTargetRef.current;
    const progTime = programmaticTimeRef.current;
    if (progTarget !== null && progTime !== null) {
      const age = Date.now() - progTime;
      if (age < 4000 && page !== progTarget) {
        console.log(`Ignored page change callback (${page}) because programmatic advance to ${progTarget} in progress (age ${age}ms)`);
        return;
      }
    }

    setCurrentPage(page);
    setIsAutoAdvancing(false);
    if (pageAdvanceTimeoutRef.current) {
      clearTimeout(pageAdvanceTimeoutRef.current);
      pageAdvanceTimeoutRef.current = null;
    }
  };

  // --- JSX -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Hidden video (camera source) */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />

      {/* Canvas is hidden — we don't show the camera image in projection, only the DOM shapes */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* CONTENT: Image or Grid */}
      {isImageStep && currentImage ? (
        // IMAGE STEP: Show fullscreen image (fit to screen, preserve aspect ratio)
        <div className="absolute inset-0 flex items-center justify-center m-20 bg-white">
          <img
            src={`/${currentImage.path}`}
            alt={currentImage.description}
            className="max-w-full max-h-full object-cover"
          />
        </div>
      ) : gridLayout ? (
        // GRID STEP: Show grid preset
        <div className="w-full ">
          <GridPreset
            shape={gridLayout.shape === "square" ? "circle" : (gridLayout.shape as "circle" | "rectangle")}
            size={gridLayout.size}
            scale={1}
            total={gridLayout.amount}
            pagination={true}
            completedStates={circleStates}
            onShapeClick={handleShapeClick}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            gap="gap-8"
          />
        </div>
      ) : (
        <div className="p-8 text-center">Laden...</div>
      )}

      {/* Page indicator */}
      {!isImageStep && gridLayout && totalPages > 1 && (
        <div className="absolute top-4 left-4 text-4xl font-bold text-blue-500 drop-shadow-[0_0_20px_rgba(0,100,255,0.7)]">
          Pagina {currentPage + 1}/{totalPages}
        </div>
      )}

      {/* Progress indicator */}
      {!isImageStep && gridLayout && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-blue-500 drop-shadow-[0_0_20px_rgba(0,100,255,0.7)]">
          {permanentCompleted.filter(Boolean).length}/{gridLayout.amount}
        </div>
      )}

      {/* Page advance countdown (for auto-advancing between pages) */}
      {!isImageStep && waitingForClear && !isDone && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4">
          <div className="text-6xl font-bold text-yellow-500 drop-shadow-[0_0_20px_rgba(255,255,0,0.7)]">
            Verwijder alle items
          </div>
        </div>
      )}

      {/* Countdown display (5 seconds when page/all completed) */}
      {!isImageStep && countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-9xl font-bold text-green-500 drop-shadow-[0_0_30px_rgba(0,255,0,0.7)]">{countdown}</div>
        </div>
      )}

      {/* Done display - waiting for items to be removed */}
      {!isImageStep && isDone && !isAllStepsComplete && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4">
          <div className="text-6xl font-bold text-blue-500 drop-shadow-[0_0_20px_rgba(0,100,255,0.7)]">
            Verwijder alle items
          </div>
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

      {/* Step number */}
      <div className="absolute top-4 right-4 text-6xl font-bold text-blue-500 drop-shadow-[0_0_30px_rgba(0,100,255,0.7)]">
        Stap {localStorage.getItem("currentStepIndex") ? Number(localStorage.getItem("currentStepIndex")) + 1 : 1}
      </div>

      {/* Image tuning controls removed — using hardcoded values per request */}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}