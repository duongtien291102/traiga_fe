import React from 'react';
import { 
  ArrowLeft,
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Play
} from 'lucide-react';

export default function ChickenDetailModal({ 
  chicken, 
  isOpen, 
  onClose, 
  onOpenConnect,
  relatedChickens = [],
  onSelectChicken,
  currentUser = null
}) {
  if (!isOpen || !chicken) return null;

  const otherChickens = relatedChickens
    .filter((item) => item.id !== chicken.id)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Thanh quay lại đơn giản */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[#14151c] hover:bg-white/10 text-white text-sm font-semibold transition flex items-center gap-2 border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách gà</span>
        </button>

        <span className="text-sm text-gray-400">
          Mã số: <strong className="text-white">{chicken.ms || 'MS KÊ'}</strong> • Khu vực: <strong className="text-white">{chicken.location || 'Toàn quốc'}</strong>
        </span>
      </div>

      {/* Khung thông tin chính (2 cột gọn gàng) */}
      <div className="bg-[#14151c] border border-white/10 rounded-xl p-5 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Cột trái: Ảnh gà & Ghi chú (6 cột) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-white/10">
              <img 
                src={chicken.image} 
                alt={chicken.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-black/80 text-amber-400 text-xs font-bold px-3 py-1 rounded">
                  {chicken.ms || 'MS KÊ'}
                </span>
                <span className="bg-black/80 text-white text-xs font-bold px-3 py-1 rounded">
                  Chạng: {chicken.chang}
                </span>
              </div>
            </div>

            {chicken.videoUrl && (
              <div className="p-3.5 rounded-lg bg-[#0e0f14] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-200 font-medium">
                  <Play className="w-4 h-4 text-red-500" />
                  <span>Video xổ thử đòn thực tế</span>
                </div>
                <a
                  href={chicken.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-sm transition"
                >
                  Xem Video
                </a>
              </div>
            )}

            <div className="p-4 rounded-lg bg-[#0e0f14] border border-white/10 space-y-2">
              <div className="font-bold flex items-center gap-2 text-white text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Ghi chú &amp; Cam kết của trại:</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {chicken.note || 'Gà khỏe mạnh, tiêm phòng đầy đủ. Hỗ trợ đóng thùng thoáng khí gửi xe khách các tỉnh.'}
              </p>
            </div>
          </div>

          {/* Cột phải: Giá bán, Thông số chi tiết & Số điện thoại (6 cột) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2 border-b border-white/10 pb-4">
              <span className="text-sm font-semibold text-amber-400">
                {chicken.breedName || 'Gà Đòn Tuyển Chọn'} • {chicken.datNuoc || 'Đang mở bán'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {chicken.title}
              </h1>
              <div className="pt-1 flex items-baseline gap-3">
                <span className="text-sm text-gray-400">Giá bán:</span>
                <span className="text-2xl sm:text-3xl font-bold text-red-500">
                  {chicken.priceText || (chicken.price ? `${chicken.price.toLocaleString('vi-VN')} đ` : 'Giá thỏa thuận')}
                </span>
              </div>
            </div>

            {/* Bảng thông số chữ to, rõ ràng, không dùng font code */}
            <div className="divide-y divide-white/10 text-sm sm:text-base">
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Chủ trại / Người đăng:</span>
                <span className="font-bold text-white text-right">{chicken.farm || chicken.sellerName}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Số điện thoại / Zalo:</span>
                {currentUser ? (
                  <span className="font-bold text-amber-400 text-right">{chicken.phone}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenConnect && onOpenConnect(chicken.title, chicken.farm || chicken.sellerName)}
                    className="font-bold text-amber-400 hover:underline text-right cursor-pointer"
                  >
                    🔒 Đăng nhập để xem SĐT
                  </button>
                )}
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Khu vực:</span>
                <span className="font-medium text-white text-right">{chicken.location || 'Toàn quốc'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Chạng cân hiện tại:</span>
                <span className="font-bold text-white text-right">{chicken.chang}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Tuổi gà:</span>
                <span className="font-medium text-white text-right">{chicken.age || '10 tháng'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Đặc điểm cán vảy:</span>
                <span className="font-medium text-white text-right">{chicken.canVay || 'Giáp thới, huyền trâm'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Đòn lối sở trường:</span>
                <span className="font-medium text-white text-right">{chicken.loi || 'Ôm đấm, kiềng hầu'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Tình trạng xổ đòn:</span>
                <span className="font-medium text-emerald-400 text-right">{chicken.datNuoc || 'Đã dạt 2 nước'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-400">Vận chuyển:</span>
                <span className="font-medium text-gray-200 text-right">Đóng thùng gửi xe khách các bến</span>
              </div>
            </div>

            {/* Nút liên hệ to, rõ, dễ bấm trên điện thoại (Yêu cầu đăng nhập nếu chưa có tài khoản) */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentUser ? (
                <a
                  href={`tel:${chicken.phone?.replace(/\D/g, '') || '0988888888'}`}
                  className="py-3.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 transition text-center"
                >
                  <Phone className="w-5 h-5" />
                  <span>Gọi: {chicken.phone}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenConnect && onOpenConnect(chicken.title, chicken.farm || chicken.sellerName)}
                  className="py-3.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 transition text-center cursor-pointer"
                >
                  <Phone className="w-5 h-5" />
                  <span>Đăng nhập để Gọi</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onOpenConnect) {
                    onOpenConnect(chicken.title, chicken.farm || chicken.sellerName);
                  }
                }}
                className="py-3.5 px-4 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{currentUser ? 'Nhắn Zalo / Liên Hệ' : 'Đăng nhập để Liên Hệ'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Gà khác đang bán (gọn gàng 3 cột) */}
      {otherChickens.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Gà Khác Đang Bán Tại Chợ
            </h2>
            <button
              onClick={onClose}
              className="text-sm font-semibold text-amber-400 hover:underline cursor-pointer"
            >
              Xem tất cả danh sách &gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherChickens.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectChicken) {
                    onSelectChicken(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="bg-[#16171d] rounded-xl border border-white/10 hover:border-amber-500/50 transition overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                <div className="relative h-44 bg-black overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-black/80 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">
                      {item.ms}
                    </span>
                    <span className="bg-black/80 text-white text-xs font-bold px-2 py-0.5 rounded">
                      {item.chang}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-amber-400">
                      {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Thỏa thuận')}
                    </span>
                    <span className="text-xs text-gray-400">{item.location}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="text-xs text-gray-400">{item.farm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
