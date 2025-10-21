# Let BASE_IMAGE be overridden at build time (mirrors, nexus proxy, etc.)
ARG BASE_IMAGE=python:3.12-slim

# ---- Base (shared) ----------------------------------------------------------
FROM ${BASE_IMAGE} AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_SYSTEM_PYTHON=1
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
 && rm -rf /var/lib/apt/lists/*

ENV VENV_PATH=/opt/venv
ENV PATH="${VENV_PATH}/bin:${PATH}"

# ---- Builder (compilers here only) ------------------------------------------
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential rustc cargo libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV UV_BIN=/root/.local/bin/uv

WORKDIR /app

# Copy dependency metadata first (better cache). Add uv.lock if you have it.
COPY pyproject.toml ./
# COPY uv.lock ./

# Create venv and install locked deps directly (no wheelhouse)
RUN python -m venv ${VENV_PATH} \
 && ${UV_BIN} lock \
 && ${UV_BIN} sync --locked --python ${VENV_PATH}/bin/python

# If uvicorn isn’t listed in your pyproject’s runtime deps, keep this:
RUN ${VENV_PATH}/bin/pip install --no-cache-dir "uvicorn[standard]>=0.30"

# Now copy the application code
COPY . .

# ---- Runtime (tiny) ---------------------------------------------------------
FROM ${BASE_IMAGE} AS runtime
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg espeak-ng libpq5 \
 && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system --gid 1001 app && \
    adduser  --system --uid 1001 --ingroup app --home /app app
WORKDIR /app

ENV VENV_PATH=/opt/venv
ENV PATH="${VENV_PATH}/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Bring venv and app from builder
COPY --from=builder ${VENV_PATH} ${VENV_PATH}
COPY --from=builder /app /app

EXPOSE 8000
USER app
CMD ["python","-m","uvicorn","main:app","--host","0.0.0.0","--port","8000"]