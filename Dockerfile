# syntax=docker/dockerfile:1
FROM node:24.10.0-alpine3.22 AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies with local packages available
RUN --mount=type=cache,target=/root/.npm \
    npm install --network-timeout 100000 || npm install

# Build stage
FROM node:24.10.0-alpine3.22 AS builder

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copy everything from deps stage
COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Create .env file with build-time environment variables or defaults
ARG BUILD_ENV=dev
ARG NEXT_PUBLIC_BACKEND_HOST=http://localhost
ARG NEXT_PUBLIC_BACKEND_PORT=8000
ARG NEXT_PUBLIC_METRICS_HOST
RUN if [ "${BUILD_ENV}" = "dev" ]; then \
        BACKEND_HOST="http://localhost"; \
    else \
        BACKEND_HOST="${NEXT_PUBLIC_BACKEND_HOST}"; \
    fi && \
    echo "NEXT_PUBLIC_BACKEND_HOST=${BACKEND_HOST}" > .env && \
    echo "NEXT_PUBLIC_BACKEND_PORT=${NEXT_PUBLIC_BACKEND_PORT}" >> .env

# Install esbuild for Alpine specifically and build
RUN npm install esbuild@latest && \
    npm run build && \
    npm run build:embed

# Runner stage
FROM node:24.10.0-alpine3.22 AS runner

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV HOST="0.0.0.0"
ENV PORT=3000

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy everything from builder
COPY --from=builder --chown=nextjs:nodejs /app .

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]