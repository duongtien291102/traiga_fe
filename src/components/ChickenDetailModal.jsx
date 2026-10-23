import React from 'react';
import { 
  ArrowLeft,
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Play,
  Sparkles,
  Eye
} from 'lucide-react';

export default function ChickenDetailModal({ 
  chicken, 
  isOpen, 
  onClose, 
  onOpenConnect,
  relatedChickens = [],
  onSelectChicken
}) {
  if (!isOpen || !chicken) return null;

  const otherChickens = relatedChickens
    .filter((item) => item.id !== chicken.id)
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Navigation & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14151c] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Quay lại Chợ Gà</span>
          </button>
          <div className="h-4 w-px bg-white/15 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span onClick={onClose} className="hover:text-amber-400 cursor-pointer transition-colors">
              Chợ Gà Ba Miền
            </span>
            <span>/</span>
            <span className="text-gray-300 font-semibold">
              {chicken.breedName || 'Gà Nòi Tuyển'}
            </span>
            <span>/</span>
            <span className="text-amber-400 font-bold font-mono">
              {chicken.ms || 'MS KÊ'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-lg border border-emerald-500/30">
            {chicken.datNuoc || 'Đang mở bán'}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#0e0f14] px-3 py-1 rounded-lg border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{chicken.location || 'Toàn quốc'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Image Gallery & Commitments (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Photo Card */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-black shadow-2xl border border-white/10 group">
            <img 
              src={chicken.image} 
              alt={chicken.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
            
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-black text-xs font-mono font-black uppercase px-3 py-1 rounded-lg shadow-lg">
                {chicken.ms || 'MS KÊ'}
              </span>
              <span className="bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1 rounded-lg shadow-lg">
                Chạng: {chicken.chang}
              </span>
              <span className="bg-black/75 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-lg shadow-lg">
                {chicken.breedName || 'Gà Nòi Chuẩn Dòng'}
              </span>
            </div>
          </div>

          {/* Video clip xổ đòn (nếu có) */}
          {chicken.videoUrl && (
            <div className="p-4 rounded-2xl bg-[#14151c] border border-white/10 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-200 font-medium">
                <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Xem clip gà xổ thử đòn thực tế tại chuồng</span>
              </div>
              <a
                href={chicken.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Mở Xem Clip
              </a>
            </div>
          )}

          {/* Ghi chú & Bảo hành */}
          <div className="p-5 rounded-2xl bg-[#14151c] border border-amber-500/25 space-y-3 shadow-xl">
            <div className="font-bold flex items-center gap-2 text-amber-400 text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Cam kết sức khỏe &amp; Ghi chú từ chủ trại:</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {chicken.note || 'Chiến kê đã được tiêm phòng đầy đủ các loại vắc xin. Hỗ trợ hướng dẫn nuôi dưỡng, om bóp và nước nôi chuẩn sau khi nhận từ nhà xe.'}
            </p>
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Truck className="w-4 h-4" />
                Bao đóng thùng xốp thoáng khí gửi bến xe các tỉnh
              </span>
              <span>•</span>
              <span>Đồng kiểm cùng nhà xe khi nhận lồng</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Price, Specs & Contact Actions (5 cols) */}
        <div className="lg:col-span-5 bg-[#14151c] border border-white/15 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
          
          {/* Title & Header */}
          <div className="space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Hồ Sơ Chiến Kê • {chicken.ms || 'MS KÊ'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
              {chicken.title}
            </h1>
          </div>

          {/* Price Highlight Box */}
          <div className="bg-gradient-to-r from-amber-500/10 via-[#0e0f14] to-rose-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Giá công khai tại trại:</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {chicken.priceText || (chicken.price ? `${chicken.price.toLocaleString('vi-VN')} đ` : 'Thỏa thuận')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Khu vực:</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 justify-end mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {chicken.location || 'Toàn quốc'}
              </span>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="bg-[#0e0f14] rounded-2xl p-4 border border-white/10 space-y-3 text-xs sm:text-sm font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Chủ trại / Người đăng:</span>
              <span className="font-bold text-white font-sans text-right">{chicken.farm || chicken.sellerName}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Chạng cân:</span>
              <span className="font-bold text-amber-300 text-right">{chicken.chang}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Tuổi gà:</span>
              <span className="font-bold text-white text-right">{chicken.age || '10 tháng'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Cán vảy đặc trưng:</span>
              <span className="font-bold text-amber-300 text-right">{chicken.canVay || 'Giáp thới, huyền trâm'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Đòn lối sở trường:</span>
              <span className="font-bold text-emerald-400 text-right">{chicken.loi || 'Ôm đấm, kiềng hầu'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 gap-2">
              <span className="text-gray-400 font-sans">Tình trạng xổ đòn:</span>
              <span className="font-bold text-blue-400 text-right">{chicken.datNuoc || 'Đã dạt 2 nước'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 gap-2">
              <span className="text-gray-400 font-sans">Vận chuyển xe khách:</span>
              <span className="font-bold text-rose-400 font-sans text-right">Đóng thùng xốp thoáng khí • Gửi các bến xe</span>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <a
              href={`tel:${chicken.phone?.replace(/\D/g, '') || '0988888888'}`}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-transform hover:scale-[1.02]"
            >
              <Phone className="w-4 h-4" />
              <span>GỌI ĐIỆN: {chicken.phone}</span>
            </a>

            <button
              onClick={() => {
                if (onOpenConnect) {
                  onOpenConnect(chicken.title, chicken.farm || chicken.sellerName);
                } else {
                  alert(`Zalo chủ trại: ${chicken.zalo || chicken.phone}`);
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>NHẮN ZALO CHỦ TRẠI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Chickens Section */}
      {otherChickens.length > 0 && (
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Các Chiến Kê Khác Đang Mở Bán
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Xem tất cả &gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherChickens.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectChicken) {
                    onSelectChicken(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="bg-[#16171d] rounded-2xl border border-white/10 hover:border-amber-400/50 transition-all overflow-hidden flex flex-col justify-between shadow-xl group cursor-pointer"
              >
                <div className="relative h-40 bg-black overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                      {item.ms}
                    </span>
                    <span className="bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                      {item.chang}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="font-mono text-amber-400 font-black text-sm">
                      {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Thỏa thuận')}
                    </span>
                    <span className="text-[10px] text-gray-300 bg-black/70 px-2 py-0.5 rounded">
                      {item.location}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="text-[11px] text-gray-400 truncate">{item.farm}</div>
                  <h4 className="font-bold text-xs text-white line-clamp-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                    <span>Xem chi tiết</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
