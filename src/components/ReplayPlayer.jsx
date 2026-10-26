import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

/**
 * Format số giây thành chuẩn JWPlayer:
 * - Thời gian hiện tại: MM:SS (hoặc H:MM:SS nếu >= 1 giờ)
 * - Tổng thời lượng: H:MM:SS (nếu >= 1 giờ) hoặc MM:SS
 */
function formatPlayerTime(seconds, forceHours = false) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0 || forceHours) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Trình phát Video Xem Lại (ReplayPlayer) mô phỏng chuẩn giao diện JWPlayer của trieugadon.com
 * - Khung viền vuông sắc nét (viền trắng mảnh)
 * - Thanh tua (Seekbar) mảnh nằm phía trên hàng nút điều khiển
 * - Nút Play/Pause, Tua lùi 10s, Âm lượng, Thời gian (00:00 / 3:37:07), PiP, Toàn màn hình (mũi tên chéo)
 * - Bảng tỷ số Cặp đấu (VÀNG | Cặp | ĐỎ) góc dưới bên phải
 */
export default function ReplayPlayer({
  src,
  poster,
  autoPlay = true,
  startedAt,
  initialVang = '266',
  initialDo = '262',
  initialCap = '7'
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const seekBarRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef(null);

  // Ngày hiển thị trong bảng cặp đấu (ví dụ: 24/10)
  const defaultDateStr = React.useMemo(() => {
    if (startedAt) {
      const d = new Date(startedAt);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [startedAt]);

  const [scoreboard, setScoreboard] = useState({
    vang: initialVang,
    cap: initialCap,
    date: defaultDateStr,
    do: initialDo
  });

  useEffect(() => {
    setScoreboard((prev) => ({ ...prev, date: defaultDateStr }));
  }, [defaultDateStr]);

  // Khởi tạo nguồn video (hỗ trợ cả MP4/WebM lẫn HLS .m3u8)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = src.includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
    } else {
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Tự động ẩn thanh điều khiển sau 3 giây không di chuột khi đang phát
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const rewind10Seconds = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, (video.currentTime || 0) - 10);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    const bar = seekBarRef.current;
    if (!video || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    video.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const togglePiP = async (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch {}
  };

  const toggleFullScreen = (e) => {
    e.stopPropagation();
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (video && video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
      className="relative aspect-video w-full bg-black border border-white/80 rounded-none overflow-hidden select-none cursor-pointer group keep-dark"
    >
      {/* Video Element (tắt toàn bộ native controls để dùng JWPlayer UI chuẩn) */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
            setIsMuted(videoRef.current.muted);
            setVolume(videoRef.current.volume);
          }
        }}
        onDurationChange={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setDuration(videoRef.current.duration);
          }
        }}
        className="w-full h-full object-contain bg-black"
      />

      {/* Tạm ẩn bảng tỷ số / chạng cân (VÀNG | Cặp | ĐỎ).
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 right-7 z-10 bg-black/85 rounded-[6px] px-3 py-1.5 grid grid-cols-3 items-center text-center min-w-[170px] sm:min-w-[190px] pointer-events-auto"
      >
        <div className="pr-2.5 sm:pr-3 border-r border-white/20">
          <div className="text-[11px] sm:text-[12px] font-extrabold text-[#c5a028] leading-tight uppercase tracking-wide">
            VÀNG
          </div>
          <div className="text-[17px] sm:text-[20px] font-extrabold text-[#c5a028] leading-tight mt-0.5">
            {scoreboard.vang}
          </div>
        </div>

        <div className="px-2.5 sm:px-3 border-r border-white/20 flex flex-col items-center justify-center">
          <div className="text-[10px] font-medium text-gray-400 leading-none">
            Cặp
          </div>
          <div className="text-[15px] sm:text-[17px] font-extrabold text-gray-200 leading-tight my-0.5">
            {scoreboard.cap}
          </div>
          <div className="text-[10px] font-bold text-gray-300 leading-none">
            {scoreboard.date}
          </div>
        </div>

        <div className="pl-2.5 sm:pl-3">
          <div className="text-[11px] sm:text-[12px] font-extrabold text-[#b91c1c] leading-tight uppercase tracking-wide">
            ĐỎ
          </div>
          <div className="text-[17px] sm:text-[20px] font-extrabold text-[#b91c1c] leading-tight mt-0.5">
            {scoreboard.do}
          </div>
        </div>
      </div>
      */}

      {/* THANH ĐIỀU KHIỂN JWPLAYER STYLE DƯỚI ĐÁY */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 z-20 pt-8 pb-2.5 px-4 sm:px-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Hàng 1: Thanh Tua (Seekbar) mảnh nằm phía trên */}
        <div
          ref={seekBarRef}
          onClick={handleSeek}
          className="w-full py-2 mb-1.5 cursor-pointer group/seek flex items-center"
        >
          <div className="w-full h-[2.5px] group-hover/seek:h-[4px] bg-white/40 relative transition-all">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Hàng 2: Các nút điều khiển chuẩn JWPlayer */}
        <div className="flex items-center justify-between text-white">
          {/* Cụm bên trái: Play/Pause, Rewind 10s, Volume, Time */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Nút Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center w-5 h-5"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                /* Icon Pause 2 vạch dọc trắng chuẩn JWPlayer */
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                /* Icon Play tam giác trắng chuẩn JWPlayer */
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <path d="M7 4v16l13-8z" />
                </svg>
              )}
            </button>

            {/* Nút Tua Lùi 10 Giây (Rewind 10s) chuẩn JWPlayer */}
            <button
              type="button"
              onClick={rewind10Seconds}
              className="text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center w-6 h-5"
              title="Lùi 10 giây"
            >
              <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-current">
                <path d="M11 5V2L6 6l5 4V7h5c2.2 0 4 1.8 4 4v5c0 2.2-1.8 4-4 4h-2v2h2c3.3 0 6-2.7 6-6v-5c0-3.3-2.7-6-6-6h-5z" />
                <text x="2" y="21" fontSize="8.5" fontWeight="800" fontFamily="sans-serif" fill="currentColor">10</text>
              </svg>
            </button>

            {/* Nút Âm Lượng & Thanh trượt */}
            <div className="flex items-center gap-2 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center w-5 h-5"
                title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              >
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                    setIsMuted(val === 0);
                  }
                }}
                className="w-0 group-hover/vol:w-16 opacity-0 group-hover/vol:opacity-100 transition-all duration-200 accent-white h-1 bg-white/40 cursor-pointer"
              />
            </div>

            {/* Hiển thị Thời Gian: 00:00 / 3:37:07 */}
            <div className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight font-sans select-none">
              {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
            </div>
          </div>

          {/* Cụm bên phải: Picture-in-Picture & Toàn màn hình (Mũi tên chéo) */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Nút Picture-in-Picture (PiP) */}
            <button
              type="button"
              onClick={togglePiP}
              className="text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center w-5 h-5"
              title="Hình trong hình (PiP)"
            >
              <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current">
                <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
              </svg>
            </button>

            {/* Nút Toàn màn hình (Mũi tên chéo 2 đầu chuẩn JWPlayer) */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className="text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center w-5 h-5"
              title="Toàn màn hình"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M21 3h-6v2h2.59l-4.29 4.29 1.41 1.41L19 6.41V9h2V3zM3 21h6v-2H6.41l4.29-4.29-1.41-1.41L5 17.59V15H3v6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
