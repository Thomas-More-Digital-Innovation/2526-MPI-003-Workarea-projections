'use client';

import { Button, GridPreset, Footer } from '@/components';
import Toast from '@/components/ui/Toast';
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



export default function CalibrationPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [points, setPoints] = useState<Point[]>([
    { x: 10, y: 10, id: 'top-left' },
    { x: 90, y: 10, id: 'top-right' },
    { x: 90, y: 90, id: 'bottom-right' },
    { x: 10, y: 90, id: 'bottom-left' },
  ]);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "error") => {
    setToast({ message, type });
  };

  // Initialize webcam
  const startWebcam = useCallback(async () => {
    try {
      // Stop any existing stream first
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
        
        // Handle stream ending
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsWebcamActive(false);
        });
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          showToast('Webcam access denied. Please allow camera permissions and try again.', 'error');
        } else if (error.name === 'NotFoundError') {
          showToast('No webcam found. Please connect a camera and try again.', 'error');
        } else if (error.name === 'NotReadableError') {
          showToast('Webcam is already in use by another application. Please close other camera applications and try again.', 'error');
        } else {
          showToast('Unable to access webcam. Please check your camera settings.', 'error');
        }
      } else {
        showToast('Unable to access webcam. Please check permissions and try again.', 'error');
      }
    }
  }, []);


  // Handle point dragging
  const handleMouseDown = (pointId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingPoint(pointId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingPoint || !videoRef.current) return;

    const videoRect = videoRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - videoRect.left) / videoRect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - videoRect.top) / videoRect.height));

    setPoints(prev => prev.map(point => 
      point.id === draggingPoint 
        ? { ...point, x: x * 100, y: y * 100 }
        : point
    ));
  }, [draggingPoint]);

  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null);
  }, []);

  // Apply calibration (preview only)
  const handleApplyCalibration = () => {
    const data: CalibrationData = {
      points,
      aspectRatio: 16/9
    };
    setCalibrationData(data);
    setIsCalibrated(true);
  };

  // Save calibration and return to main page
  const saveCalibration = () => {
    const data: CalibrationData = {
      points,
      aspectRatio: 16/9
    };
    localStorage.setItem('webcamCalibration', JSON.stringify(data));
    // Navigate back to main page
    router.push('/');
  };

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
  
  const applyCalibration = () => {
    if (!calibrationData || !canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    if (!ctx) return;
  
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
  };  

  // Event listeners for dragging
  useEffect(() => {
    if (draggingPoint) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPoint, handleMouseMove, handleMouseUp]);

  // Apply calibration preview when calibrated
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      applyCalibration();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isCalibrated && isWebcamActive) {
      animate();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCalibrated, isWebcamActive]);

  // Auto-start webcam and reset calibration on mount
  useEffect(() => {
    localStorage.removeItem('webcamCalibration');
    setCalibrationData(null);
    setIsCalibrated(false);
    setPoints([
      { x: 10, y: 10, id: 'top-left' },
      { x: 90, y: 10, id: 'top-right' },
      { x: 90, y: 90, id: 'bottom-right' },
      { x: 10, y: 90, id: 'bottom-left' },
    ]);
    
    // Auto-start webcam
    const autoStart = async () => {
      await startWebcam();
    };
    autoStart();

    // Cleanup: Stop camera when component unmounts
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    };
  }, [startWebcam]);

  // Reset calibration
  const resetCalibration = () => {
    setCalibrationData(null);
    setIsCalibrated(false);
    localStorage.removeItem('webcamCalibration');
    setPoints([
      { x: 10, y: 10, id: 'top-left' },
      { x: 90, y: 10, id: 'top-right' },
      { x: 90, y: 90, id: 'bottom-right' },
      { x: 10, y: 90, id: 'bottom-left' },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-secondary)]/20">
      <div className="w-[1280px] mx-auto">
        <div className="w-[1280px] flex ">
          {/* Webcam Section */}
          <div className="space-y-4 pt-12">
            <div className="w-[1280px] h-[720px] bg-gray-500 relative rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-[1280px] object-contain"
                style={{ display: isCalibrated ? 'none' : 'block' }}
              />
              
              {/* Draggable Points */}
              {isWebcamActive && !isCalibrated && (
                <div className="absolute inset-0">
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className="absolute w-4 h-4 bg-orange-400 rounded-full border-2 border-white cursor-move transform -translate-x-2 -translate-y-2 shadow-lg"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                      }}
                      onMouseDown={(e) => handleMouseDown(point.id, e)}
                    />
                  ))}
                  
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${points[0].x}%`}
                      y1={`${points[0].y}%`}
                      x2={`${points[1].x}%`}
                      y2={`${points[1].y}%`}
                      stroke="orange"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1={`${points[1].x}%`}
                      y1={`${points[1].y}%`}
                      x2={`${points[2].x}%`}
                      y2={`${points[2].y}%`}
                      stroke="orange"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1={`${points[2].x}%`}
                      y1={`${points[2].y}%`}
                      x2={`${points[3].x}%`}
                      y2={`${points[3].y}%`}
                      stroke="orange"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1={`${points[3].x}%`}
                      y1={`${points[3].y}%`}
                      x2={`${points[0].x}%`}
                      y2={`${points[0].y}%`}
                      stroke="orange"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              )}

              {/* Calibration Preview */}
              {isCalibrated && isWebcamActive && (
                <canvas
                  ref={canvasRef}
                  className="w-[1280px] object-contain"
                />
              )}
            </div>
            <div className="flex gap-4 flex-wrap">
              
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Footer>
          <Button 
            onClick={() => router.push('/')} 
            text="Terug" 
            type="primary"
            fullWidth={false}
            fixedWidth={true}
          />
          <Button 
            onClick={resetCalibration} 
            type='secondary' 
            text="Reset Kalibratie"
            fullWidth={false}
            fixedWidth={true}
          />
          {!isCalibrated && (
            <Button 
              onClick={handleApplyCalibration} 
              text="Toepassen Kalibratie"
              type="primary"
              fullWidth={false}
              fixedWidth={true}
            />
          )}
          {isCalibrated && (
            <Button 
              onClick={saveCalibration} 
              text="Kalibratie Opslaan"
              type="primary"
              fullWidth={false}
              fixedWidth={true}
            />
          )}
        </Footer>
      </div>

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
