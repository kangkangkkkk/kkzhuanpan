// 幸运大转盘应用
class LuckyWheel {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spinBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.addOptionBtn = document.getElementById('addOptionBtn');
        this.optionInput = document.getElementById('optionInput');
        this.colorPicker = document.getElementById('colorPicker');
        this.colorHex = document.getElementById('colorHex');
        this.spinDuration = document.getElementById('spinDuration');
        this.durationValue = document.getElementById('durationValue');
        this.spinPower = document.getElementById('spinPower');
        this.powerValue = document.getElementById('powerValue');
        this.optionsList = document.getElementById('optionsList');
        this.optionCount = document.getElementById('optionCount');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.historyList = document.getElementById('historyList');
        this.resultModal = document.getElementById('resultModal');
        this.winnerText = document.getElementById('winnerText');
        this.spinAgainBtn = document.getElementById('spinAgainBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.closeModal = document.querySelector('.close-modal');

        // Wheel properties
        this.options = [
            { text: '免费披萨', color: '#FF6B6B' },
            { text: '咖啡券', color: '#4ECDC4' },
            { text: '电影票', color: '#FFD166' },
            { text: '亚马逊礼品卡', color: '#06D6A0' },
            { text: '休假一天', color: '#118AB2' },
            { text: '神秘奖品', color: '#9D50BB' }
        ];
        this.currentColor = '#FF6B6B';
        this.isSpinning = false;
        this.rotation = 0;
        this.spinTimeout = null;
        this.history = [];

        // Initialize
        this.init();
    }

    init() {
        // Set up color picker
        this.colorPicker.value = this.currentColor;
        this.colorHex.textContent = this.currentColor;
        this.colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.colorHex.textContent = this.currentColor;
        });

        // Set up sliders
        this.spinDuration.addEventListener('input', (e) => {
            this.durationValue.textContent = e.target.value;
        });

        this.spinPower.addEventListener('input', (e) => {
            this.powerValue.textContent = e.target.value;
        });

        // Set up buttons
        this.spinBtn.addEventListener('click', () => this.spinWheel());
        this.resetBtn.addEventListener('click', () => this.resetOptions());
        this.addOptionBtn.addEventListener('click', () => this.addOption());
        this.optionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addOption();
        });

        // Modal buttons
        this.spinAgainBtn.addEventListener('click', () => {
            this.closeModalFunc();
            setTimeout(() => this.spinWheel(), 300);
        });

        this.closeModalBtn.addEventListener('click', () => this.closeModalFunc());
        this.closeModal.addEventListener('click', () => this.closeModalFunc());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.resultModal) this.closeModalFunc();
        });

        // Initialize options list and wheel
        this.renderOptionsList();
        this.drawWheel();

        // Initialize Sortable for drag and drop
        this.initSortable();

        // Configure toastr
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-top-right',
            timeOut: 3000
        };
    }

    // Draw the wheel on canvas
    drawWheel() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Draw inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#0f0c29';
        ctx.fill();

        // Draw segments
        const segmentCount = this.options.length;
        const segmentAngle = (2 * Math.PI) / segmentCount;

        this.options.forEach((option, index) => {
            const startAngle = index * segmentAngle + this.rotation;
            const endAngle = (index + 1) * segmentAngle + this.rotation;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = option.color;
            ctx.fill();

            // Draw segment border
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Poppins';
            ctx.fillText(option.text, radius - 30, 5);
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ff9800';
        ctx.stroke();
    }

    // Render options list
    renderOptionsList() {
        this.optionsList.innerHTML = '';
        this.optionCount.textContent = this.options.length;

        this.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.dataset.index = index;
            optionElement.style.borderLeftColor = option.color;

            optionElement.innerHTML = `
                <div class="option-color" style="background-color: ${option.color}"></div>
                <div class="option-text">${option.text}</div>
                <div class="option-actions">
                    <button class="edit-option" title="编辑选项"><i class="fas fa-edit"></i></button>
                    <button class="delete-option" title="删除选项"><i class="fas fa-trash"></i></button>
                </div>
            `;

            this.optionsList.appendChild(optionElement);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.option-item').dataset.index);
                this.deleteOption(index);
            });
        });

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.option-item').dataset.index);
                this.editOption(index);
            });
        });
    }

    // Initialize drag and drop sorting
    initSortable() {
        new Sortable(this.optionsList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                // Reorder options array based on new order
                const newOrder = [];
                const items = this.optionsList.querySelectorAll('.option-item');
                items.forEach(item => {
                    const index = parseInt(item.dataset.index);
                    newOrder.push(this.options[index]);
                });
                this.options = newOrder;
                this.drawWheel();
                this.renderOptionsList();
                toastr.success('选项重新排序成功！');
            }
        });
    }

    // Add a new option
    addOption() {
        const text = this.optionInput.value.trim();
        if (!text) {
            toastr.error('请输入选项文本');
            return;
        }

        if (this.options.length >= 12) {
            toastr.warning('最多允许12个选项');
            return;
        }

        this.options.push({
            text: text,
            color: this.currentColor
        });

        this.optionInput.value = '';
        this.drawWheel();
        this.renderOptionsList();
        toastr.success(`选项"${text}"已添加`);
    }

    // Delete an option
    deleteOption(index) {
        if (this.options.length <= 2) {
            toastr.error('至少需要2个选项');
            return;
        }

        const deletedOption = this.options.splice(index, 1)[0];
        this.drawWheel();
        this.renderOptionsList();
        toastr.info(`选项"${deletedOption.text}"已删除`);
    }

    // Edit an option
    editOption(index) {
        const newText = prompt('编辑选项文本：', this.options[index].text);
        if (newText && newText.trim()) {
            this.options[index].text = newText.trim();
            this.drawWheel();
            this.renderOptionsList();
            toastr.success('选项已更新');
        }
    }

    // Reset options to default
    resetOptions() {
        if (confirm('重置所有选项为默认值？此操作无法撤销。')) {
            this.options = [
                { text: '免费披萨', color: '#FF6B6B' },
                { text: '咖啡券', color: '#4ECDC4' },
                { text: '电影票', color: '#FFD166' },
                { text: '亚马逊礼品卡', color: '#06D6A0' },
                { text: '休假一天', color: '#118AB2' },
                { text: '神秘奖品', color: '#9D50BB' }
            ];
            this.drawWheel();
            this.renderOptionsList();
            toastr.success('选项已重置为默认值');
        }
    }

    // Spin the wheel
    spinWheel() {
        if (this.isSpinning) {
            toastr.warning('转盘已在旋转中！');
            return;
        }

        if (this.options.length < 2) {
            toastr.error('请至少添加2个选项以旋转');
            return;
        }

        // Disable spin button
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 旋转中...';

        // Calculate spin parameters
        const duration = parseFloat(this.spinDuration.value) * 1000; // Convert to ms
        const power = parseInt(this.spinPower.value);
        const extraRotations = 5 + power; // More power = more rotations
        const segmentAngle = (2 * Math.PI) / this.options.length;

        // Randomly select winning segment
        const winningIndex = Math.floor(Math.random() * this.options.length);

        // Calculate target rotation so that the selected segment's center aligns with the pointer (top)
        const startRotation = this.rotation;

        // Helper function for proper modulo with floating point numbers
        const mod = (x, y) => ((x % y) + y) % y;

        // Angle where the winning segment's center should be (at pointer position -π/2)
        const targetSegmentCenter = winningIndex * segmentAngle + segmentAngle / 2;

        // We want: (targetSegmentCenter + finalRotation) ≡ -π/2 (mod 2π)
        // So finalRotation ≡ -π/2 - targetSegmentCenter (mod 2π)
        const targetRotationMod = mod(-Math.PI/2 - targetSegmentCenter, 2 * Math.PI);

        // Current rotation (mod 2π)
        const currentRotationMod = mod(startRotation, 2 * Math.PI);

        // Minimum rotation needed (mod 2π) to reach target
        let rotationDeltaMod = mod(targetRotationMod - currentRotationMod, 2 * Math.PI);

        // Add extra full rotations for visual effect
        const totalRotationDelta = rotationDeltaMod + (extraRotations * 2 * Math.PI);

        // Animate the spin
        const startTime = Date.now();
        // startRotation is already defined above

        const animateSpin = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth deceleration
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOut(progress);

            this.rotation = startRotation + (totalRotationDelta * easedProgress);
            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                this.onSpinComplete();
            }
        };

        requestAnimationFrame(animateSpin);
    }

    // Calculate winning index based on current rotation
    getWinningIndexFromRotation() {
        const segmentCount = this.options.length;
        const segmentAngle = (2 * Math.PI) / segmentCount;

        // Pointer is at top (-π/2 radians)
        const pointerAngle = -Math.PI / 2;

        // Helper function for proper modulo
        const mod = (x, y) => ((x % y) + y) % y;

        // Calculate relative angle between pointer and wheel rotation
        // Normalize to [0, 2π) range
        const relativeAngle = mod(pointerAngle - this.rotation, 2 * Math.PI);

        // Calculate which segment contains this angle
        const winningIndex = Math.floor(relativeAngle / segmentAngle) % segmentCount;
        return winningIndex;
    }

    // Handle spin completion
    onSpinComplete() {
        this.isSpinning = false;
        this.spinBtn.disabled = false;
        this.spinBtn.innerHTML = '<i class="fas fa-play"></i> 旋转转盘';

        // Calculate actual winning index based on final rotation
        const actualWinningIndex = this.getWinningIndexFromRotation();
        const winningOption = this.options[actualWinningIndex];

        // Update result display
        this.resultDisplay.innerHTML = `
            <div>
                <h3 style="color: ${winningOption.color}">${winningOption.text}</h3>
                <p>恭喜！您赢得了<strong>${winningOption.text}</strong>奖品！</p>
            </div>
        `;

        // Add to history
        const historyItem = {
            option: winningOption.text,
            color: winningOption.color,
            time: new Date().toLocaleTimeString()
        };

        this.history.unshift(historyItem);
        if (this.history.length > 5) this.history.pop();

        this.updateHistoryList();

        // Show modal
        this.showResultModal(winningOption);

        // Launch confetti
        this.launchConfetti();

        // Play success sound (optional)
        this.playSuccessSound();
    }

    // Update history list
    updateHistoryList() {
        this.historyList.innerHTML = '';

        if (this.history.length === 0) {
            this.historyList.innerHTML = '<li>暂无旋转记录</li>';
            return;
        }

        this.history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong style="color: ${item.color}">${item.option}</strong>
                <span style="float: right; font-size: 0.9em; opacity: 0.7;">${item.time}</span>
            `;
            this.historyList.appendChild(li);
        });
    }

    // Show result modal
    showResultModal(winningOption) {
        this.winnerText.textContent = `您赢得了：${winningOption.text}！`;
        this.winnerText.style.color = winningOption.color;
        this.resultModal.style.display = 'flex';

        // Add some animation to modal
        document.querySelector('.winner-icon').style.animation = 'bounce 1s infinite alternate';
    }

    // Close modal
    closeModalFunc() {
        this.resultModal.style.display = 'none';
    }

    // Launch confetti effect
    launchConfetti() {
        const container = document.getElementById('confetti-container');
        container.innerHTML = '';

        const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#9D50BB', '#FF8A00', '#E52E71'];

        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 15 + 5 + 'px';
            confetti.style.height = Math.random() * 15 + 5 + 'px';
            confetti.style.opacity = '1';
            container.appendChild(confetti);

            // Animate confetti
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 1000,
                easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
            });

            // Remove element after animation
            animation.onfinish = () => confetti.remove();
        }
    }

    // Play success sound
    playSuccessSound() {
        // Create a simple success sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Audio context not supported, silently fail
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const wheel = new LuckyWheel();

    // Make wheel globally available for debugging
    window.wheel = wheel;

    // Display welcome message
    setTimeout(() => {
        toastr.success('幸运大转盘已加载！添加选项并开始旋转吧！');
    }, 1000);
});