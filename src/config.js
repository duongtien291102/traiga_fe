/**
 * Cấu hình kết nối API, WebSocket, HLS và RTMP động theo môi trường
 * - Localhost: gọi thẳng backend local hoặc proxy
 * - Vercel Production: gọi Azure Container Apps Backend (REST & WebSocket)
 */

export const getHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

// URL của Backend trên Azure Container Apps
export const AZURE_BACKEND_URL = 'https://demo-webtraiga.proudsky-59d95604.southeastasia.azurecontainerapps.io';
export const AZURE_WS_URL = 'wss://demo-webtraiga.proudsky-59d95604.southeastasia.azurecontainerapps.io';

// Kiểm tra xem frontend có đang chạy trên Vercel không
export const isVercel = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname.endsWith('vercel.app') || window.location.hostname.includes('vercel');
  }
  return false;
};

// API Base URL: Ưu tiên VITE_API_URL nếu chạy local
export const getApiBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return `http://${getHost()}:8000`;
};

// WebSocket Base URL: Ưu tiên VITE_WS_URL nếu chạy local
export const getWsUrl = (streamKey) => {
  if (import.meta.env?.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/ws/chat?streamKey=${encodeURIComponent(streamKey)}`;
  }
  if (isVercel()) {
    return `${AZURE_WS_URL}/ws/chat?streamKey=${encodeURIComponent(streamKey)}`;
  }
  const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = typeof window !== 'undefined' && window.location.host ? window.location.host : `${getHost()}:8000`;
  return `${wsProtocol}//${wsHost}/ws/chat?streamKey=${encodeURIComponent(streamKey)}`;
};

// HLS Stream: Nếu có cấu hình VITE_HLS_URL hoặc dùng link Ngrok công khai (có HTTPS)
export const NGROK_HLS_URL = 'https://subpentagonal-kenyetta-experientially.ngrok-free.dev';

export const getHlsBaseUrl = () => {
  if (import.meta.env?.VITE_HLS_URL) {
    return import.meta.env.VITE_HLS_URL;
  }
  // Khi chạy trên Vercel, ưu tiên lấy luồng từ đường hầm Ngrok HTTPS để không bị lỗi Mixed Content
  if (isVercel()) {
    return NGROK_HLS_URL;
  }
  if (typeof window !== 'undefined' && window.location.host) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return `http://${getHost()}:8080`;
};

export const getRtmpBaseUrl = () => {
  if (import.meta.env?.VITE_RTMP_URL) {
    return import.meta.env.VITE_RTMP_URL;
  }
  return `rtmp://${getHost()}:1935/live`;
};
