# Use the official Nginx image as a base
FROM nginx:alpine

# Remove the default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy our static web files to the nginx html directory
# COPY ./public/ /usr/share/nginx/html/ (Frontend devs do as you please)

# Expose port 80 (the default http port)
EXPOSE 80