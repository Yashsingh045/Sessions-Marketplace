# Frontend: Next.js (client-side only). Build then serve with `next start`.
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json ./
RUN npm install

# App source.
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time; compose passes them in.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
