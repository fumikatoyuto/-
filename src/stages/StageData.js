const StageData = {
    easy: {
        themeColor: CONFIG.neonColors.easy,
        startPos: { x: 100, y: 100 },
        goal: { x: 700, y: 500, radius: 40 }, // 少し大きめのゴール
        paths: [
            { x1: 100, y1: 100, x2: 300, y2: 100, thickness: 80 },
            { x1: 300, y1: 100, x2: 300, y2: 300, thickness: 80 },
            { x1: 300, y1: 300, x2: 700, y2: 300, thickness: 80 },
            { x1: 700, y1: 300, x2: 700, y2: 500, thickness: 80 }
        ],
        obstacles: [
            // 動く障害物なし
        ]
    },
    normal: {
        themeColor: CONFIG.neonColors.normal,
        startPos: { x: 100, y: 500 },
        goal: { x: 700, y: 100, radius: 30 },
        paths: [
            { x1: 100, y1: 500, x2: 400, y2: 500, thickness: 65 },
            { x1: 400, y1: 500, x2: 400, y2: 100, thickness: 65 },
            { x1: 400, y1: 100, x2: 700, y2: 100, thickness: 65 }
        ],
        obstacles: [
            // 上下に動く障害物
            { x: 400, y: 300, radius: 10, baseX: 400, baseY: 300, moveAxis: 'y', range: 150, speed: 1.5 }
        ]
    },
    hard: {
        themeColor: CONFIG.neonColors.hard,
        startPos: { x: 100, y: 300 },
        goal: { x: 700, y: 300, radius: 25 },
        paths: [
            { x1: 100, y1: 300, x2: 250, y2: 100, thickness: 25 },
            { x1: 250, y1: 100, x2: 400, y2: 300, thickness: 25 },
            { x1: 400, y1: 300, x2: 550, y2: 500, thickness: 25 },
            { x1: 550, y1: 500, x2: 700, y2: 300, thickness: 25 }
        ],
        obstacles: [
            // 狭い道に多数の動く障害物
            { x: 250, y: 100, radius: 8, baseX: 250, baseY: 100, moveAxis: 'x', range: 50, speed: 3 },
            { x: 400, y: 300, radius: 8, baseX: 400, baseY: 300, moveAxis: 'x', range: 80, speed: 4 },
            { x: 550, y: 500, radius: 8, baseX: 550, baseY: 500, moveAxis: 'x', range: 50, speed: 3 }
        ]
    }
};

// スケーリングロジック（ウィンドウサイズに応じてパスを自動調整）
function getScaledStage(difficulty, width, height) {
    const baseWidth = 800;
    const baseHeight = 600;

    // 画面中央に配置＆画面に合わせてスケール
    const scale = Math.min(width / baseWidth, height / baseHeight) * 0.8;
    const offsetX = (width - baseWidth * scale) / 2;
    const offsetY = (height - baseHeight * scale) / 2;

    const data = JSON.parse(JSON.stringify(StageData[difficulty])); // Deep copy

    data.startPos.x = data.startPos.x * scale + offsetX;
    data.startPos.y = data.startPos.y * scale + offsetY;

    data.goal.x = data.goal.x * scale + offsetX;
    data.goal.y = data.goal.y * scale + offsetY;
    data.goal.radius *= scale;

    data.paths.forEach(p => {
        p.x1 = p.x1 * scale + offsetX;
        p.y1 = p.y1 * scale + offsetY;
        p.x2 = p.x2 * scale + offsetX;
        p.y2 = p.y2 * scale + offsetY;
        p.thickness *= scale;
    });

    data.obstacles.forEach(o => {
        o.baseX = o.baseX * scale + offsetX;
        o.baseY = o.baseY * scale + offsetY;
        o.x = o.baseX;
        o.y = o.baseY;
        o.radius *= scale;
        o.range *= scale;
    });

    return data;
}
