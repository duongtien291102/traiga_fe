import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Lock,
  Phone,
  Key,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { getApiBaseUrl } from '../config';

export default function UserProfilePage({
  currentUser,
  authToken,
  myStreamKey,
  onProfileUpdated,
  onBack
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

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
  const [showStreamKey, setShowStreamKey] = useState(false);

  const fileInputRef = useRef(null);

  // Điền dữ liệu ban đầu
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
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
      <div className="w-full max-w-xl mx-auto py-16 px-4 text-center">
        <div className="p-8 bg-[#13141a] border border-white/10 rounded-2xl space-y-4">
          <User className="w-12 h-12 text-zinc-500 mx-auto" />
          <h2 className="text-base font-bold text-white">Yêu Cầu Đăng Nhập</h2>
          <p className="text-xs text-zinc-400">Vui lòng đăng nhập để xem và quản lý hồ sơ cá nhân.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer"
          >
            Quay Lại
          </button>
        </div>
      </div>
    );
  }

  // Xử lý nén ảnh trên Canvas
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
        setSuccessMsg('Đã chọn ảnh đại diện mới.');
        setErrorMsg('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Sao chép Stream Key
  const handleCopyStreamKey = () => {
    const keyToCopy = myStreamKey || currentUser.username;
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Lưu thông tin người dùng
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setErrorMsg('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không trùng khớp');
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Cập nhật hồ sơ thất bại');
        setLoading(false);
        return;
      }

      setSuccessMsg('Lưu thông tin thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      if (onProfileUpdated && data.user) {
        onProfileUpdated(data.user);
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const roleText =
    currentUser.role === 'systemadmin'
      ? 'Quản trị viên cấp cao'
      : currentUser.role === 'admin'
      ? 'Chủ kênh / Streamer'
      : 'Thành viên';

  const rawKey = myStreamKey || currentUser.username;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">

      {/* Điều hướng đầu trang */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={onBack}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <span className="text-xs text-zinc-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          {roleText}
        </span>
      </div>

      {/* Tiêu đề trang */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Hồ sơ cá nhân
        </h1>
        <p className="text-xs text-zinc-400">
          Quản lý thông tin tài khoản và thông tin liên hệ của bạn
        </p>
      </div>

      {/* Thông báo */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form chỉnh sửa chính */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Khung 1: Ảnh đại diện */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#14151c] border border-white/10 space-y-5">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Ảnh đại diện
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-white/15 bg-zinc-900 flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatar('')}
                  />
                ) : (
                  <span className="text-3xl font-bold text-zinc-400 uppercase">
                    {currentUser.username?.substring(0, 1) || 'U'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
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
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh lên</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      setSuccessMsg('Đã gỡ ảnh đại diện.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Gỡ ảnh</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Khuyên dùng ảnh vuông JPG hoặc PNG, dung lượng tối đa 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Khung 2: Thông tin tài khoản */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#14151c] border border-white/10 space-y-4">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Thông tin tài khoản
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={currentUser.username}
                disabled
                className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tên hiển thị / Tên trại
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập tên hiển thị"
                maxLength={60}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Số điện thoại / Zalo
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912 345 678"
              maxLength={20}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
            />
          </div>
        </div>

        {/* Khung 3: Stream Key (cho Admin) */}
        {currentUser.role === 'admin' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#14151c] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Mã Stream Key
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Dùng để phát trực tiếp từ OBS Studio, vMix hoặc thiết bị quay
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowStreamKey(!showStreamKey)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  title={showStreamKey ? 'Che mã Stream Key' : 'Xem mã Stream Key'}
                >
                  {showStreamKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showStreamKey ? 'Ẩn' : 'Hiện'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyStreamKey}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <div className="font-mono text-xs text-zinc-300 bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-white/10 select-all tracking-wider">
              {showStreamKey ? rawKey : '••••••••••••••••••••'}
            </div>
          </div>
        )}

        {/* Khung 4: Đổi mật khẩu */}
        <div className="rounded-2xl bg-[#14151c] border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full px-5 py-4 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>Đổi mật khẩu</span>
            </span>
            {showPasswordSection ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showPasswordSection && (
            <div className="p-5 pt-1 border-t border-white/10 space-y-3.5 bg-zinc-950/40">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
