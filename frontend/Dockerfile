# ---- Build stage: compile the Vite app ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these at build time. "/api" is proxied to the backend by nginx (see nginx.conf).
ARG VITE_API_URL=/api
ARG VITE_USE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCK=$VITE_USE_MOCK

RUN npm run build

# ---- Runtime stage: serve static files with nginx ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
