import React, { useState, useRef, useEffect } from 'react';
import {
  X,
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
  Loader2
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

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  authToken,
  myStreamKey,
  onProfileUpdated
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

  // Điền dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (currentUser && isOpen) {
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
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

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

      setSuccessMsg('✅ Đã lưu thông tin và ảnh đại diện vào cơ sở dữ liệu thành công!');
      
      if (onProfileUpdated && data.user) {
        onProfileUpdated(data.user);
      }

      // Xóa form đổi mật khẩu nếu thành công
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Tự động đóng modal sau 1.2 giây
      setTimeout(() => {
        onClose();
      }, 1200);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#11131a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Hồ Sơ & Tài Khoản Cá Nhân
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Chỉnh sửa thông tin cá nhân và cập nhật ảnh đại diện lưu trữ database
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* Thông báo lỗi / thành công */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PHẦN 1: AVATAR & QUẢN LÝ ẢNH ĐẠI DIỆN */}
          <div className="bg-[#171922] border border-white/10 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Ảnh Đại Diện (Lưu Database MongoDB)</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Vòng tròn Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-500/10 bg-slate-900 flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setErrorMsg('Không thể tải ảnh từ liên kết URL này');
                        setAvatar('');
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-extrabold text-3xl uppercase text-white ${
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
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer"
                  title="Tải ảnh mới từ thiết bị"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Các nút hành động Avatar */}
              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {/* Nút Upload từ máy */}
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
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy</span>
                  </button>

                  {/* Nút Nhập URL */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Dán URL ảnh</span>
                  </button>

                  {/* Nút Xóa Avatar */}
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar('');
                        setSuccessMsg('Đã gỡ ảnh đại diện (trở về chữ cái mặc định)');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Gỡ ảnh đại diện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Gỡ</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-400">
                  Hỗ trợ JPG, PNG, WEBP. Ảnh tự động tối ưu hóa kích thước và lưu trữ vĩnh viễn trong MongoDB.
                </p>

                {/* Khung dán URL ảnh nếu bật */}
                {showUrlInput && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <input
                      type="url"
                      value={avatarInputUrl}
                      onChange={(e) => setAvatarInputUrl(e.target.value)}
                      placeholder="Dán link ảnh https://..."
                      className="flex-1 bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Dùng
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar mẫu chọn nhanh */}
            <div className="mt-4 pt-3.5 border-t border-white/10">
              <span className="text-[11px] font-semibold text-gray-400 block mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Hoặc chọn nhanh avatar chiến kê & thần thú mẫu:</span>
              </span>
              <div className="grid grid-cols-6 gap-2">
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
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' 
                        : 'border-white/10 hover:border-amber-400/40 hover:scale-102'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {avatar === item.url && (
                      <span className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* PHẦN 2: THÔNG TIN TÀI KHOẢN */}
          <form id="profileForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Tên đăng nhập & Vai trò */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" />
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
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Vai Trò Hệ Thống</span>
                </label>
                <div className={`px-3 py-2 rounded-xl text-xs font-bold border truncate ${roleBadgeColor}`}>
                  {roleName}
                </div>
              </div>
            </div>

            {/* Họ và tên / Tên Trại Gà */}
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                Họ và Tên / Tên Trại Gà hiển thị:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Trại Gà Thành Trung, Nguyễn Văn A..."
                maxLength={100}
                required
                className="w-full bg-[#171922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            {/* Số điện thoại / Zalo */}
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>Số Điện Thoại / Zalo liên hệ:</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                maxLength={20}
                className="w-full bg-[#171922] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            {/* Stream Key nếu là tài khoản Admin */}
            {currentUser.role === 'admin' && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mã Stream Key Phát Sóng Của Bạn</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStreamKey}
                    className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-amber-200/90 bg-black/40 px-2.5 py-1.5 rounded-lg select-all">
                  {myStreamKey || currentUser.username}
                </div>
                <p className="text-[11px] text-amber-400/80 mt-1.5">
                  Dùng mã này để kết nối OBS Studio hoặc phát trực tiếp từ máy ảnh điện thoại.
                </p>
              </div>
            )}

            {/* PHẦN ĐỔI MẬT KHẨU (Accordion toggle) */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#171922]">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full px-4 py-3 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đổi Mật Khẩu Đăng Nhập</span>
                </span>
                {showPasswordSection ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showPasswordSection && (
                <div className="p-4 pt-1 border-t border-white/10 space-y-3 bg-black/20">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Mật khẩu hiện tại:
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đang dùng"
                      className="w-full bg-[#11131a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Mật khẩu mới (tối thiểu 6 ký tự):
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full bg-[#11131a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Xác nhận mật khẩu mới:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full bg-[#11131a] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

          </form>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#14161f] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="submit"
            form="profileForm"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Vào Database</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
