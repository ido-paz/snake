# Use nginx:alpine as base image - one of the smallest available web server images
FROM nginx:alpine

# Copy all the game files to the nginx server directory
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

# Configure nginx to listen on port 8765
RUN echo 'server { \
    listen 8765; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 8765
EXPOSE 8765

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]