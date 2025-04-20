FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm install typescript --no-save && npm run build

EXPOSE 4000
CMD ["node", "dist/server.js"]