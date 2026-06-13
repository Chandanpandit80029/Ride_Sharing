# Multi-stage build for RideShare backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend

# Install dependencies
RUN npm ci

# Copy remaining backend source
COPY backend .

# Generate Prisma client
RUN npx prisma generate

# Final stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy from builder
COPY --from=builder /app/backend .

EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "npm run prisma:migrate:prod && npm run start"]
