# Build từ thư mục gốc repo: docker build -f apps/server/Dockerfile .
FROM node:22-bookworm-slim AS build
WORKDIR /src
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/core packages/core
COPY apps/server apps/server
# Chỉ cài và build server cùng các package workspace mà nó phụ thuộc.
RUN pnpm install --frozen-lockfile --filter @wakeup/server... \
 && pnpm --filter @wakeup/server build \
 && pnpm --filter @wakeup/server deploy --prod --legacy /out

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules node_modules
COPY --from=build /out/package.json package.json
COPY --from=build /src/apps/server/dist dist
EXPOSE 8080
USER node
CMD ["node", "dist/main.js"]
