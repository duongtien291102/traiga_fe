import React, { useState, useEffect, useRef } from 'react';
import LivePlayer from './components/LivePlayer';
import ReplayPlayer from './components/ReplayPlayer';
import LiveChat from './components/LiveChat';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import LiveStudioModal from './components/LiveStudioModal';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import PostChickenModal from './components/PostChickenModal';
import ChickenDetailModal from './components/ChickenDetailModal';
import UserProfilePage from './components/UserProfilePage';
import {
  Radio,
  Search,
  Key,
  Copy,
  Check,
  Sparkles,
  Video,
  Settings,
  Shield,
  User,
  LogOut,
  LogIn,
  Tv,
  MessageSquare,
  Activity,
  Share2,
  X,
  Phone,
  Flame,
  ArrowUp,
  ArrowLeft,
  FileText,
  HelpCircle,
  Truck,
  Plus,
  Tag,
  ShoppingBag,
  ShieldCheck,
  Sun,
  Moon,
  Play,
  Archive,
  Swords,
  Camera,
  Headphones,
  History,
  BarChart3,
  Eye,
  Volume2,
  CreditCard,
  Server,
  AlertCircle
} from 'lucide-react';
import { getApiBaseUrl, getHlsBaseUrl, getRtmpBaseUrl, getHost } from './config';

// Mã hóa Key phòng live để chia sẻ an toàn và không để lộ stream key nhạy cảm trên URL
export const encodeRoomKey = (key) => {
  if (!key) return '';
  try {
    return btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return key;
  }
};

export const decodeRoomKey = (token) => {
  if (!token) return '';
  const clean = String(token).trim();
  // Nếu là số phòng ngắn gọn (ví dụ: ?room=1 -> thanhtrung01)
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    return `thanhtrung${String(num).padStart(2, '0')}`;
  }
  // Nếu là chuỗi base64url đã mã hóa (ví dụ: dGhhbmh0cnVuZzAx -> thanhtrung01)
  try {
    let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = atob(base64);
    if (decoded && decoded.length > 0) return decoded;
  } catch {}
  return clean;
};

export default function App() {
  const [streamKey, setStreamKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Trạng thái xác thực & Người dùng
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [myStreamKey, setMyStreamKey] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSystemAdminOpen, setIsSystemAdminOpen] = useState(false);
  const [isSystemAdminPage, setIsSystemAdminPage] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/system-admin');
  const [isLiveStudioPage, setIsLiveStudioPage] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/studio');
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/studio');
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [liveCamera, setLiveCamera] = useState('cam1'); // 'cam1' (toàn cảnh) | 'cam2' (soi chân vảy)
  const [liveAudioTrack, setLiveAudioTrack] = useState('blv'); // 'blv' (BLV Thành Trung) | 'arena' (Sới gốc)
  const [showAllRooms, setShowAllRooms] = useState(false); // false: chỉ hiện phòng đang live thực tế, true: hiện tất cả kênh đăng ký
  const [previewSelectedChannel, setPreviewSelectedChannel] = useState(null); // Kênh người dùng chủ động chọn xem khi không có live tự động
  const [activeServer, setActiveServer] = useState('hd1'); // 'hd1' | 'hd2' | 'hd3'
  const [oddsVotes, setOddsVotes] = useState({ red: 18, blue: 14, userVoted: null });
  const [isCopiedBank, setIsCopiedBank] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [themeMode] = useState('dark'); // Mặc định luôn là chế độ Tối (Dark Mode)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('traiga_theme', 'dark');
      } catch (e) {}
    }
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Quản lý Đăng Bán Gà & Chợ Kê (100% dữ liệu thật từ MongoDB)
  const [chickensList, setChickensList] = useState([]);
  const [isChickensLoading, setIsChickensLoading] = useState(true);
  const [isPostChickenModalOpen, setIsPostChickenModalOpen] = useState(false);
  const [selectedMarketChicken, setSelectedMarketChicken] = useState(null);

  // Tải danh sách gà thật từ MongoDB
  const fetchChickens = () => {
    fetch(`${getApiBaseUrl()}/api/chickens`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChickensList(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsChickensLoading(false);
      });
  };

  const handleAddChicken = (newChicken) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'systemadmin')) {
      return;
    }

    // Gửi lưu trực tiếp vào MongoDB
    fetch(`${getApiBaseUrl()}/api/chickens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(newChicken)
    })
      .then((res) => res.json())
      .then((saved) => {
        if (saved && saved.id) {
          setChickensList((prev) => [saved, ...prev]);
        } else {
          fetchChickens();
        }
      })
      .catch(() => {
        fetchChickens();
      });

    // Chuyển sang tab Chợ Gà và cuộn lên đầu trang
    setActiveNavTab('market');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals cho giao lưu gà
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChickenForConnect, setSelectedChickenForConnect] = useState({ title: '', farm: '' });
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Danh sách key từ MongoDB & danh sách Video Xem Lại (Replays)
  const [dbKeys, setDbKeys] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [srsStreams, setSrsStreams] = useState([]);
  const [replays, setReplays] = useState([]);
  const [archivingReplayId, setArchivingReplayId] = useState('');
  const [replayArchiveNotice, setReplayArchiveNotice] = useState(null);
  const [selectedReplay, setSelectedReplay] = useState(null);

  // Điều hướng trang chính vs Phòng Live xổ gà
  const [activeNavTab, setActiveNavTab] = useState('home'); // home | live | replays | market | profile

  // Ref cho trình phát video để tự cuộn lên khi chọn gà
  const playerSectionRef = useRef(null);

  // Khôi phục phiên đăng nhập từ localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    const savedKey = localStorage.getItem('my_stream_key');

    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
        if (savedKey) setMyStreamKey(savedKey);
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsAuthHydrated(true);
  }, []);

  useEffect(() => {
    const handleHistoryChange = () => {
      const studioIsOpen = window.location.pathname === '/studio';
      setIsLiveStudioPage(studioIsOpen);
      setIsLiveStudioOpen(studioIsOpen);
      const systemAdminIsOpen = window.location.pathname === '/system-admin';
      setIsSystemAdminPage(systemAdminIsOpen);
      setIsSystemAdminOpen(systemAdminIsOpen);
    };
    window.addEventListener('popstate', handleHistoryChange);
    return () => window.removeEventListener('popstate', handleHistoryChange);
  }, []);

  const openLiveStudioPage = () => {
    if (window.location.pathname !== '/studio') {
      window.history.pushState({ liveStudio: true }, '', '/studio');
    }
    setIsLiveStudioPage(true);
    setIsLiveStudioOpen(true);
  };

  const closeLiveStudioPage = () => {
    setIsLiveStudioOpen(false);
    if (window.location.pathname !== '/studio') {
      setIsLiveStudioPage(false);
      return;
    }
    if (window.history.state?.liveStudio) {
      window.history.back();
    } else {
      window.history.replaceState({}, '', '/');
      setIsLiveStudioPage(false);
    }
  };

  const openSystemAdminPage = () => {
    if (window.location.pathname !== '/system-admin') {
      window.history.pushState({ systemAdmin: true }, '', '/system-admin');
    }
    setIsSystemAdminPage(true);
    setIsSystemAdminOpen(true);
  };

  const closeSystemAdminPage = () => {
    if (window.location.pathname !== '/system-admin') {
      setIsSystemAdminPage(false);
      setIsSystemAdminOpen(false);
      return;
    }
    if (window.history.state?.systemAdmin) {
      window.history.back();
    } else {
      window.history.replaceState({}, '', '/');
      setIsSystemAdminPage(false);
      setIsSystemAdminOpen(false);
    }
    fetchKeysAndSessions();
  };

  // Xử lý tự động đăng xuất khi tài khoản được đăng nhập ở thiết bị khác (token bị thu hồi -> 401)
  const forceKickSession = () => {
    const activeToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    if (!activeToken) return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('my_stream_key');
    setCurrentUser(null);
    setAuthToken('');
    setMyStreamKey('');
    setActiveNavTab((curr) => curr === 'profile' ? 'home' : curr);
    setIsAdminPanelOpen(false);
    setIsSystemAdminOpen(false);
    if (window.location.pathname === '/system-admin') {
      window.history.replaceState({}, '', '/');
      setIsSystemAdminPage(false);
    }
    closeLiveStudioPage();
    setIsPostChickenModalOpen(false);
    alert('Tài khoản của bạn vừa được đăng nhập trên một thiết bị khác. Phiên hiện tại đã tự động đăng xuất.');
  };

  // Tải danh sách Stream Keys, Sessions và kiểm tra hiệu lực phiên đăng nhập
  const fetchKeysAndSessions = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : authToken;
    if (!token) return;

    fetch(`${getApiBaseUrl()}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          forceKickSession();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (!data?.stream_key) return;
        setMyStreamKey(data.stream_key);
        localStorage.setItem('my_stream_key', data.stream_key);
      })
      .catch(() => { });

    fetch(`${getApiBaseUrl()}/api/keys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          forceKickSession();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDbKeys(data);
        }
      })
      .catch(() => { });

    fetch(`${getApiBaseUrl()}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(() => { });
  };

  // Tải danh sách luồng phát thực tế từ SRS Media Server
  const fetchSrsStreams = () => {
    fetch('/srs-api/v1/streams/')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.streams)) {
          setSrsStreams(data.streams);
        } else {
          setSrsStreams([]);
        }
      })
      .catch(() => {
        setSrsStreams([]);
      });
  };

  // Tải danh sách Video Xem Lại (Google Drive / DVR Replays) công khai cho tất cả người xem
  const fetchReplays = () => {
    fetch(`${getApiBaseUrl()}/api/replays`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReplays(data);
        }
      })
      .catch(() => {});
  };

  const archiveReplay = async (replay) => {
    if (!authToken) {
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'systemadmin') return;

    const replayId = String(replay.id || replay._id || '');
    if (!replayId) return;
    setArchivingReplayId(replayId);
    setReplayArchiveNotice(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/sessions/archive?id=${encodeURIComponent(replayId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Không thể lưu trữ video');
      setReplayArchiveNotice({ id: replayId, message: 'Đã lưu trữ video lên Google Drive.' });
      fetchReplays();
    } catch (error) {
      setReplayArchiveNotice({ id: replayId, error: error.message || 'Không thể lưu trữ video.' });
    } finally {
      setArchivingReplayId('');
    }
  };

  // Tải danh sách các phòng live công khai từ MongoDB
  const fetchPublicRooms = () => {
    fetch(`${getApiBaseUrl()}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPublicRooms(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchKeysAndSessions();
    fetchPublicRooms();
    fetchChickens();
    fetchSrsStreams();
    fetchReplays();
    const interval = setInterval(() => {
      fetchKeysAndSessions();
      fetchPublicRooms();
      fetchChickens();
      fetchSrsStreams();
      fetchReplays();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tự động nhận diện kênh từ URL (hỗ trợ link mã hóa ?live=... hoặc ?room=...) và ẩn ngay tham số khỏi thanh địa chỉ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawParam = params.get('live') || params.get('room') || params.get('v') || params.get('stream') || params.get('channel') || params.get('key');
      const tabParam = params.get('tab');
      if (rawParam && rawParam.trim()) {
        const decodedKey = decodeRoomKey(rawParam.trim());
        setStreamKey(decodedKey);
        setInputKey(decodedKey);
        setActiveNavTab('live');
        setPreviewSelectedChannel(true);

        const cleanUrl = new URL(window.location.href);
        ['live', 'room', 'v', 'stream', 'channel', 'key', 'tab'].forEach((k) => cleanUrl.searchParams.delete(k));
        window.history.replaceState({}, '', cleanUrl.toString());
      } else if (tabParam === 'live') {
        setActiveNavTab('live');
      }
    }
  }, []);

  // Phím tắt Ctrl+K để tìm kiếm nhanh & ESC đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsConnectModalOpen(false);
        setIsPolicyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tự động cuộn lên đầu trang mỗi khi chuyển tab (Phòng Live, Chợ Gà, Trang Chủ) hoặc mở màn chi tiết gà
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeNavTab, selectedMarketChicken]);

  // Chuyển đổi kênh linh hoạt mà không lộ khóa luồng trên URL
  const changeChannel = (newKey, goToLive = true) => {
    const clean = newKey ? newKey.trim() : '';
    if (!clean) return;
    setStreamKey(clean);
    setInputKey(clean);
    if (goToLive) {
      setActiveNavTab('live');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAuthSuccess = (user, token, key) => {
    setCurrentUser(user);
    setAuthToken(token);
    if (key) {
      setMyStreamKey(key);
      setStreamKey(key);
      setInputKey(key);
    }
    fetchKeysAndSessions();
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    if (authToken) {
      fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => { });
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('my_stream_key');
    setCurrentUser(null);
    setAuthToken('');
    setMyStreamKey('');
    setActiveNavTab((curr) => curr === 'profile' ? 'home' : curr);
  };

  // Mở modal liên hệ chủ trại (Bắt buộc đăng nhập tài khoản trước khi liên hệ / mua / gửi lời nhắn)
  const openConnectWithFarm = (chickenTitle, farmName) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedChickenForConnect({
      title: chickenTitle || '',
      farm: farmName || ''
    });
    setIsConnectModalOpen(true);
  };

  // Mở modal đăng bán gà (CHỈ DÀNH CHO CHỦ TRẠI ADMIN HOẶC SYSTEMADMIN)
  const openPostChickenWithAuth = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'systemadmin') {
      alert('⛔ Chỉ tài khoản Chủ Trại (Admin) hoặc Ban Quản Trị mới có quyền đăng bán chiến kê!');
      return;
    }
    setIsPostChickenModalOpen(true);
  };

  // Danh sách kênh lấy từ MongoDB (không dùng mock data)
  const displayKeys = dbKeys.length > 0 ? dbKeys : publicRooms;

  // Danh sách phòng live lấy trực tiếp từ MongoDB (không dùng mock data)
  const liveRooms = publicRooms.length > 0 ? publicRooms : dbKeys;

  // Tìm thông tin phòng gắn với streamKey hiện tại từ MongoDB
  const matchedDbKey = dbKeys.find((d) => d.key === streamKey);
  const matchedPublicRoom = publicRooms.find((r) => r.key === streamKey || r.id === streamKey);
  const currentRoomInfo = matchedPublicRoom || (matchedDbKey ? {
    id: streamKey,
    key: streamKey,
    ms: matchedDbKey.ms || '',
    title: matchedDbKey.title || '',
    farm: matchedDbKey.streamer ? `Trại Gà ${matchedDbKey.streamer}` : '',
    streamer: matchedDbKey.streamer || '',
    chang: matchedDbKey.chang || '',
    loi: matchedDbKey.loi || '',
    viewers: 0
  } : null);

  // SRS là nguồn sự thật duy nhất cho trạng thái đang phát; session trong DB
  // có thể còn trạng thái live cũ nếu webhook kết thúc bị mất.
  const activeSrsKeys = srsStreams
    .filter((s) => s?.publish?.active)
    .map((s) => s.name?.trim().toLowerCase())
    .filter(Boolean);

  const allLiveKeys = activeSrsKeys;
  const actualLiveRooms = activeSrsKeys.map((key) => {
    const room = liveRooms.find((candidate) => (candidate.id || candidate.key || '').trim().toLowerCase() === key);
    return room
      ? { ...room, id: room.id || room.key, key: room.key || room.id, viewers: Number(room.viewers) || 0 }
      : { id: key, key, title: `Phòng trực tiếp ${key}`, farm: '', streamer: 'Chủ kênh', viewers: 0 };
  });
  const effectiveIsLive = actualLiveRooms.length > 0;

  // Tự động chuyển streamKey sang kênh đang phát nếu có kênh đang live
  useEffect(() => {
    if (actualLiveRooms.length > 0) {
      const isCurrentKeyLive = actualLiveRooms.some(r => (r.id || r.key || '').toLowerCase() === streamKey.toLowerCase());
      if (!isCurrentKeyLive) {
        setStreamKey(actualLiveRooms[0].id || actualLiveRooms[0].key);
      }
    }
  }, [actualLiveRooms.length]);

  // Xác định phòng live nhiều người xem nhất (Top 1 Live Room để chiếu lên Hero Banner)
  const topLiveRoom = actualLiveRooms[0] || null;

  // Xử lý chuyển Server (HD1 • HD2 • HD3) học hỏi từ trieugadon.com
  const handleServerChange = (srv) => {
    setActiveServer(srv);
    const roomMatches = liveRooms.find((r) => r.id?.toLowerCase().includes(srv)) || null;
    if (roomMatches) {
      changeChannel(roomMatches.id);
    }
    setToastMessage(`Đã chuyển sang Server ${srv.toUpperCase()}`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Xử lý bình chọn tỉ lệ (Gà Đỏ - Gà Xanh / Meron - Wala)
  const handleVoteOdds = (team) => {
    if (oddsVotes.userVoted) {
      setToastMessage('Bạn đã bình chọn cho trận đấu này rồi!');
      setTimeout(() => setToastMessage(''), 2000);
      return;
    }
    setOddsVotes((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
      userVoted: team
    }));
    setToastMessage(team === 'red' ? '🔴 Bạn đã cổ vũ cho GÀ ĐỎ (Meron)!' : '🔵 Bạn đã cổ vũ cho GÀ XANH (Wala)!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Xử lý sao chép thông tin tài khoản ngân hàng (để trống theo yêu cầu khách)
  const handleCopyBankInfo = () => {
    const bankAccount = ''; // Để trống theo yêu cầu người dùng
    if (!bankAccount) {
      alert('Thông tin Số Tài Khoản Ngân Hàng đang cập nhật. Vui lòng liên hệ Hotline/Zalo: 0909 999 999!');
      return;
    }
    navigator.clipboard.writeText(bankAccount).then(() => {
      setIsCopiedBank(true);
      setTimeout(() => setIsCopiedBank(false), 2000);
    });
  };

  // Component tiện ích phòng Live (Học hỏi & nâng cấp từ trieugadon.com: Server HD1/2/3, Odds, STK chuyển khoản, Nội quy)
  const renderLiveUtilitiesSection = () => {
    const totalVotes = oddsVotes.red + oddsVotes.blue;
    const redPercent = totalVotes > 0 ? Math.round((oddsVotes.red / totalVotes) * 100) : 50;
    const bluePercent = 100 - redPercent;

    return (
      <div className="space-y-3 mt-3 w-full">
        {/* THANH ĐỔI SERVER & CẶP NÚT TỈ LỆ MERON / WALA (HỌC HỎI TỪ TRIEUGADON.COM) */}
        <div className="p-3 sm:p-4 rounded-xl bg-[#1e2329] border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Cụm Đổi Server: hd1 | hd2 | hd3 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#edb929] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Server className="w-3.5 h-3.5 text-[#edb929]" />
              Đổi Sever:
            </span>
            <div className="flex items-center gap-1.5">
              {(['hd1', 'hd2', 'hd3']).map((srv) => (
                <button
                  key={srv}
                  onClick={() => handleServerChange(srv)}
                  className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeServer === srv
                      ? 'bg-[#edb929] text-black shadow-md ring-2 ring-[#edb929]/50'
                      : 'bg-[#292e38] text-gray-300 hover:text-white hover:bg-[#323946] border border-white/5'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeServer === srv ? 'bg-black' : 'bg-emerald-400'}`}></span>
                  <span>{srv}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cặp Nút Tỉ Lệ / Dự Đoán (Đỏ Meron vs Xanh Wala) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-semibold hidden md:inline">Tỉ lệ cược/cổ vũ:</span>
            <button
              onClick={() => handleVoteOdds('red')}
              className={`px-3.5 py-1.5 rounded-lg text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition transform active:scale-95 ${
                oddsVotes.userVoted === 'red' ? 'ring-2 ring-white bg-[#e81226]' : 'bg-[#e81226] hover:bg-red-600'
              }`}
              title="Bình chọn Gà Đỏ"
            >
              <span>🔴 GÀ ĐỎ</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">{redPercent}%</span>
            </button>

            <button
              onClick={() => handleVoteOdds('blue')}
              className={`px-3.5 py-1.5 rounded-lg text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition transform active:scale-95 ${
                oddsVotes.userVoted === 'blue' ? 'ring-2 ring-white bg-[#0f4cd9]' : 'bg-[#0f4cd9] hover:bg-blue-600'
              }`}
              title="Bình chọn Gà Xanh"
            >
              <span>🔵 GÀ XANH</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">{bluePercent}%</span>
            </button>
          </div>
        </div>

        {/* KHỐI 💳 THÔNG TIN CHUYỂN KHOẢN & ⚠️ QUY ĐỊNH (CHUẨN TRIEUGADON) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Cột 1: Thông Tin Chuyển Khoản */}
          <div className="rounded-xl p-4 bg-[#1e2329] border border-white/10 shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#edb929] flex items-center gap-2 uppercase tracking-wide">
                <CreditCard className="w-4 h-4 text-[#edb929]" />
                💳 Thông Tin Chuyển Khoản
              </h4>
              <div className="text-xs space-y-1.5 text-gray-300">
                <p>
                  <span className="text-gray-400">Tên người nhận:</span>{' '}
                  <strong className="text-white"></strong>
                </p>
                <p>
                  <span className="text-gray-400">Số tài khoản:</span>{' '}
                  <strong className="text-white font-mono text-sm"></strong>
                </p>
                <p>
                  <span className="text-gray-400">Ngân hàng:</span>{' '}
                  <strong className="text-white"></strong>
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={handleCopyBankInfo}
                className="bg-[#edb929] hover:bg-[#dca41e] text-black font-extrabold text-xs px-4 py-2 rounded-md shadow flex items-center gap-1.5 cursor-pointer transition transform active:scale-95"
              >
                {isCopiedBank ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Đã sao chép STK</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-black" />
                    <span>📋 Sao chép STK</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-gray-400 italic">Ủng hộ / Cọc giữ gà</span>
            </div>
          </div>

          {/* Cột 2: Quy định & Nội quy */}
          <div className="rounded-xl p-4 bg-[#1e2329] border border-white/10 shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-rose-500 flex items-center gap-2 uppercase tracking-wide">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                ⚠️ Quy định
              </h4>
              <div className="text-xs space-y-2 text-gray-300">
                <p className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-emerald-400 shrink-0">☑️</span>
                  <span>Xổ Gà Mua Bán Trên Tinh Thần Giao Lưu Vui Vẻ, Lịch Sự Trên Live Chat</span>
                </p>
                <p className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-rose-500 shrink-0">🚫</span>
                  <span>Không Để Số Điện Thoại, Không Cá Cược Dưới Mọi Hình Thức</span>
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  const chatInput = document.querySelector('input[placeholder*="Bình luận"]') || document.querySelector('textarea');
                  if (chatInput) {
                    chatInput.scrollIntoView({ behavior: 'smooth' });
                    chatInput.focus();
                  } else {
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }
                }}
                className="bg-[#0068ff] hover:bg-[#0053cc] text-white font-extrabold text-xs px-4 py-2 rounded-md shadow flex items-center gap-1.5 cursor-pointer transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Ngay</span>
              </button>
              <span className="text-[11px] text-gray-400">⛔ CẤM CÁ CƯỢC, KHOÁ NICK!</span>
            </div>
          </div>
        </div>

        {/* KHỐI KẾT NỐI ĐAM MÊ (HOTLINE/ZALO 0909.999.999) */}
        <div className="rounded-xl p-4 bg-[#1e2329] border border-[#edb929]/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#edb929]/10 border border-[#edb929]/30 flex items-center justify-center text-2xl shrink-0">
              📱
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#edb929] uppercase tracking-wider">Kết Nối Đam Mê</span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mt-0.5">
                0909 999 999
              </h3>
              <p className="text-xs text-gray-400 mt-1">Hotline / Zalo liên hệ trực tiếp chủ trại</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://zalo.me/0909999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0068ff] hover:bg-[#0053cc] text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Nhắn Zalo 0909.999.999</span>
            </a>
            <a
              href="tel:0909999999"
              className="bg-[#edb929] hover:bg-[#dca41e] text-black font-black text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Phone className="w-4 h-4 text-black" />
              <span>Gọi Ngay</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Component hiển thị danh sách Video Xem Lại (Google Drive / SRS DVR) dùng chung cho Trang Chủ & Phòng Live
  const renderReplaysSection = () => {
    const hasReplays = replays && replays.length > 0;
    return (
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-1.5 h-6 bg-rose-500 rounded-full shrink-0 mt-0.5 sm:mt-0"></div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-white uppercase flex flex-wrap items-center gap-2">
                <span>🎬 Xem Lại Các Phiên Live</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {replays.length} Video
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400">
                Lưu video đã phát lên Google Drive để xem lại lâu dài. Bản ghi tạm được giữ 7 ngày.
              </p>
            </div>
          </div>
        </div>

        {hasReplays ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {replays.map((rep) => {
            const repId = String(rep.id || rep._id || rep.replay_url);
            const dateStr = rep.started_at
              ? new Date(rep.started_at).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              : 'Mới đây';
            const durationMin = rep.duration_seconds > 0 ? Math.max(1, Math.round(rep.duration_seconds / 60)) : null;

            return (
              <div
                key={repId}
                onClick={() => {
                  setSelectedReplay(rep);
                  setActiveNavTab('replays');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group rounded-2xl overflow-hidden bg-[#14151b] border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-lg"
              >
                <div className="relative h-40 bg-gradient-to-br from-slate-900 via-[#1a1c26] to-rose-950/60 flex items-center justify-center overflow-hidden">
                  <img
                    src="/img/rooster_dongtao.jpg"
                    alt={rep.title}
                    className="w-full h-full object-cover opacity-55 group-hover:scale-105 group-hover:opacity-75 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14151b] via-black/30 to-transparent" />

                  <div className="absolute w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>

                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300">
                    {rep.record_status === 'uploaded_drive' ? '☁️ Google Drive' : '📼 Xem Lại'}
                  </div>

                  {durationMin && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-gray-200">
                      ⏱️ {durationMin} phút
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition line-clamp-1">
                    {rep.title || `Phiên Live: ${rep.stream_key}`}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate font-semibold text-gray-300">🎙️ {rep.streamer || 'Chủ Trại'}</span>
                    <span>{dateStr}</span>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'systemadmin') && (
                    <div className="flex items-center justify-between gap-2 pt-1" onClick={(event) => event.stopPropagation()}>
                      {rep.record_status === 'uploaded_drive' ? (
                        <span className="text-[11px] font-semibold text-emerald-400">Đã lưu trữ lâu dài</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveReplay(rep)}
                          disabled={archivingReplayId === repId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          {archivingReplayId === repId ? 'Đang lưu...' : 'Lưu trữ video'}
                        </button>
                      )}
                      {replayArchiveNotice?.id === repId && (
                        <span className={`text-[10px] ${replayArchiveNotice.error ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {replayArchiveNotice.error || replayArchiveNotice.message}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div> : (
          <div className="rounded-2xl border border-white/10 bg-[#14151b] px-5 py-12 text-center text-sm text-gray-400">
            Chưa có video phát lại nào được lưu.
          </div>
        )}
      </section>
    );
  };

  // Màn hình xem lại Livestream chuyên dụng (Cinema Mode / Trang phát riêng biệt)
  const renderDedicatedReplayScreen = () => {
    if (!selectedReplay) return null;
    const isDrive = selectedReplay.replay_url?.includes('drive.google.com');
    const startedDate = selectedReplay.started_at
      ? new Date(selectedReplay.started_at).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'Gần đây';
    const durationMin = selectedReplay.duration_seconds > 0 ? Math.max(1, Math.round(selectedReplay.duration_seconds / 60)) : null;
    const otherReplays = replays.filter(
      (r) => String(r.id || r._id || r.replay_url) !== String(selectedReplay.id || selectedReplay._id || selectedReplay.replay_url)
    );

    return (
      <div className="space-y-6">
        {/* Thanh điều hướng quay lại & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setSelectedReplay(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tất Cả Video Xem Lại</span>
            </button>
            <span className="text-gray-500 hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm text-gray-300 font-semibold truncate max-w-[200px] sm:max-w-md hidden sm:inline">
              {selectedReplay.title || `Phiên Live: ${selectedReplay.stream_key}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveNavTab('live');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Vào Xem Trực Tiếp</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Đã sao chép liên kết video xem lại!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold transition cursor-pointer"
              title="Sao chép liên kết"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chia Sẻ</span>
            </button>
          </div>
        </div>

        {/* Bố cục Cinema: Trình phát lớn & Danh sách phát lại khác */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột chính: Video Player & Thông tin chi tiết */}
          <div className="lg:col-span-8 space-y-4">
            {/* Khung video Player 16:9 chuẩn JWPlayer như trieugadon.com */}
            <div className="relative aspect-video w-full rounded-none overflow-hidden bg-black">
              {isDrive ? (
                <iframe
                  src={selectedReplay.replay_url}
                  title={selectedReplay.title || 'Replay Video'}
                  className="w-full h-full border border-white/80"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <ReplayPlayer
                  src={selectedReplay.replay_url}
                  startedAt={selectedReplay.started_at}
                  autoPlay={true}
                />
              )}
            </div>

            {/* Thông tin phiên xem lại */}
            <div className="rounded-2xl bg-[#14151b] border border-white/10 p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-rose-600 text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                  <Play className="w-3 h-3 fill-white" /> XEM LẠI PHIÊN LIVE
                </span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  selectedReplay.record_status === 'uploaded_drive'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}>
                  {selectedReplay.record_status === 'uploaded_drive' ? '☁️ Google Drive (Lưu lâu dài)' : '📼 Bản ghi tạm DVR (7 ngày)'}
                </span>
                {durationMin && (
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-[11px] font-mono text-gray-300">
                    ⏱️ {durationMin} phút
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {selectedReplay.title || `Phiên Live: ${selectedReplay.stream_key}`}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-400 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-bold text-white text-xs">
                    {(selectedReplay.streamer || 'T')[0]?.toUpperCase()}
                  </div>
                  <span className="font-bold text-gray-200">{selectedReplay.streamer || 'Quản trị viên / Chủ Trại'}</span>
                </div>
                <span>•</span>
                <span>📅 Phát lúc: <strong className="text-gray-300">{startedDate}</strong></span>
                {selectedReplay.stream_key && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-gray-500">Luồng: {selectedReplay.stream_key}</span>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-300/80 leading-relaxed pt-2">
                Video được tự động lưu trữ và tối ưu hóa cho đường truyền ổn định. Bạn có thể xem lại toàn bộ các diễn biến xổ gà, báo giá và tương tác của phiên live này.
              </p>

              {(currentUser?.role === 'admin' || currentUser?.role === 'systemadmin') && selectedReplay.record_status !== 'uploaded_drive' && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-amber-400">Video này đang lưu tạm trên VPS (7 ngày).</span>
                  <button
                    type="button"
                    onClick={() => archiveReplay(selectedReplay)}
                    disabled={archivingReplayId === (selectedReplay.id || selectedReplay._id || selectedReplay.replay_url)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                  >
                    <Archive className="h-4 w-4" />
                    Lưu trữ lên Google Drive ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cột phụ: Danh sách các phiên live khác (Playlist) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Các Video Khác</span>
                <span className="text-xs text-gray-400 font-normal">({otherReplays.length})</span>
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {otherReplays.length > 0 ? (
                otherReplays.map((rep) => {
                  const repId = String(rep.id || rep._id || rep.replay_url);
                  const dStr = rep.started_at ? new Date(rep.started_at).toLocaleDateString('vi-VN') : 'Mới đây';
                  return (
                    <div
                      key={repId}
                      onClick={() => {
                        setSelectedReplay(rep);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex gap-3 p-2.5 rounded-xl bg-[#14151b] border border-white/10 hover:border-amber-500/50 hover:bg-white/5 transition cursor-pointer"
                    >
                      <div className="relative w-28 h-18 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                        <img
                          src="/img/rooster_dongtao.jpg"
                          alt={rep.title}
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-85 transition"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow">
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 line-clamp-2 transition leading-snug">
                          {rep.title || `Phiên Live: ${rep.stream_key}`}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="truncate">{rep.streamer || 'Chủ Trại'}</span>
                          <span>{dStr}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#14151b] p-6 text-center text-xs text-gray-400">
                  Không còn video xem lại nào khác.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component thanh lọc chạng gà dùng chung cho cả trang chủ và phòng live
  const renderCategoryTabs = () => (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm font-medium">
      <button
        onClick={() => setActiveCategory('all')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border cursor-pointer whitespace-nowrap shrink-0 ${activeCategory === 'all'
            ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
            : 'bg-[#151720] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
      >
        Tất Cả Chạng Gà
      </button>
      <button
        onClick={() => setActiveCategory('don')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border cursor-pointer whitespace-nowrap shrink-0 ${activeCategory === 'don'
            ? 'bg-red-700 text-white border-red-600 shadow-sm'
            : 'bg-[#151720] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
      >
        Gà Đòn Chiến (2.8kg - 3.2kg)
      </button>
      <button
        onClick={() => setActiveCategory('noi')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border cursor-pointer whitespace-nowrap shrink-0 ${activeCategory === 'noi'
            ? 'bg-red-700 text-white border-red-600 shadow-sm'
            : 'bg-[#151720] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
      >
        Gà Nòi Cựa Tuyển
      </button>
      <button
        onClick={() => setActiveCategory('tre')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border cursor-pointer whitespace-nowrap shrink-0 ${activeCategory === 'tre'
            ? 'bg-red-700 text-white border-red-600 shadow-sm'
            : 'bg-[#151720] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
      >
        Gà Tre Tân Châu Cảnh
      </button>
      <button
        onClick={() => setActiveCategory('dongtao')}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border cursor-pointer whitespace-nowrap shrink-0 ${activeCategory === 'dongtao'
            ? 'bg-red-700 text-white border-red-600 shadow-sm'
            : 'bg-[#151720] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
      >
        Gà Đông Tảo Chuẩn F1
      </button>
    </div>
  );

  if (isLiveStudioPage) {
    return (
      <main className="min-h-[100dvh] bg-[#0c0d11] text-gray-100 font-sans antialiased">
        {!isAuthHydrated ? (
          <div className="min-h-[100dvh] flex items-center justify-center text-sm text-gray-400">
            Đang tải Live Studio...
          </div>
        ) : (
          <LiveStudioModal
            isOpen={isLiveStudioOpen}
            onClose={closeLiveStudioPage}
            streamKeys={displayKeys}
            currentStreamKey={streamKey}
            user={currentUser}
            sessions={sessions}
            onStreamStarted={(startedKey) => {
              setStreamKey(startedKey);
              setInputKey(startedKey);
            }}
          />
        )}
      </main>
    );
  }

  if (isSystemAdminPage) {
    return (
      <main className="min-h-[100dvh] bg-slate-950 text-slate-100 font-sans antialiased">
        {!isAuthHydrated ? (
          <div className="min-h-[100dvh] flex items-center justify-center text-sm text-slate-400">
            Đang tải bảng quản trị...
          </div>
        ) : currentUser?.role === 'systemadmin' ? (
          <SystemAdminDashboard
            isOpen={isSystemAdminOpen}
            isFullPage
            onClose={closeSystemAdminPage}
            token={authToken}
            currentUser={currentUser}
          />
        ) : (
          <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 px-4 text-center">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-lg font-bold text-white">Cần quyền Tổng Quản Trị</h1>
            <p className="text-sm text-slate-400">Đăng nhập bằng tài khoản sysadmin để mở màn quản trị.</p>
            <button onClick={closeSystemAdminPage} className="mt-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500">
              Quay lại trang chủ
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d11] text-gray-100 font-sans antialiased flex flex-col selection:bg-rose-600 selection:text-white">

      {/* ==================== TOP BAR ==================== */}
      <div className="hidden md:block border-b border-white/10 bg-[#1e2329] text-xs text-slate-300 py-2 px-4 sm:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[#edb929] font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#edb929]" />
              Trại Gà Thành Trung Long Biên
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300 truncate">
              Giao Lưu Đam Mê • Vần Xổ Gà Đòn Trực Tiếp
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium shrink-0">
            <a
              href="https://zalo.me/0909999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0068ff] hover:text-blue-400 font-bold hidden sm:flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#0068ff]" />
              <span>Nhắn Zalo Chủ Trại</span>
            </a>
            <a
              href="tel:0909999999"
              className="text-slate-200 hover:text-[#edb929] flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#edb929]" />
              <span className="text-slate-400">Hotline/Zalo:</span> <span className="font-bold text-[#edb929]">0909.999.999</span>
            </a>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {displayKeys.length > 0 ? `${displayKeys.length} Kênh` : 'Chưa có kênh'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN HEADER ==================== */}
      <header className="sticky top-0 z-40 bg-[#12141c]/95 backdrop-blur-md border-b border-slate-800">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">

          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center gap-2 xl:gap-6 min-w-0 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveNavTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-2.5 group shrink-0 cursor-pointer"
            >
              {/* Prestigious crest emblem */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 p-[1.5px] shadow-md group-hover:shadow-amber-500/20 transition-all shrink-0">
                <div className="w-full h-full bg-[#14151b] rounded-[7px] flex items-center justify-center border border-amber-400/30">
                  <span className="text-amber-400 font-black text-xs sm:text-sm tracking-tight">TT</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-lg font-black tracking-tight text-white leading-none whitespace-nowrap">
                    TRẠI GÀ <span className="text-[#edb929]">THÀNH TRUNG LONG BIÊN</span>
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-semibold text-gray-400 tracking-wider uppercase whitespace-nowrap mt-0.5">
                  Giao Lưu Đam Mê • Vần Xổ Gà Đòn
                </span>
              </div>
            </a>

            {/* Navigation (Desktop) - Chữ to, rõ ràng, dễ nhìn */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold shrink-0">
              <button
                onClick={() => {
                  setSelectedMarketChicken(null);
                  setActiveNavTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeNavTab === 'home'
                    ? 'text-red-500 bg-red-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                Trang Chủ
              </button>

              <button
                onClick={() => {
                  setSelectedMarketChicken(null);
                  setActiveNavTab('live');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center justify-center cursor-pointer ${activeNavTab === 'live'
                    ? 'text-red-500 bg-red-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span>Trực Tiếp</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMarketChicken(null);
                  setSelectedReplay(null);
                  setActiveNavTab('replays');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${activeNavTab === 'replays'
                    ? 'text-red-500 bg-red-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                Xem Lại
              </button>

              {/* Tạm ẩn mục Chợ Gà theo yêu cầu.
              <button
                onClick={() => {
                  setSelectedMarketChicken(null);
                  setActiveNavTab('market');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${activeNavTab === 'market'
                    ? 'text-red-500 bg-red-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span>Chợ Gà</span>
              </button>
              */}

              <button
                onClick={() => setIsPolicyModalOpen(true)}
                className="px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Lưu Ý Gửi Xe
              </button>
            </nav>
          </div>

          {/* Right: Search, Post chicken button, Admin controls, User Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Prominent Đăng Bán Gà Button (Chỉ hiển thị cho tài khoản Admin Chủ Trại hoặc SystemAdmin) */}
            {/* Tạm ẩn chức năng đăng bán gà theo yêu cầu.
            {(currentUser?.role === 'admin' || currentUser?.role === 'systemadmin') && (
              <button
                onClick={openPostChickenWithAuth}
                className="hidden sm:flex bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                title="Đăng bán chiến kê tuyển chọn"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Đăng Bán Gà</span>
              </button>
            )}
            */}

{/* Nút chuyển đổi Sáng / Tối đã được ẩn, mặc định giữ cố định chế độ Tối theo yêu cầu */}

            {/* User authenticated actions */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* SYSTEM ADMIN BUTTON */}
                {currentUser.role === 'systemadmin' && (
                  <button
                    onClick={openSystemAdminPage}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] sm:text-xs transition shadow-sm border border-purple-400/40 cursor-pointer whitespace-nowrap shrink-0"
                    title="Mở Bảng Tổng Quản Trị Hệ Thống"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-200" />
                    <span>Quản Trị</span>
                  </button>
                )}

                {/* ADMIN BROADCAST & PANEL BUTTONS */}
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={openLiveStudioPage}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] sm:text-xs transition shadow-sm border border-rose-500/40 cursor-pointer whitespace-nowrap shrink-0"
                      title="Bật camera phát sóng trực tiếp"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                      <span>Live</span>
                    </button>

                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] sm:text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                      title="Bảng điều khiển quản trị viên"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Quản Trị</span>
                    </button>
                  </>
                )}

                {/* User avatar & profile button: Click để mở trang Hồ Sơ Cá Nhân */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMarketChicken(null);
                    setActiveNavTab('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 border rounded-full py-1 px-2 sm:px-2.5 shrink-0 transition-all cursor-pointer group shadow-sm active:scale-95 ${
                    activeNavTab === 'profile'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/20'
                      : 'bg-[#16171f] hover:bg-[#20222f] border-white/10 hover:border-amber-400/50 text-gray-200'
                  }`}
                  title="Xem và chỉnh sửa hồ sơ cá nhân (Lưu vào Database)"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.username}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/60 shrink-0"
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full text-white font-bold text-[11px] flex items-center justify-center uppercase shrink-0 ${currentUser.role === 'systemadmin' ? 'bg-purple-600' : currentUser.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
                      }`}>
                      {currentUser.username.substring(0, 1)}
                    </div>
                  )}
                  <span className={`text-xs font-semibold hidden sm:inline whitespace-nowrap transition-colors ${
                    activeNavTab === 'profile' ? 'text-amber-300 font-bold' : 'group-hover:text-amber-300'
                  }`}>
                    {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'systemadmin' ? 'SysAdmin' : (currentUser.full_name || currentUser.username).split(' ')[0]}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg bg-[#16171f] hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition cursor-pointer shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Đăng Nhập</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Sub-Navigation Bar (Chia đều 4 nút vừa khít 100% chiều ngang điện thoại) */}
      <div className="lg:hidden grid grid-cols-4 border-b border-white/10 bg-[#0e0f14] px-2.5 py-1.5 gap-1.5 text-[11px] font-medium">
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors cursor-pointer ${activeNavTab === 'home' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          Trang Chủ
        </button>
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('live');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors flex items-center justify-center cursor-pointer ${activeNavTab === 'live' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          <span className="truncate">Trực Tiếp</span>
        </button>
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setSelectedReplay(null);
            setActiveNavTab('replays');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors cursor-pointer ${activeNavTab === 'replays' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          Xem Lại
        </button>
        {/* Tạm ẩn mục Chợ Gà trên thanh điều hướng mobile.
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('market');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors cursor-pointer ${activeNavTab === 'market' ? 'bg-amber-500 text-black font-extrabold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          Chợ Gà
        </button>
        */}
        <button
          onClick={() => setIsPolicyModalOpen(true)}
          className="py-1.5 px-1 rounded-lg text-center truncate text-gray-400 hover:text-white bg-white/5 cursor-pointer"
        >
          Gửi Xe
        </button>
      </div>

      {/* ==================== MAIN CONTENT WRAPPER ==================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-8 w-full">

        {/* ======================================================== */}
        {/* VIEW 1: TRANG CHỦ (HOME VIEW)                            */}
        {/* ======================================================== */}
        {activeNavTab === 'home' && (
          <div className="space-y-8">

            {/* ==================== HERO SPOTLIGHT BANNER + ACTIVE CHANNELS LIST ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Left: Big Spotlight Banner (8 cols) */}
              <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[300px] sm:min-h-[360px] shadow-xl flex flex-col justify-end group">

                {effectiveIsLive ? (
                  /* TRƯỜNG HỢP CÓ NGƯỜI LIVE: CHIẾU PHÒNG NHIỀU NGƯỜI XEM NHẤT */
                  <div className="relative w-full h-full min-h-[340px] sm:min-h-[380px] flex flex-col justify-between bg-[#14151c]">
                    <div className="relative w-full aspect-video bg-black overflow-hidden">
                      <LivePlayer streamKey={topLiveRoom.id} />

                      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                        <span className="bg-red-700 text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          ĐANG PHÁT TRỰC TIẾP
                        </span>
                        <span className="text-xs text-amber-300 font-bold bg-black/80 px-2.5 py-1 rounded-md border border-amber-500/40">
                          {topLiveRoom.viewers} người đang xem
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 bg-[#14151c] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-amber-400 font-bold flex items-center gap-2">
                          <span>{topLiveRoom.farm}</span>
                          <span>•</span>
                          <span>Chủ kê: {topLiveRoom.streamer}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                          {topLiveRoom.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {topLiveRoom.loi} • Trực tiếp từ chuồng xổ
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
                        <button
                          onClick={() => changeChannel(topLiveRoom.id, true)}
                          className="flex-1 sm:flex-initial justify-center bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 sm:px-5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                        >
                          <Tv className="w-4 h-4" />
                          <span>VÀO PHÒNG LIVE</span>
                        </button>
                        <button
                          onClick={() => openConnectWithFarm(topLiveRoom.title, topLiveRoom.farm)}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-lg transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>LIÊN HỆ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Khi chưa live, chỉ hiển thị dữ liệu lịch có thật nếu có. */
                  <div className={`relative w-full h-full min-h-[280px] sm:min-h-[340px] flex flex-col justify-end p-5 sm:p-8 rounded-2xl overflow-hidden ${
                    themeMode === 'light' ? 'bg-gradient-to-br from-white to-amber-50/30 border border-slate-200 shadow-sm' : 'bg-slate-900 border border-white/10'
                  }`}>
                    <div
                      className={`absolute inset-0 bg-cover bg-center pointer-events-none ${
                        themeMode === 'light' ? 'opacity-30' : 'opacity-40'
                      }`}
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1200&auto=format&fit=crop')` }}
                    ></div>
                    <div className={`absolute inset-0 ${
                      themeMode === 'light'
                        ? 'bg-gradient-to-r from-white/95 via-white/80 to-white/40'
                        : 'bg-gradient-to-t from-[#0e1017] via-[#0e1017]/85 to-transparent'
                    }`}></div>

                    <div className="relative z-10 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-rose-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wide shadow-sm">
                          {currentRoomInfo?.title || 'Chưa có lịch phát sóng'}
                        </span>
                        <span className={`text-xs font-bold ${
                          themeMode === 'light' ? 'text-amber-800' : 'text-amber-400'
                        }`}>
                          {[currentRoomInfo?.farm, currentRoomInfo?.streamer].filter(Boolean).join(' • ')}
                        </span>
                      </div>

                      <h2 className={`text-lg sm:text-3xl font-black tracking-tight leading-snug ${
                        themeMode === 'light' ? 'text-slate-950' : 'text-white'
                      }`}>
                        {currentRoomInfo?.chang ? `Chạng ${currentRoomInfo.chang}` : 'Chưa có thông tin lịch'} <span className={themeMode === 'light' ? 'text-rose-600' : 'text-amber-400'}>{currentRoomInfo?.loi || ''}</span>
                      </h2>

                      <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                        themeMode === 'light' ? 'text-slate-700 font-medium' : 'text-slate-300'
                      }`}>
                        {currentRoomInfo?.farm || 'Thông tin sẽ hiển thị khi kênh được cấu hình.'}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2">
                        {/* Tạm ẩn nút dẫn tới khu mua bán gà.
                        <button
                          onClick={() => {
                            if (activeNavTab !== 'market') setActiveNavTab('market');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-md"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          XEM DÀN GÀ ĐANG CÓ SẴN
                        </button>
                        */}
                        <button
                          onClick={() => currentRoomInfo && openConnectWithFarm(currentRoomInfo.title, currentRoomInfo.farm)}
                          disabled={!currentRoomInfo}
                          className={`w-full sm:w-auto justify-center text-xs sm:text-sm font-bold py-2.5 px-4 rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                            themeMode === 'light'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <Phone className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-amber-700' : 'text-amber-400'}`} />
                          LIÊN HỆ XEM CLIP ZALO
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Active Live Channels Widget (4 cols) */}
              <div className={`lg:col-span-4 rounded-2xl border p-4 flex flex-col justify-between shadow-xl ${
                themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#16171d] border-white/10'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b ${
                  themeMode === 'light' ? 'border-slate-200' : 'border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${actualLiveRooms.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                      themeMode === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {actualLiveRooms.length > 0 ? 'Đang Xổ & Lên Sóng' : 'Danh Sách Kênh'}
                    </h3>
                  </div>
                  <span
                    onClick={() => { setActiveNavTab('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`text-xs font-bold cursor-pointer hover:underline ${
                      actualLiveRooms.length > 0 ? 'text-rose-600' : 'text-gray-400'
                    }`}
                  >
                    {actualLiveRooms.length > 0 ? `${actualLiveRooms.length} Kênh Live` : 'Chờ lên sóng'}
                  </span>
                </div>

                {/* List of active channels */}
                <div className="space-y-2.5 my-3 overflow-y-auto max-h-[260px] pr-1">
                  {(() => {
                    const sortedKeys = [...displayKeys].sort((a, b) => {
                      const aKey = (a.key || a.id || '').trim().toLowerCase();
                      const bKey = (b.key || b.id || '').trim().toLowerCase();
                      const aLive = allLiveKeys.includes(aKey);
                      const bLive = allLiveKeys.includes(bKey);
                      if (aLive && !bLive) return -1;
                      if (!aLive && bLive) return 1;
                      return 0;
                    });

                    return sortedKeys.map((item) => {
                      const itemKey = (item.key || item.id || '').trim().toLowerCase();
                      const isItemLive = allLiveKeys.includes(itemKey);
                      const isSelected = streamKey === (item.key || item.id);

                      return (
                        <div
                          key={item.key || item.id}
                          onClick={() => {
                            setPreviewSelectedChannel(item.key || item.id);
                            changeChannel(item.key || item.id, true);
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isItemLive
                              ? (isSelected
                                  ? (themeMode === 'light' ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-rose-950/40 border-rose-500/60 shadow-md')
                                  : (themeMode === 'light' ? 'bg-rose-50/50 hover:bg-rose-50 border-rose-200' : 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/30'))
                              : (isSelected
                                  ? (themeMode === 'light' ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-white/5 border-white/20 shadow-sm')
                                  : (themeMode === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#111217] hover:bg-white/5 border-white/5'))
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className={`flex items-center gap-1.5 font-bold truncate max-w-[170px] ${
                              themeMode === 'light' ? 'text-slate-900' : 'text-gray-300'
                            }`}>
                              🐓 {item.title || item.streamer || 'Phòng Live Trại Gà'}
                            </span>
                            {isItemLive ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                LIVE
                              </span>
                            ) : (
                              <span className="text-gray-500 font-medium text-[10px]">
                                Chờ lên sóng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`text-[11px] ${themeMode === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                              Chủ kê: {item.streamer || 'Trại Gà Thành Trung'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                              isItemLive
                                ? (isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                                : (isSelected
                                    ? (themeMode === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white')
                                    : (themeMode === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-gray-300'))
                            }`}>
                              {isItemLive ? 'Xem luồng' : 'Vào kênh'}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div
                  onClick={() => { setActiveNavTab('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`pt-2 text-center text-[11px] font-bold cursor-pointer border-t flex items-center justify-center gap-1 ${
                    themeMode === 'light' ? 'border-slate-200 text-rose-600 hover:text-rose-700' : 'border-white/10 text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span>📺 Vào Phòng Live Xổ Gà xem đầy đủ &gt;</span>
                </div>
              </div>

            </div>

            {/* ==================== XEM LẠI PHIÊN LIVE ĐÃ PHÁT ==================== */}
            {renderReplaysSection()}

            {/* ==================== DANH SÁCH GÀ ĐANG BÁN (CÓ ẢNH RÕ RÀNG, BẤM XEM CHI TIẾT) ==================== */}
            {/* Tạm ẩn danh sách gà mua bán/giao lưu trên trang chủ. */}
            {false ? (
            <section id="featured-chickens" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl sm:text-2xl font-black ${
                  themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  Gà Đang Bán Tại Trại &amp; Giao Lưu
                </h2>
                {chickensList.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedMarketChicken(null);
                      setActiveNavTab('market');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`text-sm font-bold hover:underline cursor-pointer ${
                      themeMode === 'light' ? 'text-rose-600' : 'text-amber-400'
                    }`}
                  >
                    Xem tất cả ({chickensList.length}) &gt;
                  </button>
                )}
              </div>

              {isChickensLoading ? (
                /* Skeleton Loading State */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 animate-pulse space-y-3.5 ${
                        themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#16171d] border-white/10'
                      }`}
                    >
                      <div className={`h-48 rounded-xl ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                      <div className="space-y-2">
                        <div className={`h-5 w-2/3 rounded ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                        <div className={`h-4 w-full rounded ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                      </div>
                      <div className={`h-9 w-full rounded-lg ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                    </div>
                  ))}
                </div>
              ) : chickensList.length === 0 ? (
                /* Empty state when no chickens in DB */
                <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-4 shadow-sm ${
                  themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#16171d] border-white/10'
                }`}>
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl font-bold">
                    🐓
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-bold text-base sm:text-lg ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Chưa có chiến kê nào trong danh mục
                    </h3>
                    <p className={`text-xs sm:text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                      Các chiến kê giao lưu đang được đồng bộ trực tiếp từ cơ sở chuồng trại.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={fetchChickens}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
                    >
                      Tải lại danh sách gà
                    </button>
                    {currentUser && (currentUser.role === 'admin' || currentUser.role === 'systemadmin') && (
                      <button
                        onClick={() => setIsPostChickenModalOpen(true)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition cursor-pointer font-bold shadow-md"
                      >
                        + Đăng Bán Chiến Kê Mới
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {chickensList.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition overflow-hidden flex flex-col justify-between shadow-sm ${
                        themeMode === 'light'
                          ? 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-md'
                          : 'bg-[#16171d] border-white/10 hover:border-amber-500/50'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedMarketChicken(item);
                          setActiveNavTab('market');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="relative h-52 bg-black overflow-hidden cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="bg-black/80 text-amber-400 text-xs font-bold px-2.5 py-1 rounded">
                            {item.ms}
                          </span>
                          <span className="bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded">
                            Chạng: {item.chang}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`text-lg font-black ${
                              themeMode === 'light' ? 'text-rose-600' : 'text-amber-400'
                            }`}>
                              {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Giá thỏa thuận')}
                            </span>
                            <span className={`text-xs ${
                              themeMode === 'light' ? 'text-slate-500 font-medium' : 'text-gray-400'
                            }`}>
                              {item.location}
                            </span>
                          </div>
                          <h3
                            onClick={() => {
                              setSelectedMarketChicken(item);
                              setActiveNavTab('market');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`font-bold text-base line-clamp-2 hover:text-rose-600 cursor-pointer leading-snug ${
                              themeMode === 'light' ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {item.title}
                          </h3>
                          <p className={`text-sm ${
                            themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                          } line-clamp-2 leading-relaxed`}>
                            {item.farm} • {item.canVay}
                          </p>
                        </div>

                        <div className={`pt-3 border-t grid grid-cols-2 gap-2.5 ${
                          themeMode === 'light' ? 'border-slate-100' : 'border-white/10'
                        }`}>
                          <button
                            onClick={() => {
                              setSelectedMarketChicken(item);
                              setActiveNavTab('market');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`py-2 px-3 rounded-lg border text-sm font-bold transition cursor-pointer text-center ${
                              themeMode === 'light'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                : 'bg-[#0e0f14] hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            Xem Chi Tiết
                          </button>
                          {currentUser ? (
                            <a
                              href={`tel:${item.phone?.replace(/\D/g, '') || '0909999999'}`}
                              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Gọi Điện</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openConnectWithFarm(item.title, item.farm)}
                              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Gọi Điện</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            ) : null}

            {/* ==================== CÁC CƠ SỞ TRẠI GÀ THÀNH TRUNG ==================== */}
            {/* Tạm ẩn danh sách cơ sở trại gà theo yêu cầu.
            <section id="farms" className="space-y-3">
              <h2 className="text-lg font-bold text-white">
                Các Cơ Sở Trại Gà Thành Trung
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {displayKeys.map((f) => (
                  <div
                    key={f.key || f.id}
                    onClick={() => changeChannel(f.key || f.id, true)}
                    className="p-3.5 rounded-xl bg-[#14151c] border border-white/10 hover:border-amber-500/50 cursor-pointer transition text-center space-y-1"
                  >
                    <div className="text-sm font-bold text-white truncate">{f.title || f.streamer || f.key || f.id}</div>
                    <div className="text-xs text-gray-400 truncate">{f.streamer || f.key || f.id}</div>
                  </div>
                ))}
                {displayKeys.length === 0 && <p className="col-span-full text-sm text-gray-400">Chưa có cơ sở nào được cấu hình.</p>}
              </div>
            </section>
            */}

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: PHÒNG LIVE TRỰC TIẾP (DEDICATED LIVE THEATER VIEW) */}
        {/* ======================================================== */}
        {activeNavTab === 'live' && (
          <div className="space-y-6 animate-fadeIn">

            {/* Breadcrumb & Navigation Bar */}
            <div className="flex items-center justify-between gap-2 bg-[#14151c] border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xl">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => {
                    setActiveNavTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition flex items-center gap-1 border border-white/10 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Về Trang Chủ</span>
                </button>
                <div className="h-4 w-px bg-white/15 hidden sm:block"></div>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                  <h1 className="text-xs sm:text-lg font-black uppercase text-white tracking-wide truncate">
                    <span className="hidden sm:inline">Phòng Live: </span>
                    <span className="text-amber-400">{currentRoomInfo?.farm || currentRoomInfo?.streamer || ''}</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const shareCode = encodeRoomKey(streamKey);
                    const shareUrl = `${window.location.origin}/?live=${shareCode}`;
                    copyToClipboard(shareUrl, 'shareChannel');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1b1c25] hover:bg-white/10 text-gray-300 hover:text-white text-[11px] sm:text-xs font-semibold border border-white/10 transition cursor-pointer"
                  title="Sao chép link an toàn phòng live này để gửi anh em xem"
                >
                  {copiedField === 'shareChannel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedField === 'shareChannel' ? 'Đã sao chép!' : 'Chia sẻ'}</span>
                </button>
              </div>
            </div>

            {/* ==================== CAKHIATV LIVE THEATER: PLAYER & INTERACTION ==================== */}
            {/* CHỈ HIỂN THỊ KHI CÓ NGƯỜI ĐANG LIVE (ẢNH 1-2) HOẶC NGƯỜI DÙNG BẤM CHỌN KÊNH XEM */}
            {(effectiveIsLive || previewSelectedChannel) && (
              <section ref={playerSectionRef} id="main-player-section" className="space-y-4 pt-1">

              {/* KHUNG MAIN VIDEO VÀ LIVE CHAT (Desktop 8-4 cols, Mobile full-stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Cột trái: LivePlayer + CakhiaTV Controls & Icon Tab Bar (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-3">

                  {/* VIDEO PLAYER COMPONENT (HLS Stream) */}
                  <div className="relative rounded-none overflow-hidden bg-[#13141b]">
                    <div className="bg-black">
                      <LivePlayer streamKey={streamKey} />
                    </div>

                    {/* Overlay Thẻ Chiến Kê đang lên sóng */}
                    <div className="p-3 bg-[#13141b] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xl shrink-0">
                          🐓
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">
                              {currentRoomInfo?.title || ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {[currentRoomInfo?.farm, currentRoomInfo?.loi].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => currentRoomInfo && openConnectWithFarm(currentRoomInfo.title, currentRoomInfo.farm)}
                        disabled={!currentRoomInfo}
                        className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs px-4 py-2.5 sm:py-2 rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hỏi Về Con Này</span>
                      </button>
                    </div>
                  </div>

                  {/* KHỐI TIỆN ÍCH PHÒNG LIVE HỌC HỎI TỪ TRIEUGADON.COM (Server HD1/2/3, Odds, STK chuyển khoản, Nội quy) */}
                  {renderLiveUtilitiesSection()}

                  {/* PHÒNG BÌNH LUẬN TRỰC TIẾP TRÊN MOBILE */}
                  <div className="block lg:hidden">
                    <div className="h-[430px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16171d] shadow-xl">
                      <LiveChat
                        streamKey={streamKey}
                        user={currentUser}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                      />
                    </div>
                  </div>

                </div>

                {/* Cột phải (Desktop 4 cols): Phòng bình luận trực tiếp */}
                <div className="hidden lg:flex lg:col-span-4 flex-col gap-3">
                  <div className="h-[560px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16171d] shadow-xl">
                    <LiveChat
                      streamKey={streamKey}
                      user={currentUser}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                    />
                  </div>
                </div>

              </div>

            </section>
            )}

            {/* ==================== SECTION 1: CÁC PHÒNG LIVE XỔ GÀ (ẢNH 3 KHI CHƯA CÓ AI LIVE) ==================== */}
            <section id="live-section" className="space-y-4">
              {(() => {
                const candidateRooms = showAllRooms ? liveRooms : actualLiveRooms;
                const displayedRooms = candidateRooms;

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 bg-rose-500 rounded-full shrink-0"></div>
                        <h2 className="text-base sm:text-xl font-extrabold tracking-tight text-white uppercase">
                          {showAllRooms ? 'Danh Sách Tất Cả Kênh Phát' : (actualLiveRooms.length > 0 ? 'Các Phòng Đang Lên Sóng Trực Tiếp' : 'Phòng Phát Sóng Trực Tiếp')}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAllRooms(false)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${!showAllRooms
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${actualLiveRooms.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></span>
                          Đang Live ({actualLiveRooms.length})
                        </button>
                        <button
                          onClick={() => setShowAllRooms(true)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${showAllRooms
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          Tất cả kênh ({liveRooms.length})
                        </button>
                      </div>
                    </div>

                    {displayedRooms.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-2xl bg-[#16171d] border border-white/10 flex flex-col items-center justify-center space-y-3.5 shadow-xl">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                          <Radio className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 text-center">
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {!showAllRooms ? 'Hiện chưa có phòng nào đang phát sóng trực tiếp' : 'Không có kênh nào phù hợp với danh mục này'}
                          </h3>
                          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                            {!showAllRooms
                              ? 'Hiện chưa có kênh phát sóng. Bạn có thể xem các video phát lại bên dưới.'
                              : 'Vui lòng chọn danh mục khác hoặc chuyển về xem tất cả.'}
                          </p>
                        </div>
                        {!showAllRooms && (
                          <button
                            onClick={() => setShowAllRooms(true)}
                            className="mt-1 text-xs font-bold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
                          >
                            Xem danh sách {liveRooms.length} kênh trong hệ thống
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5">
                        {displayedRooms.map((room) => {
                          const isRoomLive = allLiveKeys.includes((room.id || room.key || '').toLowerCase());
                          const defaultThumb = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500&auto=format&fit=crop';
                          const thumbUrl = (room.thumb && room.thumb.trim()) ? room.thumb.trim() : defaultThumb;

                          return (
                            <div
                              key={room.id}
                              onClick={() => {
                                setPreviewSelectedChannel(room.id);
                                changeChannel(room.id, true);
                              }}
                              className={`bg-[#16171d] rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer group shadow-xl flex flex-col justify-between ${streamKey === room.id ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-white/10 hover:border-rose-500/60'
                                }`}
                            >
                              <div className="relative h-32 bg-slate-900 overflow-hidden">
                                <img
                                  src={thumbUrl}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = defaultThumb;
                                  }}
                                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                  alt=""
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40"></div>

                                {isRoomLive ? (
                                  <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE ({room.viewers || 0})
                                  </span>
                                ) : (
                                  <span className="absolute top-2 right-2 bg-slate-900/90 text-slate-300 border border-white/15 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                                    Chờ lên sóng
                                  </span>
                                )}

                                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                                  <div className="w-6 h-6 rounded-full border border-white/40 bg-slate-900/90 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                    {(room.streamer || 'T').substring(0, 1).toUpperCase()}
                                  </div>
                                </div>

                                {room.chang ? (
                                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-amber-300 border border-amber-500/30">
                                    Chạng: {room.chang}
                                  </div>
                                ) : (
                                  <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-slate-300 border border-white/15">
                                    {room.streamer || 'Chiến kê tuyển'}
                                  </div>
                                )}
                              </div>

                              <div className="p-3 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 truncate">
                                  <span className="text-amber-400">★</span>
                                  <span className="truncate">{room.farm || 'Trại Gà Thành Trung'}</span>
                                </div>

                                <div className="space-y-0.5">
                                  <h4 className="font-bold text-xs text-white truncate">
                                    {room.ms ? `${room.ms}: ` : ''}{room.title}
                                  </h4>
                                  <p className="text-[11px] text-gray-400 line-clamp-1">
                                    {room.loi || 'Giao lưu xổ đòn & kỹ thuật nuôi dưỡng kê chiến'}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 text-gray-300 font-semibold truncate">
                                    <span className="text-rose-500">🎙️</span>
                                    <span className="truncate">{room.streamer || 'Chủ Trại'}</span>
                                  </div>
                                  <button className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                                    {streamKey === room.id ? 'Đang xem' : 'Vào xem'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </section>

            {/* ==================== XEM LẠI CÁC PHIÊN LIVE TRƯỚC ĐÓ ==================== */}
            {renderReplaysSection()}

          </div>
        )}

        {activeNavTab === 'replays' && (
          <div className="space-y-8">
            {selectedReplay ? renderDedicatedReplayScreen() : renderReplaysSection()}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CHỢ GÀ BA MIỀN & MÀN HÌNH CHI TIẾT CHIẾN KÊ      */}
        {/* ======================================================== */}
        {/* Tạm ẩn toàn bộ khu vực chợ gà.
        {activeNavTab === 'market' && (
          selectedMarketChicken ? (
            <ChickenDetailModal
              chicken={selectedMarketChicken}
              isOpen={true}
              onClose={() => setSelectedMarketChicken(null)}
              onOpenConnect={openConnectWithFarm}
              relatedChickens={chickensList}
              onSelectChicken={(chicken) => setSelectedMarketChicken(chicken)}
              currentUser={currentUser}
            />
          ) : (
            <ChickenMarketplace
              chickens={chickensList}
              onOpenPostModal={openPostChickenWithAuth}
              onSelectChicken={(chicken) => setSelectedMarketChicken(chicken)}
              onOpenConnect={openConnectWithFarm}
              onOpenPolicy={() => setIsPolicyModalOpen(true)}
              currentUser={currentUser}
            />
          )
        )}
        */}

        {/* ======================================================== */}
        {/* VIEW 4: TRANG HỒ SƠ & TÀI KHOẢN CÁ NHÂN (FULL PAGE)      */}
        {/* ======================================================== */}
        {activeNavTab === 'profile' && (
          <UserProfilePage
            currentUser={currentUser}
            authToken={authToken}
            myStreamKey={myStreamKey}
            onProfileUpdated={(updatedUser) => {
              handleProfileUpdated(updatedUser);
              fetchKeysAndSessions();
            }}
            onBack={() => {
              setActiveNavTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateTab={(tab) => {
              setSelectedMarketChicken(null);
              setActiveNavTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </main>

      {/* TOAST MESSAGE THÔNG BÁO NHANH */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e2329] border border-[#edb929] text-[#edb929] px-4 py-2 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#edb929]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-16 bg-[#0a0b0e] border-t border-white/10 pt-10 pb-24 lg:pb-8 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveNavTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2"
              >
                <span className="text-xl">🐓</span>
                <span className="text-xl font-black tracking-tight text-white">
                  TRẠI GÀ <span className="text-rose-500">THÀNH TRUNG</span> <span className="text-xs font-bold text-amber-400">LONG BIÊN</span>
                </span>
              </a>
              <p className="leading-relaxed">
                Trại Gà Thành Trung Long Biên - Kênh phát sóng trực tiếp giao lưu gà nòi, gà đòn, gà tre cảnh. Nơi chia sẻ đam mê, học hỏi kinh nghiệm vần đòn và kết nối anh em kê thủ.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Mục Truy Cập Nhanh</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setActiveNavTab('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                  >
                    Trang chủ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveNavTab('live');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Phòng Live Xổ Gà
                  </button>
                </li>
                {/* Tạm ẩn liên kết Chợ Gà ở chân trang.
                <li>
                  <button
                    onClick={() => {
                      setActiveNavTab('market');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chợ Gà</span>
                  </button>
                </li>
                */}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hỗ Trợ Giao Nhận</h4>
              <ul className="space-y-2">
                <li><button onClick={() => setIsPolicyModalOpen(true)} className="hover:text-rose-400 text-left">Quy cách đóng thùng thoáng khí</button></li>
                <li><button onClick={() => setIsPolicyModalOpen(true)} className="hover:text-rose-400 text-left">Cách chăm sóc gà sau khi đi xe xa</button></li>
                <li><a href="#" className="hover:text-rose-400">Hướng dẫn kết nối Zalo với chủ trại</a></li>
                <li><a href="#" className="hover:text-rose-400">Quy chế sinh hoạt diễn đàn</a></li>
              </ul>
            </div>

            <div className="bg-[#13141a] rounded-2xl p-5 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Liên Hệ Ban Quản Trị</h4>
              <p>Hỗ trợ kết nối các trại gà uy tín và hướng dẫn cài đặt camera live trực tiếp.</p>
              <button
                onClick={() => alert('Hotline / Zalo Ban Quản Trị: 0909.999.999 (Hỗ trợ 24/7)')}
                className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-full transition-all text-center"
              >
                Nhắn Zalo Ban Quản Trị
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 Trại Gà Thành Trung - Cơ Sở Long Biên, Hà Nội. Giữ bản quyền nội dung.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Q. Long Biên, Hà Nội</span>
              <span>•</span>
              <span>Hotline / Zalo: 0909.999.999</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== MOBILE STICKY BOTTOM NAVIGATION BAR ==================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#12141c]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-safe grid grid-cols-3 gap-1 shadow-2xl">
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
            activeNavTab === 'home' ? 'text-rose-500 font-bold bg-rose-500/10' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Trang Chủ</span>
        </button>

        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('live');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer relative ${
            activeNavTab === 'live' ? 'text-rose-500 font-bold bg-rose-500/10' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Radio className="w-4 h-4 mb-0.5" />
            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="text-[10px]">Trực Tiếp</span>
        </button>

        {/* Tạm ẩn mục Chợ Gà trên thanh điều hướng mobile dưới cùng.
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('market');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
            activeNavTab === 'market' ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Chợ Gà</span>
        </button>
        */}

        {/* Tạm ẩn nút Đăng Bán trên thanh mobile; khôi phục khi mở lại chợ gà.
        {currentUser?.role === 'admin' ? (
          <button
            onClick={openPostChickenWithAuth}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Đăng Bán</span>
          </button>
        ) : currentUser?.role === 'systemadmin' ? (
          <button
            onClick={openSystemAdminPage}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-purple-300 font-bold bg-purple-600/15 border border-purple-500/30 cursor-pointer"
          >
            <Shield className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Quản Trị</span>
          </button>
        ) : (
          <button
            onClick={() => openConnectWithFarm('Tư vấn chọn chiến kê', 'Trại Gà Thành Trung Long Biên')}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-emerald-400 font-bold hover:text-white cursor-pointer"
          >
            <Phone className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Liên Hệ</span>
          </button>
        )}
        */}
      </nav>

      {/* ==================== FLOATING BACK TO TOP BUTTON ==================== */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 flex items-center justify-center transition-transform hover:scale-110"
        title="Lên đầu trang"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* ==================== MODAL KẾT NỐI VỚI CHỦ TRẠI ==================== */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16171f] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl font-black text-white">Liên Hệ Với Chủ Trại</h3>
              <p className="text-xs text-gray-400">Gửi lời nhắn để chủ trại gọi điện hoặc kết bạn Zalo trao đổi clip chi tiết</p>
            </div>

            <div className="bg-[#0e0f14] p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{selectedChickenForConnect.title}</div>
                <div className="text-[11px] text-amber-400 font-semibold">{selectedChickenForConnect.farm}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                effectiveIsLive ? 'text-emerald-400 bg-emerald-500/20' : 'text-gray-400 bg-white/10'
              }`}>
                {effectiveIsLive ? 'Đang Lên Sóng' : 'Chiến Kê Sẵn Sàng'}
              </span>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert(`✅ ĐÃ GỬI THÀNH CÔNG!\n\nChiến kê: ${selectedChickenForConnect.title}\nChủ trại: ${selectedChickenForConnect.farm}\n\nChủ trại sẽ nhắn tin hoặc gọi Zalo gửi clip chi tiết cho bạn.`);
              setIsConnectModalOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Tên anh em</label>
                <input required type="text" placeholder="Ví dụ: Anh Hùng, Chú Minh..." className="w-full bg-[#0e0f14] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Số điện thoại / Zalo</label>
                <input required type="tel" placeholder="09xx.xxx.xxx..." className="w-full bg-[#0e0f14] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Tỉnh / Thành phố đón xe</label>
                <input type="text" placeholder="Ví dụ: Bến xe Miền Đông, Bến xe Nước Ngầm..." className="w-full bg-[#0e0f14] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="font-bold text-gray-300 block mb-1">Lời nhắn (Cần xem thêm clip gì?)</label>
                <input type="text" placeholder="Ví dụ: Gửi giúp em clip quay sát cặp cán và clip thả nhấp..." className="w-full bg-[#0e0f14] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl shadow-lg transition-all text-sm uppercase">
                Gửi Lời Nhắn Cho Chủ Trại
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL LƯU Ý GIAO NHẬN ==================== */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16171f] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setIsPolicyModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-base font-bold">
              <Truck className="w-5 h-5" />
              <span>Kinh Nghiệm Giao Nhận Gà Qua Xe Khách</span>
            </div>

            <div className="space-y-3 text-gray-300 leading-relaxed">
              <div className="p-3 bg-[#0e0f14] rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">1. Đóng thùng lồng thoáng khí:</span>
                Thùng carton cứng có đục lỗ thông khí xung quanh, lót rơm hoặc trấu dày để chống trơn trượt móng gà khi xe chạy.
              </div>
              <div className="p-3 bg-[#0e0f14] rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">2. Hồi sức trước &amp; sau khi đi xe:</span>
                Cho gà uống nước chè xanh ấm hoặc nước điện giải nhẹ trước khi đưa lên xe. Khi đón lồng gà về, đưa vào chỗ râm mát nghỉ 30 phút rồi mới cho ăn nhẹ.
              </div>
              <div className="p-3 bg-[#0e0f14] rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">3. Đồng kiểm tra cùng nhà xe:</span>
                Khi nhận lồng từ tay phụ xe, anh em nhớ quay video khui thùng để tiện trao đổi nếu có bất kỳ vấn đề gì về thể trạng.
              </div>
            </div>

            <button
              onClick={() => setIsPolicyModalOpen(false)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}

      {/* ==================== SYSTEM & ADMIN MODALS ==================== */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => {
          setIsAdminPanelOpen(false);
          fetchKeysAndSessions();
          fetchReplays();
        }}
        token={authToken}
        currentUser={currentUser}
        currentStreamKey={streamKey}
      />



      {/* ==================== MARKETPLACE MODALS ==================== */}
      <PostChickenModal
        isOpen={isPostChickenModalOpen}
        onClose={() => setIsPostChickenModalOpen(false)}
        onAddChicken={handleAddChicken}
        currentUser={currentUser}
      />

    </div>
  );
}
