import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Users, 
  UserPlus, 
  Trash2, 
  Key, 
  Radio, 
  Activity, 
  Clock, 
  Calendar, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  History, 
  LogIn, 
  LogOut, 
  Copy, 
  Check, 
  Flame,
  UserCheck,
  Ban,
  Plus,
  Power,
  Settings,
  Tv,
  Bot,
  MessageSquare,
  Sparkles,
  Edit2,
  Smile,
  Send,
  Zap,
  Tag
} from 'lucide-react';
import { getApiBaseUrl, getRtmpBaseUrl } from '../config';

export default function SystemAdminDashboard({ isOpen, onClose, token, currentUser }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'keys' | 'sessions' | 'logs' | 'bots'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [keysList, setKeysList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Form tạo tài khoản mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [newCustomStreamKey, setNewCustomStreamKey] = useState('');
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');

  // Form tạo luồng khóa mới trực tiếp
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [directKeyName, setDirectKeyName] = useState('');
  const [directKeyTitle, setDirectKeyTitle] = useState('');
  const [directKeyAdmin, setDirectKeyAdmin] = useState('');
  const [createKeyMsg, setCreateKeyMsg] = useState('');
  const [createKeyErr, setCreateKeyErr] = useState('');

  // Quản lý Bot Chat Tương Tác
  const [botsList, setBotsList] = useState([]);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [botName, setBotName] = useState('');
  const [botAvatar, setBotAvatar] = useState('🌸');
  const [botRole, setBotRole] = useState('user');
  const [botInterval, setBotInterval] = useState(15);
  const [botMessagesText, setBotMessagesText] = useState('');
  const [botIsActive, setBotIsActive] = useState(true);
  const [botModalMsg, setBotModalMsg] = useState('');
  const [botModalErr, setBotModalErr] = useState('');
  const [botSearchTerm, setBotSearchTerm] = useState('');
  const [botRoleFilter, setBotRoleFilter] = useState('all');

  // Bộ lọc Logs
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('');

  // 1. Tải số liệu thống kê
  const loadStats = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/live-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Tải danh sách người dùng
  const loadUsers = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Tải danh sách khóa luồng (Stream Keys)
  const loadKeys = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setKeysList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Tải lịch sử sự kiện (Logs)
  const loadLogs = async () => {
    try {
      let url = `${getApiBaseUrl()}/api/sysadmin/logs?limit=100`;
      if (logActionFilter) url += `&action=${encodeURIComponent(logActionFilter)}`;
      if (logUserFilter) url += `&username=${encodeURIComponent(logUserFilter)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Tải danh sách Bot Chat tương tác
  const loadBots = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/bots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBotsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = () => {
    setLoading(true);
    Promise.all([loadStats(), loadUsers(), loadKeys(), loadLogs(), loadBots()]).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      refreshAll();
      const interval = setInterval(loadStats, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (isOpen && activeTab === 'logs') {
      loadLogs();
    }
  }, [logActionFilter, logUserFilter]);

  // Lọc danh sách các Admin để gán key
  const adminUsers = usersList.filter(u => u.role === 'admin');

  useEffect(() => {
    if (isOpen && adminUsers.length > 0 && !directKeyAdmin) {
      setDirectKeyAdmin(adminUsers[0].username);
    }
  }, [isOpen, usersList, directKeyAdmin]);

  if (!isOpen) return null;

  // Xử lý tạo tài khoản mới kèm khóa luồng
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    setCreateErr('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          full_name: newFullName.trim() || newUsername.trim(),
          role: newRole,
          stream_key: newCustomStreamKey.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo tài khoản');
      }

      setCreateMsg(`✅ Đã tạo thành công tài khoản '${data.user?.username}' (Key: ${data.stream_key?.key || 'Không'})!`);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewCustomStreamKey('');
      loadUsers();
      loadKeys();
      loadStats();
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateMsg('');
      }, 1500);
    } catch (err) {
      setCreateErr(err.message);
    }
  };

  // Xử lý tạo Khóa Luồng mới trực tiếp
  const handleCreateDirectKey = async (e) => {
    e.preventDefault();
    setCreateKeyMsg('');
    setCreateKeyErr('');

    const cleanKey = directKeyName.trim().toLowerCase();
    if (!cleanKey) {
      setCreateKeyErr('Mã khóa luồng không được để trống');
      return;
    }

    try {
      // Tìm admin được chọn
      const selectedAdmin = adminUsers.find(a => a.username === directKeyAdmin) || adminUsers[0];

      const res = await fetch(`${getApiBaseUrl()}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: cleanKey,
          title: directKeyTitle.trim() || `Kênh ${cleanKey}`,
          streamer: selectedAdmin ? (selectedAdmin.full_name || selectedAdmin.username) : 'Admin',
          admin_username: selectedAdmin ? selectedAdmin.username : '',
          user_id: selectedAdmin ? (selectedAdmin.id || '') : ''
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo khóa luồng');
      }

      setCreateKeyMsg(`✅ Đã tạo thành công khóa luồng '${data.key}'!`);
      setDirectKeyName('');
      setDirectKeyTitle('');
      loadKeys();
      loadUsers();
      loadStats();
      setTimeout(() => {
        setIsCreateKeyModalOpen(false);
        setCreateKeyMsg('');
      }, 1200);
    } catch (err) {
      setCreateKeyErr(err.message);
    }
  };

  // Bật / Tắt (Khóa / Mở khóa) Stream Key
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
        loadKeys();
        loadLogs();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi cập nhật');
      }
    } catch (e) {
      alert('Lỗi cập nhật trạng thái khóa');
    }
  };

  // Xóa Stream Key
  const handleDeleteKey = async (key) => {
    if (!window.confirm(`⚠️ Bạn có chắc muốn xóa luồng khóa '${key}' không? Streamer sẽ không thể live bằng khóa này nữa!`)) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/keys?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadKeys();
        loadUsers();
        loadStats();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi xóa key');
      }
    } catch (e) {
      alert('Lỗi xóa key');
    }
  };

  // Đổi Role cho tài khoản
  const handleChangeRole = async (username, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmText = targetRole === 'admin' 
      ? `Bạn có chắc muốn nâng tài khoản '${username}' lên quyền Admin (được phép phát sóng)?` 
      : `Bạn có chắc muốn hạ tài khoản '${username}' về User (chỉ xem, không được live)?`;
    
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/users/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, role: targetRole })
      });
      if (res.ok) {
        loadUsers();
        loadKeys();
        loadStats();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi cập nhật');
      }
    } catch (e) {
      alert('Lỗi cập nhật vai trò');
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (username) => {
    if (username === 'sysadmin') {
      alert('TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA TÀI KHOẢN TỔNG QUẢN TRỊ!');
      return;
    }
    if (!window.confirm(`⚠️ Bạn có chắc muốn xóa tài khoản '${username}' và toàn bộ Stream Key liên quan?`)) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadUsers();
        loadKeys();
        loadStats();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi xóa tài khoản');
      }
    } catch (e) {
      alert('Lỗi xóa');
    }
  };

  // Format thời lượng từ giây sang Giờ:Phút:Giây
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0 giây';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);
    return parts.join(' ');
  };

  const copyText = (txt, id) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Mở modal tạo bot mới
  const handleOpenCreateBot = () => {
    setEditingBot(null);
    setBotName('');
    setBotAvatar('🌸');
    setBotRole('user');
    setBotInterval(15);
    setBotMessagesText('');
    setBotIsActive(true);
    setBotModalMsg('');
    setBotModalErr('');
    setIsBotModalOpen(true);
  };

  // Mở modal chỉnh sửa bot
  const handleOpenEditBot = (bot) => {
    setEditingBot(bot);
    setBotName(bot.name || '');
    setBotAvatar(bot.avatar || '🤖');
    setBotRole(bot.role || 'user');
    setBotInterval(bot.interval || 15);
    setBotMessagesText((bot.messages || []).join('\n'));
    setBotIsActive(bot.is_active !== false);
    setBotModalMsg('');
    setBotModalErr('');
    setIsBotModalOpen(true);
  };

  // Lưu bot (Tạo mới hoặc cập nhật)
  const handleSaveBot = async (e) => {
    e.preventDefault();
    setBotModalMsg('');
    setBotModalErr('');

    if (!botName.trim()) {
      setBotModalErr('Vui lòng nhập tên cho bot');
      return;
    }

    const messages = botMessagesText
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (messages.length === 0) {
      setBotModalErr('Vui lòng nhập ít nhất 1 câu thoại để bot tương tác vào phòng live');
      return;
    }

    try {
      const payload = {
        name: botName.trim(),
        avatar: botAvatar.trim() || '🤖',
        role: botRole,
        messages: messages,
        interval: Number(botInterval) || 15,
        is_active: botIsActive
      };

      let url = `${getApiBaseUrl()}/api/sysadmin/bots`;
      let method = 'POST';

      if (editingBot && editingBot.id) {
        method = 'PUT';
        payload.id = editingBot.id;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setBotModalMsg(editingBot ? 'Cập nhật bot thành công!' : 'Tạo mới bot thành công!');
        loadBots();
        setTimeout(() => {
          setIsBotModalOpen(false);
          setBotModalMsg('');
        }, 1200);
      } else {
        const errData = await res.json();
        setBotModalErr(errData.error || 'Lỗi khi lưu thông tin bot');
      }
    } catch (err) {
      setBotModalErr('Lỗi kết nối máy chủ');
    }
  };

  // Bật/tắt trạng thái hoạt động của bot
  const handleToggleBotActive = async (bot) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/bots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: bot.id,
          name: bot.name,
          avatar: bot.avatar,
          role: bot.role,
          messages: bot.messages || [],
          interval: bot.interval,
          is_active: !bot.is_active
        })
      });
      if (res.ok) {
        loadBots();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Xóa bot khỏi hệ thống
  const handleDeleteBot = async (bot) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa bot '${bot.name}' không?`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sysadmin/bots?id=${encodeURIComponent(bot.id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadBots();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi xóa bot');
      }
    } catch (e) {
      alert('Lỗi xóa bot');
    }
  };

  // Chèn nhanh kịch bản câu thoại mẫu
  const handleAddTemplateMessages = (type) => {
    let templates = [];
    if (type === 'sales') {
      templates = [
        "Shop ơi cho em hỏi giá sản phẩm này bao nhiêu ạ?",
        "Em vừa bấm đặt 1 đơn rồi nha shop yêu ❤️",
        "Có hỗ trợ ship COD tận nhà không vậy shop?",
        "Chất liệu dùng bền và êm không ạ shop?",
        "Shop ship về TP.HCM mất tầm mấy ngày thế ạ?",
        "Còn được áp mã voucher giảm giá hôm nay không shop?"
      ];
    } else if (type === 'cheer') {
      templates = [
        "Chào streamer nha, live hôm nay đỉnh và nét căng luôn! 🔥",
        "Thả tim nhiệt tình cho idol nào cả nhà ơi ❤️❤️❤️",
        "Mọi người cùng share live ủng hộ idol lên 1000 mắt xem nào 🚀",
        "Idol tư vấn dễ thương và duyên dáng ghê luôn!",
        "Tương tác mạnh lên cả nhà, xem live cuốn quá đi ạ ✨",
        "Chúc streamer hôm nay bùng nổ mắt xem và nghìn đơn nhé!"
      ];
    } else if (type === 'review') {
      templates = [
        "Lần trước em mua ở shop rồi, dùng siêu thích luôn ạ ⭐⭐⭐⭐⭐",
        "10 điểm cho chất lượng và độ nhiệt tình của streamer!",
        "Hàng giao nhanh đóng gói cẩn thận lắm nha mọi người",
        "Hóng chương trình tặng quà giveaway cuối buổi quá shop ơi 🎉",
        "Ai đang phân vân thì mua luôn đi ạ, dùng thích cực kỳ!"
      ];
    }

    const currentLines = botMessagesText.split('\n').filter((l) => l.trim().length > 0);
    const newCombined = Array.from(new Set([...currentLines, ...templates])).join('\n');
    setBotMessagesText(newCombined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-slate-950 border-0 sm:border border-purple-500/30 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 shadow-purple-950/40">
        
        {/* HEADER */}
        <div className="p-3.5 sm:p-6 border-b border-slate-800/90 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-xl font-bold tracking-tight text-white truncate">
                  Tổng Quản Trị Hệ Thống
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  Root Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">
                Quản lý & tạo Admin, tạo khóa luồng, theo dõi giờ live và lịch sử toàn hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshAll}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
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

        {/* BANNER RÀNG BUỘC PHÂN QUYỀN VÀ NÚT TẠO NHANH */}
        <div className="px-3.5 sm:px-6 py-2.5 bg-purple-950/40 border-b border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-purple-200">
          <div className="flex items-center gap-2 hidden sm:flex">
            <Ban className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Bảo mật:</strong> Tài khoản Tổng Quản Trị (<code>sysadmin</code>) <strong>KHÔNG ĐƯỢC LIVESTREAM</strong>. Bạn dùng quyền này để tạo Admin, tạo luồng khóa và giám sát toàn diện.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateKeyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs shrink-0 shadow-md transition"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Tạo Luồng Khóa</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 shadow-md shadow-purple-950 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tạo Admin Mới</span>
            </button>

            <button
              onClick={handleOpenCreateBot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs shrink-0 shadow-md transition"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Tạo Bot Chat</span>
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tổng quan & Tần suất Live</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Tài khoản & Streamers</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'keys'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Quản lý Luồng Khóa (Stream Keys)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
              {keysList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bots')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'bots'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Quản Lý Bot Chat Tương Tác</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              {botsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'sessions'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Chi tiết Giờ Live & Phiên Phát</span>
            {stats?.active_sessions > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử Vào / Ra & Thao Tác</span>
          </button>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ==================== TAB 1: TỔNG QUAN & TẦN SUẤT ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* CÁC THẺ KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Tổng Người Dùng</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {stats?.total_users ?? 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Toàn hệ thống</p>
                </div>

                <div className="bg-slate-900/70 border border-amber-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
                    <span>Quản Trị Viên (Admin)</span>
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {stats?.total_admins ?? 0}
                  </div>
                  <p className="text-[11px] text-amber-500/80 mt-1">Có quyền Livestream</p>
                </div>

                <div className="bg-slate-900/70 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
                    <span>Đang Phát Trực Tiếp</span>
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                    <span>{stats?.active_sessions ?? 0}</span>
                    {stats?.active_sessions > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase font-sans animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-500/80 mt-1">Luồng thời gian thực</p>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Tổng Số Phiên Live</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {stats?.total_sessions ?? 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Tất cả phiên đã tạo</p>
                </div>

                <div className="bg-slate-900/70 border border-purple-500/30 p-4 rounded-2xl col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-purple-300 text-xs mb-1">
                    <span>Tổng Giờ Phát Sóng</span>
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-300 font-mono truncate">
                    {formatDuration(stats?.total_duration_seconds)}
                  </div>
                  <p className="text-[11px] text-purple-400/70 mt-1">Thời lượng tích lũy</p>
                </div>
              </div>

              {/* BẢNG TẦN SUẤT THEO ADMIN / STREAMER */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Tần Suất & Thời Lượng Phát Sóng Theo Admin / Streamer
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Sắp xếp theo hoạt động
                  </span>
                </div>

                {(!stats?.streamer_stats || stats.streamer_stats.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Chưa có số liệu phát sóng nào từ các Streamer.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                          <th className="py-2.5 px-3">Streamer (Admin)</th>
                          <th className="py-2.5 px-3">Khóa Luồng (Stream Key)</th>
                          <th className="py-2.5 px-3 text-center">Tần Suất (Số Phiên)</th>
                          <th className="py-2.5 px-3">Tổng Thời Lượng Live</th>
                          <th className="py-2.5 px-3">Phiên Gần Nhất</th>
                          <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {stats.streamer_stats.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center uppercase text-xs">
                                {s.streamer ? s.streamer.substring(0, 1) : 'A'}
                              </div>
                              <span>{s.streamer}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-rose-400 font-bold">
                              {s.stream_key}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-bold font-mono border border-slate-700">
                                {s.total_sessions} phiên
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-purple-300 font-semibold">
                              {formatDuration(s.total_duration_seconds)}
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                              {s.last_live_at ? new Date(s.last_live_at).toLocaleString('vi-VN') : '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {s.is_live ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  ĐANG PHÁT
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Ngoại tuyến</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* TẦN SUẤT 7 NGÀY GẦN NHẤT */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Tần Suất Phát Sóng 7 Ngày Gần Nhất
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {stats?.daily_stats?.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                        day.session_count > 0 
                          ? 'bg-purple-950/30 border-purple-500/40 shadow-md' 
                          : 'bg-slate-900/40 border-slate-800'
                      }`}
                    >
                      <span className="text-[11px] font-mono text-slate-400">
                        {day.date.substring(5)}
                      </span>
                      <span className="text-lg font-bold font-mono text-white mt-1">
                        {day.session_count} <span className="text-[10px] font-normal text-slate-400">phiên</span>
                      </span>
                      <span className="text-[10px] font-mono text-purple-400 mt-0.5 truncate max-w-full">
                        {formatDuration(day.total_duration_seconds)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB 2: QUẢN LÝ TÀI KHOẢN & ADMIN ==================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Danh Sách Tài Khoản & Phân Quyền
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chỉ có tài khoản <strong>Admin</strong> mới được livestream. SystemAdmin đóng vai trò giám sát và tạo quyền.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setIsCreateKeyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-md transition"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Tạo Luồng Khóa</span>
                  </button>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition hover:scale-[1.02]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Tạo Tài Khoản Mới</span>
                  </button>
                </div>
              </div>

              {/* BẢNG USERS */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4">Tài Khoản</th>
                        <th className="py-3 px-4">Họ và Tên</th>
                        <th className="py-3 px-4">Vai Trò</th>
                        <th className="py-3 px-4">Quyền Livestream</th>
                        <th className="py-3 px-4">Khóa Luồng (Stream Key)</th>
                        <th className="py-3 px-4">Ngày Tạo</th>
                        <th className="py-3 px-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {usersList.map((u) => {
                        const isSysAdmin = u.role === 'systemadmin' || u.username === 'sysadmin';
                        const isAdmin = u.role === 'admin';
                        const isViewer = u.role === 'user';
                        const userKeys = u.stream_keys && u.stream_keys.length > 0 ? u.stream_keys : [];

                        return (
                          <tr key={u.id || u.username} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-semibold text-white flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                                isSysAdmin 
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50' 
                                  : isAdmin 
                                  ? 'bg-amber-500 text-slate-950 font-black' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {u.username.substring(0, 1)}
                              </div>
                              <span className="font-mono">{u.username}</span>
                            </td>

                            <td className="py-3 px-4 font-medium">
                              {u.full_name || u.username}
                            </td>

                            <td className="py-3 px-4">
                              {isSysAdmin && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                                  <Shield className="w-3 h-3 text-purple-400" /> SystemAdmin
                                </span>
                              )}
                              {isAdmin && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  👑 Admin
                                </span>
                              )}
                              {isViewer && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                                  👤 User
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" /> Có quyền Live
                                </span>
                              ) : isSysAdmin ? (
                                <span className="inline-flex items-center gap-1 text-purple-400 font-semibold text-[11px]" title="Chỉ giám sát và quản trị, không được phát sóng">
                                  <Ban className="w-3.5 h-3.5" /> CẤM LIVE (Chỉ Quản Trị)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                                  <Ban className="w-3.5 h-3.5" /> Không có quyền
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono">
                              {userKeys.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {userKeys.map((k) => (
                                    <span key={k.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-rose-400 font-bold text-[11px]">
                                      <span>{k.key}</span>
                                      <button
                                        onClick={() => copyText(k.key, `u-key-${k.key}`)}
                                        className="hover:text-white"
                                        title="Sao chép Key"
                                      >
                                        {copiedKey === `u-key-${k.key}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">Chưa cấp key</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {isSysAdmin ? (
                                <span className="text-[11px] font-mono text-purple-400/80 italic">
                                  Tài khoản gốc (Khóa)
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleChangeRole(u.username, u.role)}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                                      isAdmin 
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                    }`}
                                    title={isAdmin ? 'Hạ xuống người xem' : 'Nâng lên Admin Streamer'}
                                  >
                                    {isAdmin ? 'Hạ xuống User' : 'Nâng lên Admin'}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(u.username)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB 3: QUẢN LÝ KHÓA LUỒNG (STREAM KEYS) ==================== */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Quản Lý Luồng Khóa Livestream (Stream Keys)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tạo khóa luồng mới, gán cho Admin, bật/tắt quyền phát và sao chép cấu hình OBS
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateKeyModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 transition hover:scale-[1.02] self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>+ Tạo Khóa Luồng Mới</span>
                </button>
              </div>

              {keysList.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Chưa có khóa luồng nào trong hệ thống. Hãy bấm <strong>+ Tạo Khóa Luồng Mới</strong> để bắt đầu.
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-4">Mã Khóa Luồng (Stream Key)</th>
                          <th className="py-3 px-4">Tiêu Đề Phòng Live</th>
                          <th className="py-3 px-4">Admin Sở Hữu (Streamer)</th>
                          <th className="py-3 px-4 text-center">Trạng Thái</th>
                          <th className="py-3 px-4">Cấu Hình OBS (RTMP)</th>
                          <th className="py-3 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {keysList.map((k) => (
                          <tr key={k.id || k.key} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 font-mono font-bold text-rose-400 text-sm">
                                <span>{k.key}</span>
                                <button
                                  onClick={() => copyText(k.key, `raw-key-${k.key}`)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  title="Sao chép Stream Key"
                                >
                                  {copiedKey === `raw-key-${k.key}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-medium text-white">
                              {k.title || `Kênh ${k.key}`}
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
                                👑 {k.streamer || 'Admin'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {k.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ĐANG MỞ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> ĐÃ KHÓA
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  const obsText = `RTMP Server: ${getRtmpBaseUrl()}\nStream Key: ${k.key}`;
                                  copyText(obsText, `obs-cfg-${k.key}`);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
                                title="Sao chép toàn bộ thông số Server và Key cho OBS"
                              >
                                {copiedKey === `obs-cfg-${k.key}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                                <span>{copiedKey === `obs-cfg-${k.key}` ? 'Đã sao chép!' : 'Chép thông số OBS'}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleKey(k.key, k.is_active)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition ${
                                    k.is_active
                                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  }`}
                                  title={k.is_active ? 'Khóa luồng phát' : 'Mở khóa luồng phát'}
                                >
                                  <Power className="w-3 h-3" />
                                  <span>{k.is_active ? 'Khóa Key' : 'Mở Key'}</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteKey(k.key)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                  title="Xóa khóa luồng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== TAB 4: CHI TIẾT GIỜ LIVE & PHIÊN ==================== */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Nhật Ký Từng Phiên Livestream
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chi tiết thời gian bắt đầu, kết thúc, thời lượng phát và địa chỉ IP
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {stats?.sessions?.length ?? 0} phiên ghi nhận
                </span>
              </div>

              {(!stats?.sessions || stats.sessions.length === 0) ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Chưa có phiên livestream nào được ghi nhận.
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-4">Khóa (Stream Key)</th>
                          <th className="py-3 px-4">Streamer (Admin)</th>
                          <th className="py-3 px-4">Trạng Thái</th>
                          <th className="py-3 px-4">Thời Điểm Bắt Đầu</th>
                          <th className="py-3 px-4">Thời Điểm Kết Thúc</th>
                          <th className="py-3 px-4">Tổng Thời Lượng Live</th>
                          <th className="py-3 px-4">IP Thiết Bị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {stats.sessions.map((ses, idx) => {
                          const isLive = ses.status === 'live';
                          const liveDuration = isLive && ses.started_at
                            ? Math.floor((new Date() - new Date(ses.started_at)) / 1000)
                            : ses.duration_seconds;

                          return (
                            <tr key={ses.id || idx} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-4 font-mono text-rose-400 font-bold">
                                {ses.stream_key}
                              </td>

                              <td className="py-3 px-4 font-semibold text-white">
                                {ses.streamer || 'Admin'}
                              </td>

                              <td className="py-3 px-4">
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    ĐANG LIVE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                    Đã kết thúc
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                                {ses.started_at ? new Date(ses.started_at).toLocaleString('vi-VN') : '—'}
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                                {ses.ended_at ? new Date(ses.ended_at).toLocaleString('vi-VN') : (isLive ? 'Đang diễn ra' : '—')}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-purple-300">
                                {formatDuration(liveDuration)}
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                {ses.client_ip || '127.0.0.1'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 5: LỊCH SỬ VÀO / RA & THAO TÁC ==================== */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    Lịch Sử Đăng Nhập, Vào / Ra & Thao Tác Hệ Thống
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ghi nhận mọi sự kiện đăng nhập, đăng xuất, bắt đầu phát sóng và quản trị
                  </p>
                </div>

                {/* BỘ LỌC */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">Tất cả hành động</option>
                    <option value="login">Đăng nhập thành công</option>
                    <option value="login_failed">Đăng nhập thất bại</option>
                    <option value="logout">Đăng xuất</option>
                    <option value="start_stream">Bắt đầu Livestream</option>
                    <option value="stop_stream">Kết thúc Livestream</option>
                    <option value="create_key">Tạo Khóa Luồng</option>
                    <option value="toggle_key">Bật/Khóa Key</option>
                    <option value="delete_key">Xóa Khóa Luồng</option>
                    <option value="create_user">Tạo tài khoản</option>
                    <option value="change_role">Đổi quyền tài khoản</option>
                    <option value="delete_user">Xóa tài khoản</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm user..."
                      value={logUserFilter}
                      onChange={(e) => setLogUserFilter(e.target.value)}
                      className="w-28 sm:w-36 pl-7 pr-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
                  </div>
                </div>
              </div>

              {logsList.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Không tìm thấy sự kiện nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-4">Thời Gian</th>
                          <th className="py-3 px-4">Tài Khoản</th>
                          <th className="py-3 px-4">Vai Trò</th>
                          <th className="py-3 px-4">Hành Động</th>
                          <th className="py-3 px-4">Địa Chỉ IP</th>
                          <th className="py-3 px-4">Chi Tiết Sự Kiện</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {logsList.map((logItem, idx) => {
                          let actionBadge = null;
                          switch (logItem.action) {
                            case 'login':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  <LogIn className="w-3 h-3" /> Đăng nhập
                                </span>
                              );
                              break;
                            case 'login_failed':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3" /> Đăng nhập lỗi
                                </span>
                              );
                              break;
                            case 'logout':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                                  <LogOut className="w-3 h-3" /> Đăng xuất
                                </span>
                              );
                              break;
                            case 'start_stream':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse">
                                  <Radio className="w-3 h-3 text-rose-400" /> Bắt đầu Live
                                </span>
                              );
                              break;
                            case 'stop_stream':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  <Clock className="w-3 h-3" /> Dừng Live
                                </span>
                              );
                              break;
                            case 'create_key':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  <Key className="w-3 h-3 text-amber-400" /> Tạo Khóa Luồng
                                </span>
                              );
                              break;
                            case 'toggle_key':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                                  <Power className="w-3 h-3 text-indigo-400" /> Bật/Khóa Key
                                </span>
                              );
                              break;
                            case 'delete_key':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                  <Trash2 className="w-3 h-3" /> Xóa Khóa Luồng
                                </span>
                              );
                              break;
                            case 'create_user':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                                  <UserPlus className="w-3 h-3" /> Tạo User/Admin
                                </span>
                              );
                              break;
                            case 'change_role':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                                  <UserCheck className="w-3 h-3" /> Đổi quyền
                                </span>
                              );
                              break;
                            case 'delete_user':
                              actionBadge = (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                  <Trash2 className="w-3 h-3" /> Xóa tài khoản
                                </span>
                              );
                              break;
                            default:
                              actionBadge = (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                                  {logItem.action}
                                </span>
                              );
                          }

                          return (
                            <tr key={logItem.id || idx} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                                {logItem.created_at ? new Date(logItem.created_at).toLocaleString('vi-VN') : '—'}
                              </td>

                              <td className="py-3 px-4 font-mono font-semibold text-white">
                                {logItem.username}
                              </td>

                              <td className="py-3 px-4">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {logItem.role}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                {actionBadge}
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                                {logItem.ip || '127.0.0.1'}
                              </td>

                              <td className="py-3 px-4 text-slate-300 text-xs">
                                {logItem.details}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 6: QUẢN LÝ BOT CHAT TƯƠNG TÁC ==================== */}
          {activeTab === 'bots' && (
            <div className="space-y-6">
              {/* TOP HEADER & ACTIONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Quản Lý Danh Sách Bot & Kịch Bản Chat Tự Động
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tạo các Bot ảo, cấu hình danh sách câu thoại để tự động chat vào phòng livestream. Admin có thể chọn tối đa 5 bot.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={handleOpenCreateBot}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tạo Bot Mới</span>
                  </button>
                </div>
              </div>

              {/* KPI STATS FOR BOTS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900/70 border border-cyan-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-cyan-300 text-xs mb-1">
                    <span>Tổng Số Bot Hệ Thống</span>
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {botsList.length}
                  </div>
                  <p className="text-[11px] text-cyan-400/80 mt-1">Đã sẵn sàng trong hệ thống</p>
                </div>

                <div className="bg-slate-900/70 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
                    <span>Đang Hoạt Động (Active)</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {botsList.filter((b) => b.is_active).length}
                  </div>
                  <p className="text-[11px] text-emerald-500/80 mt-1">Cho phép Admin chọn vào phòng</p>
                </div>

                <div className="bg-slate-900/70 border border-purple-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-purple-300 text-xs mb-1">
                    <span>Tổng Câu Thoại Đã Nạp</span>
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-300 font-mono">
                    {botsList.reduce((acc, b) => acc + (b.messages ? b.messages.length : 0), 0)}
                  </div>
                  <p className="text-[11px] text-purple-400/80 mt-1">Câu chat mẫu tự động</p>
                </div>

                <div className="bg-slate-900/70 border border-amber-500/30 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
                    <span>Giới Hạn Admin Chọn</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    Tối đa 5 Bot
                  </div>
                  <p className="text-[11px] text-amber-500/80 mt-1">Quy định cho mỗi phòng live</p>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm bot theo tên, câu chat..."
                    value={botSearchTerm}
                    onChange={(e) => setBotSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-400">Vai trò:</span>
                  <select
                    value={botRoleFilter}
                    onChange={(e) => setBotRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="user">Khách thường (User)</option>
                    <option value="vip">Khách VIP 👑</option>
                  </select>
                </div>
              </div>

              {/* BOTS GRID LIST */}
              {botsList.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                  <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-semibold">Chưa có bot tương tác nào được tạo.</p>
                  <p className="text-xs text-slate-500 mt-1">Bấm nút "+ Tạo Bot Mới" bên trên để tạo bot đầu tiên.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {botsList
                    .filter((b) => {
                      const matchSearch =
                        !botSearchTerm ||
                        b.name.toLowerCase().includes(botSearchTerm.toLowerCase()) ||
                        (b.messages && b.messages.some((m) => m.toLowerCase().includes(botSearchTerm.toLowerCase())));
                      const matchRole = botRoleFilter === 'all' || b.role === botRoleFilter;
                      return matchSearch && matchRole;
                    })
                    .map((b) => (
                      <div
                        key={b.id}
                        className={`relative bg-slate-900/90 border rounded-2xl p-4 flex flex-col justify-between transition hover:shadow-xl ${
                          b.is_active
                            ? b.role === 'vip'
                              ? 'border-amber-500/40 hover:border-amber-500 shadow-amber-950/20'
                              : 'border-cyan-500/30 hover:border-cyan-500/70 shadow-cyan-950/20'
                            : 'border-slate-800 opacity-60'
                        }`}
                      >
                        {/* CARD HEADER */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                                b.role === 'vip'
                                  ? 'bg-gradient-to-tr from-amber-500/30 to-amber-600/20 border border-amber-500/50'
                                  : 'bg-cyan-500/10 border border-cyan-500/30'
                              }`}>
                                {b.avatar || '🤖'}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <span>{b.name}</span>
                                  {b.role === 'vip' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                                      VIP 👑
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  <span className="inline-flex items-center gap-1 text-cyan-300 font-mono">
                                    <Clock className="w-3 h-3" /> {b.interval || 15}s/câu
                                  </span>
                                  <span>•</span>
                                  <span className="text-purple-300 font-semibold">
                                    {(b.messages || []).length} câu thoại
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* TOGGLE ACTIVE */}
                            <button
                              onClick={() => handleToggleBotActive(b)}
                              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                                b.is_active
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                              }`}
                              title={b.is_active ? 'Nhấn để tạm tắt bot này' : 'Nhấn để bật bot này'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden sm:inline">{b.is_active ? 'Bật' : 'Tắt'}</span>
                            </button>
                          </div>

                          {/* SAMPLE MESSAGES PREVIEW */}
                          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 max-h-32 overflow-y-auto space-y-1.5 mb-4 custom-scrollbar">
                            {(b.messages || []).length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic">Chưa có câu thoại nào.</p>
                            ) : (
                              (b.messages || []).map((msg, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg flex items-start gap-1.5"
                                >
                                  <span className="shrink-0 text-xs">{b.avatar || '🤖'}</span>
                                  <span className="break-words">{msg}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* CARD ACTIONS */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
                          <button
                            onClick={() => handleOpenEditBot(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 transition font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Sửa & Thêm câu</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBot(b)}
                            className="p-1.5 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 transition"
                            title="Xóa bot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* POPUP 1: TẠO TÀI KHOẢN MỚI (CÓ THỂ NHẬP LUÔN STREAM KEY TÙY CHỈNH) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tạo Tài Khoản Mới</h3>
                <p className="text-xs text-slate-400">Tạo tài khoản Admin (Livestream) hoặc User (Xem)</p>
              </div>
            </div>

            {createMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {createMsg}
              </div>
            )}
            {createErr && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {createErr}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên đăng nhập (Username) *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: admin_hcm, streamer01..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Họ và tên hiển thị</label>
                <input
                  type="text"
                  placeholder="ví dụ: Nguyễn Văn A"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vai trò & Quyền hạn *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                      newRole === 'admin'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      👑 Admin Streamer
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Được cấp quyền và khóa phát sóng trực tiếp
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                      newRole === 'user'
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      👤 Người xem (User)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Chỉ được xem live và chat (không được live)
                    </span>
                  </button>
                </div>
              </div>

              {/* TÙY CHỌN KHÓA LUỒNG CHO ADMIN */}
              {newRole === 'admin' && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <label className="block text-amber-300 font-semibold mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mã Luồng Khóa (Stream Key) tùy chỉnh</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống sẽ tự tạo theo username (vd: admin_hcm)..."
                    value={newCustomStreamKey}
                    onChange={(e) => setNewCustomStreamKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Admin này sẽ dùng khóa trên để phát sóng trong OBS hoặc Camera điện thoại.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-purple-950/50"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 2: TẠO KHÓA LUỒNG MỚI TRỰC TIẾP */}
      {isCreateKeyModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCreateKeyModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-900/50 font-black">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tạo Luồng Khóa Trực Tiếp</h3>
                <p className="text-xs text-slate-400">Tạo mã Stream Key mới và chỉ định Admin phát sóng</p>
              </div>
            </div>

            {createKeyMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {createKeyMsg}
              </div>
            )}
            {createKeyErr && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {createKeyErr}
              </div>
            )}

            <form onSubmit={handleCreateDirectKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mã Khóa Luồng (Stream Key) *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: livestream_tet, bongda_2026, show_vip..."
                  value={directKeyName}
                  onChange={(e) => setDirectKeyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu đề phòng live</label>
                <input
                  type="text"
                  placeholder="ví dụ: Kênh Ca Nhạc Trực Tiếp"
                  value={directKeyTitle}
                  onChange={(e) => setDirectKeyTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gán quyền sở hữu cho Admin</label>
                <select
                  value={directKeyAdmin}
                  onChange={(e) => setDirectKeyAdmin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {adminUsers.length > 0 ? (
                    adminUsers.map((a) => (
                      <option key={a.username} value={a.username}>
                        👑 {a.full_name || a.username} (@{a.username})
                      </option>
                    ))
                  ) : (
                    <option value="admin01">👑 Quản trị viên (admin01)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Chỉ các tài khoản vai trò Admin mới có quyền phát sóng qua khóa này.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateKeyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black transition shadow-lg shadow-amber-950/50"
                >
                  Tạo Luồng Khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 3: TẠO / SỬA BOT CHAT TƯƠNG TÁC */}
      {isBotModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
            <button
              onClick={() => setIsBotModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-950/50">
                <Bot className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{editingBot ? `Chỉnh Sửa Bot '${editingBot.name}'` : 'Tạo Bot Tương Tác Mới'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cấu hình tên, biểu tượng đại diện và danh sách câu thoại để bot tự động chat
                </p>
              </div>
            </div>

            {botModalMsg && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{botModalMsg}</span>
              </div>
            )}
            {botModalErr && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{botModalErr}</span>
              </div>
            )}

            <form onSubmit={handleSaveBot} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* TÊN BOT & BIỂU TƯỢNG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Tên Hiển Thị Của Bot *</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Minh Thư 🌸, Quốc Bảo ⚡..."
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Icon Avatar</label>
                  <input
                    type="text"
                    required
                    value={botAvatar}
                    onChange={(e) => setBotAvatar(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* CHỌN NHANH BIỂU TƯỢNG EMOJI */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-1.5">Chọn nhanh biểu tượng:</label>
                <div className="flex flex-wrap gap-1.5">
                  {['🌸', '🔥', '⚡', '💎', '💖', '🛍️', '👑', '⭐', '🚀', '🎉', '🎀', '🍀', '🤖', '🍒', '🌟', '🦄'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setBotAvatar(emoji)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition border ${
                        botAvatar === emoji
                          ? 'bg-cyan-500/20 border-cyan-400 scale-110 shadow-sm'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* VAI TRÒ & TẦN SUẤT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vai Trò Khi Chat</label>
                  <select
                    value={botRole}
                    onChange={(e) => setBotRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="user">Khách thường (User)</option>
                    <option value="vip">Khách VIP 👑 (Nổi bật, viền vàng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tần Suất Chat (Khoảng cách giây)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={botInterval}
                      onChange={(e) => setBotInterval(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-xs">giây</span>
                  </div>
                </div>
              </div>

              {/* CHECKBOX KÍCH HOẠT */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <input
                  type="checkbox"
                  id="botIsActive"
                  checked={botIsActive}
                  onChange={(e) => setBotIsActive(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded border-slate-700 bg-slate-900 focus:ring-cyan-500"
                />
                <label htmlFor="botIsActive" className="text-slate-300 font-semibold cursor-pointer select-none">
                  Kích hoạt bot này (Cho phép Admin chọn đưa vào phòng live)
                </label>
              </div>

              {/* DANH SÁCH CÂU THOẠI ĐẶT SẴN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Danh Sách Câu Thoại Để Bot Chat *</span>
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {botMessagesText.split('\n').filter((l) => l.trim().length > 0).length} câu thoại
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Nhập mỗi câu thoại trên một dòng riêng biệt. Bot sẽ chọn ngẫu nhiên các câu này để chat vào phòng livestream.
                </p>

                {/* NÚT CHÈN NHANH MẪU KỊCH BẢN */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="text-[10px] text-slate-500">Chèn nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateMessages('sales')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold transition"
                  >
                    🛍️ + Mẫu Bán Hàng & Chốt Đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateMessages('cheer')}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold transition"
                  >
                    ❤️ + Mẫu Cổ Vũ & Thả Tim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateMessages('review')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition"
                  >
                    ⭐ + Mẫu Review & Khen Ngợi
                  </button>
                </div>

                <textarea
                  rows="7"
                  required
                  placeholder={`Cho em hỏi giá sản phẩm này bao nhiêu vậy shop?\nEm vừa đặt 1 đơn rồi nha shop yêu ❤️\nChất vải mặc mát và thoáng không ạ?\nShip về Hà Nội tầm mấy ngày thế shop?...`}
                  value={botMessagesText}
                  onChange={(e) => setBotMessagesText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed custom-scrollbar"
                />
              </div>

              {/* NÚT SUBMIT */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBotModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black transition shadow-lg shadow-cyan-950/50"
                >
                  {editingBot ? 'Cập Nhật Bot' : 'Tạo Bot Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
