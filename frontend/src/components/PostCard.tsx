'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    router.push(`/board/${post.id}`);
  };

  const handleLoadedData = () => {
    setThumbnailLoaded(true);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Video Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        {/* Video element for thumbnail */}
        <video
          ref={videoRef}
          src={`/api/stream/${post.id}`}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
          onLoadedData={handleLoadedData}
        />

        {/* Loading placeholder */}
        {!thumbnailLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <svg
              className="w-12 h-12 text-gray-400 animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Play icon overlay (shown when not hovering) */}
        {thumbnailLoaded && !isHovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-800 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge placeholder */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {formatFileSize(post.video_size)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
            {post.title}
          </h3>
          {!post.is_public && (
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded whitespace-nowrap">
              Private
            </span>
          )}
        </div>

        {post.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {post.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>{post.author.full_name || post.author.email}</span>
          <span>{formatDate(post.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
