// ゲーム設定
// ==========================================
// 報酬のリンク（すべてクリアした際に表示されます）
// 変更する場合は、このURLを書き換えてください。
const REWARD_LINK = 'https://drive.google.com/drive/folders/16b74_RZlKA4bYrlmo8CsrM0AsI_XjoX3';
// ==========================================

const CONFIG = {
    rewardLink: REWARD_LINK,
    playerRadius: 6,           // プレイヤー（カーソル）のサイズ
    playerHitRadius: 4,        // 判定用のやや厳しいサイズ
    wallColor: '#222233',      // 背景の壁の色 (表示用)
    pathColor: '#111116',      // 道の色 (表示用)
    neonColors: {
        easy: '#39ff14',
        normal: '#00f3ff',
        hard: '#ff00ba'
    },
    goalColor: '#fff',         // ゴールの色
    hitColor: '#ff3333',       // 衝突時の色
    // オフスクリーンキャンバス（当たり判定用）の純粋なカラーコード
    collisionSafeColor: 'rgb(255, 255, 255)', // 道
    collisionGoalColor: 'rgb(0, 255, 0)',     // ゴール
};

// 全クリア状況の保存用
const GameState = {
    clearedStages: {
        easy: false,
        normal: false,
        hard: false
    },
    isAllCleared: function() {
        return this.clearedStages.easy && this.clearedStages.normal && this.clearedStages.hard;
    }
};
