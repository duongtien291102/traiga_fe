import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Radio, 
  Monitor, 
  Camera, 
  X, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Activity, 
  ShieldCheck,
  Play,
  Square,
  Clock,
  Copy,
  RefreshCw,
  MessageSquare,
  Send,
  Users,
  Settings,
  Flame,
  Heart,
  Maximize2,
  Minimize2,
  Smartphone,
  Zap,
  Sliders,
  Gauge
} from 'lucide-react';
import { getWsUrl, NGROK_HLS_URL, isVercel } from '../config';

export default function LiveStudioModal({ 
  isOpen, 
  onClose, 
  streamKeys = [], 
  currentStreamKey = 'thanhtrung01',
  onStreamStarted,
  user,
  sessions = []
}) {
  const [selectedKey, setSelectedKey] = useState(currentStreamKey);
  const [sourceType, setSourceType] = useState('camera'); // 'camera' | 'screen'
  const [facingMode, setFacingMode] = useState('user'); // 'user' (trước) | 'environment' (sau)
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [micVolume, setMicVolume] = useState(0); // 0-100% cường độ âm thanh mic thu được thực tế
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCopiedSession, setIsCopiedSession] = useState(false);

  // Cấu hình nâng cao: Độ trễ (delay), Độ phân giải (resolution), Hướng quay dọc/ngang (orientation)
  const [streamDelayMode, setStreamDelayMode] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('traiga_stream_delay_mode')) || 'normal';
  });
  const [resolution, setResolution] = useState('720p'); // '1080p' | '720p' | '480p' | '360p'
  const [actualVideoSettings, setActualVideoSettings] = useState(null);
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' (Ngang 16:9) | 'portrait' (Dọc 9:16) | 'square' (Vuông 1:1)
  
  // Chế độ phóng to toàn màn hình camera cho Streamer
  const [isCamMaximized, setIsCamMaximized] = useState(false);
  const [videoFit, setVideoFit] = useState('contain'); // 'contain' (khớp người xem) | 'cover' (lấp đầy)
  const [, setPreviewMetadataVersion] = useState(0);
  
  // Tab điều khiển bên dưới: 'chat' (Bình luận trực tiếp) | 'config' (Cấu hình luồng)
  const [activeTab, setActiveTab] = useState('chat');

  // Trạng thái Chat trực tiếp trong Studio cho Streamer
  const [studioMessages, setStudioMessages] = useState([]);
  const [studioChatInput, setStudioChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isChatConnected, setIsChatConnected] = useState(false);

  const previewVideoRef = useRef(null);
  const previewFrameRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const peerConnRef = useRef(null);
  const timerRef = useRef(null);
  const studioWsRef = useRef(null);
  const chatScrollRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isMountedRef = useRef(false);
  const isPageHiddenRef = useRef(false);
  const tokenFailedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (currentStreamKey) {
      setSelectedKey(currentStreamKey);
    }
  }, [currentStreamKey]);

  // Bộ đếm thời gian phát sóng trực tiếp
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
      setActiveTab('chat');
    } else {
      clearInterval(timerRef.current);
      setStreamDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  // Bộ đo cường độ âm thanh thời gian thực từ Micro (Audio Level Meter)
  useEffect(() => {
    if (!isOpen || !isMicOn || !mediaStreamRef.current) {
      setMicVolume(0);
      return;
    }

    const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
    if (!audioTrack || audioTrack.readyState === 'ended' || !audioTrack.enabled) {
      setMicVolume(0);
      return;
    }

    let audioCtx = null;
    let analyser = null;
    let animId = null;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (dataArray.length || 1);
        // Quy đổi về thang 0 - 100
        const vol = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(vol);
        animId = requestAnimationFrame(checkVolume);
      };

      animId = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('Không thể khởi tạo bộ đo âm thanh:', e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isOpen, isMicOn, hasStream, isLive]);

  // Khởi tạo kết nối WebSocket phòng Chat với Auto-Reconnect và Fallback chế độ Guest
  const connectChat = () => {
    if (!isMountedRef.current || isPageHiddenRef.current || !isOpen || !selectedKey) return;

    if (studioWsRef.current && (studioWsRef.current.readyState === WebSocket.OPEN || studioWsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = getWsUrl(selectedKey);
      const ws = new WebSocket(wsUrl);
      studioWsRef.current = ws;

      const streamerName = userRef.current?.full_name || userRef.current?.username || 'Chủ Trại (Live)';
      const rawToken = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsChatConnected(true);
        reconnectAttemptsRef.current = 0;

        if (rawToken && !tokenFailedRef.current) {
          ws.send(JSON.stringify({ type: 'auth_token', token: rawToken }));
        } else {
          ws.send(JSON.stringify({ type: 'auth_guest', guest_name: streamerName }));
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setIsChatConnected(false);
        // Tự động kết nối lại sau 2.5s nếu studio vẫn đang mở và không phải đóng chủ đích (1000)
        if (!isPageHiddenRef.current && event?.code !== 1000) {
          clearTimeout(reconnectTimerRef.current);
          const delay = Math.min(2000 + reconnectAttemptsRef.current * 1000, 5000);
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(connectChat, delay);
        }
      };

      ws.onerror = () => {
        if (isMountedRef.current) {
          setIsChatConnected(false);
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const rawLines = event.data.split('\n');
          for (const line of rawLines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line);

            if (data.type === 'history' && Array.isArray(data.history)) {
              setStudioMessages(data.history);
              setTimeout(() => {
                chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            } else if (data.type === 'chat' && data.data) {
              setStudioMessages((prev) => {
                const incoming = data.data;
                // Nếu tin nhắn từ chính mình vừa thêm optimistic thì thay thế
                const existingIndex = prev.findIndex((m) => 
                  m.id === incoming.id || 
                  (String(m.id).startsWith('local_') && m.message === incoming.message && m.username === incoming.username)
                );
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = incoming;
                  return updated;
                }
                return [...prev, incoming];
              });
              setTimeout(() => {
                chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            } else if (data.type === 'viewer_count' && typeof data.viewer_count === 'number') {
              setViewerCount(data.viewer_count);
            } else if (data.type === 'reaction' && data.emoji) {
              const id = Date.now() + Math.random();
              setFloatingEmojis((prev) => [...prev, { id, emoji: data.emoji }]);
              setTimeout(() => {
                setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
              }, 2000);
            } else if (data.type === 'auth_login_result') {
              if (data.success) {
                setIsChatConnected(true);
              }
            } else if (data.type === 'error') {
              const errStr = String(data.error || '');
              if (errStr.includes('Token') || errStr.includes('hết hạn') || errStr.includes('thu hồi') || errStr.includes('xác thực')) {
                console.warn('[Studio Chat] Token auth rejected by backend, falling back to guest mode:', errStr);
                tokenFailedRef.current = true;
                localStorage.removeItem('auth_token');
                try {
                  ws.send(JSON.stringify({ type: 'auth_guest', guest_name: streamerName }));
                } catch (e) {}
              }
            }
          }
        } catch (e) {}
      };
    } catch (e) {
      if (isMountedRef.current && !isPageHiddenRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connectChat, 3000);
      }
    }
  };

  // Quản lý vòng đời kết nối WebSocket và hỗ trợ tương thích đa nền tảng (iOS Safari, Android Chrome)
  useEffect(() => {
    if (!isOpen || !selectedKey) {
      setIsChatConnected(false);
      clearTimeout(reconnectTimerRef.current);
      if (studioWsRef.current) {
        try {
          studioWsRef.current.close(1000, 'Studio closed');
        } catch (e) {}
        studioWsRef.current = null;
      }
      return;
    }

    isMountedRef.current = true;
    isPageHiddenRef.current = false;
    setStudioMessages([]);
    setIsChatConnected(false);

    connectChat();

    // Hồi phục kết nối ngay khi quay lại tab từ chế độ cấp quyền Camera hoặc khóa màn hình điện thoại
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageHiddenRef.current = true;
        clearTimeout(reconnectTimerRef.current);
      } else {
        isPageHiddenRef.current = false;
        if (!studioWsRef.current || studioWsRef.current.readyState !== WebSocket.OPEN) {
          connectChat();
        }
      }
    };

    const handlePageShow = () => {
      isPageHiddenRef.current = false;
      if (!studioWsRef.current || studioWsRef.current.readyState !== WebSocket.OPEN) {
        connectChat();
      }
    };

    const handleOnline = () => {
      if (!studioWsRef.current || studioWsRef.current.readyState !== WebSocket.OPEN) {
        connectChat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      if (studioWsRef.current) {
        try {
          studioWsRef.current.close(1000, 'Unmount');
        } catch (e) {}
        studioWsRef.current = null;
      }
    };
  }, [isOpen, selectedKey]);

  // Gửi tin nhắn trả lời từ Studio
  const handleSendStudioChat = (e) => {
    e?.preventDefault();
    const text = studioChatInput.trim();
    if (!text) return;

    const streamerName = userRef.current?.full_name || userRef.current?.username || 'Chủ Trại (Live)';
    const token = !tokenFailedRef.current ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : '';

    if (!studioWsRef.current || studioWsRef.current.readyState !== WebSocket.OPEN) {
      connectChat();
      return;
    }
    
    const payload = {
      type: 'chat',
      message: text,
      token: token,
      sender: streamerName,
      role: userRef.current?.role || 'admin'
    };

    try {
      studioWsRef.current.send(JSON.stringify(payload));
      // Tối ưu hiển thị tức thì (optimistic update)
      const optimisticMsg = {
        id: 'local_' + Date.now(),
        username: streamerName,
        message: text,
        role: userRef.current?.role || 'admin',
        created_at: new Date().toISOString()
      };
      setStudioMessages((prev) => [...prev, optimisticMsg]);
      setStudioChatInput('');
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      console.warn('Lỗi gửi tin nhắn studio:', err);
    }
  };

  // Tính kích thước và tỉ lệ khung hình chuẩn theo độ phân giải & hướng quay
  const getDims = (res = resolution, orient = orientation) => {
    let w = 1280, h = 720;
    if (res === '1080p') { w = 1920; h = 1080; }
    else if (res === '720p') { w = 1280; h = 720; }
    else if (res === '480p') { w = 854; h = 480; }
    else if (res === '360p') { w = 640; h = 360; }

    if (orient === 'portrait') {
      return { width: h, height: w, aspectRatio: 9 / 16 };
    } else if (orient === 'square') {
      const s = Math.min(w, h);
      return { width: s, height: s, aspectRatio: 1 };
    }
    return { width: w, height: h, aspectRatio: 16 / 9 };
  };

  const syncActualVideoSettings = (track) => {
    const settings = track?.getSettings?.();
    setActualVideoSettings(settings?.width && settings?.height ? {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate
    } : null);
  };

  // Cập nhật lại cấu hình camera khi đổi độ phân giải hoặc xoay dọc/ngang mà không mất luồng
  const updateCameraTrack = async (newRes, newOrient, currentMode = facingMode) => {
    if (sourceType !== 'camera') return;
    const dims = getDims(newRes, newOrient);
    try {
      const oldVideoTrack = mediaStreamRef.current?.getVideoTracks()[0];
      let newStream = null;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: currentMode },
            width: { ideal: dims.width },
            height: { ideal: dims.height },
            aspectRatio: { ideal: dims.aspectRatio },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
      } catch (err) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      syncActualVideoSettings(newVideoTrack);
      if (mediaStreamRef.current) {
        if (oldVideoTrack) {
          mediaStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        mediaStreamRef.current.addTrack(newVideoTrack);
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStreamRef.current;
      }
      if (peerConnRef.current) {
        const sender = peerConnRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.warn('Không thể cập nhật camera với cấu hình mới:', err);
    }
  };

  const handleDelayChange = (mode) => {
    setStreamDelayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('traiga_stream_delay_mode', mode);
    }
  };

  const handleResolutionChange = (res) => {
    setResolution(res);
    updateCameraTrack(res, orientation);
  };

  const handleOrientationChange = (orient) => {
    setOrientation(orient);
    updateCameraTrack(resolution, orient);
  };

  const getPreviewRotation = (video = previewVideoRef.current, orient = orientation) => {
    if (!video?.videoWidth || !video?.videoHeight || orient === 'square') return 0;
    const trackIsPortrait = video.videoHeight > video.videoWidth;
    return (orient === 'portrait') === trackIsPortrait ? 0 : 90;
  };

  const getPreviewVideoStyle = () => {
    const video = previewVideoRef.current;
    const frame = previewFrameRef.current;
    const rotation = getPreviewRotation(video);
    const frameWidth = frame?.clientWidth || 0;
    const frameHeight = frame?.clientHeight || 0;
    const rotated = rotation !== 0;
    return {
      width: rotated && frameHeight ? `${frameHeight}px` : '100%',
      height: rotated && frameWidth ? `${frameWidth}px` : '100%',
      transform: `${facingMode === 'user' && sourceType === 'camera' ? 'scaleX(-1) ' : ''}${rotated ? `rotate(${rotation}deg)` : ''}`.trim() || 'none'
    };
  };

  // Khởi tạo nguồn thu Webcam hoặc Màn hình
  const initMediaStream = async (type = sourceType, mode = facingMode) => {
    try {
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage(
          'Trình duyệt không hỗ trợ hoặc khóa Camera qua kết nối này. Vui lòng mở bằng đường link HTTPS an toàn.'
        );
        return;
      }

      // Dừng luồng cũ nếu có
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      let stream = null;
      if (type === 'camera') {
        const dims = getDims(resolution, orientation);
        const videoConstraints = {
          facingMode: { ideal: mode },
          width: { ideal: dims.width },
          height: { ideal: dims.height },
          aspectRatio: { ideal: dims.aspectRatio },
          frameRate: { ideal: 30 }
        };

        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };

        // 1. Yêu cầu quyền và thu nhận tín hiệu đồng thời cả Camera và Micro trong 1 lần duy nhất
        // (Cách này ngăn chặn việc mobile trình duyệt như Chrome/Safari chặn micro khi gọi getUserMedia 2 lần)
        let combinedStream = null;
        try {
          combinedStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints
          });
          console.log('[MEDIA] Đã kết nối đồng thời Camera và Micro chuẩn');
        } catch (errCombined) {
          console.warn('[MEDIA] Thử cấu hình camera linh hoạt kèm audio:', errCombined);
          try {
            combinedStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: mode } },
              audio: { echoCancellation: true, noiseSuppression: true }
            });
            console.log('[MEDIA] Đã kết nối Camera linh hoạt và Micro');
          } catch (errFlex) {
            console.warn('[MEDIA] Không thể mở chung, thử mở riêng từng thiết bị:', errFlex);
            // Mở video riêng
            let vStream = null;
            try {
              vStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (vErr) {
              throw vErr;
            }
            combinedStream = new MediaStream(vStream.getVideoTracks());
            // Mở micro riêng nếu có thể
            try {
              const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              aStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
            } catch (aErr) {
              console.warn('[MIC] Thiết bị không hỗ trợ Micro hoặc bị từ chối:', aErr);
            }
          }
        }

        stream = combinedStream;
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks.forEach((t) => { t.enabled = true; });
          setIsMicOn(true);
        } else {
          setIsMicOn(false);
        }

        const videoTracks = stream.getVideoTracks();
        setIsCameraOn(videoTracks.length > 0);
        syncActualVideoSettings(videoTracks[0]);
      } else {
        // Chia sẻ màn hình
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: true
        });

        stream.getVideoTracks()[0].onended = () => {
          stopLivestream();
          setSourceType('camera');
          initMediaStream('camera', facingMode);
        };

        setIsCameraOn(true);
        setIsMicOn(stream.getAudioTracks().length > 0);
        syncActualVideoSettings(stream.getVideoTracks()[0]);
      }

      mediaStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setHasStream(true);
    } catch (err) {
      console.error('Lỗi truy cập thiết bị thu hình:', err);
      setHasStream(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Trình duyệt đã chặn quyền Camera/Micro. Vui lòng bấm vào biểu tượng Ổ khóa 🔒 (hoặc Cài đặt trang web) trên thanh địa chỉ, chọn "Cho phép" Camera và Micro, sau đó bấm Thử Lại.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Không tìm thấy thiết bị Camera hoặc Microphone trên máy tính của bạn.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera hoặc Micro đang bị ứng dụng khác sử dụng (ví dụ: OBS, Zoom, Teams, Zalo).');
      } else {
        setErrorMessage(err.message || 'Lỗi khi mở thiết bị thu hình.');
      }
    }
  };

  // Mở webcam khi modal xuất hiện
  useEffect(() => {
    if (isOpen) {
      initMediaStream(sourceType, facingMode);
    } else {
      stopLivestream();
      setHasStream(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isOpen]);

  // ĐỔI CAMERA TRƯỚC / SAU (LẬT CAM) MƯỢT MÀ KỂ CẢ KHI ĐANG PHÁT SÓNG
  const toggleFacingMode = async () => {
    if (sourceType !== 'camera') return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    try {
      const oldVideoTrack = mediaStreamRef.current?.getVideoTracks()[0];
      const dims = getDims(resolution, orientation);
      
      let newStream = null;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: dims.width },
            height: { ideal: dims.height },
            aspectRatio: { ideal: dims.aspectRatio }
          },
          audio: false
        });
      } catch (err) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      syncActualVideoSettings(newVideoTrack);

      if (mediaStreamRef.current) {
        if (oldVideoTrack) {
          mediaStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        mediaStreamRef.current.addTrack(newVideoTrack);
      }

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStreamRef.current;
      }

      // THAY ĐỔI VIDEO TRACK TRỰC TIẾP TRÊN WEBRTC MÀ KHÔNG NGẮT LUỒNG LIVE
      if (peerConnRef.current) {
        const sender = peerConnRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
          console.log('[WEBRTC] Đã đổi track camera mượt mà sang:', nextFacing);
        }
      }
    } catch (err) {
      console.warn('Không thể đổi camera:', err);
      setErrorMessage('Không thể chuyển đổi camera trên thiết bị này.');
    }
  };

  // Bật/tắt camera
  const toggleCamera = () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  // Bật/tắt micro (Tự động xin cấp quyền và kết nối thiết bị nếu chưa có track)
  const toggleMic = async () => {
    if (!mediaStreamRef.current) return;
    
    let audioTrack = mediaStreamRef.current.getAudioTracks()[0];
    
    // Nếu chưa có Audio Track hoặc track đã dừng -> Yêu cầu quyền và thu Micro
    if (!audioTrack || audioTrack.readyState === 'ended') {
      try {
        console.log('[MIC] Đang kích hoạt Micro...');
        const newAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const newTrack = newAudioStream.getAudioTracks()[0];
        if (newTrack) {
          mediaStreamRef.current.addTrack(newTrack);
          setIsMicOn(true);
          setErrorMessage('');
          console.log('[MIC] Đã kết nối Micro thành công:', newTrack.label);

          // Nếu đang live WebRTC, gắn Audio Track vào đường truyền đang phát
          if (peerConnRef.current) {
            const audioSender = peerConnRef.current.getSenders().find(
              (s) => s.track && s.track.kind === 'audio'
            );
            if (audioSender) {
              await audioSender.replaceTrack(newTrack);
              console.log('[WEBRTC] Đã cập nhật Audio Track vào Sender đang phát.');
            } else {
              peerConnRef.current.addTrack(newTrack, mediaStreamRef.current);
              console.log('[WEBRTC] Đã thêm Audio Track mới vào bộ phát.');
            }
          }
        }
      } catch (err) {
        console.error('Không thể bật micro:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Trình duyệt đang chặn Micro. Vui lòng bấm vào Ổ khóa 🔒 trên thanh địa chỉ, Cho phép Micro rồi bấm thử lại.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('Không tìm thấy thiết bị Microphone trên máy tính/điện thoại.');
        } else {
          setErrorMessage('Lỗi khi mở Micro: ' + (err.message || 'Thiết bị bận.'));
        }
        setIsMicOn(false);
      }
      return;
    }

    // Nếu đã có Audio Track sẵn -> bật/tắt (mute/unmute)
    const nextState = !audioTrack.enabled;
    audioTrack.enabled = nextState;
    setIsMicOn(nextState);
    console.log(`[MIC] Đã ${nextState ? 'BẬT' : 'TẮT'} tiếng Micro`);
  };

  // Đổi nguồn thu: Webcam <-> Màn hình
  const handleSwitchSource = (type) => {
    if (isLive) {
      alert('Vui lòng dừng phát sóng trước khi chuyển nguồn thu!');
      return;
    }
    setSourceType(type);
    initMediaStream(type, facingMode);
  };

  // BẮT ĐẦU PHÁT SÓNG TRỰC TIẾP QUA WEBRTC LÊN SRS
  const startLivestream = async () => {
    if (!user || user.role !== 'admin') {
      setErrorMessage('Chỉ tài khoản Quản trị viên (Admin) mới có quyền phát sóng trực tiếp.');
      return;
    }

    if (!mediaStreamRef.current) {
      setErrorMessage('Chưa có nguồn video để phát sóng.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');

    try {
      // Đảm bảo có Audio Track trước khi bắt đầu live nếu streamer muốn có tiếng
      if (mediaStreamRef.current.getAudioTracks().length === 0) {
        try {
          console.log('[WEBRTC] Kiểm tra Micro trước khi live...');
          const aStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          const aTrack = aStream.getAudioTracks()[0];
          if (aTrack) {
            mediaStreamRef.current.addTrack(aTrack);
            setIsMicOn(true);
            console.log('[WEBRTC] Đã tự động kích hoạt Micro chuẩn bị phát sóng');
          }
        } catch (aErr) {
          console.warn('[WEBRTC] Không thể kích hoạt Micro trước khi live, phát ở chế độ không tiếng:', aErr);
        }
      }

      const pc = new RTCPeerConnection({
        iceServers: []
      });
      peerConnRef.current = pc;

      // QUAN TRỌNG VỚI SRS MEDIA SERVER (SRS 5):
      // Bắt buộc phải khởi tạo cả 2 Transceiver audio và video ở chế độ "sendonly"
      // trước khi tạo Offer để SRS cấu hình đúng luồng Ingest và bộ chuyển đổi Opus -> AAC
      pc.addTransceiver('audio', { direction: 'sendonly' });
      pc.addTransceiver('video', { direction: 'sendonly' });

      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];

      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        pc.addTrack(audioTrack, mediaStreamRef.current);
        console.log('[WEBRTC] Đã gắn Audio Track vào bộ phát sendonly:', audioTrack.label);
      }

      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
        pc.addTrack(videoTrack, mediaStreamRef.current);
        console.log('[WEBRTC] Đã gắn Video Track vào bộ phát sendonly:', videoTrack.label);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const hostname = window.location.hostname || 'localhost';
      const streamUrl = `webrtc://${hostname}/live/${encodeURIComponent(selectedKey.trim())}`;
      
      // Khi chạy trên Vercel, trỏ tín hiệu WebRTC thẳng vào đường hầm Ngrok HTTPS
      const rtcBase = isVercel() ? NGROK_HLS_URL : '';
      const apiUrl = `${rtcBase}/rtc/v1/publish/`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          streamurl: streamUrl,
          sdp: offer.sdp
        })
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.code !== 0) {
        const serverReason = data.message || data.error || data.reason || data.msg;
        throw new Error(
          serverReason
            ? `SRS từ chối phát luồng (mã lỗi ${data.code}): ${serverReason}`
            : `SRS từ chối phát luồng (mã lỗi ${data.code}).`
        );
      }

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: data.sdp })
      );

      setIsLive(true);
      setIsPublishing(false);
      setActiveTab('chat');
      onStreamStarted && onStreamStarted(selectedKey);
    } catch (err) {
      console.error('Lỗi khi phát sóng:', err);
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ SRS để phát sóng.');
      setIsPublishing(false);
      setIsLive(false);
      if (peerConnRef.current) {
        peerConnRef.current.close();
        peerConnRef.current = null;
      }
    }
  };

  // DỪNG PHÁT SÓNG TRỰC TIẾP
  const stopLivestream = () => {
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    setIsLive(false);
    setIsPublishing(false);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Chỉ những tài khoản có vai trò <strong>Quản trị viên (Admin)</strong> mới được phép mở Studio và phát sóng trực tiếp.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className={`relative w-full ${isCamMaximized ? 'max-w-6xl' : 'max-w-4xl'} bg-[#111218] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[96vh] transition-all duration-300`}>
        
        {/* ================= HEADER MODAL ================= */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-[#161720]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-xl ${isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-500/10 text-rose-500'}`}>
              <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-black text-white tracking-wide">
                  Phát Trực Tiếp
                </h2>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-[10px] font-black text-white uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold">
                    Chuẩn bị
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 truncate max-w-[170px] sm:max-w-xs">
                Trạng thái: <span className="text-rose-400 font-bold">{isLive ? 'Đang phát sóng trực tiếp' : 'Sẵn sàng lên sóng'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLive && (
              <>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-mono text-rose-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(streamDuration)}</span>
                </div>
                <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-bold">
                  <Users className="w-3 h-3 text-amber-400" />
                  <span>{viewerCount} xem</span>
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Đóng studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/70 border-b border-rose-800/60 flex items-center gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="line-clamp-2">{errorMessage}</span>
          </div>
        )}

        {/* ================= BODY STUDIO ================= */}
        {/* Hỗ trợ Responsive linh hoạt: Khi xoay ngang điện thoại (landscape) tự động chia 2 cột trái-phải */}
        <div className="p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-y-auto flex-1">
          
          {/* CỘT TRÁI: CAMERA VIEWPORT CHUẨN THẲNG MẶT & ĐIỀU KHIỂN */}
          <div className={`${isCamMaximized ? 'lg:col-span-8' : 'lg:col-span-7'} flex flex-col gap-2.5 transition-all duration-300`}>
            
            {/* KHUNG CAMERA CHUẨN GÓC RỘNG - HỖ TRỢ XOAY DỌC 9:16, NGANG 16:9 VÀ VUÔNG 1:1 */}
            <div ref={previewFrameRef} className={`relative w-full ${
              orientation === 'portrait'
                ? 'max-w-[280px] mx-auto aspect-[9/16] h-[360px] sm:h-[430px]'
                : orientation === 'square'
                ? 'max-w-[340px] mx-auto aspect-square'
                : isCamMaximized 
                ? 'h-[62vh] xs:h-[68vh] sm:h-[480px]' 
                : 'aspect-video sm:h-[360px]'
            } bg-black rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex items-center justify-center transition-all duration-300 group keep-dark`}>
              
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setPreviewMetadataVersion((version) => version + 1)}
                style={getPreviewVideoStyle()}
                className={`w-full h-full ${videoFit === 'contain' ? 'object-contain' : 'object-cover'} object-center bg-black transition-all duration-200`}
              />

              {/* FLOATING REACTION EMOJIS BAY LÊN KHI KHÁN GIẢ THẢ TIM */}
              <div className="absolute inset-y-0 right-3 pointer-events-none flex flex-col justify-end pb-16 z-30 overflow-hidden">
                {floatingEmojis.map((item) => (
                  <div key={item.id} className="animate-float-up text-2xl select-none mb-2">
                    {item.emoji}
                  </div>
                ))}
              </div>

              {/* THANH ĐIỀU KHIỂN TRÊN CÙNG CỦA VIDEO - BỐ TRÍ KHÔNG BAO GIỜ BỊ CHỒNG CHÉO */}
              <div className="absolute top-2.5 inset-x-2.5 z-30 flex items-center justify-between gap-1.5 pointer-events-none">
                
                {/* Góc trái: Trạng thái xem trước hoặc Live */}
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <span className={`px-2 py-1 rounded-full backdrop-blur-md text-[10px] font-black border flex items-center gap-1 shadow-md ${
                    isLive ? 'bg-rose-600/90 text-white border-rose-400 animate-pulse' : 'bg-black/70 text-gray-300 border-white/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-white' : 'bg-cyan-400'}`} />
                    <span>{isLive ? 'LIVE' : 'XEM TRƯỚC'}</span>
                  </span>
                </div>

                {/* Góc phải: Nút Phóng to Cam + Nút Lật Cam + Nút Tỉ lệ */}
                <div className="pointer-events-auto flex items-center gap-1.5">
                  
                  {/* NÚT PHÓNG TO / THU NHỎ CAMERA */}
                  <button
                    onClick={() => setIsCamMaximized(!isCamMaximized)}
                    className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    title={isCamMaximized ? "Thu nhỏ camera về góc chuẩn" : "Phóng to camera xem rõ chi tiết"}
                  >
                    {isCamMaximized ? (
                      <>
                        <Minimize2 className="w-3 h-3 text-amber-400" />
                        <span>Thu nhỏ</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3 text-cyan-400" />
                        <span>Phóng to</span>
                      </>
                    )}
                  </button>

                  {/* NÚT ĐỔI TỈ LỆ (CHUẨN NGƯỜI XEM / LẤP ĐẦY) */}
                  <button
                    onClick={() => setVideoFit(prev => prev === 'contain' ? 'cover' : 'contain')}
                    className="hidden xs:inline-flex px-2 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-md transition cursor-pointer"
                    title="Chuyển đổi góc rộng người xem hoặc lấp đầy"
                  >
                    {videoFit === 'contain' ? '📐 100%' : '🔍 Lấp đầy'}
                  </button>

                  {/* NÚT LẬT CAM TRƯỚC / SAU */}
                  {sourceType === 'camera' && (
                    <button
                      onClick={toggleFacingMode}
                      className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
                      title="Lật đổi Camera Trước / Sau"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>{facingMode === 'user' ? 'Cam sau' : 'Cam trước'}</span>
                    </button>
                  )}

                </div>
              </div>

              {/* THÔNG BÁO NẾU CAMERA BỊ KHÓA HOẶC CHƯA CẤP QUYỀN */}
              {!hasStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/95 text-gray-400 z-30">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">Chưa nhận được tín hiệu Camera</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mb-3.5 leading-relaxed">
                    Vui lòng bấm <b>Cho phép</b> khi trình duyệt hỏi quyền truy cập Camera & Microphone.
                  </p>
                  <button
                    onClick={() => initMediaStream(sourceType, facingMode)}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    Thử Lại Camera
                  </button>
                </div>
              )}

              {/* THANH ĐIỀU KHIỂN CAMERA & MIC NẰM NỔI BÊN DƯỚI VIDEO (CHỈ HIỆN KHI ĐÃ CÓ STREAM) */}
              {hasStream && (
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20">
                  <button
                    onClick={toggleMic}
                    className={`px-3 py-2 sm:py-2.5 rounded-full transition shadow-lg backdrop-blur-md cursor-pointer flex items-center gap-2 ${
                      isMicOn ? 'bg-black/75 text-white hover:bg-black/90 border border-white/20' : 'bg-rose-600 text-white border border-rose-400'
                    }`}
                    title={isMicOn ? `Micro đang bật (Âm lượng: ${micVolume}%)` : "Bật Micro"}
                  >
                    {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-white" />}
                    {isMicOn && (
                      <div className="flex items-center gap-0.5 h-3" title={`Âm lượng mic: ${micVolume}%`}>
                        <span className={`w-1 rounded-full transition-all duration-75 ${micVolume > 5 ? 'h-3 bg-emerald-400' : 'h-1 bg-white/30'}`} />
                        <span className={`w-1 rounded-full transition-all duration-75 ${micVolume > 25 ? 'h-3 bg-emerald-400' : 'h-1 bg-white/30'}`} />
                        <span className={`w-1 rounded-full transition-all duration-75 ${micVolume > 50 ? 'h-3 bg-amber-400' : 'h-1 bg-white/30'}`} />
                        <span className={`w-1 rounded-full transition-all duration-75 ${micVolume > 75 ? 'h-3 bg-rose-500' : 'h-1 bg-white/30'}`} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`p-2.5 sm:p-3 rounded-full transition shadow-lg backdrop-blur-md cursor-pointer ${
                      isCameraOn ? 'bg-black/60 text-white hover:bg-black/80 border border-white/20' : 'bg-rose-600 text-white border border-rose-400'
                    }`}
                    title={isCameraOn ? "Tắt Camera" : "Bật Camera"}
                  >
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  {sourceType === 'camera' && (
                    <button
                      onClick={toggleFacingMode}
                      className="p-2.5 sm:p-3 rounded-full bg-amber-500/80 hover:bg-amber-500 text-slate-950 font-bold transition shadow-lg backdrop-blur-md cursor-pointer border border-amber-300"
                      title="Xoay Camera trước / sau"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* NÚT BẮT ĐẦU / DỪNG PHÁT SÓNG NGAY DƯỚI CAMERA TRÊN ĐIỆN THOẠI (KHÔNG CẦN CUỘN XUỐNG DƯỚI) */}
            <div className="lg:hidden">
              {!isLive ? (
                <button
                  onClick={startLivestream}
                  disabled={isPublishing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] transition-all text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isPublishing ? "ĐANG KẾT NỐI MÁY CHỦ..." : "BẮT ĐẦU PHÁT SÓNG NGAY"}</span>
                </button>
              ) : (
                <button
                  onClick={stopLivestream}
                  className="w-full py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 active:scale-[0.98] transition-all text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-rose-400/50"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>DỪNG PHÁT SÓNG (ĐANG LIVE)</span>
                </button>
              )}
            </div>

            {/* CHỌN NGUỒN THU (WEBCAM / MÀN HÌNH - Ẩn Chia sẻ màn hình trên điện thoại) */}
            <div className="hidden sm:grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSwitchSource('camera')}
                disabled={isLive}
                className={`py-1.5 sm:py-2 px-3 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  sourceType === 'camera'
                    ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                    : 'bg-[#161720] border-white/5 text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Điện Thoại / Webcam</span>
              </button>

              <button
                onClick={() => handleSwitchSource('screen')}
                disabled={isLive}
                className={`py-1.5 sm:py-2 px-3 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  sourceType === 'screen'
                    ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                    : 'bg-[#161720] border-white/5 text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Chia sẻ màn hình</span>
              </button>
            </div>

          </div>

          {/* CỘT PHẢI: KHUNG ĐỌC BÌNH LUẬN TRỰC TIẾP & BẢNG ĐIỀU KHIỂN */}
          <div className={`${isCamMaximized ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col justify-between bg-[#161720] border border-white/10 rounded-2xl p-3 sm:p-4 min-h-[300px] sm:min-h-[360px] shadow-xl transition-all duration-300`}>
            
            {/* THANH CHUYỂN TAB: BÌNH LUẬN TRỰC TIẾP <-> CẤU HÌNH PHÒNG */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 mb-2 sm:mb-3">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isChatConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Bình luận ({studioMessages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'config'
                    ? 'bg-white/15 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cấu hình kênh</span>
              </button>
            </div>

            {/* TAB 1: KHUNG ĐỌC BÌNH LUẬN TRỰC TIẾP CHO STREAMER */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between min-h-[220px]">
                
                {/* Trạng thái phòng chat trực tiếp */}
                <div className="flex items-center justify-between px-2.5 py-1 mb-2 bg-black/40 rounded-lg border border-white/5 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isChatConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span>Kênh: <strong className="text-gray-200 font-mono">{selectedKey}</strong></span>
                  </div>
                  {!isChatConnected ? (
                    <button
                      type="button"
                      onClick={() => connectChat()}
                      className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Kết nối lại</span>
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-medium text-[10px]">● Trực tuyến</span>
                  )}
                </div>

                {/* Danh sách bình luận cuộn mượt mà */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px] sm:max-h-[280px]">
                  {studioMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
                      <MessageSquare className="w-8 h-8 stroke-1 text-gray-600 mb-2" />
                      <p className="font-semibold text-gray-400">Chưa có bình luận nào</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 max-w-[260px]">
                        {isChatConnected 
                          ? `Đã kết nối phòng "${selectedKey}". Bình luận từ khán giả sẽ hiện ngay tại đây!` 
                          : `Đang kết nối vào phòng trò chuyện kênh "${selectedKey}"...`}
                      </p>
                      {!isChatConnected && (
                        <button
                          type="button"
                          onClick={() => connectChat()}
                          className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Thử kết nối lại ngay</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    studioMessages.map((msg, idx) => {
                      const sender = msg.username || msg.sender || 'Khách';
                      const content = msg.message || msg.text || '';
                      const isStreamer = msg.role === 'admin' || msg.role === 'streamer' || sender.toLowerCase().includes('chủ');
                      const isSysAdmin = msg.role === 'systemadmin';
                      return (
                        <div key={msg.id || idx} className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs shadow-sm">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <div className="flex items-center gap-1.5">
                              {isSysAdmin ? (
                                <span className="bg-purple-600/30 text-purple-300 font-bold px-1.5 py-0.5 rounded text-[9px] border border-purple-500/30">SYS</span>
                              ) : isStreamer ? (
                                <span className="bg-amber-500/30 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[9px] border border-amber-500/30">CHỦ TRẠI</span>
                              ) : (
                                <span className="bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded text-[9px] border border-rose-500/30">KHÁCH</span>
                              )}
                              <span className={`font-bold truncate max-w-[140px] ${
                                isSysAdmin ? 'text-purple-400' : isStreamer ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {sender}
                              </span>
                            </div>
                            <span className="text-gray-500 text-[10px]">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-gray-100 font-medium break-words leading-relaxed pl-1">
                            {content}
                          </p>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatScrollRef} />
                </div>

                {/* Form gõ phản hồi nhanh cho khán giả */}
                <form 
                  onSubmit={handleSendStudioChat} 
                  className="flex items-center gap-1.5 pt-2 border-t border-white/10 mt-2 relative z-20"
                >
                  <input
                    type="text"
                    value={studioChatInput}
                    onChange={(e) => setStudioChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendStudioChat(e);
                      }
                    }}
                    placeholder={isChatConnected ? "Gõ trả lời khán giả..." : "Đang kết nối lại phòng chat..."}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={!studioChatInput.trim()}
                    onClick={handleSendStudioChat}
                    onTouchEnd={(e) => {
                      if (studioChatInput.trim()) {
                        e.preventDefault();
                        handleSendStudioChat(e);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white disabled:opacity-40 transition cursor-pointer shrink-0"
                    title="Gửi phản hồi"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>
            )}

            {/* TAB 2: CẤU HÌNH PHÒNG & THÔNG SỐ */}
            {activeTab === 'config' && (
              <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[320px] pr-1 text-xs">
                {/* 1. CHỌN KÊNH PHÁT */}
                <div>
                  <label className="text-gray-400 mb-1.5 block font-semibold text-[11px] flex items-center justify-between">
                    <span>Kênh phát sóng:</span>
                    {isLive && <span className="text-emerald-400 text-[10px] font-mono">● Đang phát</span>}
                  </label>
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    disabled={isLive}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 disabled:opacity-50"
                  >
                    {streamKeys.map((k, idx) => (
                      <option key={k.key} value={k.key}>
                        {k.title || k.streamer || `Kênh phát sóng #${idx + 1}`}
                      </option>
                    ))}
                    {streamKeys.length === 0 && (
                      <option value="thanhtrung01">Kênh phát chính (Thành Trung 01)</option>
                    )}
                  </select>
                </div>

                {/* 2. HƯỚNG QUAY / KHUNG HÌNH (DỌC / NGANG / VUÔNG) */}
                <div>
                  <label className="text-gray-400 mb-1.5 block font-semibold text-[11px] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                    <span>Khung hình / Hướng quay:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOrientationChange('landscape')}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer flex flex-col items-center gap-1 ${
                        orientation === 'landscape'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>Ngang (16:9)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrientationChange('portrait')}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer flex flex-col items-center gap-1 ${
                        orientation === 'portrait'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Dọc (9:16)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrientationChange('square')}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer flex flex-col items-center gap-1 ${
                        orientation === 'square'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Square className="w-4 h-4" />
                      <span>Vuông (1:1)</span>
                    </button>
                  </div>
                </div>

                {/* 3. ĐỘ PHÂN GIẢI (RESOLUTION) */}
                <div>
                  <label className="text-gray-400 mb-1.5 block font-semibold text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Độ phân giải video:</span>
                    </span>
                    <span className="text-[10px] text-cyan-300/80 font-mono">Tối đa 30 FPS</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: '1080p', label: '1080p', desc: 'Full HD' },
                      { key: '720p', label: '720p', desc: 'Chuẩn HD' },
                      { key: '480p', label: '480p', desc: 'SD' },
                      { key: '360p', label: '360p', desc: 'Tiết kiệm' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleResolutionChange(item.key)}
                        className={`py-1.5 px-1.5 rounded-xl text-center font-bold transition border cursor-pointer flex flex-col items-center ${
                          resolution === item.key
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-950/40'
                            : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-mono">{item.label}</span>
                        <span className="text-[9px] opacity-70 font-normal">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. CHỈNH ĐỘ DELAY / ĐỘ TRỄ PHÁT SÓNG (HLS BUFFER) */}
                <div>
                  <label className="text-gray-400 mb-1.5 block font-semibold text-[11px] flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>Độ trễ phát sóng (Delay người xem):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelayChange('low')}
                      className={`py-2 px-1.5 rounded-xl text-center transition border cursor-pointer flex flex-col items-center gap-0.5 ${
                        streamDelayMode === 'low'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Siêu nhanh</span>
                      </div>
                      <span className="text-[9px] opacity-75 font-mono">Ít buffer hơn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelayChange('normal')}
                      className={`py-2 px-1.5 rounded-xl text-center transition border cursor-pointer flex flex-col items-center gap-0.5 ${
                        streamDelayMode === 'normal'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Cân bằng</span>
                      </div>
                      <span className="text-[9px] opacity-75 font-mono">Cân bằng buffer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelayChange('safe')}
                      className={`py-2 px-1.5 rounded-xl text-center transition border cursor-pointer flex flex-col items-center gap-0.5 ${
                        streamDelayMode === 'safe'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-950/40'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-[11px]">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span>Ổn định cao</span>
                      </div>
                      <span className="text-[9px] opacity-75 font-mono">Nhiều buffer hơn</span>
                    </button>
                  </div>
                </div>

                {/* 5. THÔNG SỐ TÓM TẮT REALTIME */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 font-mono text-[11px] text-gray-400">
                  <div className="flex justify-between">
                    <span>Giao thức phát:</span>
                    <span className="text-cyan-400 font-bold">HLS • buffer tùy chế độ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Khung hình / Cam:</span>
                    <span className="text-amber-300 font-bold">
                      {orientation === 'portrait' ? 'Màn Dọc 9:16' : orientation === 'square' ? 'Màn Vuông 1:1' : 'Màn Ngang 16:9'} • {facingMode === 'user' ? 'Cam Trước' : 'Cam Sau'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chất lượng video:</span>
                    <span className="text-gray-200">
                      {actualVideoSettings
                        ? `${actualVideoSettings.width}×${actualVideoSettings.height}${actualVideoSettings.frameRate ? ` @ ${Math.round(actualVideoSettings.frameRate)} FPS` : ''}`
                        : `${resolution.toUpperCase()} yêu cầu • tối đa 30 FPS`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ trễ khán giả:</span>
                    <span className="text-emerald-400 font-bold">
                      {streamDelayMode === 'low' ? 'Ít buffer hơn' : streamDelayMode === 'safe' ? 'Nhiều buffer hơn' : 'Cân bằng buffer'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* NÚT BẮT ĐẦU / DỪNG PHÁT SÓNG TO & RÕ RÀNG (TRÊN MÁY TÍNH) */}
            <div className="hidden lg:block pt-3 border-t border-white/10 mt-3">
              {!isLive ? (
                <button
                  onClick={startLivestream}
                  disabled={isPublishing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] transition-all text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isPublishing ? "ĐANG KẾT NỐI MÁY CHỦ..." : "BẮT ĐẦU PHÁT SÓNG"}</span>
                </button>
              ) : (
                <button
                  onClick={stopLivestream}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-rose-600 active:scale-[0.98] transition-all text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-rose-500/40 group"
                >
                  <Square className="w-4 h-4 fill-rose-500 group-hover:fill-white transition-colors" />
                  <span>DỪNG PHÁT SÓNG (ĐANG LIVE)</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
