FROM node:18-alpine
ENV NODE_ENV=production
ENV PORT=8001

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

#COPY .env.production dest/.env
EXPOSE 8001
CMD ["node", "dist/index.js"]