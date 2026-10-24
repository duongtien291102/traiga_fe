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
export default function LivePlayer({ streamKey = 'tiendev' }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // Trạng thái phát sóng
  const [streamStatus, setStreamStatus] = useState('connecting'); // 'connecting' | 'playing' | 'offline' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // SRS 5 phân phối HLS tại /live/[streamKey].m3u8
  const streamUrl = `${getHlsBaseUrl()}/live/${encodeURIComponent(streamKey.trim())}.m3u8`;

  // Hàm khởi tạo và tải luồng HLS
  const loadStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const loadUrl = `${streamUrl}?_t=${Date.now()}`;

    // Kiểm tra nhanh xem luồng .m3u8 đã online chưa trước khi khởi tạo Hls Worker
    // (Tránh việc hls.js retry 6 lần liên tục gây giật lag video màn hình chờ)
    try {
      const checkRes = await fetch(loadUrl, { method: 'GET', cache: 'no-store' });
      if (!checkRes.ok) {
        setStreamStatus('offline');
        return;
      }
    } catch (e) {
      setStreamStatus('offline');
      return;
    }

    setErrorMessage('');

    // Dọn dẹp instance HLS cũ nếu đang có
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Trường hợp 1: Trình duyệt hỗ trợ MediaSource Extensions (MSE) và hls.js
    if (Hls.isSupported()) {
      let mediaRecoveryCount = 0;

      // Cấu hình mức độ trễ dựa trên thiết lập kênh (Siêu nhanh / Cân bằng / Ổn định cao)
      const delayMode = (typeof window !== 'undefined' && localStorage.getItem('traiga_stream_delay_mode')) || 'normal';
      const syncCount = delayMode === 'low' ? 2 : delayMode === 'safe' ? 5 : 3;
      const maxLatency = delayMode === 'low' ? 4 : delayMode === 'safe' ? 10 : 6;
      const bufferLen = delayMode === 'low' ? 10 : delayMode === 'safe' ? 30 : 20;

      const hls = new Hls({
        enableWorker: true,
        // QUAN TRỌNG: Tắt lowLatencyMode vì WebRTC-to-HLS có độ lệch PTS/DTS nhỏ,
        // lowLatencyMode sẽ gây ra bufferAppendError và giật/đứng hình trên Chrome
        lowLatencyMode: false,
        backBufferLength: 10,
        maxBufferLength: bufferLen,
        maxMaxBufferLength: 40,
        liveSyncDurationCount: syncCount,
        liveMaxLatencyDurationCount: maxLatency,
        manifestLoadingMaxRetry: 2,
        manifestLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 4,
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
        video.play().catch((err) => {
          // Trình duyệt chặn autoplay có tiếng -> giữ mute và thử lại
          console.warn('Autoplay prevented, retrying muted:', err);
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      });

      // Sự kiện: Bắt đầu phát các phân đoạn video
      hls.on(Hls.Events.FRAG_LOADED, () => {
        setStreamStatus('playing');
      });

      // Xử lý các sự kiện lỗi từ luồng
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn('[Hls Error Event]:', data);

        // 1. Phục hồi buffer khi có jitter hoặc stall
        if (data.details === 'bufferAppendError' || data.details === 'bufferStalledError') {
          console.log(`Phát hiện lỗi buffer (${data.details}), thử recoverMediaError...`);
          hls.recoverMediaError();
          return;
        }

        // 2. Phân đoạn TS bị lỗi tải (ví dụ 404 do trượt khỏi sliding window 60s)
        // Đây KHÔNG PHẢI lỗi luồng offline! Chỉ cần tiếp tục tải phân đoạn mới
        if (data.details === 'fragLoadError') {
          console.warn('Phân đoạn video cũ bị lỡ (fragLoadError), tự động tải phân đoạn kế tiếp...');
          hls.startLoad();
          return;
        }

        // 3. Xử lý các lỗi nghiêm trọng (fatal)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Nếu file m3u8 không tồn tại (chưa phát sóng, 404, hoặc 502 khi SRS chưa có luồng)
              console.warn('Lỗi mạng HLS (Network Error / Luồng chưa phát)...');
              if (data.details === 'manifestLoadError' || data.response?.code === 404 || data.response?.code === 502) {
                setStreamStatus('offline');
                setErrorMessage('Chủ trại chưa lên sóng (Đang chờ luồng phát)...');
                setTimeout(() => {
                  if (hlsRef.current) {
                    hlsRef.current.startLoad();
                  }
                }, 5000);
              } else {
                hls.startLoad();
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              if (mediaRecoveryCount === 0) {
                mediaRecoveryCount++;
                console.log('Thử phục hồi Media lần 1...');
                hls.recoverMediaError();
              } else if (mediaRecoveryCount === 1) {
                mediaRecoveryCount++;
                console.log('Thử đổi codec audio và phục hồi Media lần 2...');
                hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                console.warn('Lỗi Media nghiêm trọng, tải lại luồng...');
                mediaRecoveryCount = 0;
                setRetryCount(prev => prev + 1);
              }
              break;

            default:
              setStreamStatus('offline');
              setErrorMessage('Không thể phát luồng trực tiếp này.');
              hls.destroy();
              break;
          }
        }
      });
    } 
    // Trường hợp 2: Trình duyệt hỗ trợ HLS nguyên bản (Safari trên iOS/macOS)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `${streamUrl}?_t=${Date.now()}`;
      video.addEventListener('loadedmetadata', () => {
        setStreamStatus('playing');
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setStreamStatus('offline');
        setErrorMessage('Luồng trực tiếp đang ngoại tuyến...');
      });
    } else {
      setStreamStatus('error');
      setErrorMessage('Trình duyệt của bạn không hỗ trợ định dạng HLS.');
    }
  }, [streamUrl, streamKey]);

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
    setIsMuted(nextMuted);
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
        onClick={() => {
          if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* NÚT PLAY TRUNG TÂM NẾU TRÌNH DUYỆT CHẶN AUTOPLAY HOẶC ĐANG TẠM DỪNG */}
      {streamStatus === 'playing' && !isPlaying && (
        <button
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 z-10 m-auto w-20 h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 cursor-pointer border border-rose-400/30"
          title="Bấm để phát trực tiếp"
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

      {/* NÚT BẬT TIẾNG NHANH TRÊN ĐIỆN THOẠI KHI ĐANG BỊ MUTE TỰ ĐỘNG */}
      {streamStatus === 'playing' && isMuted && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-black/75 hover:bg-black/90 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md transition cursor-pointer"
        >
          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          <span>Chạm bật tiếng</span>
        </button>
      )}

      {/* THANH ĐIỀU KHIỂN TÙY BIẾN DƯỚI ĐÁY VIDEO */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-2.5 sm:p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (videoRef.current) {
                if (isPlaying) videoRef.current.pause();
                else videoRef.current.play();
              }
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white"
            title={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-white"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

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
