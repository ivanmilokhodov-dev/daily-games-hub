#!/bin/sh
# Substitute PORT in nginx config
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
# Start nginx
exec nginx -g 'daemon off;'
