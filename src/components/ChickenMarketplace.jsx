import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Truck
} from 'lucide-react';

export default function ChickenMarketplace({ 
  chickens = [], 
  onOpenPostModal, 
  onSelectChicken, 
  onOpenConnect,
  onOpenPolicy,
  currentUser = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedChang, setSelectedChang] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // Filter chickens based on user criteria
  const filteredChickens = chickens.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${c.title} ${c.ms} ${c.farm} ${c.canVay} ${c.loi} ${c.location} ${c.breedName}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    if (selectedBreed !== 'all' && c.breed !== selectedBreed) {
      return false;
    }

    if (selectedChang !== 'all') {
      const changStr = (c.chang || '').toLowerCase();
      if (selectedChang === 'tre' && !changStr.includes('gram') && !changStr.includes('g') && parseFloat(changStr) >= 1.5) return false;
      if (selectedChang === 'don' && (changStr.includes('gram') || parseFloat(changStr) < 2.7 || parseFloat(changStr) > 3.3)) return false;
      if (selectedChang === 'noi' && (parseFloat(changStr) < 2.3 || parseFloat(changStr) > 2.8)) return false;
      if (selectedChang === 'khung' && parseFloat(changStr) < 3.4) return false;
    }

    if (selectedPrice !== 'all') {
      if (selectedPrice === 'negotiable' && c.price > 0) return false;
      if (selectedPrice === 'under2m' && (c.price === 0 || c.price > 2000000)) return false;
      if (selectedPrice === '2m-4m' && (c.price < 2000000 || c.price > 4000000)) return false;
      if (selectedPrice === 'over4m' && c.price < 4000000) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* ==================== TIÊU ĐỀ CHỢ GÀ ĐƠN GIẢN, DỄ NHÌN ==================== */}
      <div className="bg-[#14151c] border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Chợ Gà Ba Miền — Mua Bán &amp; Giao Lưu Chiến Kê
          </h1>
          <p className="text-sm text-gray-300">
            Thông tin chạng cân, cán vảy, lối đá rõ ràng. Liên hệ trực tiếp SĐT / Zalo chủ trại.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
          {(currentUser?.role === 'admin' || currentUser?.role === 'systemadmin') && (
            <button
              onClick={onOpenPostModal}
              className="flex-1 sm:flex-initial bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm py-2.5 px-3 sm:px-5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Đăng Bán Gà</span>
            </button>
          )}

          <button
            onClick={onOpenPolicy}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium py-2.5 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Lưu ý gửi xe</span>
          </button>
        </div>
      </div>

      {/* ==================== THANH TÌM KIẾM & LỌC ĐƠN GIẢN ==================== */}
      <div className="bg-[#14151c] rounded-xl border border-white/10 p-4 sm:p-5 space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Ô tìm kiếm */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã số (MS 201), tên gà, lối đá, tỉnh thành..."
              className="w-full pl-10 pr-8 py-2.5 rounded-lg bg-[#0e0f14] border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc chạng cân */}
          <div className="md:col-span-3">
            <select
              value={selectedChang}
              onChange={(e) => setSelectedChang(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0e0f14] border border-white/10 text-gray-200 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Tất cả chạng cân</option>
              <option value="tre">Gà Tre (Dưới 1.2 kg)</option>
              <option value="noi">Chạng 2.4 - 2.7 kg</option>
              <option value="don">Chạng 2.8 - 3.2 kg</option>
              <option value="khung">Chạng trên 3.5 kg</option>
            </select>
          </div>

          {/* Lọc mức giá */}
          <div className="md:col-span-3">
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0e0f14] border border-white/10 text-gray-200 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under2m">Dưới 2 triệu</option>
              <option value="2m-4m">Từ 2 - 4 triệu</option>
              <option value="over4m">Trên 4 triệu</option>
              <option value="negotiable">Giá thỏa thuận</option>
            </select>
          </div>
        </div>

        {/* Chọn nhanh dòng gà */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'don', label: 'Gà Đòn' },
              { id: 'noi', label: 'Gà Nòi Cựa' },
              { id: 'tre', label: 'Gà Tre Tân Châu' },
              { id: 'dongtao', label: 'Gà Đông Tảo' },
              { id: 'asil', label: 'Gà Asil / Mỹ' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedBreed(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition cursor-pointer border ${
                  selectedBreed === item.id
                    ? 'bg-red-700 text-white border-red-700 font-bold'
                    : 'bg-[#0e0f14] text-gray-300 border-white/10 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>Có <strong className="text-white">{filteredChickens.length}</strong> gà đang bán</span>
            {(searchQuery || selectedBreed !== 'all' || selectedChang !== 'all' || selectedPrice !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBreed('all');
                  setSelectedChang('all');
                  setSelectedPrice('all');
                }}
                className="text-sm text-red-500 hover:underline font-medium cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================== DANH SÁCH GÀ ĐANG BÁN ==================== */}
      {filteredChickens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChickens.map((item) => (
            <div
              key={item.id}
              className="bg-[#16171d] rounded-xl border border-white/10 hover:border-amber-500/50 transition overflow-hidden flex flex-col justify-between"
            >
              {/* Ảnh gà */}
              <div 
                onClick={() => onSelectChicken(item)}
                className="relative h-56 bg-black overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-black/80 text-amber-400 text-xs font-bold px-2.5 py-1 rounded">
                    {item.ms || 'MS KÊ'}
                  </span>
                  <span className="bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded">
                    Chạng: {item.chang}
                  </span>
                </div>
              </div>

              {/* Nội dung thông tin rõ ràng, chữ to dễ đọc */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl font-bold text-amber-400">
                      {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Giá thỏa thuận')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {item.location || 'Toàn quốc'}
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectChicken(item)}
                    className="font-bold text-base text-white line-clamp-2 hover:text-amber-400 transition cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h3>

                  <div className="pt-2 border-t border-white/10 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Chủ trại:</span>
                      <span className="font-medium text-white truncate">{item.farm || item.sellerName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Cán vảy:</span>
                      <span className="font-medium text-gray-200 truncate">{item.canVay}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Đòn lối:</span>
                      <span className="font-medium text-gray-200 truncate">{item.loi}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">Tình trạng:</span>
                      <span className="font-medium text-emerald-400">{item.datNuoc || 'Đã dạt 2 nước'} ({item.age || '10 tháng'})</span>
                    </div>
                  </div>
                </div>

                {/* Nút bấm đơn giản, rõ nghĩa */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onSelectChicken(item)}
                    className="py-2.5 px-3 rounded-lg bg-[#0e0f14] hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition cursor-pointer text-center"
                  >
                    Xem Chi Tiết
                  </button>

                  {currentUser ? (
                    <a
                      href={`tel:${item.phone?.replace(/\D/g, '') || '0988888888'}`}
                      className="py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Gọi Điện</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenConnect && onOpenConnect(item.title, item.farm || item.sellerName)}
                      className="py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Liên Hệ Mua</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#14151c] rounded-xl border border-white/10 p-10 text-center space-y-3">
          <h3 className="text-lg font-bold text-white">Không tìm thấy gà phù hợp</h3>
          <p className="text-sm text-gray-400">
            Anh em vui lòng thử từ khóa khác hoặc bấm xóa bộ lọc để xem toàn bộ danh sách.
          </p>
        </div>
      )}

    </div>
  );
}
