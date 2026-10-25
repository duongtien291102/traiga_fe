import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Radio, 
  AlertCircle, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Play, 
  Pause,
  Wifi, 
  WifiOff, 
  ShieldCheck,
  Tv
} from 'lucide-react';
import { getHlsBaseUrl } from '../config';

/**
 * Component LivePlayer phát luồng HLS trực tiếp từ Nginx-RTMP Media Server
 * @param {string} streamKey - Mã Stream Key (OBS gửi lên)
 */
export default function LivePlayer({ streamKey = '' }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // Trạng thái phát sóng
  const [streamStatus, setStreamStatus] = useState('connecting'); // 'connecting' | 'playing' | 'offline' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // SRS 5 phân phối HLS tại /live/[streamKey].m3u8
  const safeStreamKey = typeof streamKey === 'string' ? streamKey.trim() : '';
  const streamUrl = `${getHlsBaseUrl()}/live/${encodeURIComponent(safeStreamKey)}.m3u8`;

  // Hàm khởi tạo và tải luồng HLS
  const loadStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !safeStreamKey) {
      setStreamStatus('offline');
      return;
    }

    // 1. Thăm dò trước qua SRS HTTP API để kiểm tra luồng active mà không gây lỗi 404 đỏ trong DevTools console
    let isSrsChecked = false;
    try {
      const srsRes = await fetch('/srs-api/v1/streams/', { cache: 'no-store' });
      if (srsRes.ok) {
        const srsData = await srsRes.json().catch(() => null);
        if (Array.isArray(srsData?.streams)) {
          const normKey = safeStreamKey.toLowerCase();
          const isLiveActive = srsData.streams.some(
            (s) => typeof s?.name === 'string' && s.name.trim().toLowerCase() === normKey && s.publish?.active === true
          );
          isSrsChecked = true;
          if (!isLiveActive) {
            setStreamStatus('offline');
            return;
          }
        }
      }
    } catch {
      // Bỏ qua nếu endpoint /srs-api không khả dụng
    }

    const loadUrl = `${streamUrl}?_t=${Date.now()}`;

    // 2. Nếu chưa kiểm tra được qua SRS API, thăm dò file m3u8
    if (!isSrsChecked) {
      try {
        const checkRes = await fetch(loadUrl, { method: 'GET', cache: 'no-store' });
        if (!checkRes.ok) {
          setStreamStatus('offline');
          return;
        }
        const manifest = await checkRes.text();
        if (!manifest.trimStart().startsWith('#EXTM3U')) {
          setStreamStatus('offline');
          setErrorMessage('Máy chủ chưa trả về playlist HLS hợp lệ.');
          return;
        }
      } catch (e) {
        setStreamStatus('offline');
        return;
      }
    }

    setErrorMessage('');

    // Dọn dẹp instance HLS cũ nếu đang có
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Hàm gọi play() an toàn chống AbortError
    const safePlay = async () => {
      if (!video) return;
      try {
        await video.play();
      } catch (err) {
        if (err.name === 'AbortError') {
          // Bị ngắt bởi thao tác tải mới hoặc pause, hành vi bình thường của trình duyệt
          return;
        }
        if (err.name === 'NotAllowedError') {
          // Trình duyệt chặn autoplay có tiếng -> chuyển sang muted và phát tiếp
          console.warn('Autoplay có tiếng bị chặn, thử phát ở chế độ tắt tiếng (muted):', err);
          try {
            video.muted = true;
            setIsMuted(true);
            await video.play();
          } catch (muteErr) {
            if (muteErr.name !== 'AbortError') {
              console.warn('Không thể tự động phát:', muteErr);
            }
          }
          return;
        }
        console.warn('Lỗi khi phát video:', err);
      }
    };

    // Trường hợp 1: Trình duyệt hỗ trợ MediaSource Extensions (MSE) và hls.js
    if (Hls.isSupported()) {
      let mediaRecoveryCount = 0;

      // Cấu hình mức độ trễ dựa trên thiết lập kênh (Siêu nhanh / Cân bằng / Ổn định cao)
      const delayMode = (typeof window !== 'undefined' && localStorage.getItem('traiga_stream_delay_mode')) || 'normal';
      const syncCount = delayMode === 'low' ? 3 : delayMode === 'safe' ? 5 : 4;
      const maxLatency = delayMode === 'low' ? 6 : delayMode === 'safe' ? 12 : 8;
      const bufferLen = delayMode === 'low' ? 15 : delayMode === 'safe' ? 30 : 20;

      const hls = new Hls({
        enableWorker: true,
        // QUAN TRỌNG: Tắt lowLatencyMode vì WebRTC-to-HLS có độ lệch PTS/DTS nhỏ,
        // lowLatencyMode sẽ gây ra bufferAppendError và giật/đứng hình trên Chrome
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: bufferLen,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: syncCount,
        liveMaxLatencyDurationCount: maxLatency,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxBufferHole: 0.5,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 15000,
        xhrSetup: (xhr, url) => {
          // Ngăn ngừa trình duyệt cache file playlist m3u8
          if (url.includes('.m3u8')) {
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.setRequestHeader('Pragma', 'no-cache');
          }
        }
      });

      hlsRef.current = hls;

      // 1. Nạp URL luồng HLS
      hls.loadSource(loadUrl);

      // 2. Gắn kết nối vào thẻ HTML5 video
      hls.attachMedia(video);

      // Sự kiện: Phân tích thành công playlist m3u8
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamStatus('playing');
        safePlay();
      });

      // Sự kiện: Bắt đầu phát các phân đoạn video
      hls.on(Hls.Events.FRAG_LOADED, () => {
        setStreamStatus('playing');
      });

      // Xử lý các sự kiện lỗi từ luồng
      hls.on(Hls.Events.ERROR, (event, data) => {
        // Lưu ý quan trọng: Với các lỗi không nghiêm trọng (fatal === false) như
        // bufferStalledError, bufferSeekOverHole, fragLoadError (lỡ phân đoạn cũ):
        // Hls.js tự động xử lý đệm thêm hoặc bỏ qua lỗ hổng. TUYỆT ĐỐI KHÔNG gọi
        // hls.recoverMediaError() ở đây vì sẽ làm hủy kết nối media và gây loop giật lag.
        if (!data.fatal) {
          return;
        }

        console.warn('[Hls Fatal Error Event]:', data);

        // Xử lý các lỗi nghiêm trọng (fatal: true)
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Nếu file m3u8 không tồn tại (chưa phát sóng, 404, hoặc 502 khi SRS chưa có luồng)
            console.warn('Lỗi mạng HLS fatal (Network Error)...');
            if (data.details === 'manifestLoadError' || data.response?.code === 404 || data.response?.code === 502) {
              setStreamStatus('offline');
              setErrorMessage('Chủ trại chưa lên sóng (Đang chờ luồng phát)...');
              setTimeout(() => {
                if (hlsRef.current) {
                  hlsRef.current.startLoad();
                }
              }, 4000);
            } else {
              hls.startLoad();
            }
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            if (mediaRecoveryCount <= 1) {
              mediaRecoveryCount++;
              console.log(`[HLS] Thử phục hồi Media lần ${mediaRecoveryCount}...`);
              hls.recoverMediaError();
            } else {
              console.warn('[HLS] Lỗi Media nghiêm trọng, khởi tạo lại luồng...');
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
    } 
    // Trường hợp 2: Trình duyệt hỗ trợ HLS nguyên bản (Safari trên iOS/macOS)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `${streamUrl}?_t=${Date.now()}`;
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
  }, [streamUrl, safeStreamKey]);

  // Kích hoạt khi streamKey hoặc retryCount thay đổi
  useEffect(() => {
    loadStream();

    // Dọn dẹp khi unmount hoặc đổi kênh
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [loadStream, retryCount]);

  // Tự động thử kết nối lại mỗi 6 giây nếu đang offline
  useEffect(() => {
    if (streamStatus === 'offline') {
      const timer = setTimeout(() => {
        console.log('Đang tự động thăm dò luồng trực tiếp...');
        loadStream();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [streamStatus, loadStream]);

  // Bật/tắt tiếng
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    if (!nextMuted) {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setVolume(videoRef.current.volume);
    }
    setIsMuted(nextMuted);
  };

  // Xử lý khi bấm trực tiếp vào màn hình video
  const handleVideoClick = () => {
    if (!videoRef.current) return;
    // Nếu video đang tắt tiếng (Muted do autoplay), ưu tiên BẬT TIẾNG ngay
    if (isMuted || videoRef.current.muted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
      videoRef.current.play().catch(() => {});
      return;
    }
    // Nếu đã có tiếng thì chuyển đổi Tạm dừng / Phát tiếp
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  // Xem toàn màn hình (Hỗ trợ cả iOS Safari webkitEnterFullscreen)
  const toggleFullScreen = () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error(err));
    } else if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {
        if (video && video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      });
    } else if (video && video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 group keep-dark"
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
          className="absolute inset-0 z-10 m-auto w-20 h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-rose-400/30"
          title="Bấm để phát trực tiếp có âm thanh"
        >
          <Play className="w-9 h-9 fill-white translate-x-0.5" />
        </button>
      )}

      {/* VIDEO MÀN HÌNH CHỜ KHI CHƯA LÊN SÓNG / ĐANG KẾT NỐI */}
      {streamStatus !== 'playing' && (
        <div className="absolute inset-0 z-20 bg-black overflow-hidden">
          <video
            src="/waiting_screen.mp4"
            poster="/waiting_poster.jpg"
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* THANH ĐIỀU KHIỂN & BADGE TRÊN VIDEO */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 pointer-events-none">
        {streamStatus === 'playing' ? (
          <div className="flex items-center gap-1.5 bg-rose-600/90 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-300 text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>OFFLINE</span>
          </div>
        )}
      </div>

      {/* NÚT BẬT TIẾNG NỔI BẬT DỄ THẤY KHI TRÌNH DUYỆT TỰ ĐỘNG TẮT TIẾNG */}
      {streamStatus === 'playing' && isMuted && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border border-rose-300/40 text-xs font-extrabold px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span>Chạm để bật âm thanh 🔊</span>
        </button>
      )}

      {/* THANH ĐIỀU KHIỂN TÙY BIẾN DƯỚI ĐÁY VIDEO */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-2.5 sm:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (videoRef.current) {
                if (isPlaying) videoRef.current.pause();
                else videoRef.current.play().catch(() => {});
              }
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white cursor-pointer"
            title={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>

          <div className="flex items-center gap-1.5 group/vol">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white cursor-pointer"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
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
                  const newMuted = val === 0;
                  videoRef.current.muted = newMuted;
                  setIsMuted(newMuted);
                }
              }}
              className="w-16 sm:w-20 accent-rose-500 cursor-pointer h-1.5 bg-white/30 rounded-lg hidden xs:inline-block"
              title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[11px] font-mono text-slate-300 w-8 hidden xs:inline-block">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          <span className="text-xs text-slate-300 font-mono hidden sm:inline-block">
            {streamStatus === 'playing' ? 'Đang phát trực tiếp 1080p@60' : 'Chưa có tín hiệu'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white"
            title="Làm mới luồng"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white"
            title="Toàn màn hình"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
