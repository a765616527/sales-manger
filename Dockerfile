FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate && npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm run prisma:generate && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/docker/start.sh /usr/local/bin/start.sh

RUN addgroup -S nodejs \
  && adduser -S nextjs -G nodejs \
  && chmod +x /usr/local/bin/start.sh \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["/usr/local/bin/start.sh"]
