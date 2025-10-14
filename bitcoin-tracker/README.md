# 🚀 比特币价格追踪器

一个使用 Go 语言开发的实时比特币价格追踪 H5 应用，支持 WebSocket 实时数据推送和响应式设计。

## ✨ 功能特性

- 🔄 **实时价格更新**: 通过 WebSocket 实现每5秒自动更新比特币价格
- 📊 **价格图表**: 使用 Chart.js 展示价格趋势图表
- 📱 **响应式设计**: 完美适配桌面端和移动端设备
- 🎨 **现代化 UI**: 采用毛玻璃效果和渐变背景的现代化界面
- 🔌 **自动重连**: WebSocket 连接断开时自动尝试重连
- 📈 **市场数据**: 显示24小时价格变化、成交量等市场信息
- 🌐 **多数据源**: 支持 Binance 和 CoinGecko API

## 🛠️ 技术栈

### 后端
- **Go 1.21+**: 主要编程语言
- **Gin**: Web 框架
- **Gorilla WebSocket**: WebSocket 支持
- **Binance API**: 加密货币价格数据源

### 前端
- **HTML5/CSS3**: 页面结构和样式
- **JavaScript ES6+**: 交互逻辑
- **Chart.js**: 图表绘制
- **WebSocket API**: 实时数据连接

## 🚀 快速开始

### 环境要求

- Go 1.21 或更高版本
- 网络连接（用于获取价格数据）

### 安装和运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd bitcoin-tracker
   ```

2. **安装依赖**
   ```bash
   go mod tidy
   ```

3. **运行应用**
   ```bash
   go run cmd/main.go
   ```

4. **访问应用**
   打开浏览器访问: http://localhost:8080

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `8080` |
| `GIN_MODE` | Gin 运行模式 | `release` |

## 📁 项目结构

```
bitcoin-tracker/
├── cmd/
│   └── main.go                 # 主程序入口
├── internal/
│   ├── api/
│   │   └── coinapi.go         # 加密货币 API 接口
│   ├── handler/
│   │   └── handler.go         # HTTP 处理器
│   └── websocket/
│       └── hub.go             # WebSocket 集线器
├── web/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css      # 样式文件
│   │   └── js/
│   │       ├── app.js         # 主要 JavaScript 逻辑
│   │       └── chart.min.js   # Chart.js 库
│   └── templates/
│       └── index.html         # HTML 模板
├── go.mod                     # Go 模块文件
└── README.md                  # 项目说明
```

## 🔌 API 端点

### HTTP 端点

- `GET /` - 主页面
- `GET /api/price` - 获取当前比特币价格
- `GET /health` - 健康检查
- `GET /static/*` - 静态文件服务

### WebSocket 端点

- `WS /ws` - WebSocket 连接，实时价格数据推送

### 价格数据格式

```json
{
  "symbol": "BTCUSDT",
  "price": "45000.00",
  "price_float": 45000.00,
  "change_24h": "1200.50",
  "change_percent": "2.74",
  "volume_24h": "1234567890.00",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 界面特性

### 响应式设计
- 桌面端: 完整功能展示
- 平板端: 适配中等屏幕
- 手机端: 优化移动体验

### 视觉效果
- 毛玻璃背景效果
- 渐变色彩方案
- 价格变化动画
- 连接状态指示器
- 加载动画

### 交互功能
- 实时价格更新
- 价格变化高亮
- 图表时间段切换
- 错误提示系统
- 自动重连机制

## 🔧 开发说明

### 添加新的价格数据源

1. 在 `internal/api/coinapi.go` 中实现 `PriceService` 接口
2. 在 `cmd/main.go` 中切换价格服务实现

### 自定义更新频率

在 `internal/websocket/hub.go` 中修改 `startPriceUpdater` 函数的 ticker 间隔。

### 扩展图表功能

在 `web/static/js/app.js` 中的 `changeChartPeriod` 方法中添加历史数据获取逻辑。

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :8080
   # 或使用其他端口
   PORT=8081 go run cmd/main.go
   ```

2. **API 请求失败**
   - 检查网络连接
   - 确认防火墙设置
   - 验证 API 端点可访问性

3. **WebSocket 连接失败**
   - 检查浏览器控制台错误信息
   - 确认服务器正常运行
   - 验证网络代理设置

## 📈 性能优化

- WebSocket 连接池管理
- 价格数据缓存
- 图表数据限制 (最多100个数据点)
- 页面可见性检测
- 自动重连机制

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

- [Binance API](https://binance-docs.github.io/apidocs/) - 价格数据源
- [Chart.js](https://www.chartjs.org/) - 图表库
- [Gin](https://gin-gonic.com/) - Go Web 框架
- [Gorilla WebSocket](https://github.com/gorilla/websocket) - WebSocket 支持

---

**注意**: 本项目仅用于教育和演示目的，不构成投资建议。加密货币投资有风险，请谨慎决策。