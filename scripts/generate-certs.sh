#!/bin/bash

# Generate self-signed SSL certificates for local HTTPS development
# Required for PWA installation testing

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

echo "Generating self-signed SSL certificate..."

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$CERT_DIR/localhost-key.pem" \
  -out "$CERT_DIR/localhost-cert.pem" \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✓ SSL certificates generated in $CERT_DIR/"
echo ""
echo "To use HTTPS in development:"
echo "  npm run dev:https"
echo ""
echo "Note: You'll need to accept the self-signed certificate in your browser"
