# ---- Étape 1 : build du frontend (Vite) ----
FROM node:22-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html ./
COPY public ./public
COPY src ./src
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci
RUN npm run build

# ---- Étape 2 : build du backend (Express + Prisma) ----
FROM node:22-slim AS backend-build
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm ci
RUN npx prisma generate
RUN npx tsc -p tsconfig.json

# ---- Étape 3 : runtime (API + SPA dans un seul conteneur) ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./package.json
COPY --from=frontend-build /app/dist ./public
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate --schema ./prisma/schema.prisma && node dist/server.js"]