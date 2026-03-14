class CollisionChecker {
    constructor(game) {
        this.game = game;
        this.offscreenCanvas = document.getElementById('offscreenCanvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }

    resize(width, height) {
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
    }

    clear() {
        // オフスクリーンを真っ黒（壁の扱い）でクリア
        this.offscreenCtx.fillStyle = 'rgb(0, 0, 0)';
        this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

    // 衝突判定用のマップを描画
    drawCollisionMap(stage) {
        this.clear();

        // 道を白で描画
        this.offscreenCtx.lineCap = 'round';
        this.offscreenCtx.lineJoin = 'round';

        stage.paths.forEach(segment => {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(segment.x1, segment.y1);
            this.offscreenCtx.lineTo(segment.x2, segment.y2);
            this.offscreenCtx.lineWidth = segment.thickness;
            this.offscreenCtx.strokeStyle = 'rgb(255, 255, 255)';
            this.offscreenCtx.stroke();
        });

        // 動く障害物を黒で上書き（道の上に描画されるため）
        stage.obstacles.forEach(obs => {
            this.offscreenCtx.fillStyle = 'rgb(0, 0, 0)'; // 障害物は壁と同じ
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            this.offscreenCtx.fill();
        });

        // ゴールを緑で描画
        const goal = stage.goal;
        this.offscreenCtx.fillStyle = 'rgb(0, 255, 0)';
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
        this.offscreenCtx.fill();
    }

    // 指定座標（プレイヤーの位置）が安全か判定
    // 戻り値: 'wall', 'safe', 'goal'
    checkPoint(x, y) {
        // キャンバス外は直ちにアウト
        if (x < 0 || y < 0 || x >= this.offscreenCanvas.width || y >= this.offscreenCanvas.height) {
            return 'wall';
        }

        const radius = CONFIG.playerHitRadius;

        // 判定は少し余裕を持たせるか、複数点を見る。
        // ここではプレイヤーの周囲4点＋中心をチェックする厳密な判定を実施
        const points = [
            { px: x, py: y },
            { px: x + radius, py: y },
            { px: x - radius, py: y },
            { px: x, py: y + radius },
            { px: x, py: y - radius }
        ];

        let touchedGoal = false;

        for (let p of points) {
            if (p.px < 0 || p.py < 0 || p.px >= this.offscreenCanvas.width || p.py >= this.offscreenCanvas.height) {
                return 'wall';
            }
            const pixelData = this.offscreenCtx.getImageData(p.px, p.py, 1, 1).data;
            const r = pixelData[0];
            const g = pixelData[1];
            const b = pixelData[2];

            // 黒（rgb=0,0,0）は即アウト
            if (r === 0 && g === 0 && b === 0) {
                return 'wall';
            }

            // 緑があればゴールフラグを立てるが、壁に当たっていないか最後まで確認
            if (g === 255 && r === 0 && b === 0) {
                touchedGoal = true;
            }
        }

        return touchedGoal ? 'goal' : 'safe';
    }
}
