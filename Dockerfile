# # Stage 1: Python builder (Debian-based)
# FROM python:3.10-slim as python-builder
# WORKDIR /app/piper
# RUN apt-get update && apt-get install -y ffmpeg
# COPY piper/requirements.txt .
# RUN python3 -m venv piperenv \
#     && /app/piper/piperenv/bin/pip install -r requirements.txt
#
# # Stage 2: Node.js environment (Debian-based)
# FROM node:20-bullseye-slim
# WORKDIR /app
# RUN apt-get update && apt-get install -y python3 ffmpeg
#
# # Copy the entire piper directory including venv
# COPY --from=python-builder /app/piper /app/piper
#
# # The venv python should now be usable since it's on similar system environment
# COPY package*.json ./
# RUN npm install
# COPY . .
#
# EXPOSE 3000
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

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Define the startup command
CMD ["npm", "start"]

