/**
 * Cấu hình kết nối API, HLS và RTMP động theo IP/Domain hiện tại
 * Tự động nhận diện localhost hoặc địa chỉ IP LAN (ví dụ: 192.168.1.48) khi truy cập từ điện thoại
 */

export const getHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

// Sử dụng proxy cùng domain (qua Vite hoặc domain công khai) để tránh lỗi CORS và chặn cổng
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return `http://${getHost()}:8000`;
};

export const getHlsBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return `http://${getHost()}:8080`;
};

export const getRtmpBaseUrl = () => `rtmp://${getHost()}:1935/live`;
