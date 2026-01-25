// 游戏配置文件
const GameConfig = {
    // 调试模式
    DEBUG: false,
    // 画布设置
    CANVAS_WIDTH: 1920,
    CANVAS_HEIGHT: 1080,
    
    // 游戏设置
    FPS: 60,
    SCALE: 1,
    
    // 地图尺寸 - 缩小地图
    MAP_WIDTH: 1200,
    MAP_HEIGHT: 900,
    
    // 玩家设置 - 极速移动
    PLAYER: {
        SPEED: 25,
        HEALTH: 100,
        RADIUS: 20,
        ROTATION_SPEED: 0.3,
        SPRINT_MULTIPLIER: 3.2,
        // 人物真实感参数
        ANIMATION_SPEED: 0.15,
        STEP_FREQUENCY: 0.3,
        BREATHING_RATE: 0.1,
        STAMINA: 120,
        STAMINA_DRAIN_RATE: 8,
        STAMINA_RECOVER_RATE: 25,
        // 第一人称视角参数
        ADS_SPEED: 0.15,
        HEAD_BOB_INTENSITY: 8,
        RECOIL_RECOVERY_SPEED: 0.1,
        // 背包系统
        INVENTORY_SIZE: 20,
        SEARCH_RANGE: 50,
        SEARCH_TIME: 2000
    },
    
    // 武器设置
    WEAPONS: {
        PISTOL: {
            DAMAGE: 25,
            FIRE_RATE: 300,
            RELOAD_TIME: 1500,
            MAGAZINE_SIZE: 12,
            TOTAL_AMMO: 60,
            BULLET_SPEED: 15,
            SPREAD: 0.05,
            RECOIL: 0.1,
            INFINITE_AMMO: false
        },
        RIFLE: {
            DAMAGE: 45,
            FIRE_RATE: 120,
            RELOAD_TIME: 2500,
            MAGAZINE_SIZE: 30,
            TOTAL_AMMO: 90,
            BULLET_SPEED: 20,
            SPREAD: 0.02,
            RECOIL: 0.15,
            INFINITE_AMMO: false
        },
        SNIPER: {
            DAMAGE: 120,
            FIRE_RATE: 1500,
            RELOAD_TIME: 3000,
            MAGAZINE_SIZE: 5,
            TOTAL_AMMO: 20,
            BULLET_SPEED: 30,
            SPREAD: 0.001,
            RECOIL: 0.3,
            INFINITE_AMMO: false
        },
        // 新增无限弹药武器
        MACHINE_GUN: {
            DAMAGE: 35,
            FIRE_RATE: 80,
            RELOAD_TIME: 0,
            MAGAZINE_SIZE: 100,
            TOTAL_AMMO: 999999,
            BULLET_SPEED: 18,
            SPREAD: 0.08,
            RECOIL: 0.25,
            INFINITE_AMMO: true
        },
        LASER_RIFLE: {
            DAMAGE: 60,
            FIRE_RATE: 200,
            RELOAD_TIME: 0,
            MAGAZINE_SIZE: 50,
            TOTAL_AMMO: 999999,
            BULLET_SPEED: 40,
            SPREAD: 0.001,
            RECOIL: 0.05,
            INFINITE_AMMO: true
        },
        SHOTGUN: {
            DAMAGE: 15,
            FIRE_RATE: 600,
            RELOAD_TIME: 2000,
            MAGAZINE_SIZE: 8,
            TOTAL_AMMO: 40,
            BULLET_SPEED: 12,
            SPREAD: 0.2,
            RECOIL: 0.4,
            PELLETS: 8,
            INFINITE_AMMO: false
        }
    },
    
    // 敌人设置 - 提升速度保持挑战性
    ENEMY: {
        HEALTH: 60,
        SPEED: 5,
        DAMAGE: 20,
        ATTACK_RANGE: 180,
        DETECTION_RANGE: 350,
        RADIUS: 18,
        PATROL_SPEED: 4,
        CHASE_SPEED: 7,
        ATTACK_COOLDOWN: 600,
        // 增加敌人密度
        SPAWN_COUNT: [15, 25] // 适当减少敌人数量以适应小地图
    },
    
    // 地图设置 - 缩小到屏幕范围内
    MAP: {
        TILE_SIZE: 40, // 减小地块尺寸
        GRID_WIDTH: 24, // 24格 (960px宽)
        GRID_HEIGHT: 18, // 18格 (720px高)
        WALL_COLOR: '#2c3e50',
        FLOOR_COLOR: '#34495e',
        ITEM_COLOR: '#ffaa00',
        // 更真实的场景元素
        ROOM_COUNT: [3, 5], // 房间数量
        COVER_DENSITY: 20, // 掩体密度
        OBSTACLE_DENSITY: 12, // 障碍物密度
        CORRIDOR_COUNT: [2, 3] // 走廊数量
    },
    
    // 物品设置
    ITEMS: {
        WEAPON: { SIZE: 30, COLOR: '#ff6600' },
        AMMO: { SIZE: 15, COLOR: '#ffff00' },
        MEDKIT: { SIZE: 20, COLOR: '#00ff00' },
        LOOT: { SIZE: 25, COLOR: '#0099ff' }
    },
    
    // UI设置
    UI: {
        MINIMAP_SCALE: 0.1,
        MINIMAP_SIZE: 200,
        INVENTORY_SLOTS: 60,
        EQUIPMENT_SLOTS: 3
    },
    
    // 撤离设置
    EXTRACTION: {
        ZONE_SIZE: 100,
        EXTRACTION_TIME: 10000, // 10秒
        WARNING_TIME: 3000     // 3秒
    },
    
    // 物理设置
    PHYSICS: {
        GRAVITY: 0.5,
        FRICTION: 0.9,
        BOUNCE: 0.7
    }
};

// 游戏状态
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    EXTRACTION: 'extraction',
    VICTORY: 'victory'
};

// 输入键位
const Keys = {
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD',
    SHIFT: 'ShiftLeft',
    SPACE: 'Space',
    R: 'KeyR',
    I: 'KeyI',
    TAB: 'Tab',
    ESCAPE: 'Escape',
    ONE: 'Digit1',
    TWO: 'Digit2',
    THREE: 'Digit3'
};

// 鼠标按钮
const MouseButtons = {
    LEFT: 0,
    RIGHT: 2,
    MIDDLE: 1
};

// 朝向
const Directions = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP_LEFT: { x: -0.707, y: -0.707 },
    UP_RIGHT: { x: 0.707, y: -0.707 },
    DOWN_LEFT: { x: -0.707, y: 0.707 },
    DOWN_RIGHT: { x: 0.707, y: 0.707 }
};