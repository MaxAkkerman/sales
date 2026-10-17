FROM node:20-alpine AS web
WORKDIR /web
COPY app/frontend/package.json ./
RUN npm install
COPY app/frontend ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY app/backend/package.json ./
RUN npm install --omit=dev
COPY app/backend ./
COPY --from=web /web/dist ./public
ENV NODE_ENV=production PORT=8000
EXPOSE 8000
CMD ["node", "src/index.js"]
