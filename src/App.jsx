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
  ShoppingBag,
  ShieldCheck,
  Sun,
  Moon,
  Play
} from 'lucide-react';
import { getApiBaseUrl, getHlsBaseUrl, getRtmpBaseUrl, getHost } from './config';

// Dữ liệu chiến kê thực tế tại Trại Gà Thành Trung & các trại giao lưu
const INITIAL_CHICKENS = [
  {
    id: 'ck_0',
    ms: 'MS 101',
    title: 'Ô Chân Trắng Điểm Mực 2K95 Bo Đá Cực Chắc, Ôm Đấm Đòn Lưng',
    breed: 'don',
    breedName: 'Gà Đòn Long Biên',
    chang: '2.95 kg',
    age: '11 tháng tơ',
    canVay: 'Huyền trâm đóng đúng chậu, chân vuông sừng',
    loi: 'Lối ôm đấm kiềng hầu, đá mé giáp lưng',
    datNuoc: 'Đã dạt 2 nước chuẩn',
    price: 3500000,
    priceText: '3.500.000 đ',
    farm: 'Trại Gà Thành Trung',
    sellerName: 'Thành Trung Long Biên',
    phone: '0988.888.xxx',
    zalo: '0988.888.xxx',
    location: 'Long Biên, Hà Nội',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=800&auto=format&fit=crop',
    videoUrl: '',
    note: 'Chiến kê đúc trực tiếp tại trại Long Biên. Khách qua xem trực tiếp tại chuồng hoặc gọi Zalo xem video.',
    status: 'available',
    createdAt: '2026-10-23T08:00:00Z'
  },
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
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('traiga_theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
      try {
        localStorage.setItem('traiga_theme', themeMode);
      } catch (e) {}
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      } catch (e) { }
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
        } catch (e) { }
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
    }).catch(() => { });

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

  // Danh sách key từ MongoDB & danh sách Video Xem Lại (Replays)
  const [dbKeys, setDbKeys] = useState([]);
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

  useEffect(() => {
    fetchKeysAndSessions();
    fetchSrsStreams();
    fetchReplays();
    const interval = setInterval(() => {
      fetchKeysAndSessions();
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

  // Mở modal đăng bán gà (Bắt buộc đăng nhập tài khoản)
  const openPostChickenWithAuth = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsPostChickenModalOpen(true);
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
  const matchedDbKey = dbKeys.find((d) => d.key === streamKey);
  const currentRoomInfo = liveRooms.find(r => r.id === streamKey) || {
    ms: 'MS KÊ',
    title: matchedDbKey?.title || 'Phòng Live Xổ Gà Trực Tiếp',
    farm: matchedDbKey?.streamer ? `Trại Gà ${matchedDbKey.streamer}` : 'Trại Gà Thành Trung',
    streamer: matchedDbKey?.streamer || 'Chủ Trại',
    chang: 'Chạng chuẩn',
    loi: 'Lối đòn chuẩn dòng kê',
    viewers: 'Đang live'
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
        title: dbK?.title || 'Phòng Live Xổ Gà Trực Tiếp',
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

  // Component hiển thị danh sách Video Xem Lại (Google Drive / SRS DVR) dùng chung cho Trang Chủ & Phòng Live
  const renderReplaysSection = () => {
    if (!replays || replays.length === 0) return null;
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
                <span>🎬 Xem Lại Các Phiên Live Đã Phát</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {replays.length} Video
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Video lưu trữ trên Google Drive • Bấm vào phiên bất kỳ để xem lại toàn bộ buổi xổ gà
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ==================== TOP BAR ==================== */}
      <div className="border-b border-slate-800 bg-[#0e1017] text-xs text-slate-300 py-2 px-4 sm:px-8">
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
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">

          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center gap-2 xl:gap-6 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveNavTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group shrink-0 cursor-pointer"
            >
              {/* Prestigious crest emblem */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 p-[1.5px] shadow-md group-hover:shadow-amber-500/20 transition-all">
                <div className="w-full h-full bg-[#14151b] rounded-[7px] flex items-center justify-center border border-amber-400/30">
                  <span className="text-amber-400 font-black text-sm tracking-tight">TT</span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none whitespace-nowrap">
                    TRẠI GÀ <span className="text-amber-400">THÀNH TRUNG</span>
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase whitespace-nowrap mt-0.5">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Prominent Đăng Bán Gà Button */}
            <button
              onClick={openPostChickenWithAuth}
              className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-3 sm:px-4 py-2 rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
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
                  <div className={`w-5 h-5 rounded-full text-white font-bold text-[11px] flex items-center justify-center uppercase ${currentUser.role === 'systemadmin' ? 'bg-purple-600' : currentUser.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-rose-600'
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
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${activeNavTab === 'home' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          Trang Chủ
        </button>
        <button
          onClick={() => {
            setActiveNavTab('live');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${activeNavTab === 'live' ? 'bg-rose-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Phòng Live
        </button>
        <button
          onClick={() => {
            setSelectedMarketChicken(null);
            setActiveNavTab('market');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${activeNavTab === 'market' ? 'bg-amber-500 text-black font-extrabold shadow-sm' : 'text-gray-400 hover:text-white bg-white/5'
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

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => changeChannel(topLiveRoom.id, true)}
                          className="bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 sm:px-5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                        >
                          <Tv className="w-4 h-4" />
                          <span>VÀO PHÒNG LIVE</span>
                        </button>
                        <button
                          onClick={() => openConnectWithFarm(topLiveRoom.title, topLiveRoom.farm)}
                          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold py-2.5 px-3.5 rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>LIÊN HỆ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TRƯỜNG HỢP HIỆN TẠI CHƯA CÓ LIVE: BANNER LỊCH XỔ GÀ TRẠI THÀNH TRUNG */
                  <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] flex flex-col justify-end p-5 sm:p-8">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1200&auto=format&fit=crop')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017] via-[#0e1017]/80 to-transparent"></div>

                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-red-700 text-white text-[11px] font-bold uppercase px-2.5 py-0.5 rounded tracking-wide">
                          LỊCH XỔ GÀ HÔM NAY
                        </span>
                        <span className="text-xs text-amber-400 font-semibold">
                          Trại Gà Thành Trung • Long Biên, Hà Nội
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                        SỔ THỬ ĐÒN DÀN GÀ TƠ CHẠNG 2K8 - 3K2 &amp; <span className="text-amber-400">SOI CÁN VẢY TRỰC TIẾP</span>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2">
                        Trại Gà Thành Trung chuyên gà đòn, gà nòi tuyển chọn. Lịch xổ đòn vào 14h00 &amp; 19h30 hàng ngày. Anh em có thể xem video thực tế hoặc qua trực tiếp chuồng trại tại Long Biên giao lưu.
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (activeNavTab !== 'market') setActiveNavTab('market');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          XEM DÀN GÀ ĐANG CÓ SẴN
                        </button>
                        <button
                          onClick={() => openConnectWithFarm('Dàn Gà Tơ Trại Thành Trung', 'Trại Gà Thành Trung Long Biên')}
                          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          LIÊN HỆ XEM CLIP ZALO
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
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${streamKey === item.key
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-md'
                          : 'bg-[#111217] hover:bg-white/5 border-white/5'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span className="flex items-center gap-1.5 text-gray-300 font-bold truncate max-w-[170px]">
                          🐓 {item.title || item.streamer || 'Phòng Live Trại Gà'}
                        </span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {item.is_active ? 'LIVE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 text-[11px]">Chủ kê: {item.streamer || 'Trại Gà Thành Trung'}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${streamKey === item.key ? 'bg-rose-500 text-white' : 'bg-white/10 text-gray-300'
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

            {/* ==================== XEM LẠI PHIÊN LIVE ĐÃ PHÁT ==================== */}
            {renderReplaysSection()}

            {/* ==================== DANH SÁCH GÀ ĐANG BÁN (CÓ ẢNH RÕ RÀNG, BẤM XEM CHI TIẾT) ==================== */}
            <section id="featured-chickens" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Gà Đang Bán Tại Trại &amp; Giao Lưu
                </h2>
                <button
                  onClick={() => {
                    setSelectedMarketChicken(null);
                    setActiveNavTab('market');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  Xem tất cả ({chickensList.length}) &gt;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {chickensList.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#16171d] rounded-xl border border-white/10 hover:border-amber-500/50 transition overflow-hidden flex flex-col justify-between"
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
                        className="w-full h-full object-cover"
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
                          <span className="text-lg font-bold text-amber-400">
                            {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Giá thỏa thuận')}
                          </span>
                          <span className="text-xs text-gray-400">{item.location}</span>
                        </div>
                        <h3
                          onClick={() => {
                            setSelectedMarketChicken(item);
                            setActiveNavTab('market');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="font-bold text-base text-white line-clamp-2 hover:text-amber-400 cursor-pointer leading-snug"
                        >
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {item.farm} • {item.canVay}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => {
                            setSelectedMarketChicken(item);
                            setActiveNavTab('market');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2 px-3 rounded-lg bg-[#0e0f14] hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition cursor-pointer"
                        >
                          Xem Chi Tiết
                        </button>
                        <a
                          href={`tel:${item.phone?.replace(/\D/g, '') || '0988888888'}`}
                          className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Gọi Điện</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ==================== CÁC TRẠI GIAO LƯU THƯỜNG XUYÊN (ĐƠN GIẢN) ==================== */}
            <section id="farms" className="space-y-3">
              <h2 className="text-lg font-bold text-white">
                Các Trại Giao Lưu Thường Xuyên
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'thanh-trung', name: 'Trại Thành Trung', loc: 'Long Biên - Hà Nội' },
                  { key: 'tiendev', name: 'Ba Bình Định', loc: 'Gà đòn Tây Sơn' },
                  { key: 'test', name: 'Sáu Khải', loc: 'Tân Châu An Giang' },
                  { key: 'supersecret', name: 'Anh Ba', loc: 'Chợ Lách Bến Tre' },
                  { key: 'dongtao', name: 'Bác Tiến', loc: 'Khoái Châu Hưng Yên' },
                  { key: 'caolanh', name: 'Út Lớn', loc: 'Cao Lãnh Đồng Tháp' }
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
                    Phòng Live Xổ Gà: <span className="text-amber-400">{currentRoomInfo.farm}</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?tab=live`;
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
                        className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hỏi Về Con Này</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Cột phải: LiveChat & Thông tin chiến kê (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-3">

                  {/* Tab Selector */}
                  <div className="flex items-center p-1.5 rounded-2xl bg-[#16171d] border border-white/10">
                    <button
                      onClick={() => setActiveRightTab('chat')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeRightTab === 'chat'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Trò chuyện</span>
                    </button>

                    <button
                      onClick={() => setActiveRightTab('info')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeRightTab === 'info'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      title="Thông tin đòn vảy"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Thông tin gà</span>
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

                  {/* TAB 2: THÔNG TIN CHI TIẾT CHIẾN KÊ HIỆN TẠI */}
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
                      className={`bg-[#16171d] rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer group shadow-xl flex flex-col justify-between ${streamKey === room.id ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-white/10 hover:border-rose-500/60'
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

    </div>
  );
}
