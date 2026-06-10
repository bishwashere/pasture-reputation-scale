FROM node:20-alpine

WORKDIR /app

# No network tools except what's needed — container runs single job then exits
RUN addgroup -S runner && adduser -S runner -G runner
USER runner

COPY run.mjs ./

ENTRYPOINT ["node", "run.mjs"]
