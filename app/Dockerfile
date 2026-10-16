FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend ./
COPY --from=web /web/dist ./public
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/index.js"]
