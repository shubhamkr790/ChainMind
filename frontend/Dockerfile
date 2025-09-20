# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables to skip linting
ENV SKIP_LINT=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV TSC_COMPILE_ON_ERROR=true

# Build the Next.js app with ESLint disabled
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
