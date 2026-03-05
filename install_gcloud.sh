#!/usr/bin/env bash
set -e

export CLOUDSDK_CONFIG="/tmp/.config/gcloud"
mkdir -p "$CLOUDSDK_CONFIG"

cd /tmp
if [ ! -d "/tmp/google-cloud-sdk" ]; then
    echo "Downloading Google Cloud SDK for Mac (ARM)..."
    curl -O -L https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-arm.tar.gz
    echo "Extracting..."
    tar -xf google-cloud-cli-darwin-arm.tar.gz
    rm google-cloud-cli-darwin-arm.tar.gz
fi

echo "Installing (non-interactive)..."
/tmp/google-cloud-sdk/install.sh --quiet

echo "Initializing..."
echo "Done! Run: export CLOUDSDK_CONFIG=\"/tmp/.config/gcloud\" && /tmp/google-cloud-sdk/bin/gcloud init"
