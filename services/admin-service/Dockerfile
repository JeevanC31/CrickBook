FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
# Generate Prisma client using schema only (no DATABASE_URL needed at build time)
RUN npx prisma generate --schema=prisma/schema.prisma

COPY . .

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./
# prisma.config.ts is copied separately so it can read DATABASE_URL at runtime
COPY prisma.config.ts ./

EXPOSE 4007

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["npx prisma db push && npx tsx src/index.ts"]