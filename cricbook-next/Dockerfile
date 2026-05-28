FROM node:20-alpine AS builder
WORKDIR /app

# Declare build args — passed from docker-compose build.args
# NEXT_PUBLIC_* vars must be declared as ARG *and* set as ENV
# so Next.js bakes them into the JS bundle at build time.
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_TURF_URL
ARG NEXT_PUBLIC_COACH_URL
ARG NEXT_PUBLIC_MATCH_URL
ARG NEXT_PUBLIC_SHOP_URL
ARG NEXT_PUBLIC_CHAT_URL
ARG NEXT_PUBLIC_ADMIN_URL

ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_TURF_URL=$NEXT_PUBLIC_TURF_URL
ENV NEXT_PUBLIC_COACH_URL=$NEXT_PUBLIC_COACH_URL
ENV NEXT_PUBLIC_MATCH_URL=$NEXT_PUBLIC_MATCH_URL
ENV NEXT_PUBLIC_SHOP_URL=$NEXT_PUBLIC_SHOP_URL
ENV NEXT_PUBLIC_CHAT_URL=$NEXT_PUBLIC_CHAT_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0"]
