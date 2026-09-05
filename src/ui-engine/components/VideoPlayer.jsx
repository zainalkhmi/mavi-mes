import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, 
  RotateCcw, Film, CheckCircle, Video 
} from 'lucide-react';

/**
 * VideoPlayer Component
 * Shop floor SOP / Work Instruction & Industrial Training Video Player.
 * Features customizable playback, time scrubber, header overlay, and responsive container.
 */
export function VideoPlayer({
  src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  poster = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
  title = 'SOP Perakitan Sub-Assy Pompa Hidrolik',
  subtitle = 'Instruksi Kerja Standar • Rev 2.1',
  autoPlay = false,
  loop = false,
  controls = true,
  aspectRatio = '16:9', // 16:9 | 4:3 | auto
  className,
  ...props
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [showOverlayControls, setShowOverlayControls] = useState(true);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((cur / dur) * 100);
    setCurrentTime(formatTime(cur));
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(formatTime(videoRef.current.duration));
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const aspectClass = aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video';

  return (
    <div
      className={cn(
        'w-full bg-slate-950 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col group relative select-none',
        className
      )}
      onMouseEnter={() => setShowOverlayControls(true)}
      onMouseLeave={() => isPlaying && setShowOverlayControls(false)}
      {...props}
    >
      {/* Video Header / SOP Label */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 bg-linear-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Film className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white drop-shadow-xs">{title}</div>
            <div className="text-[10px] text-slate-300 drop-shadow-xs">{subtitle}</div>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded-md bg-teal-600/80 backdrop-blur-xs text-[9px] font-extrabold uppercase tracking-wider text-white">
          SOP VIDEO
        </div>
      </div>

      {/* Main Video Element */}
      <div className={cn('relative w-full overflow-hidden bg-black flex items-center justify-center', aspectClass)}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          loop={loop}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Center Play Button Overlay */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute z-10 w-14 h-14 rounded-full bg-teal-600/90 hover:bg-teal-500 text-white flex items-center justify-center shadow-2xl border border-white/20 transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Play Video"
          >
            <Play className="w-6 h-6 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* Bottom Video Controls Overlay */}
      {controls && (
        <div
          className={cn(
            'p-3 bg-linear-to-t from-black/90 via-black/70 to-transparent flex flex-col gap-2 transition-opacity duration-300',
            showOverlayControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Progress Scrubber */}
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-slate-700/80 hover:h-2.5 rounded-full cursor-pointer transition-all relative overflow-hidden group/bar"
          >
            <div
              className="h-full bg-teal-500 rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons & Time */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-teal-400 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-teal-400 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Time Display */}
              <span className="text-[11px] font-mono text-slate-400">
                {currentTime} / {duration}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFullscreen}
                className="hover:text-teal-400 transition-colors cursor-pointer"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
