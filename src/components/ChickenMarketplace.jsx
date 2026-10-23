import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Truck, 
  Sparkles, 
  Eye, 
  Tag,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function ChickenMarketplace({ 
  chickens = [], 
  onOpenPostModal, 
  onSelectChicken, 
  onOpenConnect,
  onOpenPolicy
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedChang, setSelectedChang] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // Filter chickens based on user criteria
  const filteredChickens = chickens.filter((c) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${c.title} ${c.ms} ${c.farm} ${c.canVay} ${c.loi} ${c.location} ${c.breedName}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Breed filter
    if (selectedBreed !== 'all' && c.breed !== selectedBreed) {
      return false;
    }

    // Chang filter
    if (selectedChang !== 'all') {
      const changStr = (c.chang || '').toLowerCase();
      if (selectedChang === 'tre' && !changStr.includes('gram') && !changStr.includes('g') && parseFloat(changStr) >= 1.5) return false;
      if (selectedChang === 'don' && (changStr.includes('gram') || parseFloat(changStr) < 2.7 || parseFloat(changStr) > 3.3)) return false;
      if (selectedChang === 'noi' && (parseFloat(changStr) < 2.3 || parseFloat(changStr) > 2.8)) return false;
      if (selectedChang === 'khung' && parseFloat(changStr) < 3.4) return false;
    }

    // Price filter
    if (selectedPrice !== 'all') {
      if (selectedPrice === 'negotiable' && c.price > 0) return false;
      if (selectedPrice === 'under2m' && (c.price === 0 || c.price > 2000000)) return false;
      if (selectedPrice === '2m-4m' && (c.price < 2000000 || c.price > 4000000)) return false;
      if (selectedPrice === 'over4m' && c.price < 4000000) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ==================== HERO MARKET BANNER ==================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950 via-[#181923] to-amber-950 border border-white/10 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sàn Giao Lưu &amp; Mua Bán Gà Nòi Toàn Quốc</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase leading-tight">
            Chợ Gà Ba Miền • <span className="text-amber-400">Đăng Bán Chiến Kê Tuyển</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Nơi chủ trại uy tín đăng bán chiến kê đòn tơ dạt nước, gà nòi cựa, gà tre cảnh Tân Châu và gà Đông Tảo. Công khai chạng cân, soi cán vảy đòn lối, kết nối SĐT &amp; Zalo trực tiếp không qua trung gian!
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={onOpenPostModal}
              className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-lg flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ĐĂNG BÁN CHIẾN KÊ</span>
            </button>

            <button
              onClick={onOpenPolicy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Quy Chuẩn Gửi Xe Khách</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Cards */}
        <div className="z-10 grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-mono text-center">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="text-2xl font-black text-amber-400">{chickens.length}</div>
            <div className="text-[11px] font-sans text-gray-400 uppercase font-bold">Chiến kê đang bán</div>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <div className="text-[11px] font-sans text-gray-400 uppercase font-bold">Chính chủ trại đăng</div>
          </div>
        </div>
      </div>

      {/* ==================== SEARCH & FILTERS BAR ==================== */}
      <div className="bg-[#14151c] rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4 shadow-xl">
        
        {/* Search bar & Quick Post button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã MS, tên gà, lối đá, cán vảy (ví dụ: MS 201, Án Thiên, Kiềng Hầu, Ninh Thuận...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onOpenPostModal}
            className="w-full sm:w-auto bg-red-700 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Bán Gà Mới</span>
          </button>
        </div>

        {/* Breed Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          <span className="text-gray-400 text-[11px] uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Dòng kê:
          </span>
          {[
            { id: 'all', label: 'Tất Cả Giống' },
            { id: 'don', label: 'Gà Đòn (Bắc / Trung)' },
            { id: 'noi', label: 'Gà Nòi Cựa' },
            { id: 'tre', label: 'Gà Tre Tân Châu' },
            { id: 'dongtao', label: 'Gà Đông Tảo' },
            { id: 'asil', label: 'Gà Asil / Mỹ Lai' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedBreed(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer border ${
                selectedBreed === item.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chạng & Giá Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Lọc theo chạng</label>
            <select
              value={selectedChang}
              onChange={(e) => setSelectedChang(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0e0f14] border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Tất cả chạng cân</option>
              <option value="tre">Gà Tre (Dưới 1.2 kg)</option>
              <option value="noi">Chạng Nòi Nhẹ (2.4 - 2.7 kg)</option>
              <option value="don">Chạng Gà Đòn Chuẩn (2.8 - 3.2 kg)</option>
              <option value="khung">Chạng Khủng / Đông Tảo (&gt; 3.5 kg)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Lọc theo mức giá</label>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0e0f14] border border-white/10 text-gray-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under2m">Dưới 2 triệu VNĐ</option>
              <option value="2m-4m">Từ 2 - 4 triệu VNĐ</option>
              <option value="over4m">Trên 4 triệu VNĐ</option>
              <option value="negotiable">Giá Thỏa Thuận</option>
            </select>
          </div>

          <div className="col-span-2 flex items-end justify-between">
            <span className="text-xs text-gray-400">
              Hiển thị <strong className="text-amber-400">{filteredChickens.length}</strong> / {chickens.length} chiến kê
            </span>
            {(searchQuery || selectedBreed !== 'all' || selectedChang !== 'all' || selectedPrice !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBreed('all');
                  setSelectedChang('all');
                  setSelectedPrice('all');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ==================== CHICKEN LISTINGS GRID ==================== */}
      {filteredChickens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChickens.map((item) => (
            <div
              key={item.id}
              className="bg-[#16171d] rounded-2xl border border-white/10 hover:border-amber-400/50 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl group"
            >
              {/* Image & Overlay Badges */}
              <div 
                onClick={() => onSelectChicken(item)}
                className="relative h-48 bg-black overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-md">
                    {item.ms || 'MS KÊ'}
                  </span>
                  <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                    {item.chang}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
                    {item.datNuoc || 'Đã dạt 2 nước'}
                  </span>
                </div>

                {/* Bottom of Image: Price & Location */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <div className="font-mono text-amber-400 font-black text-lg drop-shadow-md">
                    {item.priceText || (item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Thỏa thuận')}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-300 bg-black/70 px-2 py-0.5 rounded border border-white/10">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{item.location || 'Toàn quốc'}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                
                <div className="space-y-1.5">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1 truncate font-medium">
                    <span className="text-amber-400">★</span>
                    <span className="truncate">{item.farm || item.sellerName}</span>
                  </div>

                  <h3 
                    onClick={() => onSelectChicken(item)}
                    className="font-black text-sm text-white line-clamp-2 group-hover:text-amber-300 transition-colors cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Specs Box */}
                <div className="bg-[#0e0f14] rounded-xl p-3 text-[11px] space-y-1 border border-white/5 font-mono">
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400 font-sans">Cán vảy:</span>
                    <span className="font-bold text-amber-300 truncate max-w-[140px] text-right">{item.canVay}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400 font-sans">Lối đá:</span>
                    <span className="font-bold text-emerald-400 truncate max-w-[140px] text-right">{item.loi}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400 font-sans">Tuổi gà:</span>
                    <span className="font-bold text-white text-right">{item.age || '10 tháng'}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <a
                    href={`tel:${item.phone?.replace(/\D/g, '') || '0988888888'}`}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500 text-gray-200 hover:text-emerald-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={`Gọi điện trực tiếp cho ${item.farm}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gọi Điện</span>
                  </a>

                  <button
                    onClick={() => onOpenConnect(item.title, item.farm || item.sellerName)}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-black py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    title="Nhắn Zalo hoặc gửi yêu cầu kết nối"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Zalo Chủ Trại</span>
                  </button>

                  <button
                    onClick={() => onSelectChicken(item)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
                    title="Xem chi tiết chiến kê"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#14151c] rounded-3xl border border-white/10 p-12 text-center space-y-4">
          <div className="text-4xl">🐓</div>
          <h3 className="text-lg font-bold text-white">Chưa có chiến kê nào phù hợp với bộ lọc</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Hãy thử tìm kiếm với từ khóa khác, hoặc trở thành người đầu tiên đăng bán chiến kê thuộc chạng cân này!
          </p>
          <button
            onClick={onOpenPostModal}
            className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Đăng Bán Ngay</span>
          </button>
        </div>
      )}

      {/* ==================== BOTTOM SELLER CTA BANNER ==================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-amber-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 z-10 text-center sm:text-left">
          <span className="text-amber-400 font-bold uppercase text-xs tracking-wider">Dành Cho Chủ Trại Ba Miền</span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            BẠN CÓ CHIẾN KÊ ĐÒN HAY, DÀN TƠ CẦN GIAO LƯU?
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
            Đăng tin bán gà hoàn toàn miễn phí chỉ với 1 phút. Tiếp cận hàng nghìn anh em đam mê kê nòi trên khắp cả nước, bao ship xe khách an toàn và tiện lợi!
          </p>
        </div>
        <button
          onClick={onOpenPostModal}
          className="z-10 flex-shrink-0 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-xl transition-transform hover:scale-105 uppercase tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Đăng Bán Chiến Kê Ngay</span>
        </button>
      </div>

    </div>
  );
}
