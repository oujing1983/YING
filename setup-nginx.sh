#!/bin/bash
# =============================================
# Nginx 反向代理配置脚本
# 运行: sudo bash setup-nginx.sh
# =============================================

set -e

APP_PORT="${1:-3000}"
DOMAIN="${2:-_}"   # _ 表示匹配所有域名，可替换为你的域名

echo "配置 Nginx 反向代理..."

# 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
            sudo apt-get update && sudo apt-get install -y nginx
        else
            sudo yum install -y nginx
        fi
    fi
fi

# 创建 Nginx 配置
sudo tee /etc/nginx/conf.d/lead-ai.conf > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "Nginx 配置完成！"
echo "现在可以通过 http://服务器IP 访问系统了"
echo ""
echo "如需配置 HTTPS，建议使用 Let's Encrypt 免费证书："
echo "  sudo apt-get install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d your-domain.com"
