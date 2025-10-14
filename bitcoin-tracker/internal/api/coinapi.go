package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// BitcoinPrice 比特币价格数据结构
type BitcoinPrice struct {
	Symbol      string    `json:"symbol"`
	Price       string    `json:"price"`
	PriceFloat  float64   `json:"price_float"`
	Change24h   string    `json:"change_24h"`
	ChangePercent string  `json:"change_percent"`
	Volume24h   string    `json:"volume_24h"`
	Timestamp   time.Time `json:"timestamp"`
}

// BinanceResponse Binance API 响应结构
type BinanceResponse struct {
	Symbol             string `json:"symbol"`
	Price              string `json:"price"`
	PriceChange        string `json:"priceChange"`
	PriceChangePercent string `json:"priceChangePercent"`
	Volume             string `json:"volume"`
}

// CoinGeckoResponse CoinGecko API 响应结构
type CoinGeckoResponse struct {
	Bitcoin struct {
		USD                   float64 `json:"usd"`
		USD24hChange          float64 `json:"usd_24h_change"`
		USD24hVol             float64 `json:"usd_24h_vol"`
		LastUpdatedAt         int64   `json:"last_updated_at"`
	} `json:"bitcoin"`
}

// PriceService 价格服务接口
type PriceService interface {
	GetBitcoinPrice() (*BitcoinPrice, error)
}

// BinancePriceService Binance 价格服务
type BinancePriceService struct {
	client *http.Client
}

// NewBinancePriceService 创建新的 Binance 价格服务
func NewBinancePriceService() *BinancePriceService {
	return &BinancePriceService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetBitcoinPrice 从 Binance API 获取比特币价格
func (s *BinancePriceService) GetBitcoinPrice() (*BitcoinPrice, error) {
	url := "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
	
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("请求 Binance API 失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Binance API 返回错误状态: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}

	var binanceResp BinanceResponse
	if err := json.Unmarshal(body, &binanceResp); err != nil {
		return nil, fmt.Errorf("解析 JSON 失败: %v", err)
	}

	// 转换价格为浮点数
	var priceFloat float64
	if _, err := fmt.Sscanf(binanceResp.Price, "%f", &priceFloat); err != nil {
		return nil, fmt.Errorf("解析价格失败: %v", err)
	}

	return &BitcoinPrice{
		Symbol:        "BTCUSDT",
		Price:         binanceResp.Price,
		PriceFloat:    priceFloat,
		Change24h:     binanceResp.PriceChange,
		ChangePercent: binanceResp.PriceChangePercent,
		Volume24h:     binanceResp.Volume,
		Timestamp:     time.Now(),
	}, nil
}

// CoinGeckoPriceService CoinGecko 价格服务
type CoinGeckoPriceService struct {
	client *http.Client
}

// NewCoinGeckoPriceService 创建新的 CoinGecko 价格服务
func NewCoinGeckoPriceService() *CoinGeckoPriceService {
	return &CoinGeckoPriceService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetBitcoinPrice 从 CoinGecko API 获取比特币价格
func (s *CoinGeckoPriceService) GetBitcoinPrice() (*BitcoinPrice, error) {
	url := "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true"
	
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("请求 CoinGecko API 失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CoinGecko API 返回错误状态: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}

	var coinGeckoResp CoinGeckoResponse
	if err := json.Unmarshal(body, &coinGeckoResp); err != nil {
		return nil, fmt.Errorf("解析 JSON 失败: %v", err)
	}

	return &BitcoinPrice{
		Symbol:        "BTC",
		Price:         fmt.Sprintf("%.2f", coinGeckoResp.Bitcoin.USD),
		PriceFloat:    coinGeckoResp.Bitcoin.USD,
		Change24h:     fmt.Sprintf("%.2f", coinGeckoResp.Bitcoin.USD24hChange),
		ChangePercent: fmt.Sprintf("%.2f", coinGeckoResp.Bitcoin.USD24hChange),
		Volume24h:     fmt.Sprintf("%.0f", coinGeckoResp.Bitcoin.USD24hVol),
		Timestamp:     time.Unix(coinGeckoResp.Bitcoin.LastUpdatedAt, 0),
	}, nil
}