import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Phone, 
  MapPin, 
  DollarSign, 
  Video, 
  ShieldCheck, 
  Truck,
  Image as ImageIcon
} from 'lucide-react';

// Danh sách ảnh mẫu gà đẹp chuẩn gamefowl để chủ trại chọn nhanh nếu chưa kịp upload ảnh
const SAMPLE_CHICKEN_IMAGES = [
  {
    name: 'Gà Đòn Tía Chân Xanh',
    url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Tre Tân Châu Khét Đỏ',
    url: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Đông Tảo Chân Khủng',
    url: '/img/rooster_dongtao.jpg'
  },
  {
    name: 'Asil Lai Mỹ Chuối',
    url: '/img/rooster_asil.jpg'
  }
];

export default function PostChickenModal({ isOpen, onClose, onAddChicken, currentUser }) {
  const [title, setTitle] = useState('');
  const [breed, setBreed] = useState('');
  const [chang, setChang] = useState('');
  const [age, setAge] = useState('');
  const [canVay, setCanVay] = useState('');
  const [loi, setLoi] = useState('');
  const [datNuoc, setDatNuoc] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [price, setPrice] = useState('');
  const [farm, setFarm] = useState(currentUser?.fullName || currentUser?.username || '');
  const [sellerName, setSellerName] = useState(currentUser?.fullName || currentUser?.username || '');
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const canPost = currentUser && (currentUser.role === 'admin' || currentUser.role === 'systemadmin');
  if (!isOpen || !canPost) return null;

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tiêu đề chiến kê';
    if (!chang.trim()) errs.chang = 'Vui lòng nhập chạng cân (ví dụ: 2.90 kg)';
    if (!phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại liên hệ';
    if (!age.trim()) errs.age = 'Vui lòng nhập tuổi gà';
    if (!canVay.trim()) errs.canVay = 'Vui lòng nhập thông tin cán vảy';
    if (!loi.trim()) errs.loi = 'Vui lòng nhập lối đá';
    if (!breed) errs.breed = 'Vui lòng chọn giống gà';
    if (!farm.trim()) errs.farm = 'Vui lòng nhập tên trại';
    if (!location) errs.location = 'Vui lòng chọn tỉnh / thành phố';
    if (!isNegotiable && (!price || isNaN(price.replace(/\D/g, '')))) {
      errs.price = 'Vui lòng nhập giá bán hoặc chọn Giá Thỏa Thuận';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const numericPrice = isNegotiable ? 0 : parseInt(price.replace(/\D/g, ''), 10) || 0;
    const formattedPriceText = isNegotiable 
      ? 'Thỏa thuận' 
      : `${numericPrice.toLocaleString('vi-VN')} đ`;

    const breedNames = {
      don: 'Gà Đòn Long Biên Tuyển Chọn',
      noi: 'Gà Nòi Cựa Tuyển Chọn',
      tre: 'Gà Tre Cảnh',
      dongtao: 'Gà Đông Tảo Chuẩn F1',
      asil: 'Gà Asil / Mỹ Lai',
      caolanh: 'Gà Nòi Tuyển Chọn'
    };

    const newChicken = {
      id: 'ck_' + Date.now(),
      ms: '',
      title: title.trim(),
      breed: breed,
      breedName: breedNames[breed] || '',
      chang: chang.trim(),
      age: age.trim(),
      canVay: canVay.trim(),
      loi: loi.trim(),
      datNuoc: datNuoc,
      price: numericPrice,
      priceText: formattedPriceText,
      farm: farm.trim(),
      sellerName: sellerName.trim(),
      phone: phone.trim(),
      zalo: zalo.trim() || phone.trim(),
      location: location,
      image: imageUrl.trim(),
      videoUrl: videoUrl.trim(),
      note: note.trim(),
      status: 'available',
      createdAt: new Date().toISOString()
    };

    // Callback lên component cha
    if (onAddChicken) {
      onAddChicken(newChicken);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#14151c] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden mt-auto sm:my-auto animate-fadeIn max-h-[94dvh] flex flex-col">
        
        {/* Header Modal */}
        <div className="bg-[#12141c] px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Đăng Bán Chiến Kê Tuyển Chọn
              </h3>
              <p className="text-[11px] text-slate-400">
                Giao lưu trực tiếp với anh em đam mê • Không qua trung gian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
          
          {/* Tiêu đề & Dòng giống */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Tiêu đề tin đăng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ô Chân Trắng Điểm Mực 2K9 Đã Dạt 2 Nước Bo Đá Chắc Chắn"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border ${
                  errors.title ? 'border-rose-500' : 'border-white/10'
                } text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400`}
              />
              {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Dòng / Giống gà
                </label>
                <select
                value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#151722] border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Chọn giống gà</option>
                  <option value="don">Gà Đòn Long Biên Tuyển Chọn</option>
                  <option value="noi">Gà Nòi Cựa Tuyển Chọn</option>
                  <option value="tre">Gà Tre Cảnh</option>
                  <option value="dongtao">Gà Đông Tảo Chuẩn F1</option>
                  <option value="caolanh">Gà Nòi Tuyển Chọn</option>
                  <option value="asil">Gà Asil / Mỹ Lai Cựa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Chạng cân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={chang}
                  onChange={(e) => setChang(e.target.value)}
                  placeholder="Ví dụ: 2.85 kg hoặc 850 gram"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border ${
                    errors.chang ? 'border-rose-500' : 'border-white/10'
                  } text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono`}
                />
                {errors.chang && <p className="text-[11px] text-rose-400 mt-1">{errors.chang}</p>}
              </div>
            </div>
          </div>

          {/* Thông số cán vảy & Lối đá & Tuổi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Tuổi gà
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ví dụ: 9 tháng tơ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Cán vảy đặc trưng
              </label>
              <input
                type="text"
                value={canVay}
                onChange={(e) => setCanVay(e.target.value)}
                placeholder="Ví dụ: Giáp thới, huyền trâm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Tình trạng dạt nước
              </label>
              <select
                value={datNuoc}
                onChange={(e) => setDatNuoc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Gà tơ dạt nước đầu">Gà tơ dạt nước đầu</option>
                <option value="Đã dạt 2 nước">Đã dạt 2 nước</option>
                <option value="Đã dạt 3 nước cứng">Đã dạt 3 nước cứng</option>
                <option value="Đã thông 2-3 kỳ">Đã thông 2-3 kỳ</option>
                <option value="Gà cảnh chuẩn dáng">Gà cảnh chuẩn dáng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Đòn lối sở trường
            </label>
            <input
              type="text"
              value={loi}
              onChange={(e) => setLoi(e.target.value)}
              placeholder="Ví dụ: Lối kiềng hầu, ôm đấm dạt sườn, đá mé xỏ ngang..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Mức giá bán */}
          <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Giá giao lưu (VNĐ)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>Giá Thỏa Thuận / Liên Hệ</span>
              </label>
            </div>

            {!isNegotiable ? (
              <div>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ví dụ: 2.500.000"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#16171d] border ${
                    errors.price ? 'border-rose-500' : 'border-white/10'
                  } text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-amber-400`}
                />
                {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 italic font-semibold py-1">
                ✓ Tin đăng sẽ hiển thị mức giá "Thỏa thuận" để anh em gọi điện / Zalo trao đổi trực tiếp.
              </div>
            )}
          </div>

          {/* Thông tin liên hệ chủ trại */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Tên trại / Chủ kê
              </label>
              <input
                type="text"
                value={farm}
                onChange={(e) => {
                  setFarm(e.target.value);
                  setSellerName(e.target.value);
                }}
                placeholder="Ví dụ: Trại Gà Thành Trung Long Biên"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Số Điện Thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (zalo === '0909.999.999' || !zalo) setZalo(e.target.value);
                }}
                placeholder="0909.xxx.xxx"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border ${
                  errors.phone ? 'border-rose-500' : 'border-white/10'
                } text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono`}
              />
              {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Tỉnh / Thành phố
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">Chọn tỉnh / thành phố</option>
                <option value="Bình Định">Bình Định (Miền Trung)</option>
                <option value="Bến Tre">Bến Tre (Miền Tây)</option>
                <option value="Đồng Tháp">Đồng Tháp</option>
                <option value="Hưng Yên">Hưng Yên (Khoái Châu)</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đắk Lắk">Đắk Lắk (Tây Nguyên)</option>
                <option value="Gia Lai">Gia Lai</option>
                <option value="Ninh Thuận">Ninh Thuận</option>
                <option value="Toàn quốc">Ship Toàn Quốc</option>
              </select>
            </div>
          </div>

          {/* Chọn ảnh gà */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase">
              Hình ảnh chiến kê (Chọn ảnh mẫu hoặc nhập URL)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_CHICKEN_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-xl overflow-hidden border cursor-pointer group transition-all h-20 ${
                    imageUrl === img.url ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{img.name}</span>
                  </div>
                  {imageUrl === img.url && (
                    <span className="absolute top-1 right-1 bg-amber-400 text-black rounded-full p-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Hoặc dán URL hình ảnh gà từ web / điện thoại..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Video Clip Xổ đòn & Cam kết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Link video clip xổ đòn (Tùy chọn)
              </label>
              <div className="relative">
                <Video className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Link YouTube, TikTok hoặc clip xổ..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Ghi chú bảo hành &amp; Ship xe khách
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Vắc xin đầy đủ, gửi xe khách toàn quốc..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Thông báo cam kết */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý giao nhận:</strong> Khi gửi xe khách, chủ trại cần đóng lồng thoáng khí, lót rơm ấm và ghi rõ số điện thoại nhà xe để người nhận ra điểm đón thuận tiện.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial justify-center px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wide transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>XÁC NHẬN ĐĂNG BÁN</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
