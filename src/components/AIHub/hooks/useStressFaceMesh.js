import { useRef, useCallback, useEffect } from 'react';
import { computeEAR } from '../StressTest.data';

export const useStressFaceMesh = ({
  cameraEnabled, cameraConsent, setAttention, engagementScoreRef,
  setBlinks, setFaceEverDetected, setFaceDetected
}) => {
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceEverDetectedRef = useRef(false);
  const blinkStateRef = useRef({ lastEar: 0.25, blinkCount: 0, isClosed: false });
  const attRef = useRef(50);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
  }, []);

  const initFaceMesh = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');
      
      const fm = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      fm.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          if (!faceEverDetectedRef.current) {
            faceEverDetectedRef.current = true;
            setFaceEverDetected(true);
          }
          setFaceDetected(true);
          
          const landmarks = results.multiFaceLandmarks[0];
          // Simple EAR logic for blinks
          const leftEye = [landmarks[33], landmarks[160], landmarks[158], landmarks[133], landmarks[153], landmarks[144]];
          const ear = computeEAR(leftEye);
          
          if (ear < 0.18 && !blinkStateRef.current.isClosed) {
            blinkStateRef.current.isClosed = true;
            blinkStateRef.current.blinkCount++;
            setBlinks(prev => prev + 1);
          } else if (ear > 0.22) {
            blinkStateRef.current.isClosed = false;
          }
          blinkStateRef.current.lastEar = ear;
          
          // Simple engagement logic based on face presence
          attRef.current = Math.min(100, attRef.current + 0.5);
          setAttention(Math.round(attRef.current));
          engagementScoreRef.current = attRef.current;
        } else {
          setFaceDetected(false);
          attRef.current = Math.max(0, attRef.current - 0.2);
          setAttention(Math.round(attRef.current));
          engagementScoreRef.current = attRef.current;
        }
      });
      
      faceMeshRef.current = fm;
      
      if (videoRef.current && cameraEnabled && cameraConsent) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        cameraRef.current.start();
      }
    } catch (e) {
      console.error("❌ FaceMesh Init Failed:", e);
    }
  }, [cameraEnabled, cameraConsent, setAttention, setBlinks, setFaceDetected, setFaceEverDetected, engagementScoreRef]);

  useEffect(() => {
    if (cameraEnabled && cameraConsent) {
      initFaceMesh();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraEnabled, cameraConsent, initFaceMesh, stopCamera]);

  return { faceMeshRef, cameraRef, videoRef, canvasRef, faceEverDetectedRef, attRef, initFaceMesh, stopCamera };
};

