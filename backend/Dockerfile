
FROM node:24-bookworm-slim

WORKDIR /app

# Інструменти для компіляції better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо файли залежностей
COPY backend/package*.json ./backend/

WORKDIR /app/backend

# Встановлюємо залежності
RUN npm ci --omit=dev

# Копіюємо backend та frontend
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/public/ ./frontend/public/

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "start"]
