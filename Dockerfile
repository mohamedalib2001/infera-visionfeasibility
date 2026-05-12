FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application
COPY . .

# Build if needed
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm start"]
