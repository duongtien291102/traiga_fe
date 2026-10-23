import React from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Award, 
  ShieldCheck, 
  Truck, 
  Check, 
  Share2, 
  Play
} from 'lucide-react';

export default function ChickenDetailModal({ chicken, isOpen, onClose, onOpenConnect }) {
  if (!isOpen || !chicken) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#14151c] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fadeIn">
        
        {/* Header Modal */}
        <div className="bg-[#12141c] px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  {chicken.ms || 'MS KÊ'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  {chicken.datNuoc || 'Đang mở bán'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {chicken.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          
          {/* Main Photo & Badges */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-xl border border-white/10">
            <img 
              src={chicken.image} 
              alt={chicken.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full shadow-lg">
                Chạng: {chicken.chang}
              </span>
              <span className="bg-black/75 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {chicken.breedName || 'Gà Nòi Chuẩn Dòng'}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-300 block font-medium">Giá công khai:</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono drop-shadow-md">
                  {chicken.priceText || (chicken.price ? `${chicken.price.toLocaleString('vi-VN')} đ` : 'Thỏa thuận')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{chicken.location || 'Toàn quốc'}</span>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="bg-[#0e0f14] rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Chủ trại / Người đăng:</span>
              <span className="font-bold text-white font-sans">{chicken.farm || chicken.sellerName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Chạng cân:</span>
              <span className="font-bold text-amber-300">{chicken.chang}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Tuổi gà:</span>
              <span className="font-bold text-white">{chicken.age || '10 tháng'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Cán vảy đặc trưng:</span>
              <span className="font-bold text-amber-300">{chicken.canVay || 'Giáp thới, huyền trâm'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Đòn lối sở trường:</span>
              <span className="font-bold text-emerald-400">{chicken.loi || 'Ôm đấm, kiềng hầu'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-gray-400 font-sans">Tình trạng xổ đòn:</span>
              <span className="font-bold text-blue-400">{chicken.datNuoc || 'Đã dạt 2 nước'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-400 font-sans">Vận chuyển xe khách:</span>
              <span className="font-bold text-rose-400 font-sans">Đóng thùng xốp thoáng khí • Gửi các bến xe</span>
            </div>
          </div>

          {/* Video clip xổ đòn (nếu có) */}
          {chicken.videoUrl && (
            <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Xem clip gà xổ thử đòn thực tế</span>
              </div>
              <a
                href={chicken.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Mở Xem Clip
              </a>
            </div>
          )}

          {/* Ghi chú & Bảo hành */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Cam kết sức khỏe &amp; Tiêm chủng:</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {chicken.note || 'Chiến kê đã được tiêm phòng đầy đủ các loại vắc xin. Hỗ trợ hướng dẫn nuôi dưỡng, om bóp và nước nôi chuẩn sau khi nhận từ nhà xe.'}
            </p>
          </div>

          {/* Contact Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`tel:${chicken.phone?.replace(/\D/g, '') || '0988888888'}`}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-transform hover:scale-105"
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
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-transform hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>NHẮN ZALO CHỦ TRẠI</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
