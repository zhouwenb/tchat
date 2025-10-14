package main

import (
	"bitcoin-tracker/internal/api"
	"bitcoin-tracker/internal/handler"
	"bitcoin-tracker/internal/websocket"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// 设置 Gin 模式
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建价格服务 (使用 CoinGecko API)
	priceService := api.NewCoinGeckoPriceService()

	// 创建 WebSocket 集线器
	hub := websocket.NewHub(priceService)
	go hub.Run()

	// 创建处理器
	h := handler.NewHandler(priceService, hub)

	// 创建 Gin 路由器
	router := gin.Default()

	// 设置静态文件服务
	router.Static("/static", "./web/static")
	router.LoadHTMLGlob("web/templates/*")

	// 设置路由
	router.GET("/", h.Home)
	router.GET("/api/price", h.GetPrice)
	router.GET("/ws", h.WebSocket)
	router.GET("/health", h.HealthCheck)

	// 添加 CORS 中间件
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// 获取端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 比特币价格追踪器启动中...")
	log.Printf("📊 服务器运行在: http://localhost:%s", port)
	log.Printf("🔗 WebSocket 端点: ws://localhost:%s/ws", port)
	log.Printf("💡 API 端点: http://localhost:%s/api/price", port)
	log.Printf("❤️  健康检查: http://localhost:%s/health", port)

	// 启动服务器
	if err := router.Run(":" + port); err != nil {
		log.Fatal("启动服务器失败:", err)
	}
}