FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

COPY . .

# Build the project
RUN pnpm run build

# Prune dev dependencies to save space (optional, but recommended for production)
RUN pnpm prune --prod

ENV PORT=80
EXPOSE 80

CMD ["pnpm", "start"]
