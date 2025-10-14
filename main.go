package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// BitcoinPrice 比特币价格结构
type BitcoinPrice struct {
	Price     float64   `json:"price"`
	Change24h float64   `json:"change_24h"`
	Timestamp time.Time `json:"timestamp"`
}

// CoinGeckoResponse CoinGecko API 响应结构
type CoinGeckoResponse struct {
	Bitcoin struct {
		USD           float64 `json:"usd"`
		USD24hChange  float64 `json:"usd_24h_change"`
	} `json:"bitcoin"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许跨域
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan BitcoinPrice)

func main() {
	// 静态文件服务
	http.Handle("/", http.FileServer(http.Dir("./static/")))
	
	// WebSocket 端点
	http.HandleFunc("/ws", handleWebSocket)
	
	// 启动价格更新协程
	go handlePriceUpdates()
	
	// 启动广播协程
	go handleBroadcast()
	
	fmt.Println("服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket 升级失败: %v", err)
		return
	}
	defer conn.Close()
	
	clients[conn] = true
	
	// 发送当前价格
	currentPrice, err := fetchBitcoinPrice()
	if err == nil {
		conn.WriteJSON(currentPrice)
	}
	
	// 保持连接
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket 读取错误: %v", err)
			delete(clients, conn)
			break
		}
	}
}

func handlePriceUpdates() {
	ticker := time.NewTicker(10 * time.Second) // 每10秒更新一次
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			price, err := fetchBitcoinPrice()
			if err != nil {
				log.Printf("获取价格失败: %v", err)
				continue
			}
			broadcast <- price
		}
	}
}

func handleBroadcast() {
	for {
		price := <-broadcast
		for client := range clients {
			err := client.WriteJSON(price)
			if err != nil {
				log.Printf("WebSocket 写入错误: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func fetchBitcoinPrice() (BitcoinPrice, error) {
	resp, err := http.Get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
	if err != nil {
		return BitcoinPrice{}, err
	}
	defer resp.Body.Close()
	
	var coinGeckoResp CoinGeckoResponse
	if err := json.NewDecoder(resp.Body).Decode(&coinGeckoResp); err != nil {
		return BitcoinPrice{}, err
	}
	
	return BitcoinPrice{
		Price:     coinGeckoResp.Bitcoin.USD,
		Change24h: coinGeckoResp.Bitcoin.USD24hChange,
		Timestamp: time.Now(),
	}, nil
}