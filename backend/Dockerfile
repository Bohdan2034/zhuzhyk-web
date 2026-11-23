
FROM node:24-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm ci --omit=dev

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/public/ ./frontend/public/

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
