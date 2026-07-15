#!/bin/bash
# =============================================
# Lead-AI 阿里云服务器一键部署脚本
# 使用方法：在服务器上运行 bash deploy.sh
# =============================================

set -e

APP_NAME="lead-ai"
APP_DIR="/opt/$APP_NAME"
NODE_VERSION="18"

echo "======================================"
echo "  Lead-AI 包装获客系统 - 服务器部署"
echo "======================================"

# 1. 检测系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "无法检测操作系统"
    exit 1
fi
echo "[1/7] 检测系统: $OS"

# 2. 安装 Node.js 18 (如果没装)
if ! command -v node &> /dev/null; then
    echo "[2/7] 安装 Node.js $NODE_VERSION..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        # CentOS / Alibaba Cloud Linux
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    fi
else
    echo "[2/7] Node.js 已安装: $(node -v)"
fi

# 3. 安装 PM2 (进程守护)
if ! command -v pm2 &> /dev/null; then
    echo "[3/7] 安装 PM2 进程管理器..."
    sudo npm install -g pm2
else
    echo "[3/7] PM2 已安装"
fi

# 4. 创建应用目录并上传代码
echo "[4/7] 准备应用目录..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 复制当前目录的代码（假设脚本和代码一起上传到了服务器）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    echo "  复制文件到 $APP_DIR ..."
    rsync -av --exclude='node_modules' --exclude='.next' --exclude='data' "$SCRIPT_DIR/" "$APP_DIR/"
fi

cd $APP_DIR

# 5. 安装依赖
echo "[5/7] 安装项目依赖..."
npm install --production

# 6. 创建数据目录
mkdir -p data

# 7. 构建生产版本
echo "[6/7] 构建生产版本..."
npm run build

# 8. 启动 PM2
echo "[7/7] 启动应用..."
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- run start
pm2 save
pm2 startup

echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "  应用已启动在: http://localhost:3000"
echo ""
echo "  常用命令："
echo "    pm2 status          - 查看运行状态"
echo "    pm2 logs $APP_NAME  - 查看日志"
echo "    pm2 restart $APP_NAME - 重启应用"
echo ""
echo "  下一步（可选）：配置 Nginx 反向代理"
echo "  运行: sudo bash setup-nginx.sh"
echo "======================================"
