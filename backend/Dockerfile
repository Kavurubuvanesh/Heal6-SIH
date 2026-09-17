# ==============================================================================
# Heal6 Enterprise Clinical Telemetry & ML Backend
# Production-Hardened Container: Non-Root Security, PyTorch Pre-warming, Healthcheck
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable unbuffered standard streams
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    UVICORN_WORKERS=2 \
    PYTHONPATH=/app

# Install minimal system runtime libraries required by OpenCV (libgl1, libglib) and health check (curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security Hardening: Create unprivileged system user and group (HIPAA/CIS Docker Benchmark)
RUN groupadd -g 1000 heal6 && \
    useradd -u 1000 -g heal6 -s /bin/bash -m heal6

WORKDIR /app

# Install Python dependencies leveraging layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code and models
COPY . /app

# Ensure correct file permissions for unprivileged user
RUN chown -R heal6:heal6 /app

# Switch to non-root user
USER heal6

# Expose FastAPI listening port
EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production server with configurable Uvicorn workers
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-2}"]
