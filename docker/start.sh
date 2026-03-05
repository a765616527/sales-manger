#!/usr/bin/env sh
set -eu

: "${DB_HOST:=mysql}"
: "${DB_PORT:=3306}"
: "${DB_NAME:=sales_manager}"
: "${DB_USER:=sales_user}"
: "${DB_PASSWORD:=sales_password}"

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

if [ -z "${SESSION_SECRET:-}" ]; then
  echo "[start] SESSION_SECRET 未配置，拒绝启动。"
  exit 1
fi

if [ -z "${ADMIN_INIT_USERNAME:-}" ] || [ -z "${ADMIN_INIT_PASSWORD:-}" ]; then
  echo "[start] ADMIN_INIT_USERNAME / ADMIN_INIT_PASSWORD 未配置，拒绝启动。"
  exit 1
fi

echo "[start] DATABASE_URL 已注入，开始同步数据库结构..."
if [ -f "./node_modules/prisma/build/index.js" ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate
else
  echo "[start] 未找到 Prisma CLI，跳过 db push。"
fi

echo "[start] 初始化管理员账号..."
node scripts/bootstrap-admin.mjs

echo "[start] 启动 Next.js..."
if [ -f "./server.js" ]; then
  exec node ./server.js
fi

exec npm run start
