import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Lock,
  Phone,
  Shield,
  Key,
  Copy,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  ArrowLeft,
  Tv,
  Radio,
  ShoppingBag,
  Clock,
  BadgeCheck
} from 'lucide-react';
import { getApiBaseUrl } from '../config';

// Danh sách các avatar mẫu đẹp phong cách trại gà & chiến binh để chọn nhanh
const PRESET_AVATARS = [
  {
    name: 'Chiến Kê Lửa',
    url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Tân Châu Khét',
    url: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Đại Bàng Vàng',
    url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Sư Tử Oai Vệ',
    url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Chủ Trại Bản Lĩnh',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Thần Kê Chiến Binh',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=256&auto=format&fit=crop'
  }
];

export default function UserProfilePage({
  currentUser,
  authToken,
  myStreamKey,
  onProfileUpdated,
  onBack,
  onNavigateTab
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarInputUrl, setAvatarInputUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Đổi mật khẩu
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Trạng thái xử lý
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const fileInputRef = useRef(null);

  // Điền dữ liệu ban đầu
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
      setAvatarInputUrl('');
      setShowUrlInput(false);
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-8 bg-[#13141c] border border-white/10 rounded-2xl space-y-4">
          <User className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Yêu Cầu Đăng Nhập</h2>
          <p className="text-xs text-gray-400">Vui lòng đăng nhập tài khoản để xem và cập nhật hồ sơ cá nhân.</p>
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Quay Lại Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // Xử lý nén ảnh trên Canvas và chuyển thành Base64 Data URL (lưu trực tiếp trong MongoDB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn định dạng file hình ảnh (JPG, PNG, WEBP...)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén ảnh về kích thước tối đa 280x280 để tối ưu dung lượng DB (< 35KB)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Chuyển sang dạng Data URL JPEG chất lượng 85%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
        setSuccessMsg('Đã tải và tối ưu ảnh đại diện sẵn sàng lưu vào database!');
        setErrorMsg('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Áp dụng URL ảnh từ bên ngoài
  const handleApplyUrl = () => {
    if (!avatarInputUrl.trim()) return;
    setAvatar(avatarInputUrl.trim());
    setShowUrlInput(false);
    setAvatarInputUrl('');
    setSuccessMsg('Đã cập nhật liên kết ảnh đại diện!');
  };

  // Sao chép Stream Key
  const handleCopyStreamKey = () => {
    const keyToCopy = myStreamKey || currentUser.username;
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Lưu thông tin người dùng vào database
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Kiểm tra mật khẩu mới nếu người dùng muốn đổi
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setErrorMsg('Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Xác nhận mật khẩu mới không khớp');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar: avatar
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu thông tin');
      }

      setSuccessMsg('✅ Đã lưu thông tin và ảnh đại diện vào cơ sở dữ liệu MongoDB thành công!');
      
      if (onProfileUpdated && data.user) {
        onProfileUpdated(data.user);
      }

      // Xóa form đổi mật khẩu nếu thành công
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Vai trò hiển thị
  const roleName = currentUser.role === 'systemadmin' 
    ? 'Ban Quản Trị Hệ Thống (SysAdmin)' 
    : currentUser.role === 'admin' 
    ? 'Chủ Trại Chiến Kê (Admin Streamer)' 
    : 'Thành Viên Giao Lưu (User)';

  const roleBadgeColor = currentUser.role === 'systemadmin'
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    : currentUser.role === 'admin'
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* ==================== BREADCRUMB & BACK HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer font-medium px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">Tài khoản</span>
          <span className="text-gray-600">/</span>
          <span className="text-amber-300 font-bold">Hồ sơ cá nhân</span>
        </div>

        {/* Lối tắt các tab */}
        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('home')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trang Chủ</span>
              </button>
              <button
                onClick={() => onNavigateTab('live')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Phòng Live</span>
              </button>
              <button
                onClick={() => onNavigateTab('market')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Chợ Gà</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================== TIÊU ĐỀ TRANG ==================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#171924] via-[#14151e] to-[#101117] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Hồ Sơ & Tài Khoản Cá Nhân</span>
              <BadgeCheck className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Chỉnh sửa thông tin cá nhân, cập nhật ảnh đại diện và lưu trữ vĩnh viễn vào cơ sở dữ liệu MongoDB
            </p>
          </div>
        </div>

        <div className={`px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 inline-flex items-center gap-2 shadow-sm ${roleBadgeColor}`}>
          <Shield className="w-4 h-4" />
          <span>{roleName}</span>
        </div>
      </div>

      {/* ==================== THÔNG BÁO LỖI / THÀNH CÔNG ==================== */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-fade-in">
          <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================== FORM CHÍNH: 2 CỘT RESPONSIVE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CỘT TRÁI (5 cols): AVATAR & QUẢN LÝ ẢNH ĐẠI DIỆN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Ảnh Đại Diện (Lưu Database)</span>
              </h2>
              <span className="text-[10px] text-gray-500 font-mono">MongoDB Sync</span>
            </div>

            {/* Vòng tròn Avatar Preview */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-400/60 shadow-2xl shadow-amber-500/20 bg-slate-900 flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setErrorMsg('Không thể nạp ảnh từ liên kết URL này');
                        setAvatar('');
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-black text-4xl uppercase text-white ${
                      currentUser.role === 'systemadmin' 
                        ? 'bg-purple-600' 
                        : currentUser.role === 'admin' 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-rose-600'
                    }`}>
                      {currentUser.username?.substring(0, 1) || 'A'}
                    </div>
                  )}
                </div>

                {/* Nút bấm nhanh trên ảnh */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Tải ảnh mới từ thiết bị"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {fullName || currentUser.username}
                </p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  @{currentUser.username}
                </p>
              </div>

              {/* Các nút Upload / URL / Gỡ */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh từ máy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Dán URL ảnh</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      setSuccessMsg('Đã gỡ ảnh đại diện (trở về chữ cái mặc định)');
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Gỡ ảnh đại diện"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Gỡ</span>
                  </button>
                )}
              </div>

              {/* Khung dán URL ảnh nếu bật */}
              {showUrlInput && (
                <div className="flex items-center gap-2 w-full pt-2">
                  <input
                    type="url"
                    value={avatarInputUrl}
                    onChange={(e) => setAvatarInputUrl(e.target.value)}
                    placeholder="Dán link ảnh https://..."
                    className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Dùng
                  </button>
                </div>
              )}

              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh tự động nén tối ưu hóa kích thước và lưu trữ trực tiếp vào cơ sở dữ liệu.
              </p>
            </div>

            {/* Avatar mẫu chọn nhanh */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <span className="text-[11px] font-bold text-gray-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hoặc chọn nhanh avatar chiến kê & thần thú mẫu:</span>
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(item.url);
                      setSuccessMsg(`Đã chọn avatar mẫu: ${item.name}`);
                    }}
                    title={item.name}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition-all cursor-pointer group ${
                      avatar === item.url 
                        ? 'border-amber-400 ring-2 ring-amber-400/60 scale-105 shadow-md shadow-amber-500/20' 
                        : 'border-white/10 hover:border-amber-400/40 hover:scale-102'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {avatar === item.url && (
                      <span className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow font-bold" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Hộp Thông Tin Phụ: Trạng thái kết nối */}
          <div className="bg-[#13151f] border border-white/10 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
            <div className="flex items-center justify-between text-gray-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trạng Thái Phiên:</span>
              </span>
              <span className="text-emerald-400 font-bold">Đang Hoạt Động</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Đồng Bộ Realtime:</span>
              <span className="text-gray-200 font-mono">Bật (Live Chat & Studio)</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 cols): BIỂU MẪU CHỈNH SỬA THÔNG TIN */}
        <div className="lg:col-span-7">
          <form id="profileFullPageForm" onSubmit={handleSubmit} className="bg-[#13151f] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>Thông Tin Định Danh & Kênh Phát</span>
              </h2>
              <span className="text-[10px] text-gray-500 font-mono">MongoDB Document</span>
            </div>

            {/* Tên đăng nhập & Vai trò */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Tên Đăng Nhập (Cố định)</span>
                </label>
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 font-mono cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vai Trò Hệ Thống</span>
                </label>
                <div className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${roleBadgeColor}`}>
                  {roleName}
                </div>
              </div>
            </div>

            {/* Họ và tên / Tên Trại Gà */}
            <div>
              <label className="block text-xs font-bold text-gray-200 mb-1.5">
                Họ và Tên / Tên Trại Gà hiển thị:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Trại Gà Thành Trung, Nguyễn Văn A..."
                maxLength={100}
                required
                className="w-full bg-[#181a26] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tên này sẽ hiển thị trên tin nhắn Chat trực tiếp, danh sách phòng live và các thẻ chiến kê đăng bán.
              </p>
            </div>

            {/* Số điện thoại / Zalo */}
            <div>
              <label className="block text-xs font-bold text-gray-200 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Số Điện Thoại / Zalo liên hệ:</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                maxLength={20}
                className="w-full bg-[#181a26] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Dùng để kết nối nhanh qua Zalo / Cuộc gọi khi khách hàng bấm xem chi tiết gà bạn đăng.
              </p>
            </div>

            {/* Stream Key nếu là tài khoản Admin */}
            {currentUser.role === 'admin' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Mã Stream Key Phát Sóng Của Bạn</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStreamKey}
                    className="text-xs text-amber-300 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition cursor-pointer font-bold"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs sm:text-sm text-amber-200 font-bold bg-black/50 px-3 py-2 rounded-xl select-all border border-amber-500/20">
                  {myStreamKey || currentUser.username}
                </div>
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  Dùng mã này để cấu hình phần mềm OBS Studio, vMix hoặc phát trực tiếp từ Studio máy ảnh trên điện thoại.
                </p>
              </div>
            )}

            {/* PHẦN ĐỔI MẬT KHẨU (Accordion toggle) */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#181a26]">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full px-4 py-3.5 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Đổi Mật Khẩu Đăng Nhập</span>
                </span>
                {showPasswordSection ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showPasswordSection && (
                <div className="p-4 pt-1 border-t border-white/10 space-y-3.5 bg-black/25 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Mật khẩu hiện tại:
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đang dùng"
                      className="w-full bg-[#11131a] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Mật khẩu mới (tối thiểu 6 ký tự):
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full bg-[#11131a] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Xác nhận mật khẩu mới:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full bg-[#11131a] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NÚT SUBMIT LƯU VÀO DATABASE */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition cursor-pointer text-center"
              >
                Hủy / Quay lại
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer transform hover:scale-[1.02] active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Vào Database</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
