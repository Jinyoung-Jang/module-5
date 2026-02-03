'use client';

interface VideoPlayerProps {
  postId: number;
  title?: string;
}

export default function VideoPlayer({ postId, title }: VideoPlayerProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      )}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={`/api/stream/${postId}`}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
