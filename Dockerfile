FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_VAPID_PUBLIC_KEY=""
ARG VITE_GEMINI_KEY=""
ARG VITE_SPOONACULAR_KEY=""
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
ENV VITE_GEMINI_KEY=$VITE_GEMINI_KEY
ENV VITE_SPOONACULAR_KEY=$VITE_SPOONACULAR_KEY

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM docker.io/library/nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
