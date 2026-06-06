FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm ci --prefer-offline --no-audit

COPY src ./src
COPY tsconfig.json .

RUN npm run build

CMD ["npm", "start"]
