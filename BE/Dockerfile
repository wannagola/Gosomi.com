FROM node:24-alpine AS frontend-builder

# Build Frontend
WORKDIR /frontend
COPY ../FE/package*.json ./
RUN npm install
COPY ../FE/ ./
RUN npm run build

# Backend Runtime
FROM node:24-alpine
WORKDIR /usr/src/app

RUN npm install -g pnpm

# Install backend dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod

# Copy backend code
COPY . .

# Copy frontend build from builder stage
COPY --from=frontend-builder /frontend/build ./public/build

ENV NODE_ENV=production
EXPOSE 3000

CMD [ "node", "src/index.js" ]