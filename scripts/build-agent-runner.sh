#!/usr/bin/env bash
set -euo pipefail

echo "Building agent-runner image..."
docker build -t rep-protocol/agent-runner:latest ./docker/agent-runner

echo "Done. Image: rep-protocol/agent-runner:latest"
