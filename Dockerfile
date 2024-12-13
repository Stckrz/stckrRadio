# # Use Python 3.10 Slim as the base image
# FROM python:3.10-slim
#
# # Install necessary system packages and Node.js 20
# RUN apt-get update && \
#     apt-get install -y curl ffmpeg && \
#     curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
#     apt-get install -y nodejs && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*
#
# # Set the working directory
# WORKDIR /app
#
# # Copy Python requirements and install them in a virtual environment
# COPY piper/requirements.txt /app/piper/requirements.txt
# RUN python3 -m venv /app/piperenv && \
#     /app/piperenv/bin/pip install --upgrade pip && \
#     /app/piperenv/bin/pip install -r /app/piper/requirements.txt
#
# # Set PATH to prioritize the virtual environment's binaries
# ENV PATH="/app/piperenv/bin:${PATH}"
#
# # Verify Python version in the virtual environment
# RUN python --version  # Should output Python 3.10.x
#
# # Install Node.js dependencies
# COPY package*.json ./
# RUN npm install
#
# # Copy the rest of the application code
# COPY . .
#
# # Expose the application port
# EXPOSE 3000
#
# # Define the startup command
# CMD ["npm", "start"]

# Use Python 3.10 Slim as the base image
FROM python:3.10-slim

# Install necessary system packages and Node.js 20
RUN apt-get update && \
    apt-get install -y curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy Python requirements and install them in a virtual environment
COPY piper/requirements.txt /app/piper/requirements.txt
RUN python3 -m venv /app/piperenv && \
    /app/piperenv/bin/pip install --upgrade pip && \
    /app/piperenv/bin/pip install -r /app/piper/requirements.txt

# Set PATH to prioritize the virtual environment's binaries
ENV PATH="/app/piperenv/bin:${PATH}"

# Verify Python version in the virtual environment
RUN python --version  # Should output Python 3.10.x

# Copy Node.js dependencies and install them
COPY package*.json tsconfig.json ./
RUN npm install

# Transpile TypeScript to JavaScript
COPY . . 
RUN npx tsc

# Expose the application port
EXPOSE 3000

# Define the startup command to use the compiled JavaScript files
CMD ["node", "dist/index.js"]

