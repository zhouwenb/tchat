package handler

import (
	"bitcoin-tracker/internal/api"
	"bitcoin-tracker/internal/websocket"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler HTTP 处理器
type Handler struct {
	priceService api.PriceService
	hub          *websocket.Hub
}

// NewHandler 创建新的处理器
func NewHandler(priceService api.PriceService, hub *websocket.Hub) *Handler {
	return &Handler{
		priceService: priceService,
		hub:          hub,
	}
}

// Home 主页处理器
func (h *Handler) Home(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", gin.H{
		"title": "比特币价格追踪器",
	})
}

// GetPrice 获取当前价格 API
func (h *Handler) GetPrice(c *gin.Context) {
	price, err := h.priceService.GetBitcoinPrice()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取价格失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, price)
}

// WebSocket WebSocket 连接处理器
func (h *Handler) WebSocket(c *gin.Context) {
	h.hub.HandleWebSocket(c.Writer, c.Request)
}

// HealthCheck 健康检查
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"message": "比特币价格追踪器运行正常",
	})
}