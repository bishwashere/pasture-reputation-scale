FROM node:20-alpine AS builder

RUN apk add --no-cache docker-cli

WORKDIR /app

COPY services/evaluation-worker/package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/evaluation-worker/tsconfig.json ./
COPY services/evaluation-worker/src ./src
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache docker-cli

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=8080
ENV DOCKER_ENABLED=true

EXPOSE 8080

CMD ["node", "dist/index.js"]
