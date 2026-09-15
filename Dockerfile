# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Salin manifest dependencies
COPY package*.json ./

# Install dependencies (termasuk devDependencies untuk proses build)
RUN npm ci

# Salin seluruh kode sumber
COPY . .

# Kompilasi aplikasi Vue 3 ke folder dist
RUN npm run build


# Stage 2: Production runtime stage
FROM nginx:1.27-alpine

# Pasang curl untuk healthcheck
RUN apk add --no-cache curl

# Salin konfigurasi Nginx khusus SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari builder stage ke direktori public web Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
