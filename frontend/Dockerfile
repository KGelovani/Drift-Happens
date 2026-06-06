FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g http-server

COPY --from=builder /app/dist/drift-ui/browser ./dist

EXPOSE 4200

CMD ["http-server", "dist", "-p", "4200", "-c-1"]
