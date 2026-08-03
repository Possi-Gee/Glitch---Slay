
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (imageDataUri: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const startStream = useCallback(async () => {
    // Ensure existing stream is stopped before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer rear camera
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings.",
      });
      setHasPermission(false);
    }
  }, [toast]);

  // Request permission and start stream on mount
  useEffect(() => {
    startStream();
    // Cleanup function to stop the stream when the component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startStream]);


  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
        // Stop the stream after capture
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Restart the stream
    startStream();
  };
  
  const handleConfirm = () => {
    if (capturedImage) {
        onCapture(capturedImage);
    }
  }

  const renderContent = () => {
    if (hasPermission === null) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Requesting camera access...</p>
        </div>
      );
    }
    
    if (hasPermission === false) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            You have denied camera access. Please enable it in your browser's settings to use this feature.
          </AlertDescription>
        </Alert>
      );
    }

    if (capturedImage) {
      return (
        <div className="space-y-4">
          <Image src={capturedImage} alt="Captured" width={640} height={480} className="rounded-md w-full" />
           <div className="flex justify-center gap-4">
              <Button onClick={handleRetake} variant="outline">
                <RefreshCcw className="mr-2" />
                Retake
              </Button>
              <Button onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <video
          ref={videoRef}
          className="w-full aspect-video rounded-md bg-black"
          autoPlay
          playsInline
          muted
        />
         <div className="flex justify-center">
            <Button onClick={handleCapture} size="lg" className="rounded-full w-20 h-20">
                <Camera className="h-8 w-8" />
            </Button>
        </div>
      </div>
    );
  };


  return (
    <div>
      {renderContent()}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
