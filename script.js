class PomodoroTimer {
    constructor() {
        // 计时器状态
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'work';
        this.timeLeft = 25 * 60; // 默认25分钟，以秒为单位
        this.totalTime = 25 * 60;
        this.sessionCount = 1;
        this.completedPomodoros = 0;
        this.totalFocusTime = 0;
        this.totalBreakTime = 0;
        
        // 计时器间隔ID
        this.timerInterval = null;
        
        // 设置
        this.settings = {
            workTime: 25,
            shortBreakTime: 5,
            longBreakTime: 15,
            soundEnabled: true
        };
        
        // DOM元素
        this.initElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化进度环
        this.initProgressRing();
        
        // 加载保存的数据
        this.loadData();
        
        // 更新显示
        this.updateDisplay();
        
        // 请求通知权限
        this.requestNotificationPermission();
    }
    
    initElements() {
        // 计时器显示
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        
        // 控制按钮
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // 模式按钮
        this.modeBtns = document.querySelectorAll('.mode-btn');
        
        // 设置输入
        this.workTimeInput = document.getElementById('workTime');
        this.shortBreakTimeInput = document.getElementById('shortBreakTime');
        this.longBreakTimeInput = document.getElementById('longBreakTime');
        this.soundEnabledInput = document.getElementById('soundEnabled');
        
        // 统计显示
        this.completedPomodorosDisplay = document.getElementById('completedPomodoros');
        this.totalFocusTimeDisplay = document.getElementById('totalFocusTime');
        this.totalBreakTimeDisplay = document.getElementById('totalBreakTime');
        
        // 进度环
        this.progressRing = document.querySelector('.progress-ring__progress');
        this.timerCircle = document.querySelector('.timer-circle');
        
        // 通知
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
    }
    
    bindEvents() {
        // 控制按钮事件
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // 模式切换事件
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                const time = parseInt(e.target.dataset.time);
                this.switchMode(mode, time);
            });
        });
        
        // 设置变更事件
        this.workTimeInput.addEventListener('change', () => {
            this.settings.workTime = parseInt(this.workTimeInput.value);
            this.updateModeButtons();
            this.saveData();
            if (this.currentMode === 'work' && !this.isRunning) {
                this.setTime(this.settings.workTime);
            }
        });
        
        this.shortBreakTimeInput.addEventListener('change', () => {
            this.settings.shortBreakTime = parseInt(this.shortBreakTimeInput.value);
            this.updateModeButtons();
            this.saveData();
            if (this.currentMode === 'shortBreak' && !this.isRunning) {
                this.setTime(this.settings.shortBreakTime);
            }
        });
        
        this.longBreakTimeInput.addEventListener('change', () => {
            this.settings.longBreakTime = parseInt(this.longBreakTimeInput.value);
            this.updateModeButtons();
            this.saveData();
            if (this.currentMode === 'longBreak' && !this.isRunning) {
                this.setTime(this.settings.longBreakTime);
            }
        });
        
        this.soundEnabledInput.addEventListener('change', () => {
            this.settings.soundEnabled = this.soundEnabledInput.checked;
            this.saveData();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            } else if (e.code === 'KeyR' && e.ctrlKey) {
                e.preventDefault();
                this.reset();
            }
        });
        
        // 页面可见性变化事件
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isRunning) {
                // 页面重新可见时更新显示
                this.updateDisplay();
            }
        });
    }
    
    initProgressRing() {
        const radius = 140;
        this.circumference = 2 * Math.PI * radius;
        this.progressRing.style.strokeDasharray = this.circumference;
        this.progressRing.style.strokeDashoffset = this.circumference;
    }
    
    updateModeButtons() {
        this.modeBtns.forEach(btn => {
            const mode = btn.dataset.mode;
            if (mode === 'work') {
                btn.dataset.time = this.settings.workTime;
                btn.innerHTML = `<i class="fas fa-briefcase"></i> 工作 (${this.settings.workTime}分钟)`;
            } else if (mode === 'shortBreak') {
                btn.dataset.time = this.settings.shortBreakTime;
                btn.innerHTML = `<i class="fas fa-coffee"></i> 短休息 (${this.settings.shortBreakTime}分钟)`;
            } else if (mode === 'longBreak') {
                btn.dataset.time = this.settings.longBreakTime;
                btn.innerHTML = `<i class="fas fa-couch"></i> 长休息 (${this.settings.longBreakTime}分钟)`;
            }
        });
    }
    
    start() {
        if (this.isPaused) {
            // 从暂停状态恢复
            this.isPaused = false;
            this.isRunning = true;
        } else {
            // 开始新的计时
            this.isRunning = true;
        }
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> 运行中...';
        
        // 添加脉冲动画
        this.timerCircle.classList.add('pulse');
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }
    
    pause() {
        this.isRunning = false;
        this.isPaused = true;
        
        clearInterval(this.timerInterval);
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
        
        // 移除脉冲动画
        this.timerCircle.classList.remove('pulse');
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timerInterval);
        
        // 重置时间
        if (this.currentMode === 'work') {
            this.setTime(this.settings.workTime);
        } else if (this.currentMode === 'shortBreak') {
            this.setTime(this.settings.shortBreakTime);
        } else if (this.currentMode === 'longBreak') {
            this.setTime(this.settings.longBreakTime);
        }
        
        // 重置按钮状态
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> 开始';
        
        // 移除脉冲动画
        this.timerCircle.classList.remove('pulse');
        
        this.updateDisplay();
    }
    
    complete() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timerInterval);
        
        // 更新统计
        if (this.currentMode === 'work') {
            this.completedPomodoros++;
            this.totalFocusTime += this.totalTime / 60;
            this.sessionCount++;
        } else {
            this.totalBreakTime += this.totalTime / 60;
        }
        
        // 保存数据
        this.saveData();
        
        // 显示通知
        this.showNotification();
        
        // 播放声音
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        // 浏览器通知
        this.showBrowserNotification();
        
        // 自动切换到下一个模式
        this.autoSwitchMode();
        
        // 重置按钮状态
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> 开始';
        
        // 移除脉冲动画
        this.timerCircle.classList.remove('pulse');
        
        this.updateDisplay();
        this.updateStats();
    }
    
    autoSwitchMode() {
        if (this.currentMode === 'work') {
            // 工作结束，切换到休息
            if (this.completedPomodoros % 4 === 0) {
                // 每4个番茄后长休息
                this.switchMode('longBreak', this.settings.longBreakTime);
            } else {
                // 短休息
                this.switchMode('shortBreak', this.settings.shortBreakTime);
            }
        } else {
            // 休息结束，切换到工作
            this.switchMode('work', this.settings.workTime);
        }
    }
    
    switchMode(mode, time) {
        if (this.isRunning) {
            return; // 运行中不允许切换模式
        }
        
        this.currentMode = mode;
        this.setTime(time);
        
        // 更新模式按钮状态
        this.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 更新进度环颜色
        this.updateProgressRingColor();
        
        this.updateDisplay();
    }
    
    setTime(minutes) {
        this.timeLeft = minutes * 60;
        this.totalTime = minutes * 60;
    }
    
    updateDisplay() {
        // 更新时间显示
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新会话类型
        const typeText = {
            'work': '工作时间',
            'shortBreak': '短休息',
            'longBreak': '长休息'
        };
        this.sessionType.textContent = typeText[this.currentMode];
        
        // 更新会话计数
        this.sessionCountDisplay.textContent = this.sessionCount;
        
        // 更新进度环
        this.updateProgressRing();
        
        // 更新页面标题
        document.title = `${this.timeDisplay.textContent} - ${typeText[this.currentMode]} - 番茄钟`;
    }
    
    updateProgressRing() {
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const offset = this.circumference - (progress * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }
    
    updateProgressRingColor() {
        const colors = {
            'work': '#ff6b6b',
            'shortBreak': '#4ecdc4',
            'longBreak': '#45b7d1'
        };
        this.progressRing.style.stroke = colors[this.currentMode];
    }
    
    updateStats() {
        this.completedPomodorosDisplay.textContent = this.completedPomodoros;
        this.totalFocusTimeDisplay.textContent = Math.round(this.totalFocusTime);
        this.totalBreakTimeDisplay.textContent = Math.round(this.totalBreakTime);
    }
    
    showNotification() {
        const messages = {
            'work': '工作时间结束！该休息一下了 🎉',
            'shortBreak': '短休息结束！继续专注工作 💪',
            'longBreak': '长休息结束！准备好新的挑战 🚀'
        };
        
        this.notificationText.textContent = messages[this.currentMode];
        this.notification.classList.add('show', 'shake');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
            setTimeout(() => {
                this.notification.classList.remove('shake');
            }, 500);
        }, 3000);
    }
    
    playNotificationSound() {
        // 创建音频上下文播放提示音
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('音频播放失败:', error);
        }
    }
    
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    }
    
    showBrowserNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const messages = {
                'work': '工作时间结束！该休息一下了',
                'shortBreak': '短休息结束！继续专注工作',
                'longBreak': '长休息结束！准备好新的挑战'
            };
            
            const notification = new Notification('番茄钟提醒', {
                body: messages[this.currentMode],
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff6b6b"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">🍅</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff6b6b"/></svg>'
            });
            
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }
    
    saveData() {
        const data = {
            completedPomodoros: this.completedPomodoros,
            totalFocusTime: this.totalFocusTime,
            totalBreakTime: this.totalBreakTime,
            sessionCount: this.sessionCount,
            settings: this.settings,
            date: new Date().toDateString()
        };
        
        localStorage.setItem('pomodoroData', JSON.stringify(data));
    }
    
    loadData() {
        const savedData = localStorage.getItem('pomodoroData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // 检查是否是今天的数据
            if (data.date === new Date().toDateString()) {
                this.completedPomodoros = data.completedPomodoros || 0;
                this.totalFocusTime = data.totalFocusTime || 0;
                this.totalBreakTime = data.totalBreakTime || 0;
                this.sessionCount = data.sessionCount || 1;
            }
            
            // 加载设置
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }
        }
        
        // 更新设置输入框
        this.workTimeInput.value = this.settings.workTime;
        this.shortBreakTimeInput.value = this.settings.shortBreakTime;
        this.longBreakTimeInput.value = this.settings.longBreakTime;
        this.soundEnabledInput.checked = this.settings.soundEnabled;
        
        // 更新模式按钮
        this.updateModeButtons();
        
        // 设置初始时间
        this.setTime(this.settings.workTime);
        
        // 更新统计显示
        this.updateStats();
    }
}

// 页面加载完成后初始化番茄钟
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    
    // 全局错误处理
    window.addEventListener('error', (e) => {
        console.error('发生错误:', e.error);
    });
    
    // 添加一些额外的用户体验改进
    
    // 防止意外刷新
    window.addEventListener('beforeunload', (e) => {
        if (timer.isRunning) {
            e.preventDefault();
            e.returnValue = '计时器正在运行，确定要离开吗？';
            return e.returnValue;
        }
    });
    
    // 添加快捷键提示
    const shortcuts = document.createElement('div');
    shortcuts.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1000;
    `;
    shortcuts.innerHTML = `
        <div><strong>快捷键:</strong></div>
        <div>空格键 - 开始/暂停</div>
        <div>Ctrl+R - 重置</div>
    `;
    document.body.appendChild(shortcuts);
    
    // 鼠标悬停显示快捷键
    let shortcutTimeout;
    document.addEventListener('mousemove', () => {
        shortcuts.style.opacity = '1';
        clearTimeout(shortcutTimeout);
        shortcutTimeout = setTimeout(() => {
            shortcuts.style.opacity = '0';
        }, 3000);
    });
});