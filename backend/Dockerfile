# Pettography backend — production image
# Multi-stage: build with full deps, run with prod deps only.
# Runtime: Node 22 (alpine), NestJS 11 (Express + socket.io).

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# pnpm via corepack (lockfile is at the repo root in the pnpm workspace).
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/

# Install the backend workspace deps (incl. dev) using the root lockfile.
RUN pnpm install --frozen-lockfile --filter pettography-backend...

# Copy backend sources and compile (nest build -> dist/main.js).
COPY backend ./backend
RUN pnpm --filter pettography-backend run build

# Prune to production-only dependencies for the runtime stage.
RUN pnpm --filter pettography-backend deploy --prod --legacy /app/deploy

# ---------- Stage 2: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Render/Fly inject PORT; default to 3001 for local `docker run`.
ENV PORT=3001

# Drop privileges: run as the built-in non-root `node` user.
COPY --chown=node:node --from=build /app/deploy/node_modules ./node_modules
COPY --chown=node:node --from=build /app/deploy/package.json ./package.json
COPY --chown=node:node --from=build /app/backend/dist ./dist

USER node
EXPOSE 3001

# Container-level liveness check against the public health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
