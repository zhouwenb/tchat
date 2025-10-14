package websocket

import (
	"bitcoin-tracker/internal/api"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源，生产环境应该限制
	},
}

// Client WebSocket 客户端
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// Hub WebSocket 集线器
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	priceService api.PriceService
	mutex      sync.RWMutex
}

// NewHub 创建新的 WebSocket 集线器
func NewHub(priceService api.PriceService) *Hub {
	return &Hub{
		clients:      make(map[*Client]bool),
		broadcast:    make(chan []byte),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		priceService: priceService,
	}
}

// Run 运行 WebSocket 集线器
func (h *Hub) Run() {
	// 启动价格更新协程
	go h.startPriceUpdater()

	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("客户端已连接，当前连接数: %d", len(h.clients))
			
			// 立即发送当前价格给新连接的客户端
			go h.sendCurrentPrice(client)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mutex.Unlock()
			log.Printf("客户端已断开，当前连接数: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// startPriceUpdater 启动价格更新器
func (h *Hub) startPriceUpdater() {
	ticker := time.NewTicker(5 * time.Second) // 每5秒更新一次价格
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			price, err := h.priceService.GetBitcoinPrice()
			if err != nil {
				log.Printf("获取比特币价格失败: %v", err)
				continue
			}

			data, err := json.Marshal(price)
			if err != nil {
				log.Printf("序列化价格数据失败: %v", err)
				continue
			}

			h.broadcast <- data
		}
	}
}

// sendCurrentPrice 向特定客户端发送当前价格
func (h *Hub) sendCurrentPrice(client *Client) {
	price, err := h.priceService.GetBitcoinPrice()
	if err != nil {
		log.Printf("获取当前价格失败: %v", err)
		return
	}

	data, err := json.Marshal(price)
	if err != nil {
		log.Printf("序列化当前价格失败: %v", err)
		return
	}

	select {
	case client.send <- data:
	default:
		close(client.send)
		h.mutex.Lock()
		delete(h.clients, client)
		h.mutex.Unlock()
	}
}

// HandleWebSocket 处理 WebSocket 连接
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket 升级失败: %v", err)
		return
	}

	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

// readPump 读取客户端消息
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket 错误: %v", err)
			}
			break
		}
	}
}

// writePump 向客户端写入消息
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 批量发送队列中的其他消息
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}