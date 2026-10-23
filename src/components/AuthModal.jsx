import React, { useState } from 'react';
import { X, Lock, User, UserCheck, Shield, Sparkles, Key, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../config';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginTab 
      ? { username, password } 
      : { username, password, full_name: fullName };

    try {
      const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      // Lưu thông tin đăng nhập
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      if (data.stream_key) {
        localStorage.setItem('my_stream_key', data.stream_key);
      }

      onAuthSuccess(data.user, data.token, data.stream_key);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nút điền nhanh tài khoản System Admin mặc định
  const fillSysAdmin = () => {
    setIsLoginTab(true);
    setUsername('sysadmin');
    setPassword('123456');
    setErrorMsg('');
  };

  // Nút điền nhanh tài khoản Admin mặc định
  const fillAdmin = () => {
    setIsLoginTab(true);
    setUsername('admin01');
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40">
            {isLoginTab ? <Lock className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isLoginTab ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên'}
            </h2>
            <p className="text-xs text-slate-400">
              {isLoginTab ? 'Truy cập Admin Portal hoặc Studio' : 'Tạo tài khoản tự do, nhận Stream Key riêng'}
            </p>
          </div>
        </div>

        {/* Chuyển tab */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isLoginTab ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isLoginTab ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng ký (Tự do)
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Họ và tên hiển thị</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Gamer"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Tên đăng nhập (Username)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLoginTab ? 'admin01 hoặc username' : 'viết liền không dấu (tiến, hoang...)'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 hover:shadow-rose-900/60 transition-all mt-2 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : (isLoginTab ? 'Đăng nhập ngay' : 'Đăng ký tài khoản người xem')}
          </button>
        </form>

        {/* Nút đăng nhập nhanh System Admin & Admin */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-2">
          <button
            type="button"
            onClick={fillSysAdmin}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>🛡️ Điền nhanh Tổng Quản Trị (sysadmin / 123456)</span>
          </button>

          <button
            type="button"
            onClick={fillAdmin}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>👑 Điền nhanh Admin Streamer (admin01 / 123456)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
