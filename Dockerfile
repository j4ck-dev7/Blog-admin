FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN mkdir -p logs/

EXPOSE 3000

CMD ["npm", "start"]