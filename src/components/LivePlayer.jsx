import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Radio, 
  VolumeX, 
  Play
} from 'lucide-react';
import { getHlsBaseUrl } from '../config';

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
 * Component LivePlayer phát luồng HLS trực tiếp từ Nginx-RTMP Media Server
 * Giao diện điều khiển mô phỏng chuẩn JWPlayer của trieugadon.com
 * @param {string} streamKey - Mã Stream Key (OBS gửi lên)
 */
export default function LivePlayer({ streamKey = 'thanhtrung01' }) {
  const videoRef = useRef(null);
  const waitingVideoRef = useRef(null);
  const containerRef = useRef(null);
  const seekBarRef = useRef(null);
  const hlsRef = useRef(null);
  const nativeQualityUrlsRef = useRef([]);

  // Trạng thái phát sóng
  const [streamStatus, setStreamStatus] = useState('connecting'); // 'connecting' | 'playing' | 'offline' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(13027); // 3:37:07 mặc định hiển thị chuẩn JWPlayer khi live
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  // Ngày hiện tại cho bảng tỷ số cặp đấu
  const todayStr = React.useMemo(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // SRS 5 phân phối HLS tại /live/[streamKey].m3u8
  const streamUrl = `${getHlsBaseUrl()}/live/${encodeURIComponent(streamKey.trim())}.m3u8`;
  const masterUrl = `${getHlsBaseUrl()}/live/${encodeURIComponent(streamKey.trim())}.master.m3u8`;

  // Hàm lấy thẻ video đang hoạt động (luồng live hoặc video chờ)
  const getActiveVideo = () => {
    if (streamStatus === 'playing' && videoRef.current) {
      return videoRef.current;
    }
    return waitingVideoRef.current || videoRef.current;
  };

  // Hàm khởi tạo và tải luồng HLS
  const loadStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    let isSrsChecked = false;
    try {
      const srsRes = await fetch('/srs-api/v1/streams/', { cache: 'no-store' });
      if (srsRes.ok) {
        const srsData = await srsRes.json();
        const normKey = streamKey.trim().toLowerCase();
        const isLiveActive = Array.isArray(srsData?.streams) && srsData.streams.some(
          (s) => s.name?.trim().toLowerCase() === normKey && s.publish?.active
        );
        isSrsChecked = true;
        if (!isLiveActive) {
          setStreamStatus('offline');
          return;
        }
      }
    } catch {
      // Bỏ qua nếu không gọi được SRS API
    }

    if (!isSrsChecked) {
      try {
        const checkRes = await fetch(streamUrl, { method: 'HEAD', cache: 'no-store' });
        if (!checkRes.ok) {
          setStreamStatus('offline');
          return;
        }
      } catch {
        setStreamStatus('offline');
        return;
      }
    }

    setQualityLevels([]);
    setSelectedQuality('auto');
    nativeQualityUrlsRef.current = [];
    let playbackUrl = streamUrl;
    for (let attempt = 0; attempt < 10 && playbackUrl === streamUrl; attempt += 1) {
      try {
        const masterResponse = await fetch(masterUrl, { method: 'HEAD', cache: 'no-store' });
        if (masterResponse.ok) playbackUrl = masterUrl;
      } catch {}
      if (playbackUrl === streamUrl && attempt < 9) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setStreamStatus('connecting');
    setErrorMessage('');

    const safePlay = () => {
      if (!video) return;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        if (!video.muted) {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(false);
        }
      });
    };

    if (Hls.isSupported()) {
      let networkRecoveryCount = 0;
      let mediaRecoveryCount = 0;

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Keep viewers about five seconds behind the live edge.
        liveSyncDuration: 5,
        liveMaxLatencyDuration: 10,
        liveBackBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferHole: 0.5,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 5,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 6
      });

      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        networkRecoveryCount = 0;
        const levels = (data?.levels || hls.levels || []).map((level, index) => ({
          id: `level-${index}`,
          label: level.height ? `${level.height}p` : `Mức ${index + 1}`,
          index,
          height: level.height || 0
        }));
        setQualityLevels(levels);
        setStreamStatus('playing');
        safePlay();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (
              data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
              data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
              data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
              networkRecoveryCount >= 3
            ) {
              setStreamStatus('offline');
              setErrorMessage('Phòng Live hiện đang tạm nghỉ hoặc vừa kết thúc.');
              hls.destroy();
            } else {
              networkRecoveryCount++;
              hls.startLoad();
            }
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            if (mediaRecoveryCount <= 1) {
              mediaRecoveryCount++;
              hls.recoverMediaError();
            } else {
              mediaRecoveryCount = 0;
              setRetryCount((prev) => prev + 1);
            }
            break;

          default:
            setStreamStatus('offline');
            setErrorMessage('Không thể phát luồng trực tiếp này.');
            hls.destroy();
            break;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (playbackUrl === masterUrl) {
        try {
          const response = await fetch(masterUrl, { cache: 'no-store' });
          const manifest = await response.text();
          const lines = manifest.split(/\r?\n/);
          const variants = [];
          for (let index = 0; index < lines.length; index += 1) {
            const info = lines[index].match(/#EXT-X-STREAM-INF:(.*)/);
            if (!info) continue;
            const uri = lines.slice(index + 1).find((line) => line.trim() && !line.startsWith('#'));
            if (!uri) continue;
            const height = Number(info[1].match(/RESOLUTION=\d+x(\d+)/)?.[1]) || 0;
            variants.push({
              id: `native-${variants.length}`,
              label: `${height || 'Gốc'}${height ? 'p' : ''}`,
              url: new URL(uri.trim(), masterUrl).toString(),
              height
            });
          }
          nativeQualityUrlsRef.current = variants;
          setQualityLevels(variants);
        } catch {}
      }
      video.src = `${playbackUrl}?_t=${Date.now()}`;
      video.addEventListener('loadedmetadata', () => {
        setStreamStatus('playing');
        safePlay();
      });
      video.addEventListener('error', () => {
        setStreamStatus('offline');
        setErrorMessage('Luồng trực tiếp đang ngoại tuyến...');
      });
    } else {
      setStreamStatus('error');
      setErrorMessage('Trình duyệt của bạn không hỗ trợ định dạng HLS.');
    }
  }, [masterUrl, streamUrl, streamKey]);

  const handleQualityChange = (qualityId) => {
    setSelectedQuality(qualityId);
    if (qualityId === 'auto') {
      if (hlsRef.current) hlsRef.current.currentLevel = -1;
      else if (videoRef.current) {
        videoRef.current.src = `${masterUrl}?_t=${Date.now()}`;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    if (hlsRef.current) {
      const levelIndex = Number(qualityId.replace('level-', ''));
      if (Number.isInteger(levelIndex)) hlsRef.current.currentLevel = levelIndex;
      return;
    }

    const variant = nativeQualityUrlsRef.current.find((level) => level.id === qualityId);
    if (variant && videoRef.current) {
      videoRef.current.src = `${variant.url}?_t=${Date.now()}`;
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    loadStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [loadStream, retryCount]);

  useEffect(() => {
    if (streamStatus === 'offline') {
      const timer = setTimeout(() => {
        loadStream();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [streamStatus, loadStream]);

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    if (!activeVid) return;
    const nextMuted = !activeVid.muted;
    activeVid.muted = nextMuted;
    if (!nextMuted) {
      activeVid.volume = volume > 0 ? volume : 1;
      setVolume(activeVid.volume);
    }
    setIsMuted(nextMuted);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    if (!activeVid) return;
    if (activeVid.paused) {
      activeVid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      activeVid.pause();
      setIsPlaying(false);
    }
  };

  const rewind10Seconds = (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    if (!activeVid) return;
    activeVid.currentTime = Math.max(0, (activeVid.currentTime || 0) - 10);
    setCurrentTime(activeVid.currentTime || 0);
  };

  const handleSeek = (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    const bar = seekBarRef.current;
    if (!activeVid || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const targetTime = ratio * duration;
    if (Number.isFinite(activeVid.duration) && activeVid.duration > 0) {
      activeVid.currentTime = ratio * activeVid.duration;
    }
    setCurrentTime(targetTime);
  };

  const togglePiP = async (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    if (!activeVid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && activeVid.requestPictureInPicture) {
        await activeVid.requestPictureInPicture();
      }
    } catch {}
  };

  const handleVideoClick = () => {
    const activeVid = getActiveVideo();
    if (!activeVid) return;
    if (isMuted || activeVid.muted) {
      activeVid.muted = false;
      activeVid.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
      activeVid.play().catch(() => {});
      return;
    }
    togglePlay();
  };

  const toggleFullScreen = (e) => {
    if (e) e.stopPropagation();
    const activeVid = getActiveVideo();
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {
        if (activeVid && activeVid.webkitEnterFullscreen) {
          activeVid.webkitEnterFullscreen();
        }
      });
    } else if (activeVid && activeVid.webkitEnterFullscreen) {
      activeVid.webkitEnterFullscreen();
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-none overflow-hidden border border-white/80 group keep-dark select-none"
    >
      {/* Thẻ Video HTML5 chuẩn */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black cursor-pointer"
        playsInline
        autoPlay
        muted={isMuted}
        controls={false}
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (streamStatus === 'playing' && videoRef.current) {
            setCurrentTime(videoRef.current.currentTime || 0);
          }
        }}
        onVolumeChange={() => {
          if (videoRef.current) {
            setIsMuted(videoRef.current.muted || videoRef.current.volume === 0);
            if (!videoRef.current.muted && videoRef.current.volume > 0) {
              setVolume(videoRef.current.volume);
            }
          }
        }}
      />

      {/* NÚT PLAY TRUNG TÂM NẾU TRÌNH DUYỆT CHẶN AUTOPLAY HOẶC ĐANG TẠM DỪNG */}
      {streamStatus === 'playing' && !isPlaying && (
        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.volume = volume > 0 ? volume : 1;
              setIsMuted(false);
              videoRef.current.play().catch(() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  setIsMuted(true);
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          }}
          className="absolute inset-0 z-30 m-auto w-20 h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-rose-400/30"
          title="Bấm để phát trực tiếp có âm thanh"
        >
          <Play className="w-9 h-9 fill-white translate-x-0.5" />
        </button>
      )}

      {/* VIDEO MÀN HÌNH CHỜ KHI CHƯA LÊN SÓNG / ĐANG KẾT NỐI */}
      {streamStatus !== 'playing' && (
        <div onClick={handleVideoClick} className="absolute inset-0 z-20 bg-black overflow-hidden cursor-pointer">
          <video
            ref={waitingVideoRef}
            src="/waiting_screen.mp4"
            poster="/waiting_poster.jpg"
            preload="auto"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (waitingVideoRef.current) {
                setCurrentTime(waitingVideoRef.current.currentTime || 0);
              }
            }}
            onLoadedMetadata={() => {
              if (waitingVideoRef.current && Number.isFinite(waitingVideoRef.current.duration)) {
                setDuration(waitingVideoRef.current.duration || 13027);
              }
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* THANH BADGE TRẠNG THÁI TRÊN VIDEO */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 pointer-events-none">
        {streamStatus === 'playing' ? (
          <div className="flex items-center gap-1.5 bg-rose-600/90 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full animate-pulse">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-300 text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>OFFLINE</span>
          </div>
        )}
      </div>

      {/* NÚT BẬT TIẾNG NỔI BẬT DỄ THẤY KHI TRÌNH DUYỆT TỰ ĐỘNG TẮT TIẾNG */}
      {streamStatus === 'playing' && isMuted && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-300/40 text-xs font-extrabold px-3.5 py-2 rounded-full transition-all cursor-pointer animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span>Chạm để bật âm thanh 🔊</span>
        </button>
      )}

      {/* BẢNG TỶ SỐ / CHẠNG CÂN (VÀNG | Cặp | ĐỎ) GÓC PHẢI DƯỚI NHƯ TRIEUGADON */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 right-7 z-25 bg-black/85 rounded-[6px] px-3 py-1.5 grid grid-cols-3 items-center text-center min-w-[165px] sm:min-w-[185px] pointer-events-auto"
      >
        <div className="pr-2.5 sm:pr-3 border-r border-white/20">
          <div className="text-[11px] sm:text-[12px] font-extrabold text-[#c5a028] leading-tight uppercase tracking-wide">
            VÀNG
          </div>
          <div className="text-[17px] sm:text-[20px] font-extrabold text-[#c5a028] leading-tight mt-0.5">
            266
          </div>
        </div>

        <div className="px-2.5 sm:px-3 border-r border-white/20 flex flex-col items-center justify-center">
          <div className="text-[10px] font-medium text-gray-400 leading-none">
            Cặp
          </div>
          <div className="text-[15px] sm:text-[17px] font-extrabold text-gray-200 leading-tight my-0.5">
            7
          </div>
          <div className="text-[10px] font-bold text-gray-300 leading-none">
            {todayStr}
          </div>
        </div>

        <div className="pl-2.5 sm:pl-3">
          <div className="text-[11px] sm:text-[12px] font-extrabold text-[#b91c1c] leading-tight uppercase tracking-wide">
            ĐỎ
          </div>
          <div className="text-[17px] sm:text-[20px] font-extrabold text-[#b91c1c] leading-tight mt-0.5">
            262
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN JWPLAYER STYLE DƯỚI ĐÁY VIDEO */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 z-30 pt-8 pb-2.5 px-4 sm:px-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent text-white"
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
        <div className="flex items-center justify-between">
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
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
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
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
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
                  const activeVid = getActiveVideo();
                  if (activeVid) {
                    activeVid.volume = val;
                    activeVid.muted = val === 0;
                    setIsMuted(val === 0);
                  }
                }}
                className="w-0 group-hover/vol:w-16 opacity-0 group-hover/vol:opacity-100 transition-all duration-200 accent-white h-1 bg-white/40 cursor-pointer"
              />
            </div>

            {/* Hiển thị Thời Gian: 00:00 / 3:37:07 */}
            <div className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight font-sans select-none">
              {formatPlayerTime(currentTime)} / {formatPlayerTime(duration || 13027)}
            </div>
          </div>

          {/* Cụm bên phải: Picture-in-Picture & Toàn màn hình (Mũi tên chéo) */}
          <div className="flex items-center gap-4 sm:gap-5">
            {qualityLevels.length > 0 && (
              <label className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/80">
                <span className="hidden sm:inline">Chất lượng</span>
                <select
                  value={selectedQuality}
                  onChange={(event) => handleQualityChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="max-w-[92px] rounded bg-black/70 border border-white/20 px-1.5 py-1 text-white outline-none cursor-pointer"
                  aria-label="Chọn chất lượng video"
                >
                  <option value="auto">Auto</option>
                  {qualityLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </label>
            )}

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
