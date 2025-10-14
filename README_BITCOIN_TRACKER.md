# 实时比特币价格追踪器

一个使用 Go 和 WebSocket 技术构建的实时比特币价格追踪 H5 应用。

## 功能特性

- 🚀 **实时价格更新**: 每10秒自动获取最新比特币价格
- 📱 **响应式设计**: 完美适配手机和桌面设备
- 🔄 **自动重连**: WebSocket 断线自动重连机制
- 📊 **24小时变化**: 显示价格涨跌幅度和百分比
- 🎨 **现代化UI**: 美观的渐变设计和动画效果
- ⚡ **高性能**: Go 后端确保高并发处理能力

## 技术栈

- **后端**: Go + Gorilla WebSocket
- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **API**: CoinGecko 加密货币价格 API
- **实时通信**: WebSocket

## 快速开始

### 环境要求

- Go 1.21 或更高版本
- 网络连接（用于获取价格数据）

### 安装依赖

```bash
go mod tidy
```

### 运行应用

```bash
go run main.go
```

服务器将在 `http://localhost:8080` 启动。

### 访问应用

在浏览器中打开 `http://localhost:8080` 即可查看实时比特币价格。

## 项目结构

```
bitcoin-tracker/
├── main.go              # 主服务器文件
├── go.mod              # Go 模块文件
├── static/             # 静态文件目录
│   └── index.html      # H5 前端页面
└── README_BITCOIN_TRACKER.md    # 项目说明
```

## API 接口

### WebSocket 端点

- **URL**: `/ws`
- **协议**: WebSocket
- **数据格式**: JSON

#### 消息格式

```json
{
  "price": 65432.10,
  "change_24h": 2.45,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 配置选项

可以在 `main.go` 中修改以下配置：

- **更新频率**: 修改 `time.NewTicker(10 * time.Second)` 中的时间间隔
- **服务器端口**: 修改 `:8080` 为其他端口
- **API 源**: 可替换为其他加密货币价格 API

## 部署说明

### 本地部署

1. 克隆项目
2. 安装依赖: `go mod tidy`
3. 运行: `go run main.go`

### 生产部署

1. 编译二进制文件:
   ```bash
   go build -o bitcoin-tracker main.go
   ```

2. 运行二进制文件:
   ```bash
   ./bitcoin-tracker
   ```

### Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o bitcoin-tracker main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/bitcoin-tracker .
COPY --from=builder /app/static ./static
EXPOSE 8080
CMD ["./bitcoin-tracker"]
```

构建和运行:
```bash
docker build -t bitcoin-tracker .
docker run -p 8080:8080 bitcoin-tracker
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 移动端浏览器

## 性能优化

- 使用 Gorilla WebSocket 库提供高性能 WebSocket 支持
- 客户端自动重连机制，确保连接稳定性
- 响应式设计，减少不必要的DOM操作
- 合理的API调用频率，避免被限流

## 故障排除

### 常见问题

1. **无法连接到价格API**
   - 检查网络连接
   - 确认 CoinGecko API 可访问性

2. **WebSocket 连接失败**
   - 检查防火墙设置
   - 确认端口8080未被占用

3. **页面显示异常**
   - 清除浏览器缓存
   - 检查浏览器控制台错误信息

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 实现基本的实时价格追踪功能
- 支持 WebSocket 实时通信
- 响应式 H5 界面