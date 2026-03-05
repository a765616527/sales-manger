#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "未找到 $COMPOSE_FILE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 docker，请先安装 Docker。"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 docker compose 插件，请先安装。"
  exit 1
fi

get_compose_value() {
  local key="$1"
  awk -F'"' -v k="$key" '$1 ~ "^[[:space:]]*"k":" { print $2; exit }' "$COMPOSE_FILE"
}

set_compose_value() {
  local key="$1"
  local value="$2"
  local escaped
  escaped=$(printf '%s' "$value" | sed -e 's/[\\&/]/\\\\&/g')
  sed -i -E "s|^([[:space:]]*${key}:[[:space:]]*&${key}[[:space:]]*\").*(\")$|\\1${escaped}\\2|" "$COMPOSE_FILE"
}

current_image="$(get_compose_value app_image)"
current_port_binding="$(get_compose_value app_port_binding)"
current_admin_user="$(get_compose_value admin_init_username)"
current_admin_pass="$(get_compose_value admin_init_password)"
current_mysql_data_path="$(get_compose_value mysql_data_path)"

if [[ -z "$current_image" || -z "$current_port_binding" || -z "$current_mysql_data_path" ]]; then
  echo "解析 $COMPOSE_FILE 失败，请检查 x-deploy 配置块。"
  exit 1
fi

current_port="${current_port_binding%%:*}"

read -r -p "项目对外端口 [${current_port}]: " input_port
app_port="${input_port:-$current_port}"
if ! [[ "$app_port" =~ ^[0-9]+$ ]] || (( app_port < 1 || app_port > 65535 )); then
  echo "端口号不合法：$app_port"
  exit 1
fi

read -r -p "初始管理员账号 [${current_admin_user}]: " input_admin_user
admin_user="${input_admin_user:-$current_admin_user}"
if [[ -z "$admin_user" ]]; then
  echo "管理员账号不能为空"
  exit 1
fi

read -r -s -p "初始管理员密码（留空则沿用当前值）: " input_admin_pass
echo
if [[ -n "$input_admin_pass" ]]; then
  admin_pass="$input_admin_pass"
else
  admin_pass="$current_admin_pass"
fi
if [[ -z "$admin_pass" ]]; then
  echo "管理员密码不能为空"
  exit 1
fi

mysql_data_dir="$current_mysql_data_path"
if [[ "$mysql_data_dir" == ./* ]]; then
  mysql_data_dir="${mysql_data_dir#./}"
fi

if [[ -e "$mysql_data_dir" ]]; then
  echo "检测到目录或文件已存在：$mysql_data_dir"
  echo "判定为已安装。请先移动该目录，或删除该目录后再重新安装。"
  exit 1
fi

mkdir -p "$mysql_data_dir"

set_compose_value app_port_binding "${app_port}:3000"
set_compose_value admin_init_username "$admin_user"
set_compose_value admin_init_password "$admin_pass"

echo "已写入部署配置到 $COMPOSE_FILE"
echo "  镜像: $current_image（固定，不可交互修改）"
echo "  端口: ${app_port}:3000"
echo "  管理员: $admin_user"
echo "  MySQL 数据目录: $mysql_data_dir"

echo "开始部署..."
docker compose pull app || true
docker compose up -d mysql

echo "等待 MySQL 健康检查通过..."
for _ in $(seq 1 60); do
  health=$(docker inspect --format='{{.State.Health.Status}}' sales-manger-mysql 2>/dev/null || true)
  if [[ "$health" == "healthy" ]]; then
    break
  fi
  sleep 2
 done

docker compose up -d app watchtower

echo "部署完成。"
docker compose ps
