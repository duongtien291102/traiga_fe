import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Plus, 
  Trash2, 
  Power, 
  RefreshCw, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Bot,
  Sparkles,
  MessageSquare,
  Play,
  Square,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { getApiBaseUrl } from '../config';

export default function AdminPanel({ isOpen, onClose, token, currentUser, currentStreamKey }) {
  const [panelTab, setPanelTab] = useState('keys'); // 'keys' | 'bots'
  const [keys, setKeys] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStreamer, setNewStreamer] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Quản lý Bot Tương Tác Phòng Live
  const [availableBots, setAvailableBots] = useState([]);
  const [selectedRoomKey, setSelectedRoomKey] = useState(currentStreamKey || 'thanhtrung01');
  const [selectedBotIds, setSelectedBotIds] = useState([]);
  const [isRoomBotsRunning, setIsRoomBotsRunning] = useState(false);
  const [roomBotsMsg, setRoomBotsMsg] = useState('');
  const [roomBotsErr, setRoomBotsErr] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Quản lý Video Xem Lại (Google Drive / DVR Replay)
  const [replayTitle, setReplayTitle] = useState('');
  const [replayUrl, setReplayUrl] = useState('');
  const [replayStreamKey, setReplayStreamKey] = useState('');
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayMsg, setReplayMsg] = useState('');

  const loadData = async () => {
    try {
      // 1. Tải danh sách Keys
      const resKeys = await fetch(`${getApiBaseUrl()}/api/keys`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const dataKeys = await resKeys.json();
      if (Array.isArray(dataKeys)) {
        setKeys(dataKeys);
        if (!selectedRoomKey && dataKeys.length > 0) {
          setSelectedRoomKey(dataKeys[0].key);
        }
      }

      // 2. Tải danh sách Sessions
      const resSessions = await fetch(`${getApiBaseUrl()}/api/sessions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const dataSessions = await resSessions.json();
      if (Array.isArray(dataSessions)) setSessions(dataSessions);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAvailableBots = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/bots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAvailableBots(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRoomBots = async (streamKey) => {
    if (!streamKey) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/room-bots?streamKey=${encodeURIComponent(streamKey)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const ids = (data.bot_ids || []).map((id) =>
          typeof id === 'object' && id.$oid ? id.$oid : String(id)
        );
        setSelectedBotIds(ids);
        setIsRoomBotsRunning(!!data.is_running);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadAvailableBots();
      const targetKey = selectedRoomKey || currentStreamKey || 'thanhtrung01';
      setSelectedRoomKey(targetKey);
      loadRoomBots(targetKey);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedRoomKey) {
      loadRoomBots(selectedRoomKey);
    }
  }, [selectedRoomKey]);

  // Chọn / bỏ chọn bot (tối đa 5 bot)
  const handleToggleBotSelection = (botId) => {
    setRoomBotsMsg('');
    setRoomBotsErr('');
    const idStr = String(botId);
    if (selectedBotIds.includes(idStr)) {
      setSelectedBotIds((prev) => prev.filter((id) => id !== idStr));
    } else {
      if (selectedBotIds.length >= 5) {
        setRoomBotsErr('⛔ Mỗi phòng livestream chỉ được phép chọn tối đa 5 bot tương tác!');
        return;
      }
      setSelectedBotIds((prev) => [...prev, idStr]);
    }
  };

  // Kích hoạt hoặc dừng bot vào phòng live
  const handleSaveAndToggleBots = async (newRunningState) => {
    setRoomBotsMsg('');
    setRoomBotsErr('');

    if (newRunningState && selectedBotIds.length === 0) {
      setRoomBotsErr('Vui lòng tick chọn ít nhất 1 bot (tối đa 5 con) trước khi bật');
      return;
    }

    if (selectedBotIds.length > 5) {
      setRoomBotsErr('⛔ Vượt quá số lượng cho phép! Mỗi phòng chỉ được chọn tối đa 5 bot.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/room-bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stream_key: selectedRoomKey,
          bot_ids: selectedBotIds,
          is_running: newRunningState
        })
      });

      if (res.ok) {
        setIsRoomBotsRunning(newRunningState);
        setRoomBotsMsg(
          newRunningState
            ? `🎉 Đã kích hoạt ${selectedBotIds.length} bot vào phòng thành công! Bot sẽ tự động chat và thả tim định kỳ.`
            : `⏹️ Đã dừng bot tương tác trong phòng!`
        );
        setTimeout(() => setRoomBotsMsg(''), 5000);
      } else {
        const d = await res.json();
        setRoomBotsErr(d.error || 'Lỗi cập nhật cấu hình bot phòng live');
      }
    } catch (e) {
      setRoomBotsErr('Lỗi kết nối máy chủ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleKey = async (key, currentStatus) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, is_active: !currentStatus })
      });
      if (res.ok) {
        setMsg(`Đã ${!currentStatus ? 'MỞ KHÓA' : 'KHÓA'} luồng '${key}' thành công!`);
        setTimeout(() => setMsg(''), 3000);
        loadData();
      }
    } catch (err) {
      alert('Lỗi cập nhật');
    }
  };

  const handleDeleteKey = async (key) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Stream Key '${key}' không?`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys?key=${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      alert('Lỗi xóa key');
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: newKey.trim(),
          title: newTitle || `Kênh ${newKey}`,
          streamer: newStreamer || currentUser?.full_name || 'Admin'
        })
      });

      if (res.ok) {
        setNewKey('');
        setNewTitle('');
        setNewStreamer('');
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi tạo key');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 shadow-amber-950/20">
        
        {/* Header Modal */}
        <div className="p-3.5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                  Bảng Quản Trị Streamer
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {currentUser?.full_name || 'Quản Trị Viên'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                Quản lý Stream Key phát sóng, Video Xem Lại và Bot Seeding phòng live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadData();
                loadAvailableBots();
                if (selectedRoomKey) loadRoomBots(selectedRoomKey);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Đóng bảng quản trị"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-4 sm:px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setPanelTab('keys')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              panelTab === 'keys'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Quản Lý Stream Keys & Phiên Live</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {keys.length}
            </span>
          </button>

          <button
            onClick={() => setPanelTab('bots')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              panelTab === 'bots'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>🤖 Bot Seeding Phòng Live (Tối Đa 5 Con)</span>
            {isRoomBotsRunning ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase animate-pulse">
                Đang chạy ({selectedBotIds.length}/5)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {selectedBotIds.length}/5 bot
              </span>
            )}
          </button>
        </div>

        {/* Thông báo thao tác chung */}
        {msg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* ==================== TAB CONTENT ==================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ==================== TAB 1: STREAM KEYS & SESSIONS ==================== */}
          {panelTab === 'keys' && (
            <div className="space-y-6">
              {/* Form thêm Stream Key mới */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-rose-500" /> Cấp Stream Key mới (Đặc quyền Admin)
                </h3>
                <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Stream Key (vd: vip_live)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Tiêu đề kênh (vd: Chung kết VIP)"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <input
                    type="text"
                    value={newStreamer}
                    onChange={(e) => setNewStreamer(e.target.value)}
                    placeholder="Tên streamer"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-md shadow-rose-900/40"
                  >
                    + Cấp Key
                  </button>
                </form>
              </div>

              {/* Bảng danh sách Keys */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" /> Danh sách Stream Keys ({keys.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-semibold">Stream Key</th>
                        <th className="pb-3 font-semibold">Tiêu đề & Streamer</th>
                        <th className="pb-3 font-semibold">Trạng thái phát</th>
                        <th className="pb-3 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {keys.map((k) => {
                        return (
                          <tr key={k.id || k.key} className="hover:bg-slate-800/30 transition">
                            <td className="py-3.5 font-bold text-white">
                              <div className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-rose-400">
                                <span aria-label="Stream Key đã được ẩn" title="Stream Key đã được ẩn">••••••••</span>
                              </div>
                            </td>
                            <td className="py-3.5 font-sans">
                              <div className="font-semibold text-slate-200">{k.title || 'Kênh Phát Sóng'}</div>
                              <div className="text-[11px] text-slate-500">{k.streamer || 'Chủ Trại'}</div>
                            </td>
                            <td className="py-3.5 font-sans">
                              {k.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Đang mở quyền
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Đã khoá (Bị chặn)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 text-right font-sans">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleKey(k.key, k.is_active)}
                                  className={`p-2 rounded-xl transition ${
                                    k.is_active 
                                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={k.is_active ? "Khoá luồng này" : "Mở khoá luồng này"}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteKey(k.key)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                                  title="Xóa key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng danh sách Phiên Livestream & Quản lý Video Xem Lại (Google Drive) */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Lịch sử Phiên Livestream &amp; Video Xem Lại ({sessions.length})
                  </h3>
                  <span className="text-[11px] text-amber-400 font-medium">
                    ☁️ Tự động ghi DVR &amp; đồng bộ Google Drive sau khi kết thúc live
                  </span>
                </div>

                {/* Form gắn thêm Video Xem Lại từ Google Drive */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!replayUrl.trim()) return;
                    setReplayLoading(true);
                    setReplayMsg('');
                    try {
                      const res = await fetch(`${getApiBaseUrl()}/api/sessions/replay`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                          stream_key: replayStreamKey || currentStreamKey || 'thanhtrung01',
                          title: replayTitle.trim(),
                          replay_url: replayUrl.trim()
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setReplayTitle('');
                        setReplayUrl('');
                        setReplayMsg('✅ Đã gắn video Google Drive vào danh sách Xem Lại!');
                        loadData();
                      } else {
                        setReplayMsg(`❌ ${data.error || 'Lỗi lưu video'}`);
                      }
                    } catch (err) {
                      setReplayMsg('❌ Không thể kết nối máy chủ');
                    } finally {
                      setReplayLoading(false);
                    }
                  }}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <input
                    type="text"
                    value={replayTitle}
                    onChange={(e) => setReplayTitle(e.target.value)}
                    placeholder="Tiêu đề video xem lại (VD: Xổ gà Ô Chân Trắng 2.9kg)"
                    className="sm:col-span-4 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={replayUrl}
                    onChange={(e) => setReplayUrl(e.target.value)}
                    placeholder="Dán link Google Drive (https://drive.google.com/file/d/...) hoặc File ID"
                    className="sm:col-span-5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={replayLoading || !replayUrl.trim()}
                    className="sm:col-span-3 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                  >
                    {replayLoading ? 'Đang lưu...' : '+ Thêm Video Google Drive'}
                  </button>
                  {replayMsg && (
                    <div className="sm:col-span-12 text-[11px] font-semibold text-amber-300">
                      {replayMsg}
                    </div>
                  )}
                </form>

                {sessions.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Chưa có phiên phát sóng nào được ghi nhận.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-3 font-semibold">Mã Phiên</th>
                          <th className="pb-3 font-semibold">Chủ Trại / Tiêu đề</th>
                          <th className="pb-3 font-semibold">Thời gian phát</th>
                          <th className="pb-3 font-semibold">Video Xem Lại</th>
                          <th className="pb-3 font-semibold text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {sessions.map((s) => {
                          const sId = String(s.id || s._id || 'unknown');
                          const maskedId = sId.length > 6 ? `••••${sId.slice(-4)}` : '••••';
                          return (
                            <tr key={sId} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 font-bold text-white">
                                <span className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-emerald-400">
                                  {maskedId}
                                </span>
                              </td>
                              <td className="py-3 text-slate-200 font-sans">
                                <div className="font-semibold">{s.streamer || 'Chủ Trại'}</div>
                                {s.title && <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{s.title}</div>}
                              </td>
                              <td className="py-3 text-slate-400 text-[11px] font-sans">
                                {s.started_at ? new Date(s.started_at).toLocaleString('vi-VN') : 'Mới đây'}
                              </td>
                              <td className="py-3 font-sans">
                                {s.replay_url ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={s.replay_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/25"
                                    >
                                      {s.record_status === 'uploaded_drive' ? '☁️ Google Drive' : '🎬 Phát lại'}
                                    </a>
                                    <button
                                      onClick={async () => {
                                        if (!window.confirm('Xóa video xem lại của phiên này?')) return;
                                        await fetch(`${getApiBaseUrl()}/api/sessions/replay?id=${encodeURIComponent(sId)}`, {
                                          method: 'DELETE',
                                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                        });
                                        loadData();
                                      }}
                                      className="text-rose-400 hover:text-rose-300 text-[11px] font-bold cursor-pointer"
                                      title="Xóa bản ghi phát lại"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      const link = window.prompt('Dán link Google Drive cho phiên live này:');
                                      if (!link || !link.trim()) return;
                                      await fetch(`${getApiBaseUrl()}/api/sessions/replay`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify({
                                          session_id: sId,
                                          replay_url: link.trim()
                                        })
                                      });
                                      loadData();
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 cursor-pointer"
                                  >
                                    + Gắn link Drive
                                  </button>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  {s.status === 'live' ? 'Đang phát' : s.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: BOT SEEDING VÀO PHÒNG LIVE ==================== */}
          {panelTab === 'bots' && (
            <div className="space-y-6">
              
              {/* STATUS & CONTROL PANEL */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-5 shadow-lg shadow-cyan-950/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* CỘT TRÁI: CHỌN PHÒNG STREAM KEY */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Chọn Phòng Livestream Của Bạn:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRoomKey}
                        onChange={(e) => setSelectedRoomKey(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-200 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        {keys.length > 0 ? (
                          keys.map((k, idx) => (
                            <option key={k.key} value={k.key}>
                              📺 {k.title || k.streamer || `Kênh phát #${idx + 1}`}
                            </option>
                          ))
                        ) : (
                          <option value={selectedRoomKey}>Kênh phát chính</option>
                        )}
                      </select>

                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                        <span className="text-slate-400">Số lượng:</span>
                        <span className={`font-mono font-black ${
                          selectedBotIds.length === 5 ? 'text-amber-400' : 'text-cyan-300'
                        }`}>
                          {selectedBotIds.length} / 5 Bot
                        </span>
                        {selectedBotIds.length === 5 && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                            Đạt Giới Hạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CỘT PHẢI: NÚT BẬT / DỪNG BOT MASTER */}
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    {isRoomBotsRunning ? (
                      <button
                        onClick={() => handleSaveAndToggleBots(false)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition shadow-lg shadow-rose-950/50 flex items-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-current text-white" />
                        <span>DỪNG BOT TRONG PHÒNG</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSaveAndToggleBots(true)}
                        disabled={actionLoading || selectedBotIds.length === 0}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-lg ${
                          selectedBotIds.length === 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/50 hover:scale-[1.02]'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>KÍCH HOẠT BOT VÀO PHÒNG LIVE</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* TRẠNG THÁI REAL-TIME */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      isRoomBotsRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`} />
                    <span className={isRoomBotsRunning ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                      {isRoomBotsRunning
                        ? `Đang có ${selectedBotIds.length} bot hoạt động tự động trong phòng live`
                        : `Bot đang tắt. Hãy chọn tối đa 5 bot bên dưới và bấm Kích Hoạt.`}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Quy định: Tối đa 5 Bot / Phòng Livestream
                  </span>
                </div>
              </div>

              {/* THÔNG BÁO FEEDBACK */}
              {roomBotsMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{roomBotsMsg}</span>
                </div>
              )}
              {roomBotsErr && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{roomBotsErr}</span>
                </div>
              )}

              {/* HƯỚNG DẪN RÕ RÀNG */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Hướng dẫn chọn Bot:</strong> Tick chọn các Bot bên dưới mà bạn muốn đưa vào phòng live của mình. 
                  Các bot được chọn sẽ luân phiên gửi tin nhắn từ kịch bản do <strong>System Admin</strong> thiết lập, 
                  đồng thời thả tim/reaction để tạo không khí sôi nổi cho buổi livestream.
                </div>
              </div>

              {/* DANH SÁCH BOTS CHO PHÉP TICK CHỌN */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    Danh Sách Bot Khả Dụng ({availableBots.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Đã chọn: <strong className="text-cyan-300 font-mono">{selectedBotIds.length}</strong> / 5
                  </span>
                </div>

                {availableBots.length === 0 ? (
                  <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Chưa có bot nào khả dụng. Vui lòng liên hệ System Admin để tạo bot.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {availableBots.map((bot) => {
                      const idStr = String(bot.id);
                      const isSelected = selectedBotIds.includes(idStr);
                      const isLimitReached = selectedBotIds.length >= 5 && !isSelected;

                      return (
                        <div
                          key={idStr}
                          onClick={() => {
                            if (!isLimitReached) handleToggleBotSelection(idStr);
                          }}
                          className={`relative rounded-2xl p-4 border transition cursor-pointer select-none flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cyan-950/30 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-950/40'
                              : isLimitReached
                              ? 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <div>
                            {/* CARD TOP ROW */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                                  bot.role === 'vip'
                                    ? 'bg-amber-500/20 border border-amber-500/40'
                                    : 'bg-cyan-500/10 border border-cyan-500/30'
                                }`}>
                                  {bot.avatar || '🤖'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-bold text-white">
                                      {bot.name}
                                    </h5>
                                    {bot.role === 'vip' && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                                        VIP 👑
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <span className="text-cyan-300 font-mono">
                                      ⏱️ {bot.interval || 15}s
                                    </span>
                                    <span>•</span>
                                    <span className="text-purple-300 font-semibold">
                                      {(bot.messages || []).length} câu thoại
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* CHECKBOX SELECTION */}
                              <div className="mt-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isLimitReached}
                                  onChange={() => {}} // Đã xử lý ở thẻ cha onClick
                                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-400 cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* CÂU THOẠI MẪU PREVIEW */}
                            <div className="bg-slate-950/90 rounded-xl p-2 border border-slate-800/80 max-h-24 overflow-y-auto space-y-1 mb-2 custom-scrollbar">
                              {(bot.messages || []).length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic">Chưa có câu thoại.</p>
                              ) : (
                                (bot.messages || []).slice(0, 3).map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[10px] text-slate-300 bg-slate-900/90 border border-slate-800/80 px-2 py-0.5 rounded-lg flex items-center gap-1.5"
                                  >
                                    <span className="shrink-0">{bot.avatar || '🤖'}</span>
                                    <span className="truncate">{msg}</span>
                                  </div>
                                ))
                              )}
                              {(bot.messages || []).length > 3 && (
                                <p className="text-[9px] text-slate-500 text-center">
                                  +{(bot.messages || []).length - 3} câu thoại khác...
                                </p>
                              )}
                            </div>
                          </div>

                          {/* FOOTER LABEL */}
                          <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                            {isSelected ? (
                              <span className="text-cyan-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Đã chọn vào phòng
                              </span>
                            ) : isLimitReached ? (
                              <span className="text-amber-400/80 font-medium">
                                Đã đủ tối đa 5 bot
                              </span>
                            ) : (
                              <span className="text-slate-400 hover:text-slate-200">
                                Nhấp để chọn bot này
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
