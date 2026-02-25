#!/bin/bash

# Strict error handling
set -euo pipefail

# Generate self-signed SSL certificates for local HTTPS development
# Required for PWA installation testing

# Resolve cert directory relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/../certs"

mkdir -p "$CERT_DIR" || {
  echo "Error: Failed to create certificate directory" >&2
  exit 1
}

echo "Generating self-signed SSL certificate..."

if ! openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$CERT_DIR/localhost-key.pem" \
  -out "$CERT_DIR/localhost-cert.pem" \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"; then
  echo "Error: OpenSSL certificate generation failed" >&2
  exit 1
fi

echo "✓ SSL certificates generated in $CERT_DIR/"
echo ""
echo "To use HTTPS in development:"
echo "  npm run dev:https"
echo ""
echo "Note: You'll need to accept the self-signed certificate in your browser"
