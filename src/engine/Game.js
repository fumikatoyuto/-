class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = new ParticleSystem();
        this.collision = new CollisionChecker(this);

        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER, CLEAR, ALL_CLEAR
        this.difficulty = null;
        this.stage = null;
        this.mouse = { x: 0, y: 0 };
        this.player = { x: 0, y: 0, active: false };
        this.timeStart = 0;
        this.timeCurrent = 0;
        this.timerElement = document.getElementById('hud-timer');

        // UI references
        this.screens = {
            menu: document.getElementById('menu-screen'),
            gameover: document.getElementById('gameover-screen'),
            clear: document.getElementById('clear-screen'),
            allClear: document.getElementById('all-clear-screen')
        };

        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    setupEventListeners() {
        // Buttons
        document.querySelectorAll('.menu-buttons .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.startStage(e.target.dataset.difficulty));
        });

        document.getElementById('btn-retry').addEventListener('click', () => this.startStage(this.difficulty));
        document.getElementById('btn-back-from-fail').addEventListener('click', () => this.showMenu());
        document.getElementById('btn-back-from-clear').addEventListener('click', () => this.showMenu());

        // All Clear Reward Button Setting
        document.getElementById('reward-link').href = CONFIG.rewardLink;

        // Input
        window.addEventListener('mousemove', (e) => this.updateInput(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.updateInput(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
    }

    updateInput(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;

        // ゲーム中で、まだスタート地点にいなくてクリック待ち等の状態管理は今回不要（マウス追跡即開始）
        if (this.state === 'PLAYING') {
            if (!this.player.active) {
                // スタート地点からの距離で開始判定
                const dx = x - this.stage.startPos.x;
                const dy = y - this.stage.startPos.y;
                if (Math.hypot(dx, dy) < 20) {
                    this.player.active = true;
                    this.timeStart = performance.now();
                    this.player.x = x;
                    this.player.y = y;
                    this.timerElement.style.display = 'block';
                }
            } else {
                this.player.x = x;
                this.player.y = y;
            }
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.collision.resize(this.canvas.width, this.canvas.height);

        if (this.state === 'PLAYING') {
            // Resize中の再スケール
            this.stage = getScaledStage(this.difficulty, this.canvas.width, this.canvas.height);
            this.prepareCollisionMap();
        }
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        if (screenName && this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }

    showMenu() {
        this.state = 'MENU';
        this.showScreen('menu');
        this.timerElement.style.display = 'none';
        this.updateMenuButtons();
    }

    updateMenuButtons() {
        // クリア状況をボタンの見た目に反映させる
        if (GameState.clearedStages.easy) document.getElementById('btn-easy').style.boxShadow = `0 0 15px ${CONFIG.neonColors.easy}`;
        if (GameState.clearedStages.normal) document.getElementById('btn-normal').style.boxShadow = `0 0 15px ${CONFIG.neonColors.normal}`;
        if (GameState.clearedStages.hard) document.getElementById('btn-hard').style.boxShadow = `0 0 15px ${CONFIG.neonColors.hard}`;
    }

    startStage(diff) {
        this.difficulty = diff;
        this.stage = getScaledStage(diff, this.canvas.width, this.canvas.height);
        this.state = 'PLAYING';
        this.player.active = false;
        this.player.x = this.stage.startPos.x;
        this.player.y = this.stage.startPos.y;
        this.showScreen(null); // Hide UI
        this.timerElement.style.display = 'none';
        this.prepareCollisionMap();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.player.active = false;
        this.particles.emitExplosion(this.player.x, this.player.y, CONFIG.hitColor);
        setTimeout(() => {
            this.showScreen('gameover');
        }, 1000); // 爆発を見せてから1秒後にUI
    }

    gameClear() {
        this.state = 'CLEAR';
        this.player.active = false;
        const totalTime = ((performance.now() - this.timeStart) / 1000).toFixed(1);

        GameState.clearedStages[this.difficulty] = true;

        if (GameState.isAllCleared()) {
            this.state = 'ALL_CLEAR';
            setTimeout(() => {
                this.showScreen('allClear');
            }, 1000);
        } else {
            setTimeout(() => {
                this.showScreen('clear');
                const p = this.screens.clear.querySelector('p');
                p.innerText = `タイム: ${totalTime}秒\n素晴らしい！`;
            }, 1000);
        }

        // ゴール地点での祝祭花火
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.particles.emitExplosion(this.player.x + (Math.random() - 0.5) * 50, this.player.y + (Math.random() - 0.5) * 50, this.stage.themeColor);
            }, i * 200);
        }
    }

    prepareCollisionMap() {
        this.collision.drawCollisionMap(this.stage); // 静的な障害物と道を描画
    }

    update(dt) {
        this.particles.update(dt);

        if (this.state === 'PLAYING') {
            // 動く障害物の更新
            let obstaclesMoved = false;
            this.stage.obstacles.forEach(obs => {
                const elapsed = performance.now() / 1000;
                if (obs.moveAxis === 'y') {
                    obs.y = obs.baseY + Math.sin(elapsed * obs.speed) * obs.range;
                } else {
                    obs.x = obs.baseX + Math.sin(elapsed * obs.speed) * obs.range;
                }
                obstaclesMoved = true;
            });

            // 障害物が動いていれば当たり判定マップを再生成
            if (obstaclesMoved) {
                this.prepareCollisionMap();
            }

            if (this.player.active) {
                // タイマー更新
                this.timerElement.innerText = `Time: ${((performance.now() - this.timeStart) / 1000).toFixed(1)}s`;

                // プレイヤーの軌跡エフェクト
                if (Math.random() > 0.5) {
                    this.particles.emitTrail(this.player.x, this.player.y, this.stage.themeColor);
                }

                // 衝突判定
                const result = this.collision.checkPoint(this.player.x, this.player.y);
                if (result === 'wall') {
                    this.gameOver();
                } else if (result === 'goal') {
                    this.gameClear();
                }
            }
        }
    }

    draw() {
        this.ctx.fillStyle = CONFIG.wallColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 背景グリッド描画（サイバーパンク感）
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 40) {
            this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke();
        }

        if (this.state === 'PLAYING' || this.state === 'GAMEOVER' || this.state === 'CLEAR' || this.state === 'ALL_CLEAR') {
            this.drawStage();

            if (this.state === 'PLAYING') {
                this.drawPlayer();
            }
        }

        this.particles.draw(this.ctx);
    }

    drawStage() {
        // 道
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.stage.paths.forEach(segment => {
            // Glow effect
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = this.stage.themeColor;

            this.ctx.beginPath();
            this.ctx.moveTo(segment.x1, segment.y1);
            this.ctx.lineTo(segment.x2, segment.y2);
            this.ctx.lineWidth = segment.thickness;
            this.ctx.strokeStyle = CONFIG.pathColor;
            this.ctx.stroke();

            // Inner Neon Line
            this.ctx.shadowBlur = 0;
            this.ctx.lineWidth = segment.thickness - 10;
            this.ctx.strokeStyle = '#22222a'; // 道の中央
            this.ctx.stroke();
        });

        // 障害物
        this.stage.obstacles.forEach(obs => {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = CONFIG.hitColor;
            this.ctx.fillStyle = CONFIG.hitColor;
            this.ctx.beginPath();
            this.ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // ゴール
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = CONFIG.goalColor;
        this.ctx.fillStyle = CONFIG.goalColor;
        this.ctx.beginPath();
        this.ctx.arc(this.stage.goal.x, this.stage.goal.y, this.stage.goal.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // スタート地点
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.stage.themeColor;
        this.ctx.strokeStyle = this.stage.themeColor;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.stage.startPos.x, this.stage.startPos.y, 20, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.shadowBlur = 0; // Reset
    }

    drawPlayer() {
        if (!this.player.active) {
            // アピールエフェクト：スタート地点にホバーを促す
            const pulse = (Math.sin(performance.now() / 200) + 1) / 2;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(this.stage.startPos.x, this.stage.startPos.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.font = '20px Outfit';
            this.ctx.fillStyle = this.stage.themeColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ここをタッチしてスタート', this.stage.startPos.x, this.stage.startPos.y - 40);
        } else {
            // プレイヤー（光るカーソル）
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#fff';
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, CONFIG.playerRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    loop(currentTime) {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// 初期化
window.onload = () => {
    new Game();
};
