#!/bin/bash
set -e

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r api/requirements.txt

echo "Dependencies installed successfully!"
echo "Starting Uvicorn server..."
