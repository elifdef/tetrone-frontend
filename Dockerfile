FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# DEV
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# BUILD
FROM base AS build

# docker-compose (args)
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_NAME
ARG VITE_MAX_FILE_SIZE_KB
ARG VITE_APP_ENV

# Node/Viteки
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_MAX_FILE_SIZE_KB=$VITE_MAX_FILE_SIZE_KB
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm ci
COPY . .

RUN npm run build

# PROD
FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
