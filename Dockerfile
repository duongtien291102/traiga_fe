# Stage 1: Build Frontend bằng Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn và build production
COPY . .
RUN npm run build

# Stage 2: Nginx phục vụ static file và làm API Gateway
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copy file build từ builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
