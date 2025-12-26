
import type { ProcessedVideo, VideoMetadata } from '../types';

export const processVideo = (videoFile: File, maxFrames: number = 16): Promise<ProcessedVideo> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return reject(new Error('Canvas 2D context is not available.'));
    }

    const frames: string[] = [];
    let metadata: VideoMetadata;

    video.onloadedmetadata = () => {
      metadata = {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      };
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const interval = video.duration / maxFrames;
      let currentTime = 0;
      let framesExtracted = 0;

      const extractFrame = () => {
        // Ensure we don't go past the end, and handle very short videos
        if (framesExtracted >= maxFrames || currentTime >= video.duration) {
          URL.revokeObjectURL(video.src);
          // In a real app, you'd process audio here and get a transcript.
          // For now, we'll use a placeholder.
          const audioTranscript = "Audio was present in the video. The content of the audio should be analyzed for authenticity and consistency with the video frames. [Placeholder for actual transcript]";
          resolve({ frames, metadata, audioTranscript });
          return;
        }

        video.currentTime = currentTime;
        currentTime += interval;
        framesExtracted++;
      };

      video.onseeked = () => {
        // A small timeout can help ensure the frame is fully rendered before capturing
        setTimeout(() => {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            // Get base64 string, remove data url prefix
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Use JPEG with quality for smaller size
            frames.push(base64);
            extractFrame();
        }, 100);
      };
      
      // Handle cases where seeking fails
      video.onerror = (e) => {
          console.error("Error processing video:", e);
          reject(new Error('Failed to process video file. It may be corrupt or in an unsupported format.'));
      };

      // Start the frame extraction process
      video.play().then(() => {
          video.pause();
          extractFrame();
      }).catch(err => {
          // Fallback for browsers that don't like playing then pausing immediately
           extractFrame();
      });
    };

    video.onerror = (e) => {
      reject(new Error('Failed to load video file metadata.'));
    };
  });
};