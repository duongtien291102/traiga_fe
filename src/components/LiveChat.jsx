import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Smile, 
  Crown, 
  ShieldCheck, 
  Heart, 
  Flame, 
  Sparkles, 
  ArrowDown, 
  User as UserIcon, 
  Settings,
  LogIn
} from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '🎉', '💯', '😂', '⭐', '🚀'];

export default function LiveChat({ streamKey = 'tiendev', user = null, onOpenAuth = null }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('chat_guest_name') || `Khách_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [isEditingGuestName, setIsEditingGuestName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState(guestName);
  const [isConnected, setIsConnected] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const wsRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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

  // Khởi tạo kết nối WebSocket đến Backend
  useEffect(() => {
    if (!streamKey) return;

    // Reset danh sách tin nhắn khi đổi stream key
    setMessages([]);
    setIsConnected(false);

    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat?streamKey=${encodeURIComponent(streamKey)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (token) {
        ws.send(JSON.stringify({ type: 'auth_token', token }));
      } else {
        ws.send(JSON.stringify({ type: 'auth_guest', guest_name: guestName }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const rawLines = event.data.split('\n');
        for (const line of rawLines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);

          switch (data.type) {
            case 'history':
              if (Array.isArray(data.history)) {
                setMessages(data.history);
                setTimeout(() => scrollToBottom(false), 100);
              }
              break;

            case 'chat':
              if (data.data && (!data.data.stream_key || data.data.stream_key === streamKey)) {
                setMessages((prev) => [...prev, data.data]);
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

            default:
              break;
          }
        }
      } catch (err) {
        console.error('Lỗi phân tích cú pháp WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS CHAT] Lỗi kết nối WebSocket:', err);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log(`[WS CHAT] Ngắt kết nối phòng chat: ${streamKey}`);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [streamKey, user, guestName]);

  // Gửi tin nhắn
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'chat',
      message: text,
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputValue('');
  };

  // Thả biểu cảm nhanh
  const handleSendReaction = (emoji) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'reaction',
      emoji: emoji,
    };

    wsRef.current.send(JSON.stringify(payload));
    spawnFloatingReaction(emoji, user ? user.username : guestName);
  };

  // Lưu tên khách mới
  const handleSaveGuestName = () => {
    const trimmed = tempGuestName.trim();
    if (trimmed && trimmed.length <= 25) {
      setGuestName(trimmed);
      localStorage.setItem('chat_guest_name', trimmed);
      setIsEditingGuestName(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* HEADER PHÒNG CHAT */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Trò chuyện trực tiếp
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400 font-mono">#{streamKey}</p>
          </div>
        </div>

        {/* Số người đang xem */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 text-xs font-semibold text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{viewerCount}</span>
          </div>

          {!user && (
            <button
              onClick={() => {
                setTempGuestName(guestName);
                setIsEditingGuestName(!isEditingGuestName);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đổi tên hiển thị"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* POPUP ĐỔI TÊN KHÁCH */}
      {isEditingGuestName && !user && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={tempGuestName}
            onChange={(e) => setTempGuestName(e.target.value)}
            maxLength={20}
            placeholder="Nhập tên hiển thị..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSaveGuestName}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
          >
            Lưu
          </button>
          <button
            onClick={() => setIsEditingGuestName(false)}
            className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* DANH SÁCH TIN NHẮN */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 py-8">
            <Sparkles className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-xs">Chưa có tin nhắn nào trong phòng live này.</p>
            <p className="text-[11px] text-slate-600">Hãy là người đầu tiên gửi lời chào tới Streamer!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystemAdmin = msg.role === 'systemadmin';
            const isAdmin = msg.role === 'admin';
            const isStreamer = msg.username === streamKey || msg.role === 'streamer';
            const isCurrentUser = user ? msg.username === user.username : msg.username === guestName;

            return (
              <div 
                key={msg.id || index} 
                className={`flex flex-col gap-1 text-xs group transition-all duration-150 ${
                  isSystemAdmin
                    ? 'bg-purple-500/5 -mx-2 px-2 py-1.5 rounded-lg border border-purple-500/10'
                    : isAdmin 
                    ? 'bg-amber-500/5 -mx-2 px-2 py-1.5 rounded-lg border border-amber-500/10' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* HUY HIỆU ROLE */}
                  {isSystemAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      SYSADMIN
                    </span>
                  )}

                  {!isSystemAdmin && isAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                      <Crown className="w-3 h-3 text-amber-400" />
                      ADMIN
                    </span>
                  )}

                  {isStreamer && !isSystemAdmin && !isAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      STREAMER
                    </span>
                  )}

                  {!isSystemAdmin && !isAdmin && !isStreamer && msg.role === 'user' && (
                    <span className="inline-flex items-center gap-1 px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-medium text-[9px]">
                      VIP
                    </span>
                  )}

                  {/* USERNAME */}
                  <span className={`font-semibold ${
                    isSystemAdmin
                      ? 'text-purple-400'
                      : isAdmin 
                      ? 'text-amber-400' 
                      : isStreamer 
                      ? 'text-purple-400' 
                      : isCurrentUser 
                      ? 'text-rose-400' 
                      : 'text-slate-300'
                  }`}>
                    {msg.username}
                  </span>

                  {/* THỜI GIAN */}
                  <span className="text-[10px] text-slate-500 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* NỘI DUNG TIN NHẮN */}
                <div className="text-slate-200 leading-relaxed break-words pl-0.5">
                  {msg.message}
                </div>
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
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-900/50 hover:bg-rose-500 transition-all animate-bounce"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Tin nhắn mới nhất
        </button>
      )}

      {/* HIỆU ỨNG THẢ TIM / ICON BAY LÊN */}
      <div className="absolute right-6 bottom-24 pointer-events-none z-30 flex flex-col items-center">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            style={{ transform: `translateX(${item.xOffset}px)` }}
            className="text-2xl animate-float-up select-none filter drop-shadow-md"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* THANH THẢ CẢM XÚC NHANH */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto scrollbar-none gap-1">
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-1">Thả tim:</span>
        <div className="flex items-center gap-1.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              disabled={!isConnected}
              className="text-base hover:scale-125 active:scale-95 transition-transform p-1 rounded-md hover:bg-slate-800/80 disabled:opacity-40"
              title={`Thả ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* KHUNG NHẬP TIN NHẮN */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
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
                : user 
                ? `Chat với tên ${user.username}...` 
                : `Chat với tên ${guestName}...`
            }
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 transition pr-8 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || !isConnected}
          className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white transition shadow-lg shadow-rose-900/30 flex items-center justify-center shrink-0"
          title="Gửi tin nhắn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* GỢI Ý ĐĂNG NHẬP NẾU LÀ KHÁCH */}
      {!user && onOpenAuth && (
        <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Đang chat với vai trò Khách</span>
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <LogIn className="w-3 h-3" />
            Đăng nhập để nhận huy hiệu
          </button>
        </div>
      )}
    </div>
  );
}
