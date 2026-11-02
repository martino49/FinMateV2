FROM node:20-slim

# App directory inside the container
WORKDIR /app

# Install production dependencies from the lockfile first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# App source
COPY . .

# The app creates its schema on boot when INIT_DB=true
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
