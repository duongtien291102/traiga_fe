import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Sparkles, 
  ArrowDown, 
  LogIn
} from 'lucide-react';

import { getWsUrl } from '../config';
import { mergeChatMessages } from '../chatUtils';

const QUICK_EMOJIS = ['❤️', '🔥', '🐓', '👏', '🎉', '💯', '⭐', '😂'];

export default function LiveChat({ streamKey = '', user = null, onOpenAuth = null }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [guestName] = useState(() => {
    return localStorage.getItem('chat_guest_name') || `Khách_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const wsRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPageHiddenRef = useRef(false);
  const tokenFailedRef = useRef(false);

  // Tự động cuộn xuống cuối khi có tin nhắn mới (chỉ cuộn khung chat, tuyệt đối không cuộn cả trang web)
  const scrollToBottom = useCallback((smooth = true) => {
    if (!isScrolledUp && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, [isScrolledUp]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // Kiểm tra vị trí cuộn chuột của người dùng
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsScrolledUp(!atBottom);
  };

  // Thêm hiệu ứng reaction nổi lên
  const spawnFloatingReaction = (emoji, sender) => {
    const id = Date.now() + Math.random();
    const xOffset = Math.floor(Math.random() * 60) - 30; // -30px đến +30px
    setFloatingReactions((prev) => [...prev, { id, emoji, sender, xOffset }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  // Khởi tạo kết nối WebSocket đến Backend với Auto-Reconnect và hỗ trợ bfcache (Back-Forward Cache)
  useEffect(() => {
    if (!streamKey) return;

    isMountedRef.current = true;
    isPageHiddenRef.current = false;

    // Reset danh sách tin nhắn khi đổi stream key
    setMessages([]);
    setIsConnected(false);

    const wsUrl = getWsUrl(streamKey);

    const connect = () => {
      if (!isMountedRef.current || isPageHiddenRef.current) return;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          const activeToken = !tokenFailedRef.current ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : '';
          if (activeToken) {
            ws.send(JSON.stringify({ type: 'auth_token', token: activeToken }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_guest', guest_name: guestName }));
          }
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const rawLines = event.data.split('\n');
            for (const line of rawLines) {
              if (!line.trim()) continue;
              const data = JSON.parse(line);

              switch (data.type) {
                case 'auth_login_result':
                  setIsConnected(Boolean(data.success));
                  break;

                case 'history':
                  if (Array.isArray(data.history)) {
                    setMessages((prev) => mergeChatMessages(prev, data.history));
                    setTimeout(() => scrollToBottom(false), 100);
                  }
                  break;

                case 'reset_chat':
                case 'clear_chat':
                  setMessages([]);
                  break;

                case 'chat':
                  if (data.data && (!data.data.stream_key || data.data.stream_key === streamKey)) {
                    setMessages((prev) => mergeChatMessages(prev, [data.data]));
                  }
                  break;

                case 'viewer_count':
                  if (typeof data.viewer_count === 'number') {
                    setViewerCount(data.viewer_count);
                  }
                  break;

                case 'reaction':
                  if (data.emoji) {
                    spawnFloatingReaction(data.emoji, data.sender);
                  }
                  break;

                case 'error':
                  if (data.error && (data.error.includes('Token') || data.error.includes('hết hạn') || data.error.includes('thu hồi') || data.error.includes('xác thực'))) {
                    console.warn('[LiveChat] Token auth rejected, falling back to guest mode:', data.error);
                    tokenFailedRef.current = true;
                    localStorage.removeItem('auth_token');
                    try {
                      ws.send(JSON.stringify({ type: 'auth_guest', guest_name: guestName }));
                    } catch {}
                  }
                  break;

                default:
                  break;
              }
            }
          } catch {
            // Không spam console
          }
        };

        ws.onerror = () => {
          // Xử lý êm đẹp lỗi kết nối (tránh báo đỏ khi chuyển trang / rớt mạng)
          setIsConnected(false);
        };

        ws.onclose = (event) => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          // Tự động kết nối lại sau 3s nếu không phải đóng có chủ đích
          if (!isPageHiddenRef.current && event?.code !== 1000) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = setTimeout(connect, 3000);
          }
        };
      } catch {
        if (isMountedRef.current && !isPageHiddenRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      }
    };

    // Khởi tạo kết nối
    connect();

    // Xử lý khi trang vào Back-Forward Cache (bfcache) và khi quay lại
    const handlePageHide = () => {
      isPageHiddenRef.current = true;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Page hidden');
        } catch {}
      }
    };

    const handlePageShow = (event) => {
      isPageHiddenRef.current = false;
      if (event.persisted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isPageHiddenRef.current = false;
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
          connect();
        }
      } else {
        isPageHiddenRef.current = true;
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounted');
        } catch {}
        wsRef.current = null;
      }
    };
  }, [streamKey, user, guestName, scrollToBottom]);

  // Khôi phục bình luận đã lưu nếu WebSocket bị ngắt hoặc các client nối tới replica khác.
  useEffect(() => {
    if (!streamKey) return undefined;
    let cancelled = false;
    const syncHistory = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
        const response = await fetch(`${getApiBaseUrl()}/api/chat/history?streamKey=${encodeURIComponent(streamKey)}`, {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) return;
        const history = await response.json();
        if (!cancelled && Array.isArray(history)) {
          setMessages((prev) => mergeChatMessages(prev, history));
        }
      } catch {
        // WebSocket remains the primary realtime path; polling is a recovery fallback.
      }
    };

    syncHistory();
    const timer = setInterval(syncHistory, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [streamKey]);

  // Gửi tin nhắn (Bắt buộc phải đăng nhập tài khoản)
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const text = inputValue.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'chat',
      message: text,
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputValue('');
  };

  // Thả biểu cảm nhanh (Bắt buộc phải đăng nhập tài khoản)
  const handleSendReaction = (emoji) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'reaction',
      emoji: emoji,
    };

    wsRef.current.send(JSON.stringify(payload));
    spawnFloatingReaction(emoji, user.username);
  };

  // Hiển thị vai trò thật của người gửi tin nhắn (BQT, Chủ Trại, Trại Chủ, Thành Viên, Khách)
  const getUserLevel = (msg) => {
    if (msg.role === 'systemadmin') return { label: 'BQT', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', isStaff: true };
    if (msg.role === 'admin' || msg.username === 'admin01') return { label: 'Chủ Trại', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', isStaff: true };
    if (msg.role === 'streamer' || msg.username === streamKey) return { label: 'Trại Chủ', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', isStaff: true };
    if (msg.role === 'user' || msg.userId) return { label: 'Thành Viên', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', isStaff: false };
    return { label: 'Khách', color: 'bg-white/10 text-zinc-300 border-white/10', isStaff: false };
  };

  return (
    <div className="relative flex flex-col h-full bg-[#121318]/90 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden">
      {/* HEADER PHÒNG CHAT APPLE TITAN */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white tracking-wide">
            Bình luận trực tiếp
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
            {viewerCount.toLocaleString('vi-VN')} người
          </span>
        </div>

        <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          ● Trực tuyến
        </span>
      </div>

      {/* DANH SÁCH TIN NHẮN: STREAM CHAT GỌN GÀNG - HIỂN THỊ ĐỦ 10-12 NGƯỜI NHẮN */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent text-xs"
      >
        {/* TIN NHẮN HỆ THỐNG GHIM TRÊN CÙNG */}
        <div className="py-1 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-zinc-300 text-[11px] leading-snug flex items-start gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-[#e6b744] text-black font-black text-[9px] uppercase tracking-wider shrink-0 mt-0.5">
            Hệ Thống
          </span>
          <p className="text-zinc-200">
            Chào mừng anh em ghé thăm <span className="text-[#e6b744] font-bold">Trại gà Thành Trung</span>! Bình luận văn minh, tôn trọng đam mê chung.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-zinc-500 gap-1.5 py-2">
            <Sparkles className="w-5 h-5 text-zinc-600 animate-pulse" />
            <p className="text-xs">Chưa có bình luận nào trong phiên live này.</p>
            <p className="text-[11px] text-zinc-600">Hãy gửi lời chào mở màn tới anh em xem live!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystemAdmin = msg.role === 'systemadmin';
            const isAdmin = msg.role === 'admin';
            const isStreamer = msg.username === streamKey || msg.role === 'streamer';
            const isCurrentUser = user ? msg.username === user.username : msg.username === guestName;
            const badge = getUserLevel(msg);

            const displayName = msg.username === 'sysadmin'
              ? 'Ban Quản Trị'
              : msg.username === 'admin01'
              ? 'Chủ Trại Thành Trung'
              : msg.username;

            return (
              <div 
                key={msg.id || index} 
                className={`py-1 px-2 rounded-xl transition-all leading-snug hover:bg-white/[0.04] flex items-start gap-1.5 ${
                  isSystemAdmin
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : isAdmin 
                    ? 'bg-amber-500/10 border border-amber-500/20' 
                    : 'border border-transparent'
                }`}
              >
                {/* Badge vai trò */}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${
                  isSystemAdmin 
                    ? 'bg-purple-500 text-white font-black' 
                    : isAdmin 
                    ? 'bg-[#e6b744] text-black font-black' 
                    : isStreamer 
                    ? 'bg-[#ff3b30] text-white font-black' 
                    : 'bg-white/10 text-zinc-300'
                }`}>
                  {isSystemAdmin ? 'BQT' : isAdmin ? 'CHỦ TRẠI' : isStreamer ? 'TRẠI CHỦ' : badge.label}
                </span>

                <div className="min-w-0 flex-1">
                  {/* Tên người gửi */}
                  <span className={`font-bold text-[11px] mr-1 ${
                    isSystemAdmin
                      ? 'text-purple-300'
                      : isAdmin 
                      ? 'text-[#e6b744]' 
                      : isStreamer 
                      ? 'text-[#ff3b30]' 
                      : isCurrentUser 
                      ? 'text-cyan-300' 
                      : 'text-zinc-300'
                  }`}>
                    {displayName}:
                  </span>

                  {/* Nội dung tin nhắn */}
                  <span className="text-zinc-100 text-xs font-normal break-words">
                    {msg.message}
                  </span>
                </div>

                {/* Giờ gửi */}
                {msg.created_at && (
                  <span className="text-[9px] text-zinc-500 font-mono shrink-0 ml-1">
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            );
          })
        )}

        <div ref={chatEndRef} />
      </div>

      {/* NÚT CUỘN XUỐNG KHI ĐANG ĐỌC TIN NHẮN CŨ */}
      {isScrolledUp && (
        <button
          onClick={() => {
            setIsScrolledUp(false);
            scrollToBottom(true);
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3b30] text-white text-[11px] font-semibold shadow-lg shadow-[#ff3b30]/40 hover:bg-[#e0342a] transition-all animate-bounce"
        >
          <ArrowDown className="w-3 h-3" />
          Tin nhắn mới nhất
        </button>
      )}

      {/* HIỆU ỨNG THẢ TIM / ICON BAY LÊN */}
      <div className="absolute right-4 bottom-20 pointer-events-none z-30 flex flex-col items-center">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            style={{ transform: `translateX(${item.xOffset}px)` }}
            className="text-xl animate-float-up select-none filter drop-shadow-md"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* THANH THẢ CẢM XÚC NHANH KIỂU STREAM THỰC TẾ */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 border-t border-white/[0.08] overflow-x-auto scrollbar-none gap-1">
        <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap mr-1">Cảm xúc:</span>
        <div className="flex items-center gap-1.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              disabled={!isConnected}
              className="text-sm hover:scale-125 active:scale-95 transition-transform p-1 rounded-lg hover:bg-white/10 disabled:opacity-40"
              title={`Thả ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* KHUNG NHẬP TIN NHẮN APPLE TITAN */}
      {user ? (
        <form 
          onSubmit={handleSendMessage}
          className="p-3 bg-black/60 border-t border-white/[0.08] flex items-center gap-2"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-amber-400/40"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 ${
              user?.role === 'systemadmin' ? 'bg-purple-600' : user?.role === 'admin' ? 'bg-[#e6b744] text-black font-extrabold' : 'bg-[#ff3b30]'
            }`}>
              {user?.username?.substring(0, 1) || 'U'}
            </div>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!isConnected}
              maxLength={300}
              placeholder={
                !isConnected 
                  ? "Đang kết nối phòng chat..." 
                  : `Bình luận với tư cách ${user.role === 'admin' ? (user.full_name || 'Chủ Trại') : user.role === 'systemadmin' ? 'Ban Quản Trị' : (user.full_name || user.username)}...`
              }
              className="w-full bg-white/[0.05] border border-white/10 rounded-full px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition pr-8 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            className="w-8 h-8 rounded-full bg-[#ff3b30] hover:bg-[#e0342a] disabled:opacity-40 text-white transition shadow-md shadow-[#ff3b30]/30 flex items-center justify-center shrink-0 cursor-pointer"
            title="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="p-3 bg-black/60 border-t border-white/[0.08]">
          <div 
            onClick={() => onOpenAuth && onOpenAuth()}
            className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 cursor-pointer group transition"
          >
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200">
              Đăng nhập để tham gia bình luận...
            </span>
            <button
              type="button"
              className="px-3 py-1 rounded-full bg-[#ff3b30] hover:bg-[#e0342a] text-white font-bold text-xs flex items-center gap-1 transition shadow-md shadow-[#ff3b30]/30 shrink-0"
            >
              <LogIn className="w-3 h-3" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
