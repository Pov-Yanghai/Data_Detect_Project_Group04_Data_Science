FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=5000 \
    ML_SERVICE_URL=http://ml-service:8000

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads \
    && addgroup -S nodejs \
    && adduser -S appuser -G nodejs \
    && chown -R appuser:nodejs /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
