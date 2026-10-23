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
  ShoppingBag
} from 'lucide-react';
import { getApiBaseUrl, getHlsBaseUrl, getRtmpBaseUrl, getHost } from './config';

// Dữ liệu mẫu ban đầu cho Sàn Giao Lưu & Đăng Bán Chiến Kê Ba Miền
const INITIAL_CHICKENS = [
  {
    id: 'ck_1',
    ms: 'MS 201',
    title: 'Chuối Lửa Chân Xanh 2K9 Đã Dạt 2 Nước Bo Đá Chắc Chắn',
    breed: 'don',
    breedName: 'Gà Đòn Bình Định',
    chang: '2.90 kg',
    age: '11 tháng',
    canVay: 'Giáp thới, huyền trâm sát chậu',
    loi: 'Ôm đấm kiềng hầu, đá mé xỏ ngang',
    datNuoc: 'Đã dạt 2 nước',
    price: 3200000,
    priceText: '3.200.000 đ',
    farm: 'Trại Gà Đòn Ninh Thuận',
    sellerName: 'Anh Bảy Ninh Thuận',
    phone: '0988.888.101',
    zalo: '0988.888.101',
    location: 'Ninh Thuận',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=800&auto=format&fit=crop',
    videoUrl: '',
    note: 'Đã tiêm phòng 100% vắc xin. Hỗ trợ gửi xe khách các tỉnh miền Trung & miền Nam.',
    status: 'available',
    createdAt: '2026-10-22T08:00:00Z'
  },
  {
    id: 'ck_2',
    ms: 'MS 202',
    title: 'Tre Chuối Tuyết Bờm Trắng Đuôi Phụng 68cm Chuẩn Dáng Cảnh',
    breed: 'tre',
    breedName: 'Gà Tre Tân Châu',
    chang: '850 gram',
    age: '10 tháng',
    canVay: 'Cán tròn hai hàng trơn, vảy mỏng sát thịt',
    loi: 'Gà cảnh dạn người, gáy tiếng thanh vang',
    datNuoc: 'Chuẩn dáng cảnh',
    price: 1800000,
    priceText: '1.800.000 đ',
    farm: 'Trại Gà Tre Sáu Khải',
    sellerName: 'Sáu Khải Tân Châu',
    phone: '0988.888.102',
    zalo: '0988.888.102',
    location: 'Bến Tre',
    image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?q=80&w=800&auto=format&fit=crop',
    videoUrl: '',
    note: 'Đuôi xòe 3 lớp chạm đất, bờm phủ vai tuyệt đẹp. Ship toàn quốc.',
    status: 'available',
    createdAt: '2026-10-22T09:30:00Z'
  },
  {
    id: 'ck_3',
    ms: 'MS 203',
    title: 'Tía Chân Xanh Án Thiên 1 Đòn Mé Xỏ Ngang Giáp Lưng Dạt Sườn',
    breed: 'don',
    breedName: 'Gà Đòn Bình Định',
    chang: '3.15 kg',
    age: '12 tháng',
    canVay: 'Án Thiên 1 sát đầu gối, chân vuông sắc',
    loi: 'Lối mé xỏ ngang, đánh giáp lưng dạt sườn',
    datNuoc: 'Đã dạt 3 nước cứng',
    price: 4500000,
    priceText: '4.500.000 đ',
    farm: 'Trại Gà Ba Bình Định',
    sellerName: 'Ba Bình Định',
    phone: '0988.888.103',
    zalo: '0988.888.103',
    location: 'Bình Định',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=800&auto=format&fit=crop',
    videoUrl: '',
    note: 'Gà đòn gốc Tây Sơn Bình Định. Đòn đấm uy lực, bao thử chân trực tiếp.',
    status: 'available',
    createdAt: '2026-10-22T10:15:00Z'
  },
  {
    id: 'ck_4',
    ms: 'MS 204',
    title: 'Đông Tảo Tiến Vua Chân Khủng F1 Thuần Chủng Vảy Thịt Đỏ Au',
    breed: 'dongtao',
    breedName: 'Gà Đông Tảo Hưng Yên',
    chang: '4.60 kg',
    age: '14 tháng',
    canVay: 'Chân xù to vảy thịt đỏ au, ngón ngắn vạm vỡ',
    loi: 'Trống thuần chủng làm giống hoặc biếu tặng',
    datNuoc: 'Giống chuẩn F1',
    price: 0,
    priceText: 'Thỏa thuận',
    farm: 'Trại Gà Tiến Khoái Châu',
    sellerName: 'Bác Tiến Khoái Châu',
    phone: '0988.888.104',
    zalo: '0988.888.104',
    location: 'Hưng Yên',
    image: '/img/rooster_dongtao.jpg',
    videoUrl: '',
    note: 'Gà giống Khoái Châu Hưng Yên tuyển chọn. Vận chuyển chuồng gỗ xe khách an toàn.',
    status: 'available',
    createdAt: '2026-10-22T11:00:00Z'
  },
  {
    id: 'ck_5',
    ms: 'MS 205',
    title: 'Asil Lai Mỹ Xám Chuối Nạp Chân Sâu Bo Đá Nhanh Gọn Bo Bén',
    breed: 'asil',
    breedName: 'Gà Asil / Mỹ Lai',
    chang: '2.60 kg',
    age: '10 tháng',
    canVay: 'Tam tài sát gối, vảy sạch bo bén',
    loi: 'Nhanh nhẹn, tốc độ cao, nạp chân sâu',
    datNuoc: 'Đã dạt 2 nước',
    price: 2800000,
    priceText: '2.800.000 đ',
    farm: 'Trại Gà Ba Tri Bến Tre',
    sellerName: 'Tuấn Ba Tri',
    phone: '0988.888.105',
    zalo: '0988.888.105',
    location: 'Bến Tre',
    image: '/img/rooster_asil.jpg',
    videoUrl: '',
    note: 'Bo đá tốc độ, nhanh nhẹn. Gửi xe khách bến xe Miền Tây trong ngày.',
    status: 'available',
    createdAt: '2026-10-22T14:20:00Z'
  }
];

export default function App() {
  const [streamKey, setStreamKey] = useState('tiendev');
  const [inputKey, setInputKey] = useState('tiendev');
  const [copiedField, setCopiedField] = useState(null);

  // Trạng thái xác thực & Người dùng
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [myStreamKey, setMyStreamKey] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSystemAdminOpen, setIsSystemAdminOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('chat'); // 'chat' | 'obs' | 'info'

  // Quản lý Đăng Bán Gà & Chợ Kê
  const [chickensList, setChickensList] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('market_chickens');
        if (saved) {
          const list = JSON.parse(saved);
          return list.map((c) => {
            if (c.image && c.image.includes('photo-1516467508483-a7212febe31a')) {
              return { ...c, image: '/img/rooster_asil.jpg' };
            }
            if (c.image && c.image.includes('photo-1563281577-a7be47e20db9')) {
              return { ...c, image: '/img/rooster_dongtao.jpg' };
            }
            return c;
          });
        }
      } catch (e) {}
    }
    return INITIAL_CHICKENS;
  });
  const [isPostChickenModalOpen, setIsPostChickenModalOpen] = useState(false);
  const [selectedMarketChicken, setSelectedMarketChicken] = useState(null);

  const handleAddChicken = (newChicken) => {
    setChickensList((prev) => {
      const updated = [newChicken, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('market_chickens', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    // Gửi lên server backend nếu có
    fetch(`${getApiBaseUrl()}/api/chickens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(newChicken)
    }).catch(() => {});

    // Chuyển sang tab Chợ Gà và cuộn lên đầu trang
    setActiveNavTab('market');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals cho giao lưu gà
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChickenForConnect, setSelectedChickenForConnect] = useState({
    title: 'MS 101: Gà Ô Chân Trắng Điểm Mực',
    farm: 'Trại Gà Ba Bình Định'
  });
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Danh sách key từ MongoDB
  const [dbKeys, setDbKeys] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [srsStreams, setSrsStreams] = useState([]);

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

  // Tải danh sách Stream Keys và Sessions từ MongoDB Atlas
  const fetchKeysAndSessions = () => {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
    if (!token) return;

    fetch(`${getApiBaseUrl()}/api/keys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbKeys(data);
        }
      })
      .catch(() => {});

    fetch(`${getApiBaseUrl()}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(() => {});
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

  useEffect(() => {
    fetchKeysAndSessions();
    fetchSrsStreams();
    const interval = setInterval(() => {
      fetchKeysAndSessions();
      fetchSrsStreams();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Tự động nhận diện kênh từ URL khi vào web (ví dụ: ?stream=test hoặc ?channel=test)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get('stream') || params.get('channel') || params.get('key');
      const tabParam = params.get('tab');
      if (urlKey && urlKey.trim()) {
        const clean = urlKey.trim();
        setStreamKey(clean);
        setInputKey(clean);
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

  // Tự động cuộn lên đầu trang mỗi khi chuyển tab (Phòng Live, Chợ Gà, Trang Chủ)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeNavTab]);

  // Chuyển đổi kênh linh hoạt và đồng bộ lên URL
  const changeChannel = (newKey, goToLive = true) => {
    const clean = newKey ? newKey.trim() : '';
    if (!clean) return;
    setStreamKey(clean);
    setInputKey(clean);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('stream', clean);
      window.history.replaceState({}, '', url.toString());
    }
    if (goToLive) {
      setActiveNavTab('live');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleApplyKey = (e) => {
    e.preventDefault();
    if (inputKey.trim()) {
      changeChannel(inputKey.trim());
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

  const handleLogout = () => {
    if (authToken) {
      fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('my_stream_key');
    setCurrentUser(null);
    setAuthToken('');
    setMyStreamKey('');
  };

  // Mở modal liên hệ chủ trại
  const openConnectWithFarm = (chickenTitle, farmName) => {
    setSelectedChickenForConnect({
      title: chickenTitle || 'Chiến kê đang lên sóng',
      farm: farmName || 'Chủ trại'
    });
    setIsConnectModalOpen(true);
  };

  // Danh sách kênh mặc định nếu MongoDB chưa có dữ liệu
  const displayKeys = dbKeys.length > 0 
    ? dbKeys 
    : [
        { key: 'tiendev', title: 'Trại Ba Bình Định', streamer: 'Ba Bình Định', is_active: true },
        { key: 'test', title: 'Trại Sáu Khải Tân Châu', streamer: 'Sáu Khải', is_active: true },
        { key: 'supersecret', title: 'Trại Anh Ba Chợ Lách', streamer: 'Anh Ba', is_active: true }
      ];

  // Danh sách chiến kê đặc sắc lên sóng
  const liveRooms = [
    {
      id: 'tiendev',
      ms: 'MS 101',
      title: 'Gà Ô Chân Trắng Điểm Mực',
      farm: 'Trại Gà Ba Bình Định',
      streamer: 'Ba Bình Định',
      chang: '2.85 kg',
      loi: 'Lối kiềng hầu, đá mé xỏ ngang',
      viewers: '1.4k',
      thumb: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 'test',
      ms: 'MS 102',
      title: 'Tre Tân Châu Khét Đỏ Bờm Dài',
      farm: 'Trại Gà Tre Sáu Khải',
      streamer: 'Sáu Khải Tân Châu',
      chang: '850 g',
      loi: 'Trống tơ 9 tháng, đuôi phụng 68cm',
      viewers: '950',
      thumb: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 'supersecret',
      ms: 'MS 103',
      title: 'Asil Lai Mỹ Xám Chuối',
      farm: 'Trại Gà Ba Tri Bến Tre',
      streamer: 'Tuấn Ba Tri',
      chang: '2.60 kg',
      loi: 'Nhanh nhẹn, nạp chân sâu',
      viewers: '2.1k',
      thumb: '/img/rooster_asil.jpg'
    },
    {
      id: 'dongtao',
      ms: 'MS 104',
      title: 'Đông Tảo Tiến Vua Chân Khủng',
      farm: 'Trại Gà Tiến Khoái Châu',
      streamer: 'Bác Tiến Khoái Châu',
      chang: '4.50 kg',
      loi: 'Chân xù vảy thịt đỏ, F1 thuần chủng',
      viewers: '1.1k',
      thumb: '/img/rooster_dongtao.jpg'
    },
    {
      id: 'caolanh',
      ms: 'MS 105',
      title: 'Gà Nòi Tía Vàng 8 Móng',
      farm: 'Trại Kê Cao Lãnh',
      streamer: 'Út Lớn Cao Lãnh',
      chang: '3.00 kg',
      loi: 'Vảy đại giáp, lối đá đấm lưng',
      viewers: '1.8k',
      thumb: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500&auto=format&fit=crop'
    }
  ];

  // Tìm thông tin con gà gắn với streamKey hiện tại
  const currentRoomInfo = liveRooms.find(r => r.id === streamKey) || {
    ms: 'MS KÊ',
    title: `Kênh phát sóng: ${streamKey}`,
    farm: 'Trại Gà Trực Tiếp',
    streamer: 'Chủ Trại',
    chang: 'Chạng chuẩn',
    loi: 'Lối đòn chuẩn dòng kê',
    viewers: 'Đang live'
  };

  const currentSession = sessions.find((s) => s.stream_key === streamKey);
  const currentSessionId = currentSession?.id || currentSession?._id || '';

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

  // CHỈ COI LÀ LIVE THỰC TẾ KHI SRS ĐANG CÓ PUBLISHER PHÁT SÓNG
  // (Tránh trường hợp DB còn session cũ làm màn hình chính hiện bảng đen offline lỗi UI)
  const isRealLive = activeSrsKeys.length > 0;
  const realLiveKeys = isRealLive ? activeSrsKeys : [];
  const effectiveIsLive = forceLivePreview !== null ? forceLivePreview : isRealLive;

  // Xác định phòng live nhiều người xem nhất (Top 1 Live Room để chiếu lên Hero Banner)
  let topLiveRoom = null;
  if (effectiveIsLive) {
    const candidateKeys = realLiveKeys.length > 0 ? realLiveKeys : ['supersecret', 'caolanh', 'tiendev'];
    const candidates = candidateKeys.map((key) => {
      const room = liveRooms.find((r) => r.id.toLowerCase() === key);
      if (room) return room;
      const dbK = dbKeys.find((d) => d.key.toLowerCase() === key);
      return {
        id: key,
        ms: 'MS TOP 1',
        title: dbK?.title || `Luồng trực tiếp: ${key}`,
        farm: dbK?.streamer ? `Trại Gà ${dbK.streamer}` : 'Trại Gà Trực Tiếp',
        streamer: dbK?.streamer || 'Chủ Trại',
        chang: '2.90 kg',
        loi: 'Lối đá đòn chuẩn dòng kê ba miền',
        viewers: '2.5k',
        thumb: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500&auto=format&fit=crop'
      };
    });
    candidates.sort((a, b) => parseViewers(b.viewers) - parseViewers(a.viewers));
    topLiveRoom = candidates[0] || liveRooms[2];
  } else {
    topLiveRoom = liveRooms[0];
  }

  // Component thanh lọc chạng gà dùng chung cho cả trang chủ và phòng live
  const renderCategoryTabs = () => (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm font-medium">
      <button 
        onClick={() => setActiveCategory('all')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 ${
          activeCategory === 'all'
            ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
            : 'bg-[#16171d] hover:bg-white/5 text-gray-300 border-white/10'
        }`}
      >
        <span>🔥</span>
        <span>Tất Cả Chạng Gà</span>
      </button>
      <button 
        onClick={() => setActiveCategory('don')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 ${
          activeCategory === 'don'
            ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
            : 'bg-[#16171d] hover:bg-white/5 text-gray-300 border-white/10'
        }`}
      >
        <span>🐓</span>
        <span>Gà Đòn (2.8kg - 3.2kg)</span>
      </button>
      <button 
        onClick={() => setActiveCategory('noi')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 ${
          activeCategory === 'noi'
            ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
            : 'bg-[#16171d] hover:bg-white/5 text-gray-300 border-white/10'
        }`}
      >
        <span>⚡</span>
        <span>Gà Nòi Cựa (2.4kg - 2.7kg)</span>
      </button>
      <button 
        onClick={() => setActiveCategory('tre')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 ${
          activeCategory === 'tre'
            ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
            : 'bg-[#16171d] hover:bg-white/5 text-gray-300 border-white/10'
        }`}
      >
        <span>🦃</span>
        <span>Gà Tre Tân Châu Cảnh</span>
      </button>
      <button 
        onClick={() => setActiveCategory('dongtao')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 ${
          activeCategory === 'dongtao'
            ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
            : 'bg-[#16171d] hover:bg-white/5 text-gray-300 border-white/10'
        }`}
      >
        <span>🐥</span>
        <span>Gà Đông Tảo Chuẩn F1</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c0d11] text-gray-100 font-sans antialiased flex flex-col selection:bg-rose-600 selection:text-white">
      
      {/* ==================== TOP BAR ==================== */}
      <div className="border-b border-white/5 bg-[#08090c] text-xs text-gray-400 py-1.5 px-4 sm:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-rose-500 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Kê Trường Live
            </span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="hidden sm:inline text-gray-300 truncate">
              Phát sóng trực tiếp xổ đòn thử chân, soi cán vảy &amp; giao lưu ba miền
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] font-medium tracking-normal shrink-0">
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="hover:text-amber-300 transition-colors hidden md:flex items-center gap-1.5 text-gray-300 cursor-pointer whitespace-nowrap"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Quy chuẩn gửi xe khách</span>
            </button>
            <span className="text-gray-300 hidden lg:inline flex items-center gap-1 whitespace-nowrap">
              <span className="text-gray-500">Hotline/Zalo:</span> 0988.888.xxx
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {displayKeys.length > 0 ? `${displayKeys.length} Kênh Trực Tuyến` : 'Hệ Thống Sẵn Sàng'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN HEADER ==================== */}
      <header className="sticky top-0 z-40 bg-[#101117]/95 backdrop-blur-md border-b border-white/10">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center gap-2 xl:gap-5 shrink-0">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveNavTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/60 group-hover:scale-105 transition-transform shrink-0">
                <span className="text-xl select-none">🐓</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic tracking-tighter text-white leading-none whitespace-nowrap">
                  kê<span className="text-rose-500">TRƯỜNG</span>
                </span>
                <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold whitespace-nowrap">Kênh Gà Nòi Live</span>
              </div>
            </a>

            {/* Navigation (Desktop) - Single line, optimized typography */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-[13px] font-medium shrink-0">
              <button 
                onClick={() => {
                  setActiveNavTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeNavTab === 'home'
                    ? 'text-rose-400 bg-rose-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Trang Chủ
              </button>
              
              <button 
                onClick={() => {
                  setActiveNavTab('live');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeNavTab === 'live'
                    ? 'text-rose-400 bg-rose-500/10 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Phòng Live</span>
              </button>

              <button 
                onClick={() => {
                  setActiveNavTab('market');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeNavTab === 'market'
                    ? 'text-amber-400 bg-amber-500/10 font-bold border border-amber-500/20'
                    : 'text-gray-300 hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Chợ Gà</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-black font-extrabold rounded-md ml-0.5">MỚI</span>
              </button>

              <button 
                onClick={() => {
                  if (activeNavTab !== 'home') setActiveNavTab('home');
                  setTimeout(() => document.getElementById('featured-chickens')?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
                className="px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Gà Mới
              </button>

              <button 
                onClick={() => {
                  if (activeNavTab !== 'home') setActiveNavTab('home');
                  setTimeout(() => document.getElementById('breeds')?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
                className="px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Dòng Kê
              </button>

              <button 
                onClick={() => {
                  if (activeNavTab !== 'home') setActiveNavTab('home');
                  setTimeout(() => document.getElementById('farms')?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
                className="px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Trại Kê
              </button>

              <button 
                onClick={() => setIsPolicyModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cẩm Nang
              </button>
            </nav>
          </div>

          {/* Right: Search, Post chicken button, Admin controls, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Prominent Đăng Bán Gà Button */}
            <button
              onClick={() => setIsPostChickenModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-lg shadow-md shadow-rose-950/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Đăng bán chiến kê tuyển chọn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Đăng Bán Gà</span>
            </button>

            {/* Search Button (Ctrl+K) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              title="Tìm kiếm chạng gà, mã số MS (Ctrl+K)"
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User authenticated actions */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* SYSTEM ADMIN BUTTON */}
                {currentUser.role === 'systemadmin' && (
                  <button
                    onClick={() => setIsSystemAdminOpen(true)}
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm border border-purple-400/40 cursor-pointer whitespace-nowrap shrink-0"
                    title="Mở Bảng Tổng Quản Trị Hệ Thống"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-200" />
                    <span className="hidden xl:inline">Tổng Quản Trị</span>
                  </button>
                )}

                {/* ADMIN BROADCAST & PANEL BUTTONS */}
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setIsLiveStudioOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm border border-rose-500/40 cursor-pointer whitespace-nowrap shrink-0"
                      title="Bật camera phát sóng trực tiếp"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                      <span className="hidden sm:inline">Phát Live</span>
                    </button>

                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                      title="Bảng điều khiển quản trị viên"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden xl:inline">Quản Trị</span>
                    </button>
                  </>
                )}

                {/* User avatar & role/name */}
                <div className="flex items-center gap-1.5 bg-[#16171f] border border-white/10 rounded-full py-1 px-2.5 shrink-0">
                  <div className={`w-5 h-5 rounded-full text-white font-bold text-[11px] flex items-center justify-center uppercase ${
                    currentUser.role === 'systemadmin' ? 'bg-purple-600' : currentUser.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
                  }`}>
                    {currentUser.username.substring(0, 1)}
                  </div>
                  <span className="text-xs font-semibold text-gray-200 hidden md:inline whitespace-nowrap">
                    {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'systemadmin' ? 'SysAdmin' : (currentUser.full_name || currentUser.username).split(' ')[0]}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-lg bg-[#16171f] hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition cursor-pointer shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden xs:inline">Đăng Nhập</span>
                <span className="xs:hidden">Vào</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center border-b border-white/10 bg-[#0e0f14] px-4 py-2 gap-2 text-xs font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveNavTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            activeNavTab === 'home' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          Trang Chủ
        </button>
        <button
          onClick={() => {
            setActiveNavTab('live');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeNavTab === 'live' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Phòng Live
        </button>
        <button
          onClick={() => {
            setActiveNavTab('market');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeNavTab === 'market' ? 'bg-amber-500 text-black font-extrabold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Chợ Gà (Đăng Bán)
        </button>
        <button
          onClick={() => {
            if (activeNavTab !== 'home') setActiveNavTab('home');
            setTimeout(() => document.getElementById('featured-chickens')?.scrollIntoView({ behavior: 'smooth' }), 50);
          }}
          className="px-3 py-1.5 rounded-lg whitespace-nowrap text-gray-400 hover:text-white bg-white/5 cursor-pointer shrink-0"
        >
          Gà Mới
        </button>
        <button
          onClick={() => {
            if (activeNavTab !== 'home') setActiveNavTab('home');
            setTimeout(() => document.getElementById('farms')?.scrollIntoView({ behavior: 'smooth' }), 50);
          }}
          className="px-3 py-1.5 rounded-lg whitespace-nowrap text-gray-400 hover:text-white bg-white/5 cursor-pointer shrink-0"
        >
          Trại Giao Lưu
        </button>
        <button
          onClick={() => setIsPolicyModalOpen(true)}
          className="px-3 py-1.5 rounded-lg whitespace-nowrap text-gray-400 hover:text-white bg-white/5 cursor-pointer shrink-0"
        >
          Cẩm Nang
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
              <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950 via-[#181922] to-[#12131a] border border-white/10 min-h-[300px] sm:min-h-[360px] shadow-2xl flex flex-col justify-end group">
                
                {/* Nút xem thử trạng thái Live (Tự động / Thử có live / Thử không có ai live) */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (forceLivePreview === null) setForceLivePreview(!isRealLive);
                      else if (forceLivePreview === true) setForceLivePreview(false);
                      else setForceLivePreview(null);
                    }}
                    title="Bấm để thử nghiệm cả 2 trạng thái: Có người live vs Không ai live"
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-gray-300 hover:text-white border border-white/15 backdrop-blur-md transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>{effectiveIsLive ? '🔴 Đang có live' : '⚪ Không có ai live'}</span>
                    <span className="text-gray-500 font-normal">
                      {forceLivePreview === null ? '(Tự động)' : '(Đang thử)'}
                    </span>
                  </button>
                </div>

                {effectiveIsLive ? (
                  /* ======================================================== */
                  /* TRƯỜNG HỢP CÓ NGƯỜI LIVE: CHIẾU PHÒNG NHIỀU NGƯỜI XEM NHẤT (ẢNH 2) */
                  /* ======================================================== */
                  <div className="relative w-full h-full min-h-[340px] sm:min-h-[380px] flex flex-col justify-between bg-black">
                    {/* Live Player Container */}
                    <div className="relative w-full aspect-video bg-black overflow-hidden">
                      <LivePlayer streamKey={topLiveRoom.id} />
                      
                      {/* Floating overlay badges on video */}
                      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none pr-36">
                        <span className="bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5 shadow-lg border border-rose-400/30">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          ĐANG PHÁT TRỰC TIẾP
                        </span>
                        <span className="bg-amber-500/95 backdrop-blur-md text-black text-[11px] font-black uppercase px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
                          TOP 1 NHIỀU NGƯỜI XEM NHẤT
                        </span>
                        <span className="text-xs text-amber-300 font-bold bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-md">
                          🔥 {topLiveRoom.viewers} người xem
                        </span>
                      </div>
                    </div>

                    {/* Info & CTA bar below live video */}
                    <div className="p-4 sm:p-5 bg-[#14151c] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-amber-400 font-bold flex items-center gap-2">
                          <span>★ {topLiveRoom.farm}</span>
                          <span>•</span>
                          <span>Chủ trại: {topLiveRoom.streamer}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                          {topLiveRoom.title} <span className="text-amber-400 font-bold">({topLiveRoom.chang})</span>
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {topLiveRoom.loi} • Đang phát sóng trực tiếp từ chuồng xổ!
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => changeChannel(topLiveRoom.id, true)}
                          className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs sm:text-sm font-extrabold py-2.5 px-4 sm:px-5 rounded-xl shadow-lg shadow-rose-950/60 flex items-center gap-2 transition-transform hover:scale-105 shrink-0 cursor-pointer"
                        >
                          <Tv className="w-4 h-4" />
                          <span>VÀO PHÒNG LIVE NÀY</span>
                        </button>
                        <button
                          onClick={() => openConnectWithFarm(topLiveRoom.title, topLiveRoom.farm)}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>LIÊN HỆ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ======================================================== */
                  /* TRƯỜNG HỢP KHÔNG CÓ AI LIVE: HIỆN ẢNH HIỆN TẠI (ẢNH 2)    */
                  /* ======================================================== */
                  <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] flex flex-col justify-end p-5 sm:p-8">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1200&auto=format&fit=crop')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider flex items-center gap-1 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          TRỰC TIẾP HÔM NAY
                        </span>
                        <span className="text-xs text-amber-400 font-bold">
                          Trại Gà Ba Bình Định • Lên Sóng Dàn Tơ Mới Dạt
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                        XỔ THỬ ĐÒN DÀN TƠ CHẠNG 2K8 - 3K1 &amp; <span className="text-amber-400">SOI CÁN VẢY TRỰC TIẾP</span>
                      </h2>
                      
                      <p className="text-xs sm:text-sm text-gray-300 max-w-xl line-clamp-2">
                        Hôm nay trại lên sóng dàn gà đòn tơ vừa dạt nước đầu, lông hình dày dặn, bo đá chắc chắn. Anh em vào phòng live xem thả chân thử đòn, giao lưu kinh nghiệm đòn lối cùng chủ trại!
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button 
                          onClick={() => changeChannel('tiendev', true)}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-rose-950/60 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Tv className="w-4 h-4" />
                          XEM LUỒNG NÀY TRÊN PLAYER
                        </button>
                        <button 
                          onClick={() => openConnectWithFarm('MS 09: Xám Cần Đỏ (Chạng 2.95kg)', 'Trại Gà Ba Bình Định')}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          LIÊN HỆ CHỦ TRẠI
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Active Live Channels Widget (4 cols) */}
              <div className="lg:col-span-4 bg-[#16171d] rounded-2xl border border-white/10 p-4 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">Đang Xổ &amp; Lên Sóng</h3>
                  </div>
                  <span 
                    onClick={() => { setActiveNavTab('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-xs text-rose-400 font-semibold cursor-pointer hover:underline"
                  >
                    {displayKeys.length} Kênh
                  </span>
                </div>

                {/* List of active channels */}
                <div className="space-y-2.5 my-3 overflow-y-auto max-h-[260px] pr-1">
                  {displayKeys.map((item) => (
                    <div
                      key={item.key}
                      onClick={() => changeChannel(item.key, true)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        streamKey === item.key
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-md'
                          : 'bg-[#111217] hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span className="flex items-center gap-1.5 text-gray-300 font-bold truncate max-w-[170px]">
                          🐓 {item.title || item.streamer || item.key}
                        </span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {item.is_active ? 'LIVE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-gray-400 text-[11px]">Stream: {item.key}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          streamKey === item.key ? 'bg-rose-500 text-white' : 'bg-white/10 text-gray-300'
                        }`}>
                          Xem luồng
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div 
                  onClick={() => { setActiveNavTab('live'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="pt-2 text-center text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer font-semibold border-t border-white/10 flex items-center justify-center gap-1"
                >
                  <span>📺 Vào Phòng Live Xổ Gà xem đầy đủ &gt;</span>
                </div>
              </div>

            </div>

            {/* ==================== CATEGORY FILTER TABS ==================== */}
            {renderCategoryTabs()}

        {/* ==================== SECTION 2: GÀ MỚI LÊN CHUỒNG ==================== */}
        <section id="featured-chickens" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                Gà Mới Lên Chuồng &amp; Thông Số Cán Vảy
              </h2>
            </div>
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="text-xs sm:text-sm font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              Xem quy trình đóng lồng &gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="bg-[#16171d] rounded-2xl border border-white/10 p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-400">★</span> Gà Đòn Bình Định
                </span>
                <span className="bg-emerald-600/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">Đã Dạt 2 Nước</span>
              </div>

              <div className="space-y-1 font-bold text-xs">
                <div className="text-white text-sm">MS 201: Chuối Lửa Chân Xanh</div>
                <div className="text-[11px] text-gray-400 font-normal">Trại Gà Đòn Ninh Thuận • Lông hình phủ kín</div>
              </div>

              <div className="bg-[#0e0f14] rounded-xl p-3 text-[11px] space-y-1.5 border border-white/10 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Chạng:</span>
                  <span className="font-bold text-white">2.90 kg</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Cán vảy:</span>
                  <span className="font-bold text-amber-300">Giáp thới, huyền trâm</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Lối đá:</span>
                  <span className="text-emerald-400 font-bold">Ôm đấm, kiềng hầu</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Đã xổ thử 2 hiệp</span>
                <button 
                  onClick={() => openConnectWithFarm('MS 201: Chuối Lửa Chân Xanh (Chạng 2.9kg)', 'Trại Gà Ninh Thuận')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg"
                >
                  Hỏi Thông Tin Gà
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#16171d] rounded-2xl border border-white/10 p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-400">★</span> Gà Tre Cảnh Tân Châu
                </span>
                <span className="bg-blue-600/20 text-blue-400 font-bold px-2 py-0.5 rounded text-[10px]">Đuôi Phụng 68cm</span>
              </div>

              <div className="space-y-1 font-bold text-xs">
                <div className="text-white text-sm">MS 202: Tre Chuối Tuyết Bờm Trắng</div>
                <div className="text-[11px] text-gray-400 font-normal">Trại Gà Tre Miền Tây • Dạn người</div>
              </div>

              <div className="bg-[#0e0f14] rounded-xl p-3 text-[11px] space-y-1.5 border border-white/10 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Chạng:</span>
                  <span className="font-bold text-white">850 gram</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Bộ đuôi:</span>
                  <span className="font-bold text-amber-300">Xòe phụng 3 lớp chạm đất</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Tuổi gà:</span>
                  <span className="text-blue-400 font-bold">10 tháng tuổi</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Gà cảnh tuyển chọn</span>
                <button 
                  onClick={() => openConnectWithFarm('MS 202: Tre Chuối Tuyết Bờm Trắng', 'Trại Gà Tre Miền Tây')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg"
                >
                  Hỏi Thông Tin Gà
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#16171d] rounded-2xl border border-white/10 p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-400">★</span> Gà Đòn Bình Định
                </span>
                <span className="bg-emerald-600/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">Đã Dạt 3 Nước</span>
              </div>

              <div className="space-y-1 font-bold text-xs">
                <div className="text-white text-sm">MS 203: Tía Chân Xanh Án Thiên</div>
                <div className="text-[11px] text-gray-400 font-normal">Trại Gà Đòn Ba Bình Định • Chân vuông</div>
              </div>

              <div className="bg-[#0e0f14] rounded-xl p-3 text-[11px] space-y-1.5 border border-white/10 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Chạng:</span>
                  <span className="font-bold text-white">3.15 kg</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Cán vảy:</span>
                  <span className="font-bold text-amber-300">Án Thiên 1 sát đầu gối</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Lối đá:</span>
                  <span className="text-emerald-400 font-bold">Đòn mé xỏ ngang, giáp lưng</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Bao thử chân trực tiếp</span>
                <button 
                  onClick={() => openConnectWithFarm('MS 203: Tía Chân Xanh Án Thiên (Chạng 3.15kg)', 'Trại Gà Ba Bình Định')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg"
                >
                  Hỏi Thông Tin Gà
                </button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#16171d] rounded-2xl border border-white/10 p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-xl">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-400">★</span> Gà Đông Tảo Hưng Yên
                </span>
                <span className="bg-purple-600/20 text-purple-400 font-bold px-2 py-0.5 rounded text-[10px]">Giống Chuẩn F1</span>
              </div>

              <div className="space-y-1 font-bold text-xs">
                <div className="text-white text-sm">MS 204: Đông Tảo Tiến Vua Chân Khủng</div>
                <div className="text-[11px] text-gray-400 font-normal">Trại Gà Khoái Châu • Chân vảy thịt đỏ</div>
              </div>

              <div className="bg-[#0e0f14] rounded-xl p-3 text-[11px] space-y-1.5 border border-white/10 font-mono">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Chạng:</span>
                  <span className="font-bold text-white">4.60 kg</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Đặc điểm:</span>
                  <span className="font-bold text-amber-300">Chân to xù vảy thịt đỏ au</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400 font-sans">Tiêm phòng:</span>
                  <span className="text-purple-400 font-bold">Đầy đủ 100% vắc xin</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Chuẩn giống Khoái Châu</span>
                <button 
                  onClick={() => openConnectWithFarm('MS 204: Đông Tảo Tiến Vua Chân Khủng', 'Trại Gà Khoái Châu')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg"
                >
                  Hỏi Thông Tin Gà
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ==================== SECTION 3: CÁC TRẠI GIAO LƯU THƯỜNG XUYÊN ==================== */}
        <section id="farms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                Các Trại Giao Lưu Thường Xuyên Lên Live
              </h2>
            </div>
            <span className="text-xs text-gray-400">Bấm vào avatar để chuyển sang kênh trại đó</span>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-1">
            <div onClick={() => changeChannel('tiendev', true)} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[120px]">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-600 to-orange-500 group-hover:scale-105 transition-transform shadow-lg">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="Ba Bình Định" />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#16171d]"></span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors text-center truncate max-w-[110px]">
                Ba Bình Định
              </span>
              <span className="text-[10px] text-amber-400">Chuyên dòng gà đòn</span>
            </div>

            <div onClick={() => changeChannel('test', true)} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[120px]">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-[#282a36] group-hover:bg-rose-600 group-hover:scale-105 transition-all">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="Sáu Khải" />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#16171d]"></span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors text-center truncate max-w-[110px]">
                Sáu Khải Tân Châu
              </span>
              <span className="text-[10px] text-gray-400">Gà tre cảnh An Giang</span>
            </div>

            <div onClick={() => changeChannel('supersecret', true)} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[120px]">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-[#282a36] group-hover:bg-rose-600 group-hover:scale-105 transition-all">
                <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="Anh Ba" />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#16171d]"></span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors text-center truncate max-w-[110px]">
                Anh Ba Chợ Lách
              </span>
              <span className="text-[10px] text-gray-400">Gà nòi cựa Bến Tre</span>
            </div>

            <div onClick={() => changeChannel('dongtao', true)} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[120px]">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-600 to-orange-500 group-hover:scale-105 transition-transform shadow-lg">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="Bác Tiến" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors text-center truncate max-w-[110px]">
                Bác Tiến Khoái Châu
              </span>
              <span className="text-[10px] text-amber-400">Đông Tảo thuần chủng</span>
            </div>

            <div onClick={() => changeChannel('caolanh', true)} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[120px]">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-[#282a36] group-hover:bg-rose-600 group-hover:scale-105 transition-all">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover rounded-full" alt="Út Lớn" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-rose-400 transition-colors text-center truncate max-w-[110px]">
                Út Lớn Cao Lãnh
              </span>
              <span className="text-[10px] text-gray-400">Gà nòi đòn Đồng Tháp</span>
            </div>
          </div>
        </section>

        {/* ==================== SECTION 4: DÒNG KÊ BA MIỀN ==================== */}
        <section id="breeds" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                Các Dòng Kê Nổi Danh Ba Miền
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#16171d] hover:bg-[#1c1d25] border border-white/10 hover:border-amber-400/50 rounded-2xl h-28 flex items-center justify-center p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md group">
              <div className="flex flex-col items-center text-center font-extrabold text-sm sm:text-base">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🐓</span>
                <span className="text-white group-hover:text-amber-400 transition-colors">Gà Đòn Bình Định</span>
                <span className="text-[10px] text-gray-400 font-medium">Lối ôm đấm, kiềng mé</span>
              </div>
            </div>

            <div className="bg-[#16171d] hover:bg-[#1c1d25] border border-white/10 hover:border-amber-400/50 rounded-2xl h-28 flex items-center justify-center p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md group">
              <div className="flex flex-col items-center text-center font-extrabold text-sm sm:text-base">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌴</span>
                <span className="text-white group-hover:text-amber-400 transition-colors">Gà Nòi Chợ Lách</span>
                <span className="text-[10px] text-gray-400 font-medium">Bến Tre • Cựa sắc nhọn</span>
              </div>
            </div>

            <div className="bg-[#16171d] hover:bg-[#1c1d25] border border-white/10 hover:border-amber-400/50 rounded-2xl h-28 flex items-center justify-center p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md group">
              <div className="flex flex-col items-center text-center font-extrabold text-sm sm:text-base">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👑</span>
                <span className="text-white group-hover:text-amber-400 transition-colors">Gà Đông Tảo</span>
                <span className="text-[10px] text-rose-400 font-bold uppercase">Khoái Châu Hưng Yên</span>
              </div>
            </div>

            <div className="bg-[#16171d] hover:bg-[#1c1d25] border border-white/10 hover:border-amber-400/50 rounded-2xl h-28 flex items-center justify-center p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md group">
              <div className="flex flex-col items-center text-center font-extrabold text-sm sm:text-base">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🪶</span>
                <span className="text-white group-hover:text-amber-400 transition-colors">Gà Tre Tân Châu</span>
                <span className="text-[10px] text-gray-400 font-medium">Đuôi phụng, bờm xòe</span>
              </div>
            </div>

            <div className="bg-[#16171d] hover:bg-[#1c1d25] border border-white/10 hover:border-amber-400/50 rounded-2xl h-28 flex items-center justify-center p-3 cursor-pointer transition-all hover:-translate-y-1 shadow-md col-span-2 sm:col-span-1 group">
              <div className="flex flex-col items-center text-center font-extrabold text-sm sm:text-base">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚡</span>
                <span className="text-white group-hover:text-amber-400 transition-colors">Gà Nòi Cao Lãnh</span>
                <span className="text-[10px] text-gray-400 font-medium">Đồng Tháp • Cốt gà lì</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== BANNER LƯU Ý GIAO NHẬN XE KHÁCH ==================== */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-rose-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 z-10 text-center sm:text-left">
            <span className="text-amber-400 font-bold uppercase text-xs tracking-wider">Kinh Nghiệm Giao Nhận</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              LƯU Ý KHI GIAO NHẬN GÀ QUA XE KHÁCH ĐI CÁC TỈNH
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Khi ra điểm đón xe nhận lồng gà, anh em nhớ quay video từ lúc nhận thùng từ tay phụ xe tới lúc khui lồng, kiểm tra thể trạng và cho gà uống nước chè ấm hồi sức sau chặng đường dài.
            </p>
          </div>
          <button 
            onClick={() => setIsPolicyModalOpen(true)}
            className="z-10 flex-shrink-0 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 uppercase tracking-wider cursor-pointer"
          >
            Xem Hướng Dẫn Chi Tiết
          </button>
        </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: PHÒNG LIVE XỔ GÀ (DEDICATED LIVE THEATER VIEW)    */}
        {/* ======================================================== */}
        {activeNavTab === 'live' && (
          <div className="space-y-8 animate-fadeIn">

            {/* Breadcrumb & Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14151c] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveNavTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Về Trang Chủ</span>
                </button>
                <div className="h-4 w-px bg-white/15 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <h1 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                    Phòng Live Xổ Gà: <span className="text-rose-400 font-mono">{streamKey}</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?stream=${encodeURIComponent(streamKey)}`;
                    copyToClipboard(shareUrl, 'shareChannel');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1c25] hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
                  title="Sao chép link trực tiếp phòng live này để gửi anh em xem"
                >
                  {copiedField === 'shareChannel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedField === 'shareChannel' ? 'Đã sao chép link!' : 'Chia sẻ phòng'}</span>
                </button>
              </div>
            </div>

            {/* ==================== CENTRAL LIVE PLAYER & REAL LIVECHAT SECTION ==================== */}
            <section ref={playerSectionRef} id="main-player-section" className="space-y-4 pt-1">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Cột trái: LivePlayer & Pinned Chicken Info (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  
                  {/* VIDEO PLAYER COMPONENT (HLS Stream) */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                    <LivePlayer streamKey={streamKey} />

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
                        className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hỏi Về Con Này</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Input đổi Stream Key thủ công & Session ID */}
                  <div className="bg-[#16171d] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <form onSubmit={handleApplyKey} className="flex-1 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={inputKey}
                          onChange={(e) => setInputKey(e.target.value)}
                          placeholder="Nhập mã stream key để xem..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e0f14] border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shrink-0 cursor-pointer"
                      >
                        Xem Key Này
                      </button>
                    </form>

                    {currentSessionId && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-[#0e0f14] px-3 py-1.5 rounded-xl border border-white/5">
                        <span>Session: {currentSessionId}</span>
                        <button
                          onClick={() => copyToClipboard(currentSessionId, 'sessionId')}
                          className="text-gray-400 hover:text-white cursor-pointer"
                          title="Sao chép Session ID"
                        >
                          {copiedField === 'sessionId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Cột phải: LiveChat & OBS Configuration Tabs (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  
                  {/* Tab Selector */}
                  <div className="flex items-center p-1.5 rounded-2xl bg-[#16171d] border border-white/10">
                    <button
                      onClick={() => setActiveRightTab('chat')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeRightTab === 'chat'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Trò chuyện</span>
                    </button>

                    <button
                      onClick={() => setActiveRightTab('obs')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeRightTab === 'obs'
                          ? 'bg-white/15 text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Cấu hình OBS</span>
                    </button>

                    <button
                      onClick={() => setActiveRightTab('info')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeRightTab === 'info'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title="Thông tin đòn vảy"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>

                  {/* TAB 1: REAL LIVE CHAT COMPONENT */}
                  {activeRightTab === 'chat' && (
                    <div className="h-[480px] lg:h-[530px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#16171d] shadow-xl">
                      <LiveChat
                        streamKey={streamKey}
                        user={currentUser}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                      />
                    </div>
                  )}

                  {/* TAB 2: OBS CONFIGURATION */}
                  {activeRightTab === 'obs' && (
                    <div className="h-[480px] lg:h-[530px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-4 text-xs shadow-xl">
                      <div className="flex items-center justify-between text-rose-400 font-bold text-sm tracking-wide uppercase">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Thông số OBS Studio</span>
                        </div>
                        {currentUser?.role === 'admin' && (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            👑 Admin
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-gray-400 mb-1 font-medium">1. Server (RTMP URL):</div>
                          <div className="flex items-center justify-between bg-[#0e0f14] border border-white/10 rounded-lg p-2 font-mono text-gray-200">
                            <span>{getRtmpBaseUrl()}</span>
                            <button 
                              onClick={() => copyToClipboard(getRtmpBaseUrl(), 'obsUrl')}
                              className="text-gray-400 hover:text-white ml-2 cursor-pointer"
                            >
                              {copiedField === 'obsUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400 mb-1 font-medium">2. Stream Key:</div>
                          <div className="flex items-center justify-between bg-[#0e0f14] border border-white/10 rounded-lg p-2 font-mono text-rose-400 font-bold">
                            <span>{myStreamKey || streamKey}</span>
                            <button 
                              onClick={() => copyToClipboard(myStreamKey || streamKey, 'obsKey')}
                              className="text-gray-400 hover:text-white ml-2 cursor-pointer"
                            >
                              {copiedField === 'obsKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-400 mb-1 font-medium">3. Camera iPhone / WebRTC (HTTPS):</div>
                          <div className="flex items-center justify-between bg-[#0e0f14] border border-white/10 rounded-lg p-2 font-mono text-cyan-400 text-xs">
                            <span className="truncate">{`https://${getHost()}:8088/players/rtc_publisher.html?app=live&stream=${myStreamKey || streamKey}`}</span>
                            <button 
                              onClick={() => copyToClipboard(`https://${getHost()}:8088/players/rtc_publisher.html?app=live&stream=${myStreamKey || streamKey}`, 'mobileUrl')}
                              className="text-gray-400 hover:text-white ml-2 shrink-0 cursor-pointer"
                              title="Sao chép link phát HTTPS"
                            >
                              {copiedField === 'mobileUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                        💡 Chỉ tài khoản có quyền <strong>Admin</strong> mới phát sóng được qua OBS. Hãy đăng nhập tài khoản Admin để phát luồng của bạn.
                      </div>
                    </div>
                  )}

                  {/* TAB 3: THÔNG TIN CHI TIẾT CHIẾN KÊ HIỆN TẠI */}
                  {activeRightTab === 'info' && (
                    <div className="h-[480px] lg:h-[530px] w-full rounded-2xl overflow-y-auto border border-white/10 bg-[#16171d] p-5 space-y-4 text-xs shadow-xl">
                      <div className="text-amber-400 font-bold text-sm uppercase flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Hồ Sơ Chiến Kê Trên Sóng</span>
                      </div>

                      <div className="space-y-3 font-mono bg-[#0e0f14] p-3.5 rounded-xl border border-white/10">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-sans">Mã số:</span>
                          <span className="font-bold text-white">{currentRoomInfo.ms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-sans">Chạng cân:</span>
                          <span className="font-bold text-amber-300">{currentRoomInfo.chang}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-sans">Lối đá:</span>
                          <span className="font-bold text-emerald-400">{currentRoomInfo.loi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-sans">Chủ trại:</span>
                          <span className="font-bold text-rose-400">{currentRoomInfo.farm}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => openConnectWithFarm(currentRoomInfo.title, currentRoomInfo.farm)}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition text-center shadow-md uppercase cursor-pointer"
                      >
                        Gửi Yêu Cầu Kết Nối Với Chủ Trại
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </section>

            {/* ==================== CATEGORY FILTER TABS IN LIVE THEATER ==================== */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 bg-rose-500 rounded-full"></span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Lọc Theo Chạng Gà Lên Sóng</h3>
              </div>
              {renderCategoryTabs()}
            </div>

            {/* ==================== SECTION 1: CÁC PHÒNG LIVE XỔ GÀ ĐANG LÊN SÓNG ==================== */}
            <section id="live-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                    Danh Sách Các Phòng Live Đang Xổ &amp; Lên Sóng
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  Bấm vào card để tải luồng vào màn hình phát
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {liveRooms
                  .filter((room) => {
                    if (activeCategory === 'all') return true;
                    if (activeCategory === 'don') return room.title.toLowerCase().includes('đòn') || room.loi.toLowerCase().includes('đòn') || room.farm.toLowerCase().includes('bình định') || room.id === 'tiendev';
                    if (activeCategory === 'tre') return room.title.toLowerCase().includes('tre') || room.farm.toLowerCase().includes('tân châu') || room.id === 'test';
                    if (activeCategory === 'noi') return room.title.toLowerCase().includes('nòi') || room.title.toLowerCase().includes('asil') || room.id === 'supersecret' || room.id === 'caolanh';
                    if (activeCategory === 'dongtao') return room.title.toLowerCase().includes('đông tảo') || room.id === 'dongtao';
                    return true;
                  })
                  .map((room) => (
                  <div
                    key={room.id}
                    onClick={() => changeChannel(room.id, true)}
                    className={`bg-[#16171d] rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer group shadow-xl flex flex-col justify-between ${
                      streamKey === room.id ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-white/10 hover:border-rose-500/60'
                    }`}
                  >
                    <div className="relative h-32 bg-gradient-to-tr from-gray-900 to-gray-800 overflow-hidden">
                      <img src={room.thumb} className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" alt={room.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
                      
                      <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE ({room.viewers})
                      </span>

                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full border border-white/50 bg-black/60 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white">
                          {room.streamer.substring(0, 1)}
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-amber-300 border border-amber-500/30">
                        Chạng: {room.chang}
                      </div>
                    </div>

                    <div className="p-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 truncate">
                        <span className="text-amber-400">★</span>
                        <span className="truncate">{room.farm}</span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-white truncate">{room.ms}: {room.title}</h4>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{room.loi}</p>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-gray-300 font-semibold truncate">
                          <span className="text-rose-500">🎙️</span>
                          <span className="truncate">{room.streamer}</span>
                        </div>
                        <button className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                          {streamKey === room.id ? 'Đang xem' : 'Vào xem'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: CHỢ GÀ BA MIỀN / ĐĂNG BÁN CHIẾN KÊ              */}
        {/* ======================================================== */}
        {activeNavTab === 'market' && (
          <ChickenMarketplace
            chickens={chickensList}
            onOpenPostModal={() => setIsPostChickenModalOpen(true)}
            onSelectChicken={(chicken) => setSelectedMarketChicken(chicken)}
            onOpenConnect={openConnectWithFarm}
            onOpenPolicy={() => setIsPolicyModalOpen(true)}
          />
        )}

      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-16 bg-[#0a0b0e] border-t border-white/10 pt-12 pb-8 text-xs text-gray-400">
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
                <span className="text-2xl font-black italic tracking-tighter text-white">
                  kê<span className="text-rose-500">TRƯỜNG</span> <span className="text-xs font-bold text-gray-400">LIVE</span>
                </span>
              </a>
              <p className="leading-relaxed">
                Kênh phát sóng trực tiếp giao lưu gà nòi, gà đòn, gà tre cảnh. Nơi chia sẻ đam mê, học hỏi kinh nghiệm vần đòn và kết nối anh em kê thủ khắp ba miền.
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
                    <span>Chợ Gà (Đăng Bán)</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (activeNavTab !== 'home') setActiveNavTab('home');
                      setTimeout(() => document.getElementById('featured-chickens')?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                  >
                    Gà Mới Lên Chuồng
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (activeNavTab !== 'home') setActiveNavTab('home');
                      setTimeout(() => document.getElementById('breeds')?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                  >
                    Dòng Kê Ba Miền
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (activeNavTab !== 'home') setActiveNavTab('home');
                      setTimeout(() => document.getElementById('farms')?.scrollIntoView({ behavior: 'smooth' }), 50);
                    }}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                  >
                    Danh Sách Trại Giao Lưu
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

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Kê Trường Live. Nền tảng Livestream Giao Lưu &amp; Kết Nối Đam Mê Gà Nòi Ba Miền.</p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-gray-500">SRS 5 Hybrid • HLS/WebRTC • MongoDB Atlas</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== FLOATING BACK TO TOP BUTTON ==================== */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 flex items-center justify-center transition-transform hover:scale-110" 
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
                      <div className="font-bold text-white">{r.ms}: {r.title}</div>
                      <div className="text-[10px] text-gray-400">{r.farm} • Chạng: {r.chang}</div>
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
        }}
        token={authToken}
        currentUser={currentUser}
        currentStreamKey={streamKey}
      />

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

      <ChickenDetailModal
        chicken={selectedMarketChicken}
        isOpen={!!selectedMarketChicken}
        onClose={() => setSelectedMarketChicken(null)}
        onOpenConnect={openConnectWithFarm}
      />

    </div>
  );
}
