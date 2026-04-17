FROM node:20-slim

WORKDIR /app

# Install dependencies required by mongodb-memory-server
RUN apt-get update && apt-get install -y libcurl4 && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./
RUN npm install
COPY server/ .

EXPOSE 5000

CMD ["npm", "start"]
