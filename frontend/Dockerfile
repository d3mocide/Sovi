FROM node:22-alpine AS builder
WORKDIR /app

# Copy frontend package files and install deps
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Copy shared payoff engine
COPY shared/ /shared/

# Build
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
