FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/src/index.js"]
