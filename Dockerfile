FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production

COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 3000

CMD ["/usr/local/bin/start.sh"]
