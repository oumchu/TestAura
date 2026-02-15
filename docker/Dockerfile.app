FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.ts ./
RUN npx tsc server.ts --esModuleInterop --module commonjs --target ES2022 --skipLibCheck

EXPOSE 3000

CMD ["node", "server.js"]
