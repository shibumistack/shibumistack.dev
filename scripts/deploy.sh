#!/usr/bin/env bash

set -euo pipefail

# Load .env file
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  echo "Copy .env.example to .env and fill in your values"
  exit 1
fi

# Validate required variables
for var in DEPLOY_HOST DEPLOY_USER DEPLOY_PATH; do
  if [[ -z "${!var:-}" ]]; then
    echo "Error: $var is not set in .env"
    exit 1
  fi
done

echo "Deploying to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

# Build SSH command
SSH_ARGS="-o StrictHostKeyChecking=no"

# Add key if specified and exists
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  if [[ -f "${DEPLOY_SSH_KEY}" ]]; then
    SSH_ARGS="-i ${DEPLOY_SSH_KEY} ${SSH_ARGS}"
  else
    echo "Warning: SSH key ${DEPLOY_SSH_KEY} not found, using default"
  fi
fi

# Wrapper: ensures ~/.local/bin is in PATH for non-interactive SSH sessions
remote() {
  ssh ${SSH_ARGS} "${DEPLOY_USER}@${DEPLOY_HOST}" "export PATH=\"\$HOME/.local/bin:\$PATH\" && $*"
}

# Deploy
echo "→ Pulling latest code..."
remote "cd ${DEPLOY_PATH} && git pull"

# Container tool on server. podman-compose handles build + lifecycle.
# Override with DEPLOY_CONTAINER_CMD=docker or podman if needed.
CONTAINER_CMD=${DEPLOY_CONTAINER_CMD:-podman-compose}
APP_NAME=shibumistack

# Determine compose subcommand ("compose" for docker/podman, empty for standalone compose tools)
COMPOSE_SUBCMD="compose"
if [[ "${CONTAINER_CMD}" == *"-compose" ]]; then
  COMPOSE_SUBCMD=""
fi

if remote "cd ${DEPLOY_PATH} && ${CONTAINER_CMD} ${COMPOSE_SUBCMD} version" >/dev/null 2>&1; then
  echo "→ Rebuilding and restarting containers..."
  remote "cd ${DEPLOY_PATH} && ${CONTAINER_CMD} ${COMPOSE_SUBCMD} down && ${CONTAINER_CMD} ${COMPOSE_SUBCMD} up -d --build"
else
  echo "→ Rebuilding and restarting containers (raw ${CONTAINER_CMD})..."
  # Stop and remove any container using port 9001 (by name or orphaned)
  remote "cd ${DEPLOY_PATH} && ${CONTAINER_CMD} stop ${APP_NAME} 2>/dev/null; ${CONTAINER_CMD} rm -f ${APP_NAME} 2>/dev/null; ${CONTAINER_CMD} stop \$( ${CONTAINER_CMD} ps -q --filter publish=9001 ) 2>/dev/null; ${CONTAINER_CMD} rm -f \$( ${CONTAINER_CMD} ps -aq --filter publish=9001 ) 2>/dev/null; ${CONTAINER_CMD} build -t ${APP_NAME} . && ${CONTAINER_CMD} run -d --name ${APP_NAME} --restart unless-stopped -p 9001:9001 ${APP_NAME}"
fi

echo "✓ Deployed successfully"
