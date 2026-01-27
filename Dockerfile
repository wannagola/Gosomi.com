FROM node:24-alpine
WORKDIR /usr/src/app

RUN npm install -g pnpm

# Install backend dependencies
COPY BE/package.json BE/pnpm-lock.yaml* ./
RUN pnpm install --prod

# Copy backend source
COPY BE/ ./

# Install and build frontend
WORKDIR /frontend
COPY FE/package*.json ./
RUN npm install
COPY FE/ ./
RUN npm run build

# Move frontend build to backend public directory
WORKDIR /usr/src/app
RUN mkdir -p public && cp -r /frontend/build/* public/

ENV NODE_ENV=production
EXPOSE 3000

CMD [ "node", "src/index.js" ]
