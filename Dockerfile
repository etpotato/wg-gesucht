FROM node:20.12.2-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile

FROM base
RUN corepack enable
WORKDIR /app
COPY --from=prod-deps /app/node_modules /app/node_modules
CMD [ "pnpm", "start" ]
