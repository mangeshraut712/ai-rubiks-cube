# Stage 1: Build frontend assets
FROM node:20-alpine AS builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime backend + static frontend
FROM node:20-alpine AS runner
WORKDIR /app/backend

ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY --from=builder /app/frontend/dist /app/frontend/dist

EXPOSE 8080
CMD ["node", "src/server.js"]
