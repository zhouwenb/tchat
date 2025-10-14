class BitcoinTracker {
    constructor() {
        this.ws = null;
        this.chart = null;
        this.priceHistory = [];
        this.maxHistoryLength = 100;
        this.lastPrice = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.initializeElements();
        this.initializeChart();
        this.connectWebSocket();
        this.bindEvents();
    }

    initializeElements() {
        // 获取DOM元素
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),
            currentPrice: document.getElementById('currentPrice'),
            changeAmount: document.getElementById('changeAmount'),
            changePercent: document.getElementById('changePercent'),
            priceChange: document.getElementById('priceChange'),
            volume24h: document.getElementById('volume24h'),
            lastUpdated: document.getElementById('lastUpdated'),
            marketPrice: document.getElementById('marketPrice'),
            marketChange: document.getElementById('marketChange'),
            high24h: document.getElementById('high24h'),
            low24h: document.getElementById('low24h'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            errorToast: document.getElementById('errorToast'),
            errorMessage: document.getElementById('errorMessage'),
            chartButtons: document.querySelectorAll('.chart-btn')
        };
    }

    initializeChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'BTC 价格 (USDT)',
                    data: [],
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#f7931a',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#f7931a',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return '时间: ' + context[0].label;
                            },
                            label: function(context) {
                                return '价格: $' + parseFloat(context.parsed.y).toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#7f8c8d',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#7f8c8d',
                            callback: function(value) {
                                return '$' + parseFloat(value).toLocaleString();
                            }
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket 连接已建立');
                this.updateConnectionStatus(true);
                this.hideLoading();
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.updatePriceData(data);
                } catch (error) {
                    console.error('解析消息失败:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket 连接已关闭');
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                this.showError('连接服务器失败，请检查网络连接');
            };
            
        } catch (error) {
            console.error('创建 WebSocket 连接失败:', error);
            this.showError('无法连接到服务器');
            this.hideLoading();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            this.showError('连接服务器失败，请刷新页面重试');
        }
    }

    updateConnectionStatus(connected) {
        if (connected) {
            this.elements.statusDot.className = 'status-dot connected';
            this.elements.statusText.textContent = '已连接';
        } else {
            this.elements.statusDot.className = 'status-dot disconnected';
            this.elements.statusText.textContent = '连接断开';
        }
    }

    updatePriceData(data) {
        try {
            const price = parseFloat(data.price_float);
            const change24h = parseFloat(data.change_24h);
            const changePercent = parseFloat(data.change_percent);
            
            // 更新当前价格
            this.elements.currentPrice.textContent = `$${price.toLocaleString()}`;
            
            // 价格变化动画
            if (this.lastPrice > 0) {
                if (price > this.lastPrice) {
                    this.elements.currentPrice.className = 'current-price price-up';
                } else if (price < this.lastPrice) {
                    this.elements.currentPrice.className = 'current-price price-down';
                }
                
                setTimeout(() => {
                    this.elements.currentPrice.className = 'current-price';
                }, 500);
            }
            
            this.lastPrice = price;
            
            // 更新价格变化
            const changeAmountText = change24h >= 0 ? `+$${Math.abs(change24h).toFixed(2)}` : `-$${Math.abs(change24h).toFixed(2)}`;
            const changePercentText = changePercent >= 0 ? `(+${changePercent.toFixed(2)}%)` : `(${changePercent.toFixed(2)}%)`;
            
            this.elements.changeAmount.textContent = changeAmountText;
            this.elements.changePercent.textContent = changePercentText;
            
            // 更新颜色
            const isPositive = change24h >= 0;
            this.elements.changeAmount.className = `change-amount ${isPositive ? 'positive' : 'negative'}`;
            this.elements.changePercent.className = `change-percent ${isPositive ? 'positive' : 'negative'}`;
            
            // 更新成交量
            const volume = parseFloat(data.volume_24h);
            this.elements.volume24h.textContent = `$${this.formatLargeNumber(volume)}`;
            
            // 更新最后更新时间
            const updateTime = new Date(data.timestamp).toLocaleTimeString('zh-CN');
            this.elements.lastUpdated.textContent = `更新于 ${updateTime}`;
            
            // 更新市场信息
            this.elements.marketPrice.textContent = `$${price.toLocaleString()}`;
            this.elements.marketChange.textContent = changePercentText;
            this.elements.marketChange.className = `info-value ${isPositive ? 'positive' : 'negative'}`;
            
            // 添加到价格历史
            this.addToPriceHistory(price, new Date(data.timestamp));
            
        } catch (error) {
            console.error('更新价格数据失败:', error);
        }
    }

    addToPriceHistory(price, timestamp) {
        this.priceHistory.push({
            price: price,
            timestamp: timestamp
        });
        
        // 限制历史数据长度
        if (this.priceHistory.length > this.maxHistoryLength) {
            this.priceHistory.shift();
        }
        
        this.updateChart();
    }

    updateChart() {
        const labels = this.priceHistory.map(item => 
            item.timestamp.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );
        
        const prices = this.priceHistory.map(item => item.price);
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.update('none');
    }

    formatLargeNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }

    bindEvents() {
        // 图表时间段按钮
        this.elements.chartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 移除所有活动状态
                this.elements.chartButtons.forEach(btn => btn.classList.remove('active'));
                // 添加活动状态到当前按钮
                e.target.classList.add('active');
                
                const period = e.target.dataset.period;
                this.changeChartPeriod(period);
            });
        });

        // 页面可见性变化处理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时暂停连接
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    console.log('页面隐藏，暂停 WebSocket');
                }
            } else {
                // 页面显示时恢复连接
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    console.log('页面显示，恢复 WebSocket 连接');
                    this.connectWebSocket();
                }
            }
        });

        // 网络状态变化处理
        window.addEventListener('online', () => {
            console.log('网络已连接');
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.connectWebSocket();
            }
        });

        window.addEventListener('offline', () => {
            console.log('网络已断开');
            this.showError('网络连接已断开');
        });
    }

    changeChartPeriod(period) {
        console.log(`切换图表时间段: ${period}`);
        // 这里可以实现不同时间段的数据获取逻辑
        // 目前只是示例，实际应用中需要从服务器获取历史数据
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorToast.classList.add('show');
        
        // 5秒后自动隐藏
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.elements.errorToast.classList.remove('show');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    showLoading() {
        this.elements.loadingOverlay.classList.remove('hidden');
    }
}

// 全局错误处理函数
function hideError() {
    document.getElementById('errorToast').classList.remove('show');
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('比特币价格追踪器正在启动...');
    window.bitcoinTracker = new BitcoinTracker();
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 拒绝:', event.reason);
});