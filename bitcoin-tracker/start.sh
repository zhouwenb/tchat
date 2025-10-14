#!/bin/bash

# 比特币价格追踪器启动脚本

echo "🚀 正在启动比特币价格追踪器..."

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ 错误: Go 未安装，请先安装 Go 1.21 或更高版本"
    exit 1
fi

# 检查 Go 版本
GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+' | sed 's/go//')
REQUIRED_VERSION="1.21"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GO_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ 错误: Go 版本过低，需要 $REQUIRED_VERSION 或更高版本，当前版本: $GO_VERSION"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 安装依赖
echo "📦 正在安装依赖..."
go mod tidy

# 编译应用
echo "🔨 正在编译应用..."
go build -o bitcoin-tracker cmd/main.go

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

# 设置默认端口
PORT=${PORT:-8080}

echo "✅ 编译成功！"
echo "🌐 服务器将在端口 $PORT 上启动"
echo "📱 请在浏览器中访问: http://localhost:$PORT"
echo "🔗 WebSocket 端点: ws://localhost:$PORT/ws"
echo "💡 API 端点: http://localhost:$PORT/api/price"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "----------------------------------------"

# 启动应用
PORT=$PORT ./bitcoin-tracker