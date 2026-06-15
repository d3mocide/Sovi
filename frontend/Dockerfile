FROM node:20-alpine AS builder
WORKDIR /app

# Copy frontend package files and install deps
COPY frontend/package.json ./
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Copy shared payoff engine
COPY shared/ /shared/

# Build
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
