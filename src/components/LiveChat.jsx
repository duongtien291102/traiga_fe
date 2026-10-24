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

import { getWsUrl } from '../config';

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
    const wsUrl = getWsUrl(streamKey);

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

            case 'reset_chat':
            case 'clear_chat':
              setMessages([]);
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
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [streamKey, user, guestName]);

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

  // Lưu tên khách mới
  const handleSaveGuestName = () => {
    const trimmed = tempGuestName.trim();
    if (trimmed && trimmed.length <= 25) {
      setGuestName(trimmed);
      localStorage.setItem('chat_guest_name', trimmed);
      setIsEditingGuestName(false);
    }
  };

  // Hàm tính toán Level hiển thị theo user hoặc tên
  const getUserLevel = (msg) => {
    if (msg.role === 'systemadmin') return { label: 'BQT', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', isStaff: true };
    if (msg.role === 'admin' || msg.username === 'admin01') return { label: 'Chủ Trại', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', isStaff: true };
    if (msg.role === 'streamer' || msg.username === streamKey) return { label: 'Trại Chủ', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', isStaff: true };
    
    // Hash username ra level từ 1 đến 12 để tạo không khí sôi nổi như CakhiaTV
    let hash = 0;
    const str = msg.username || 'user';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lv = Math.abs(hash % 12) + 1;
    if (lv >= 8) {
      return { label: `Lv.${lv}`, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', isStaff: false };
    } else if (lv >= 4) {
      return { label: `Lv.${lv}`, color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', isStaff: false };
    }
    return { label: `Lv.${lv}`, color: 'bg-slate-800 text-slate-400 border-slate-700/60', isStaff: false };
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* HEADER PHÒNG CHAT KIỂU CAKHIATV */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Bình luận trực tiếp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
          </div>
        </div>

        {/* Số người đang xem */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-[11px] font-semibold text-slate-300">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>{viewerCount.toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* DANH SÁCH TIN NHẮN */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent text-xs"
      >
        {/* TIN NHẮN HỆ THỐNG GHIM TRÊN CÙNG (CakhiaTV System Notice) */}
        <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5">
          <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black text-[9px] uppercase tracking-wider shrink-0 mt-0.5">
            Hệ Thống
          </span>
          <p className="text-slate-300">
            Chào mừng anh em ghé thăm <span className="text-amber-400 font-bold">Trại gà Thành Trung Long Biên</span>! Bình luận văn minh, tôn trọng đam mê chung.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2 py-6">
            <Sparkles className="w-6 h-6 text-slate-600 animate-pulse" />
            <p className="text-xs">Chưa có bình luận nào trong phiên xổ này.</p>
            <p className="text-[11px] text-slate-600">Hãy gửi lời chào mở màn tới anh em xem live!</p>
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
                className={`py-1 px-1.5 rounded-md transition-colors leading-relaxed hover:bg-slate-800/40 ${
                  isSystemAdmin
                    ? 'bg-purple-500/10 border-l-2 border-purple-500'
                    : isAdmin 
                    ? 'bg-amber-500/10 border-l-2 border-amber-500' 
                    : ''
                }`}
              >
                {/* HUY HIỆU LEVEL CÁ KHỊA TV + TÊN + DẤU CHECK + NỘI DUNG INLINE */}
                <span className="inline-flex items-center gap-1 mr-1.5 align-baseline">
                  {/* Badge Level kiểu Cakhia */}
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${badge.color}`}>
                    {badge.isStaff ? (
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                    ) : null}
                    {badge.label}
                  </span>

                  {/* Tên người dùng */}
                  <span className={`font-bold text-[11px] hover:underline cursor-pointer ${
                    isSystemAdmin
                      ? 'text-purple-400'
                      : isAdmin 
                      ? 'text-amber-400' 
                      : isStreamer 
                      ? 'text-rose-400' 
                      : isCurrentUser 
                      ? 'text-cyan-400' 
                      : 'text-slate-300'
                  }`}>
                    {displayName}
                  </span>

                  {/* Tick xanh verified nếu là Admin hoặc Staff */}
                  {(isAdmin || isSystemAdmin || isStreamer) && (
                    <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-black" title="Đã xác minh chính chủ">
                      ✓
                    </span>
                  )}

                  <span className="text-slate-500 font-bold">:</span>
                </span>

                {/* Nội dung tin nhắn */}
                <span className="text-slate-200 text-xs break-words font-normal">
                  {msg.message}
                </span>

                {/* Giờ gửi */}
                {msg.created_at && (
                  <span className="text-[9px] text-slate-600 font-mono ml-1.5 opacity-60">
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
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold shadow-lg shadow-rose-900/50 hover:bg-rose-500 transition-all animate-bounce"
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
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto scrollbar-none gap-1">
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-1">Cảm xúc:</span>
        <div className="flex items-center gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              disabled={!isConnected}
              className="text-sm hover:scale-125 active:scale-95 transition-transform p-0.5 rounded hover:bg-slate-800/80 disabled:opacity-40"
              title={`Thả ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* KHUNG NHẬP TIN NHẮN KIỂU CAKHIATV */}
      {user ? (
        <form 
          onSubmit={handleSendMessage}
          className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
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
                  : `Bình luận với tư cách ${user.role === 'admin' ? (user.full_name || 'Chủ Trại') : user.role === 'systemadmin' ? 'Ban Quản Trị' : (user.full_name || user.username)}...`
              }
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 transition pr-8 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white transition shadow-lg shadow-rose-900/30 flex items-center justify-center shrink-0 cursor-pointer"
            title="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="p-2.5 bg-slate-950 border-t border-slate-800">
          <div 
            onClick={() => onOpenAuth && onOpenAuth()}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer group transition"
          >
            <span className="text-xs text-slate-400 group-hover:text-slate-300">
              Đăng nhập để tham gia bình luận...
            </span>
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-md shadow-rose-900/30 shrink-0"
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
