import React, { useState, useEffect, useRef } from 'react';
import LivePlayer from './components/LivePlayer';
import LiveChat from './components/LiveChat';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import LiveStudioModal from './components/LiveStudioModal';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import PostChickenModal from './components/PostChickenModal';
import ChickenDetailModal from './components/ChickenDetailModal';
import ChickenMarketplace from './components/ChickenMarketplace';
import UserProfileModal from './components/UserProfileModal';
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
  Swords,
  Camera,
  Headphones,
  History,
  BarChart3,
  Eye,
  Volume2
} from 'lucide-react';
import { getApiBaseUrl, getHlsBaseUrl, getRtmpBaseUrl, getHost } from './config';

export default function App() {
  const [streamKey, setStreamKey] = useState('thanhtrung01');
  const [inputKey, setInputKey] = useState('thanhtrung01');
  const [copiedField, setCopiedField] = useState(null);

  // Trạng thái xác thực & Người dùng
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [myStreamKey, setMyStreamKey] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSystemAdminOpen, setIsSystemAdminOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('chat'); // 'chat' | 'obs' | 'info'
  const [liveCamera, setLiveCamera] = useState('cam1'); // 'cam1' (toàn cảnh) | 'cam2' (soi chân vảy)
  const [liveAudioTrack, setLiveAudioTrack] = useState('blv'); // 'blv' (BLV Thành Trung) | 'arena' (Sới gốc)
  const [liveTab, setLiveTab] = useState('chat'); // 'chat' | 'info' | 'h2h' | 'market' | 'shipping'
  const [showAllRooms, setShowAllRooms] = useState(false); // false: chỉ hiện phòng đang live thực tế, true: hiện tất cả kênh đăng ký
  const [previewSelectedChannel, setPreviewSelectedChannel] = useState(null); // Kênh người dùng chủ động chọn xem khi không có live tự động
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('traiga_theme');
        if (saved === 'light' || saved === 'dark') {
          return saved;
        }
      } catch (e) {}
    }
    return 'dark'; // Dark Mode là mặc định theo thiết kế
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'light') {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark');
      }
      try {
        localStorage.setItem('traiga_theme', themeMode);
      } catch (e) {}
    }
  }, [themeMode]);

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
  const [selectedChickenForConnect, setSelectedChickenForConnect] = useState({
    title: 'MS 101: Gà Ô Chân Trắng Điểm Mực',
    farm: 'Trại Gà Thành Trung 01'
  });
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Danh sách key từ MongoDB & danh sách Video Xem Lại (Replays)
  const [dbKeys, setDbKeys] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [srsStreams, setSrsStreams] = useState([]);
  const [replays, setReplays] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState(null);

  // Điều hướng trang chính vs Phòng Live xổ gà
  const [activeNavTab, setActiveNavTab] = useState('home'); // 'home' | 'live'
  const [forceLivePreview, setForceLivePreview] = useState(null); // null (tự động theo luồng thật) | true | false

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
  }, []);

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
    setIsProfileModalOpen(false);
    setIsAdminPanelOpen(false);
    setIsSystemAdminOpen(false);
    setIsLiveStudioOpen(false);
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
        }
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

  // Tự động nhận diện kênh từ URL khi vào web và ẩn ngay tham số nhạy cảm khỏi thanh địa chỉ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get('stream') || params.get('channel') || params.get('key');
      const tabParam = params.get('tab');
      if (urlKey && urlKey.trim()) {
        const clean = urlKey.trim();
        setStreamKey(clean);
        setInputKey(clean);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('stream');
        cleanUrl.searchParams.delete('channel');
        cleanUrl.searchParams.delete('key');
        window.history.replaceState({}, '', cleanUrl.toString());
      }
      if (tabParam === 'live') {
        setActiveNavTab('live');
      }
    }
  }, []);

  // Phím tắt Ctrl+K để tìm kiếm nhanh & ESC đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
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
    setIsProfileModalOpen(false);
  };

  // Mở modal liên hệ chủ trại (Bắt buộc đăng nhập tài khoản trước khi liên hệ / mua / gửi lời nhắn)
  const openConnectWithFarm = (chickenTitle, farmName) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedChickenForConnect({
      title: chickenTitle || 'Chiến kê đang lên sóng',
      farm: farmName || 'Chủ trại'
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
  const currentRoomInfo = matchedPublicRoom || {
    id: streamKey,
    key: streamKey,
    ms: matchedDbKey?.ms || 'MS 101',
    title: matchedDbKey?.title || 'Trực Tiếp Giao Lưu Chiến Kê',
    farm: matchedDbKey?.streamer ? `Trại Gà ${matchedDbKey.streamer}` : 'Trại Gà Thành Trung 01',
    streamer: matchedDbKey?.streamer || 'Thành Trung 01',
    chang: matchedDbKey?.chang || '2.95 kg',
    loi: matchedDbKey?.loi || 'Lối ôm đấm kiềng hầu, đá mé giáp lưng',
    viewers: 0
  };

  // Chuyển đổi số người xem để so sánh: ví dụ '2.1k' -> 2100, '950' -> 950
  const parseViewers = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).toLowerCase().trim();
    if (str.endsWith('k')) return parseFloat(str) * 1000;
    return parseInt(str, 10) || 0;
  };

  // Xác định các stream key đang phát sóng thực tế:
  // 1. Luồng active thực tế trong SRS Media Server (WebRTC / RTMP)
  const activeSrsKeys = srsStreams
    .filter((s) => s?.publish?.active)
    .map((s) => s.name?.trim().toLowerCase())
    .filter(Boolean);

  // 2. Luồng active từ publicRooms (từ MongoDB backend sessions)
  const activeRoomKeys = publicRooms
    .filter((r) => r.is_live)
    .map((r) => (r.key || r.id || '').trim().toLowerCase())
    .filter(Boolean);

  // 3. Luồng active từ sessions
  const activeSessionKeys = sessions
    .filter((s) => s.status === 'live')
    .map((s) => (s.stream_key || '').trim().toLowerCase())
    .filter(Boolean);

  // Hợp nhất toàn bộ các nguồn kiểm tra live để đảm bảo khi chỉ có 1 mình live vẫn nhận diện 100%
  const allLiveKeys = Array.from(new Set([...activeSrsKeys, ...activeRoomKeys, ...activeSessionKeys]));
  const isRealLive = allLiveKeys.length > 0;
  const realLiveKeys = isRealLive ? allLiveKeys : [];
  const effectiveIsLive = forceLivePreview !== null ? forceLivePreview : isRealLive;

  // Lọc ra các phòng live thực tế
  const actualLiveRooms = liveRooms.filter((r) => {
    const k = (r.id || r.key || '').trim().toLowerCase();
    return allLiveKeys.includes(k) || Boolean(r.is_live);
  });
  const hasAnyLive = actualLiveRooms.length > 0;

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
  let topLiveRoom = null;
  if (effectiveIsLive && actualLiveRooms.length > 0) {
    topLiveRoom = actualLiveRooms[0];
  } else if (effectiveIsLive) {
    const candidateKeys = realLiveKeys.length > 0 ? realLiveKeys : ['thanhtrung01', 'thanhtrung02', 'thanhtrung03'];
    const candidates = candidateKeys.map((key) => {
      const room = liveRooms.find((r) => r.id.toLowerCase() === key);
      if (room) return room;
      const dbK = dbKeys.find((d) => d.key.toLowerCase() === key);
      return {
        id: key,
        ms: 'MS 101',
        title: dbK?.title || 'Trực Tiếp Giao Lưu Chiến Kê',
        farm: dbK?.streamer ? `Trại Gà ${dbK.streamer}` : 'Trại Gà Thành Trung 01',
        streamer: dbK?.streamer || 'Thành Trung 01',
        chang: '2.95 kg',
        loi: 'Lối ôm đấm kiềng hầu, đá mé giáp lưng',
        viewers: '2.5k',
        thumb: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500&auto=format&fit=crop'
      };
    });
    candidates.sort((a, b) => parseViewers(b.viewers) - parseViewers(a.viewers));
    topLiveRoom = candidates[0] || liveRooms[0];
  } else {
    topLiveRoom = liveRooms[0] || {
      id: 'thanhtrung01',
      title: 'Trại Gà Thành Trung 01 — Trực Tiếp Giao Lưu Chiến Kê',
      farm: 'Trại Gà Thành Trung 01',
      streamer: 'Thành Trung 01',
      chang: '2.95 kg',
      loi: 'Lối ôm đấm kiềng hầu, đá mé giáp lưng',
      viewers: 0
    };
  }

  // Component hiển thị danh sách Video Xem Lại (Google Drive / SRS DVR) dùng chung cho Trang Chủ & Phòng Live
  const renderReplaysSection = () => {
    if (!replays || replays.length === 0) return null;
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
                Video lưu trữ trên Google Drive • Bấm để xem lại toàn bộ buổi xổ gà
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                onClick={() => setSelectedReplay(rep)}
                className="group rounded-2xl overflow-hidden bg-[#14151b] border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-lg"
              >
                <div className="relative h-40 bg-gradient-to-br from-slate-900 via-[#1a1c26] to-rose-950/60 flex items-center justify-center overflow-hidden">
                  <img
                    src="/img/rooster_don.jpg"
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
                </div>
              </div>
            );
          })}
        </div>
      </section>
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

  return (
    <div className="min-h-screen bg-[#0c0d11] text-gray-100 font-sans antialiased flex flex-col selection:bg-rose-600 selection:text-white">

      {/* ==================== TOP BAR (Ẩn trên điện thoại để tiết kiệm chiều dọc màn hình) ==================== */}
      <div className="hidden md:block border-b border-slate-800 bg-[#0e1017] text-xs text-slate-300 py-2 px-4 sm:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Trại Gà Thành Trung
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300 truncate">
              Q. Long Biên, Hà Nội • Giờ tiếp khách: 07h30 - 20h00
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium shrink-0">
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="hover:text-amber-300 transition-colors hidden md:flex items-center gap-1.5 text-slate-300 cursor-pointer whitespace-nowrap"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Gửi xe khách toàn quốc</span>
            </button>
            <a
              href="tel:0988888888"
              className="text-slate-200 hover:text-amber-400 hidden lg:flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Hotline/Zalo:</span> <span className="font-bold text-white">0988.888.xxx</span>
            </a>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {displayKeys.length > 0 ? `${displayKeys.length} Kênh Trực Tuyến` : 'Trại Mở Cửa 24/7'}
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
                    TRẠI GÀ <span className="text-amber-400">THÀNH TRUNG</span>
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-semibold text-gray-400 tracking-wider uppercase whitespace-nowrap mt-0.5">
                  Cơ Sở Long Biên • Hà Nội
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
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 cursor-pointer ${activeNavTab === 'live'
                    ? 'text-red-500 bg-red-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <span>Xem Trực Tiếp</span>
              </button>

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
                <span>Chợ Gà Đang Bán ({chickensList.length})</span>
              </button>

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

            {/* Search Button (Ctrl+K) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              title="Tìm kiếm chạng gà, mã số MS (Ctrl+K)"
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleThemeMode}
              title={themeMode === 'dark' ? 'Chuyển sang giao diện Sáng (Light Mode)' : 'Chuyển sang giao diện Tối (Dark Mode)'}
              className="p-1.5 sm:px-2.5 sm:py-2 text-gray-300 hover:text-amber-400 hover:bg-white/5 rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs font-semibold">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden xl:inline text-xs font-semibold">Tối</span>
                </>
              )}
            </button>

            {/* User authenticated actions */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* SYSTEM ADMIN BUTTON */}
                {currentUser.role === 'systemadmin' && (
                  <button
                    onClick={() => setIsSystemAdminOpen(true)}
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
                      onClick={() => setIsLiveStudioOpen(true)}
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

                {/* User avatar & profile button: Click để mở hồ sơ & đổi avatar lưu DB */}
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 bg-[#16171f] hover:bg-[#20222f] border border-white/10 hover:border-amber-400/50 rounded-full py-1 px-2 sm:px-2.5 shrink-0 transition-all cursor-pointer group shadow-sm active:scale-95"
                  title="Nhấn để xem thông tin cá nhân và cài đặt ảnh đại diện (Lưu vào Database)"
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
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-amber-300 hidden sm:inline whitespace-nowrap transition-colors">
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
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors flex items-center justify-center gap-1 cursor-pointer ${activeNavTab === 'live' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0"></span>
          <span className="truncate">Trực Tiếp</span>
        </button>
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('market');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`py-1.5 px-1 rounded-lg text-center truncate transition-colors cursor-pointer ${activeNavTab === 'market' ? 'bg-amber-500 text-black font-extrabold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          Chợ Gà ({chickensList.length})
        </button>
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
                          {topLiveRoom.title} <span className="text-amber-400">({topLiveRoom.chang})</span>
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
                  /* TRƯỜNG HỢP HIỆN TẠI CHƯA CÓ LIVE: BANNER LỊCH XỔ GÀ */
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
                          LỊCH XỔ GÀ HÔM NAY
                        </span>
                        <span className={`text-xs font-bold ${
                          themeMode === 'light' ? 'text-amber-800' : 'text-amber-400'
                        }`}>
                          {currentRoomInfo.farm || 'Trại Gà Thành Trung'} • {currentRoomInfo.streamer || 'Long Biên, Hà Nội'}
                        </span>
                      </div>

                      <h2 className={`text-lg sm:text-3xl font-black tracking-tight leading-snug ${
                        themeMode === 'light' ? 'text-slate-950' : 'text-white'
                      }`}>
                        XỔ THỬ ĐÒN DÀN GÀ TƠ CHẠNG {currentRoomInfo.chang || '2K8 - 3K2'} &amp; <span className={themeMode === 'light' ? 'text-rose-600' : 'text-amber-400'}>SOI CÁN VẢY TRỰC TIẾP</span>
                      </h2>

                      <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${
                        themeMode === 'light' ? 'text-slate-700 font-medium' : 'text-slate-300'
                      }`}>
                        {currentRoomInfo.farm || 'Trại Gà'} phát trực tiếp xổ đòn thử chân, soi cán vảy và giao lưu chiến kê tuyển chọn. Lịch xổ đòn vào 14h00 &amp; 19h30 hàng ngày. Anh em có thể xem video thực tế hoặc qua trực tiếp chuồng trại giao lưu.
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2">
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
                        <button
                          onClick={() => openConnectWithFarm(currentRoomInfo.title || 'Dàn Gà Tơ', currentRoomInfo.farm || 'Trại Gà')}
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
                      Đang Xổ &amp; Lên Sóng
                    </h3>
                  </div>
                  <span
                    onClick={() => { setActiveNavTab('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-xs text-rose-600 font-bold cursor-pointer hover:underline"
                  >
                    {actualLiveRooms.length > 0 ? `${actualLiveRooms.length} Kênh Live` : '0 Kênh Live'}
                  </span>
                </div>

                {/* List of active channels */}
                <div className="space-y-2.5 my-3 overflow-y-auto max-h-[260px] pr-1">
                  {displayKeys.map((item) => {
                    const itemKey = (item.key || item.id || '').trim().toLowerCase();
                    const isItemLive = allLiveKeys.includes(itemKey) || Boolean(item.is_live);
                    return (
                      <div
                        key={item.key || item.id}
                        onClick={() => {
                          setPreviewSelectedChannel(item.key || item.id);
                          changeChannel(item.key || item.id, true);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          streamKey === (item.key || item.id)
                            ? (themeMode === 'light' ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-rose-950/40 border-rose-500/60 shadow-md')
                            : (themeMode === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-[#111217] hover:bg-white/5 border-white/5')
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            streamKey === (item.key || item.id)
                              ? 'bg-rose-600 text-white'
                              : (themeMode === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-gray-300')
                          }`}>
                            {isItemLive ? 'Xem luồng' : 'Vào kênh'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                              href={`tel:${item.phone?.replace(/\D/g, '') || '0988888888'}`}
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

            {/* ==================== CÁC CƠ SỞ TRẠI GÀ THÀNH TRUNG ==================== */}
            <section id="farms" className="space-y-3">
              <h2 className="text-lg font-bold text-white">
                Các Cơ Sở Trại Gà Thành Trung
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'thanhtrung01', name: 'Trại Gà Thành Trung 01', loc: 'Cơ Sở 1 - Long Biên' },
                  { key: 'thanhtrung02', name: 'Trại Gà Thành Trung 02', loc: 'Cơ Sở 2 - Gia Lâm' },
                  { key: 'thanhtrung03', name: 'Trại Gà Thành Trung 03', loc: 'Cơ Sở 3 - Đông Anh' },
                  { key: 'thanhtrung04', name: 'Trại Gà Thành Trung 04', loc: 'Cơ Sở 4 - Sóc Sơn' },
                  { key: 'thanhtrung05', name: 'Trại Gà Thành Trung 05', loc: 'Cơ Sở 5 - Thường Tín' },
                  { key: 'thanhtrung06', name: 'Trại Gà Thành Trung 06', loc: 'Cơ Sở 6 - Sơn Tây' }
                ].map((f) => (
                  <div
                    key={f.key}
                    onClick={() => changeChannel(f.key, true)}
                    className="p-3.5 rounded-xl bg-[#14151c] border border-white/10 hover:border-amber-500/50 cursor-pointer transition text-center space-y-1"
                  >
                    <div className="text-sm font-bold text-white truncate">{f.name}</div>
                    <div className="text-xs text-gray-400 truncate">{f.loc}</div>
                  </div>
                ))}
              </div>
            </section>

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
                    <span className="text-amber-400">{currentRoomInfo.farm}</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?tab=live&key=${streamKey}`;
                    copyToClipboard(shareUrl, 'shareChannel');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1b1c25] hover:bg-white/10 text-gray-300 hover:text-white text-[11px] sm:text-xs font-semibold border border-white/10 transition cursor-pointer"
                  title="Sao chép link trực tiếp phòng live này để gửi anh em xem"
                >
                  {copiedField === 'shareChannel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedField === 'shareChannel' ? 'Đã sao chép!' : 'Chia sẻ'}</span>
                </button>
              </div>
            </div>

            {/* ==================== CAKHIATV LIVE THEATER: PLAYER & INTERACTION ==================== */}
            {/* CHỈ HIỂN THỊ KHI CÓ NGƯỜI ĐANG LIVE (ẢNH 1-2) HOẶC NGƯỜI DÙNG BẤM CHỌN KÊNH XEM */}
            {(hasAnyLive || previewSelectedChannel) && (
              <section ref={playerSectionRef} id="main-player-section" className="space-y-4 pt-1">

              {/* KHUNG MAIN VIDEO VÀ LIVE CHAT (Desktop 8-4 cols, Mobile full-stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Cột trái: LivePlayer + CakhiaTV Controls & Icon Tab Bar (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-3">

                  {/* VIDEO PLAYER COMPONENT (HLS Stream) */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#13141b] shadow-2xl">
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
                              {currentRoomInfo.title}
                            </span>
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {currentRoomInfo.chang}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {currentRoomInfo.farm} • {currentRoomInfo.loi}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => openConnectWithFarm(currentRoomInfo.title, currentRoomInfo.farm)}
                        className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs px-4 py-2.5 sm:py-2 rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hỏi Về Con Này</span>
                      </button>
                    </div>
                  </div>

                  {/* THANH TAB TÍNH NĂNG KIỂU CAKHIATV NGAY DƯỚI VIDEO (Icon Tab Bar) */}
                  <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-2xl bg-[#16171d] border border-white/10 overflow-x-auto scrollbar-none">
                    {[
                      { key: 'chat', label: 'Bình luận', icon: MessageSquare },
                      { key: 'info', label: 'Soi đòn vảy', icon: Swords },
                      { key: 'h2h', label: 'Đối đầu (H2H)', icon: History },
                      { key: 'market', label: 'Chợ cùng chạng', icon: ShoppingBag },
                      { key: 'shipping', label: 'Bến xe gửi gà', icon: Truck },
                    ].map((tab) => {
                      const IconComp = tab.icon;
                      const isActive = liveTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            setLiveTab(tab.key);
                            setActiveRightTab(tab.key === 'chat' ? 'chat' : 'info');
                          }}
                          className={`flex-1 min-w-[90px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* NỘI DUNG HIỂN THỊ THEO TAB TRÊN MOBILE (VÀ DƯỚI VIDEO) */}
                  <div className="block lg:hidden">
                    {liveTab === 'chat' && (
                      <div className="h-[430px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16171d] shadow-xl">
                        <LiveChat
                          streamKey={streamKey}
                          user={currentUser}
                          onOpenAuth={() => setIsAuthModalOpen(true)}
                        />
                      </div>
                    )}

                    {liveTab === 'info' && (
                      <div className="p-4 rounded-2xl bg-[#16171d] border border-white/10 space-y-4 text-xs shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="font-extrabold uppercase text-amber-400 flex items-center gap-1.5">
                            <Swords className="w-4 h-4" /> Soi Đòn Vảy &amp; Thông Tin Chiến Kê
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">Dữ liệu thực tế</span>
                        </div>

                        {/* Bảng thông tin chiến kê */}
                        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                          <div className="font-black text-rose-400 uppercase text-xs pb-1 border-b border-rose-500/20 flex items-center justify-between">
                            <span>CHIẾN KÊ LÊN SÓNG: {currentRoomInfo.title}</span>
                            <span className="font-mono text-white">{currentRoomInfo.ms || 'MS KÊ'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-gray-300">
                            <p><span className="text-gray-500">Chạng cân:</span> <b className="text-amber-400">{currentRoomInfo.chang || 'Tiêu chuẩn'}</b></p>
                            <p><span className="text-gray-500">Lối đá:</span> <span className="text-white">{currentRoomInfo.loi || 'Chuẩn lối'}</span></p>
                            <p><span className="text-gray-500">Cán vảy:</span> <span className="text-white">{currentRoomInfo.can_vay || 'Chuẩn sừng'}</span></p>
                            <p><span className="text-gray-500">Trại chủ:</span> <span className="text-emerald-400">{currentRoomInfo.farm || currentRoomInfo.streamer}</span></p>
                          </div>
                        </div>
                      </div>
                    )}

                    {liveTab === 'h2h' && (
                      <div className="p-4 rounded-2xl bg-[#16171d] border border-white/10 space-y-3 text-xs shadow-xl">
                        <div className="font-extrabold uppercase text-amber-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                          <History className="w-4 h-4" /> Lịch Sử Các Phiên Phát Sóng Trước Đây
                        </div>

                        {sessions.filter((s) => s.stream_key === streamKey && s.status === 'ended').length > 0 ? (
                          sessions
                            .filter((s) => s.stream_key === streamKey && s.status === 'ended')
                            .slice(0, 5)
                            .map((s, idx) => (
                              <div key={s.id || idx} className="p-3 rounded-xl bg-[#0e0f14] border border-white/10 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-400 font-mono">
                                    {s.started_at ? new Date(s.started_at).toLocaleString('vi-VN') : 'Gần đây'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {s.duration_seconds > 0 ? `${Math.floor(s.duration_seconds / 60)} phút` : 'Hoàn thành'}
                                  </span>
                                </div>
                                <div className="text-white font-bold text-xs pt-1">
                                  Streamer: <span className="text-rose-400">{s.streamer || streamKey}</span>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="p-6 text-center text-gray-400 text-xs space-y-2">
                            <History className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                            <p>Chưa có dữ liệu các phiên phát sóng trước đây của kênh này.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {liveTab === 'market' && (
                      <div className="p-4 rounded-2xl bg-[#16171d] border border-white/10 space-y-3 text-xs shadow-xl">
                        <div className="font-extrabold uppercase text-amber-400 flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4" /> Chiến Kê Cùng Chạng (2.8kg - 3.0kg) Mở Bán
                          </span>
                          <button
                            onClick={() => {
                              setActiveNavTab('market');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-[11px] text-rose-400 hover:underline font-bold"
                          >
                            Xem tất cả &rarr;
                          </button>
                        </div>

                        {chickensList.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {chickensList.slice(0, 2).map((ck) => (
                              <div key={ck.id} className="p-3 rounded-xl bg-[#0e0f14] border border-white/10 flex gap-3 items-center">
                                <img src={ck.image} alt={ck.title} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-white text-xs truncate">{ck.ms ? `${ck.ms}: ` : ''}{ck.title}</div>
                                  <div className="text-[11px] text-amber-400 font-bold mt-0.5">{ck.priceText}</div>
                                  <div className="text-[10px] text-gray-400">Chạng {ck.chang} • {ck.breedName}</div>
                                  <button
                                    onClick={() => setSelectedMarketChicken(ck)}
                                    className="mt-1.5 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Xem chi tiết
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-5 text-xs text-gray-400 bg-[#0e0f14] rounded-xl border border-white/5">
                            Đang cập nhật chiến kê giao lưu...
                          </div>
                        )}
                      </div>
                    )}

                    {liveTab === 'shipping' && (
                      <div className="p-4 rounded-2xl bg-[#16171d] border border-white/10 space-y-3 text-xs shadow-xl">
                        <div className="font-extrabold uppercase text-amber-400 flex items-center gap-1.5 pb-2 border-b border-white/10">
                          <Truck className="w-4 h-4" /> Tuyến Xe Gửi Gà An Toàn Từ Long Biên (Hà Nội)
                        </div>

                        <div className="space-y-2.5 text-gray-300">
                          <div className="p-2.5 rounded-xl bg-[#0e0f14] border border-white/10">
                            <b className="text-white text-xs flex items-center gap-1.5 text-rose-400">
                              🚌 Tuyến Bến Xe Gia Lâm &rarr; Miền Bắc:
                            </b>
                            <p className="text-[11px] text-gray-300 mt-1">
                              Hải Phòng, Quảng Ninh, Bắc Giang, Lạng Sơn, Thái Nguyên, Phú Thọ. Xe chạy liên tục 30 phút/chuyến. Nhận gà sau 2 - 4 tiếng.
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#0e0f14] border border-white/10">
                            <b className="text-white text-xs flex items-center gap-1.5 text-cyan-400">
                              🚌 Tuyến Bến Nước Ngầm &amp; Giáp Bát &rarr; Miền Trung &amp; Nam:
                            </b>
                            <p className="text-[11px] text-gray-300 mt-1">
                              Thanh Hóa, Nghệ An, Hà Tĩnh, Huế, Đà Nẵng, Bình Định, TP. Hồ Chí Minh. Gửi xe giường nằm khoang máy lạnh, lồng xốp khoét lỗ thoáng khí kèm ngô nước đầy đủ.
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                            ⭐ <b>Cam kết Trại Thành Trung:</b> Bảo hiểm sống khỏe 100% đến tận tay anh em. Quay video cân gà và đóng thùng trước khi xe lăn bánh!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Cột phải (Desktop 4 cols): CakhiaTV Dynamic Tab Display */}
                <div className="hidden lg:flex lg:col-span-4 flex-col gap-3">

                  {/* TAB 1: PHÒNG CHAT TRỰC TIẾP (Mặc định khi xem live) */}
                  {liveTab === 'chat' && (
                    <div className="h-[560px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16171d] shadow-xl">
                      <LiveChat
                        streamKey={streamKey}
                        user={currentUser}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                      />
                    </div>
                  )}

                  {/* TAB 2: SOI ĐÒN VẢY CHI TIẾT */}
                  {liveTab === 'info' && (
                    <div className="h-[560px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-4 text-xs shadow-xl">
                      <div className="text-amber-400 font-bold text-sm uppercase flex items-center gap-2 border-b border-white/10 pb-3">
                        <Swords className="w-4 h-4" />
                        <span>Soi Kỹ Đòn Vảy &amp; Tông Dòng</span>
                      </div>

                      {/* Thông tin Chiến Kê Thực Tế */}
                      <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                        <div className="font-black text-rose-400 text-xs pb-1 border-b border-rose-500/20 flex items-center justify-between">
                          <span>CHIẾN KÊ: {currentRoomInfo.title}</span>
                          <span className="font-mono text-white">{currentRoomInfo.ms || 'MS KÊ'}</span>
                        </div>
                        <div className="space-y-1.5 text-gray-300 font-mono">
                          <p><span className="text-gray-500 font-sans">Chạng:</span> <b className="text-amber-300">{currentRoomInfo.chang || 'Tiêu chuẩn'}</b></p>
                          <p><span className="text-gray-500 font-sans">Lối đá:</span> <span className="text-emerald-400 font-sans">{currentRoomInfo.loi || 'Chuẩn lối'}</span></p>
                          <p><span className="text-gray-500 font-sans">Cán vảy:</span> <span className="text-white font-sans">{currentRoomInfo.can_vay || 'Chuẩn sừng'}</span></p>
                          <p><span className="text-gray-500 font-sans">Trại chủ:</span> <span className="text-rose-400 font-sans">{currentRoomInfo.farm || currentRoomInfo.streamer}</span></p>
                        </div>
                      </div>

                      <button
                        onClick={() => openConnectWithFarm(currentRoomInfo.title, currentRoomInfo.farm)}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition text-center shadow-md uppercase cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Liên Hệ Trực Tiếp Chủ Trại</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 3: LỊCH SỬ CÁC PHIÊN LIVE TRƯỚC ĐÓ TỪ MONGODB */}
                  {liveTab === 'h2h' && (
                    <div className="h-[560px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-3.5 text-xs shadow-xl">
                      <div className="text-amber-400 font-bold text-sm uppercase flex items-center gap-2 border-b border-white/10 pb-3">
                        <History className="w-4 h-4" />
                        <span>Lịch Sử Các Phiên Phát Sóng Trước Đây</span>
                      </div>

                      {sessions.filter((s) => s.stream_key === streamKey && s.status === 'ended').length > 0 ? (
                        sessions
                          .filter((s) => s.stream_key === streamKey && s.status === 'ended')
                          .slice(0, 10)
                          .map((s, idx) => (
                            <div key={s.id || idx} className="p-3.5 rounded-xl bg-[#0e0f14] border border-white/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {s.started_at ? new Date(s.started_at).toLocaleString('vi-VN') : 'Gần đây'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  {s.duration_seconds > 0 ? `${Math.floor(s.duration_seconds / 60)} phút` : 'Hoàn tất'}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-white">
                                Streamer: <span className="text-rose-400">{s.streamer || streamKey}</span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                          <History className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                          <p>Chưa có lịch sử các phiên live trước đây của kênh này.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: CHỢ GÀ CÙNG CHẠNG */}
                  {liveTab === 'market' && (
                    <div className="h-[560px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-3.5 text-xs shadow-xl">
                      <div className="text-amber-400 font-bold text-sm uppercase flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4" /> Kê Cùng Chạng (2.8kg - 3.0kg)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {chickensList.length > 0 ? (
                          chickensList.slice(0, 3).map((ck) => (
                            <div key={ck.id} className="p-3 rounded-xl bg-[#0e0f14] border border-white/10 flex gap-3 items-center">
                              <img src={ck.image} alt={ck.title} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-white text-xs truncate">{ck.ms ? `${ck.ms}: ` : ''}{ck.title}</div>
                                <div className="text-[11px] text-amber-400 font-bold mt-0.5">{ck.priceText}</div>
                                <div className="text-[10px] text-gray-400">Chạng {ck.chang} • {ck.breedName}</div>
                                <button
                                  onClick={() => setSelectedMarketChicken(ck)}
                                  className="mt-2 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                                >
                                  Xem chi tiết &amp; Đặt cọc
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-gray-400 bg-[#0e0f14] rounded-xl border border-white/5">
                            Đang cập nhật chiến kê cùng chạng...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: BẾN XE GỬI GÀ */}
                  {liveTab === 'shipping' && (
                    <div className="h-[560px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-3.5 text-xs shadow-xl">
                      <div className="text-amber-400 font-bold text-sm uppercase flex items-center gap-2 border-b border-white/10 pb-3">
                        <Truck className="w-4 h-4" />
                        <span>Bến Xe &amp; Hậu Cần Gửi Gà</span>
                      </div>

                      <div className="space-y-3 text-gray-300">
                        <div className="p-3 rounded-xl bg-[#0e0f14] border border-white/10">
                          <b className="text-white text-xs flex items-center gap-1.5 text-rose-400">
                            🚌 Tuyến Bến Xe Gia Lâm &rarr; Miền Bắc:
                          </b>
                          <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                            Hải Phòng, Quảng Ninh, Bắc Giang, Lạng Sơn, Thái Nguyên, Phú Thọ. Xe chạy liên tục 30 phút/chuyến. Nhận gà sau 2 - 4 tiếng.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0e0f14] border border-white/10">
                          <b className="text-white text-xs flex items-center gap-1.5 text-cyan-400">
                            🚌 Tuyến Bến Nước Ngầm &amp; Giáp Bát &rarr; Miền Trung &amp; Nam:
                          </b>
                          <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                            Thanh Hóa, Nghệ An, Hà Tĩnh, Huế, Đà Nẵng, Bình Định, TP. Hồ Chí Minh. Gửi xe giường nằm khoang máy lạnh, lồng xốp khoét lỗ thoáng khí kèm ngô nước đầy đủ.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                          ⭐ <b>Cam kết Trại Thành Trung:</b> Bảo hiểm sống khỏe 100% đến tận tay anh em. Quay video cân gà và đóng thùng trước khi xe lăn bánh!
                        </div>
                      </div>
                    </div>
                  )}

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
                          {showAllRooms ? 'Danh Sách Tất Cả Kênh Phát' : 'Các Phòng Đang Lên Sóng Trực Tiếp'}
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
                              ? 'Các phiên xổ gà thử chân và giao lưu thường lên sóng vào khung giờ 09:00 – 17:00 hàng ngày. Bạn có thể xem danh sách toàn bộ kênh hoặc theo dõi các video phát lại bên dưới!'
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
                          const isRoomLive = allLiveKeys.includes((room.id || room.key || '').toLowerCase()) || Boolean(room.is_live);
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

        {/* ======================================================== */}
        {/* VIEW 3: CHỢ GÀ BA MIỀN & MÀN HÌNH CHI TIẾT CHIẾN KÊ      */}
        {/* ======================================================== */}
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

      </main>

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
                <li>
                  <button
                    onClick={() => {
                      setActiveNavTab('market');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chợ Gà Đang Bán</span>
                  </button>
                </li>
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
                onClick={() => alert('Hotline / Zalo Ban Quản Trị: 0988.888.xxx (Hỗ trợ 24/7)')}
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
              <span>Hotline / Zalo: 0988.888.xxx</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== MOBILE STICKY BOTTOM NAVIGATION BAR ==================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#12141c]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-safe grid grid-cols-4 gap-1 shadow-2xl">
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
          <span className="text-[10px]">Xem Live</span>
        </button>

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
          <span className="text-[10px]">Chợ Gà ({chickensList.length})</span>
        </button>

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
            onClick={() => setIsSystemAdminOpen(true)}
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
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                Đang Lên Sóng
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

      {/* ==================== MODAL TÌM KIẾM NHANH (Ctrl+K) ==================== */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#16171f] border border-white/10 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gõ chạng cân (ví dụ: 2k9, 3k1), mã số MS, tên trại..."
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
              <button onClick={() => setIsSearchModalOpen(false)} className="text-gray-400 hover:text-white text-xs">
                ESC
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {liveRooms
                .filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.chang.toLowerCase().includes(searchQuery.toLowerCase()) || r.farm.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      changeChannel(r.id, true);
                      setIsSearchModalOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#0e0f14] hover:bg-white/10 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <div className="font-bold text-white">{r.ms ? `${r.ms}: ` : ''}{r.title}</div>
                      <div className="text-[10px] text-gray-400">{r.farm}{r.chang ? ` • Chạng: ${r.chang}` : ''}</div>
                    </div>
                    <span className="text-rose-500 font-bold text-[10px] bg-rose-500/10 px-2 py-0.5 rounded">
                      LIVE
                    </span>
                  </div>
                ))}
            </div>
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

      {/* ==================== MODAL XEM LẠI LIVESTREAM (GOOGLE DRIVE / MP4) ==================== */}
      {selectedReplay && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedReplay(null)}
        >
          <div
            className="bg-[#14151b] border border-white/15 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-[10px] uppercase tracking-wider">Xem Lại</span>
                  <span>{selectedReplay.title || `Phiên Live: ${selectedReplay.stream_key}`}</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  🎙️ {selectedReplay.streamer || 'Chủ Trại'} • Phát lúc:{' '}
                  {selectedReplay.started_at ? new Date(selectedReplay.started_at).toLocaleString('vi-VN') : 'Mới đây'}
                </p>
              </div>
              <button
                onClick={() => setSelectedReplay(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {selectedReplay.replay_url?.includes('drive.google.com') ? (
                <iframe
                  src={selectedReplay.replay_url}
                  title={selectedReplay.title || 'Replay Video'}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedReplay.replay_url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <SystemAdminDashboard
        isOpen={isSystemAdminOpen}
        onClose={() => {
          setIsSystemAdminOpen(false);
          fetchKeysAndSessions();
        }}
        token={authToken}
        currentUser={currentUser}
      />

      <LiveStudioModal
        isOpen={isLiveStudioOpen}
        onClose={() => setIsLiveStudioOpen(false)}
        streamKeys={displayKeys}
        currentStreamKey={streamKey}
        user={currentUser}
        sessions={sessions}
        onStreamStarted={(startedKey) => {
          setStreamKey(startedKey);
          setInputKey(startedKey);
        }}
      />

      {/* ==================== MARKETPLACE MODALS ==================== */}
      <PostChickenModal
        isOpen={isPostChickenModalOpen}
        onClose={() => setIsPostChickenModalOpen(false)}
        onAddChicken={handleAddChicken}
        currentUser={currentUser}
      />

      {/* ==================== USER PROFILE & AVATAR MODAL ==================== */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        authToken={authToken}
        myStreamKey={myStreamKey}
        onProfileUpdated={handleProfileUpdated}
      />

    </div>
  );
}
