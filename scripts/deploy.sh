#!/bin/bash

# Exit on error
set -e

# Check if commit hash is passed as an argument
if [ -z "$2" ]; then
  echo "Usage: $0 <backend|frontend> <commit-hash>"
  exit 1
fi

DEPLOY_TYPE=$1
COMMIT_HASH=$2
RELEASES_DIR="/home/deploy/releases/countryBox/${COMMIT_HASH}"
DEPLOY_DIR="/home/deploy/production/countryBox/${DEPLOY_TYPE}"
SERVICE_NAME="countryBox-${DEPLOY_TYPE}"

if [ "$DEPLOY_TYPE" == "backend" ]; then
  DEPLOY_TARGET="${RELEASES_DIR}/backend"
elif [ "$DEPLOY_TYPE" == "frontend" ]; then
  DEPLOY_TARGET="${RELEASES_DIR}/frontend"
else
  echo "Invalid deployment type: ${DEPLOY_TYPE}. Use 'backend' or 'frontend'."
  exit 1
fi

# Ensure deployment target exists
if [ ! -e "$DEPLOY_TARGET" ]; then
  echo "Error: Deployment target ${DEPLOY_TARGET} not found."
  exit 1
fi

# Keep a reference to the previous deployment
if [ -L "${DEPLOY_DIR}" ]; then
  PREVIOUS=$(readlink -f "${DEPLOY_DIR}")
  echo "Current deployment is ${PREVIOUS}, saved for rollback."
else
  echo "No symbolic link found, no previous deployment to backup."
  PREVIOUS=""
fi

rollback_deployment() {
  if [ -n "$PREVIOUS" ]; then
    echo "Rolling back to previous deployment: ${PREVIOUS}"
    ln -sfn "${PREVIOUS}" "${DEPLOY_DIR}"
  else
    echo "No previous deployment to roll back to."
  fi

  echo "Restarting ${SERVICE_NAME}..."
  sudo systemctl restart "${SERVICE_NAME}"

  echo "Rollback completed."
}

# Deploy new version
echo "Deploying ${DEPLOY_TYPE}..."
ln -sfn "${DEPLOY_TARGET}" "${DEPLOY_DIR}"

# Restart service
echo "Restarting ${SERVICE_NAME}..."
if ! sudo systemctl restart "${SERVICE_NAME}"; then
  echo "Error: Failed to restart ${SERVICE_NAME}. Rolling back deployment."
  rollback_deployment
  exit 1
fi

# Wait a few seconds for the service to start
sleep 5

# Verify service status
if ! systemctl is-active --quiet "${SERVICE_NAME}"; then
  echo "Error: ${SERVICE_NAME} failed to start correctly. Rolling back deployment."
  rollback_deployment
  exit 1
fi

echo "Deployment of ${DEPLOY_TYPE} completed successfully."
