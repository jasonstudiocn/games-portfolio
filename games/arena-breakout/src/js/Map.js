// 地图类
class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = GameConfig.MAP.TILE_SIZE;
        this.gridWidth = GameConfig.MAP.GRID_WIDTH; // 使用配置中的网格大小
        this.gridHeight = GameConfig.MAP.GRID_HEIGHT;
        
        // 确保实际地图尺寸与配置一致
        this.width = this.gridWidth * this.tileSize;
        this.height = this.gridHeight * this.tileSize;
        
        // 地图网格
        this.grid = [];
        this.walls = [];
        this.items = [];
        this.containers = [];
        this.extractionZones = [];
        this.spawnPoints = {
            player: [],
            enemies: []
        };
        
        // 初始化地图
        this.init();
    }
    
    // 初始化地图
    init() {
        this.generateGrid();
        this.generateWalls();
        this.generateContainers();
        this.generateItems();
        this.generateExtractionZones();
        this.generateSpawnPoints();
    }
    
    // 生成基础网格
    generateGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push({
                    type: 'floor',
                    walkable: true,
                    x: x,
                    y: y
                });
            }
            this.grid.push(row);
        }
    }
    
    // 生成墙壁
    generateWalls() {
        // 外墙
        this.createBorderWalls();
        
        // 内部结构
        this.createInternalStructures();
        
        // 随机障碍物
        this.createRandomObstacles();
    }
    
    // 创建外墙
    createBorderWalls() {
        const wallThickness = 2;
        
        // 上墙
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < wallThickness; y++) {
                this.grid[y][x].type = 'wall';
                this.grid[y][x].walkable = false;
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
            }
        }
        
        // 下墙
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = this.gridHeight - wallThickness; y < this.gridHeight; y++) {
                this.grid[y][x].type = 'wall';
                this.grid[y][x].walkable = false;
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
            }
        }
        
        // 左墙
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < wallThickness; x++) {
                this.grid[y][x].type = 'wall';
                this.grid[y][x].walkable = false;
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
            }
        }
        
        // 右墙
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = this.gridWidth - wallThickness; x < this.gridWidth; x++) {
                this.grid[y][x].type = 'wall';
                this.grid[y][x].walkable = false;
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
            }
        }
    }
    
    // 创建内部结构
    createInternalStructures() {
        // 创建房间
        this.createRooms();
        
        // 创建走廊
        this.createCorridors();
        
        // 创建掩体
        this.createCover();
    }
    
    // 创建房间
    createRooms() {
        const roomCountRange = GameConfig.MAP.ROOM_COUNT;
        const numRooms = Utils.randomInt(roomCountRange[0], roomCountRange[1]);
        
        for (let i = 0; i < numRooms; i++) {
            const roomWidth = Utils.randomInt(3, 8);
            const roomHeight = Utils.randomInt(3, 8);
            const roomX = Utils.randomInt(5, this.gridWidth - roomWidth - 5);
            const roomY = Utils.randomInt(5, this.gridHeight - roomHeight - 5);
            
            // 创建房间墙壁
            for (let y = roomY; y < roomY + roomHeight; y++) {
                for (let x = roomX; x < roomX + roomWidth; x++) {
                    if (x === roomX || x === roomX + roomWidth - 1 ||
                        y === roomY || y === roomY + roomHeight - 1) {
                        if (this.grid[y] && this.grid[y][x]) {
                            this.grid[y][x].type = 'wall';
                            this.grid[y][x].walkable = false;
                            this.walls.push({
                                x: x * this.tileSize,
                                y: y * this.tileSize,
                                width: this.tileSize,
                                height: this.tileSize
                            });
                        }
                    }
                }
            }
        }
    }
    
    // 创建走廊
    createCorridors() {
        const corridorCountRange = GameConfig.MAP.CORRIDOR_COUNT;
        const numCorridors = Utils.randomInt(corridorCountRange[0], corridorCountRange[1]);
        
        for (let i = 0; i < numCorridors; i++) {
            const isHorizontal = Utils.random(0, 1) > 0.5;
            
            if (isHorizontal) {
                const y = Utils.randomInt(5, this.gridHeight - 5);
                const startX = Utils.randomInt(0, this.gridWidth - 10);
                const length = Utils.randomInt(5, 15);
                
                for (let x = startX; x < Math.min(startX + length, this.gridWidth); x++) {
                    if (this.grid[y] && this.grid[y][x]) {
                        this.grid[y][x].type = 'corridor';
                        // 在走廊两侧创建墙壁
                        if (y > 0 && this.grid[y - 1][x].type === 'floor') {
                            this.grid[y - 1][x].type = 'wall';
                            this.grid[y - 1][x].walkable = false;
                        }
                        if (y < this.gridHeight - 1 && this.grid[y + 1][x].type === 'floor') {
                            this.grid[y + 1][x].type = 'wall';
                            this.grid[y + 1][x].walkable = false;
                        }
                    }
                }
            }
        }
    }
    
    // 创建掩体
    createCover() {
        const numCover = Math.floor((this.gridWidth * this.gridHeight) * GameConfig.MAP.COVER_DENSITY / 100);
        
        for (let i = 0; i < numCover; i++) {
            const x = Utils.randomInt(3, this.gridWidth - 3);
            const y = Utils.randomInt(3, this.gridHeight - 3);
            
            // 更真实的掩体类型分布
            const coverTypes = [
                { type: 'concrete_barrier', weight: 30 },
                { type: 'sandbag', weight: 25 },
                { type: 'metal_crate', weight: 20 },
                { type: 'wooden_box', weight: 15 },
                { type: 'vehicle', weight: 10 }
            ];
            
            const coverType = this.weightedRandom(coverTypes);
            
            if (this.grid[y] && this.grid[y][x] && this.grid[y][x].walkable) {
                this.grid[y][x].type = coverType;
                this.grid[y][x].walkable = false;
                
                // 不同掩体有不同的碰撞体积
                const size = this.getCoverSize(coverType);
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: size.width,
                    height: size.height,
                    cover: true,
                    coverType: coverType,
                    destructible: coverType !== 'concrete_barrier'
                });
            }
        }
    }
    
    // 权重随机选择
    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        return items[0].type;
    }
    
    // 获取掩体尺寸
    getCoverSize(coverType) {
        const sizes = {
            'concrete_barrier': { width: this.tileSize, height: this.tileSize * 0.6 },
            'sandbag': { width: this.tileSize * 1.5, height: this.tileSize * 0.4 },
            'metal_crate': { width: this.tileSize * 1.2, height: this.tileSize },
            'wooden_box': { width: this.tileSize, height: this.tileSize * 0.8 },
            'vehicle': { width: this.tileSize * 2, height: this.tileSize * 1.5 }
        };
        return sizes[coverType] || { width: this.tileSize, height: this.tileSize };
    }
    
    // 创建随机障碍物
    createRandomObstacles() {
        const numObstacles = Math.floor((this.gridWidth * this.gridHeight) * GameConfig.MAP.OBSTACLE_DENSITY / 100);
        
        for (let i = 0; i < numObstacles; i++) {
            const x = Utils.randomInt(3, this.gridWidth - 3);
            const y = Utils.randomInt(3, this.gridHeight - 3);
            
            if (this.grid[y] && this.grid[y][x] && this.grid[y][x].walkable) {
                this.grid[y][x].type = 'obstacle';
                this.grid[y][x].walkable = false;
                this.walls.push({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
            }
        }
    }
    
    // 生成容器
    generateContainers() {
        const containerTypes = ['crate', 'locker', 'chest', 'safe'];
        const numContainers = Utils.randomInt(15, 25);
        
        for (let i = 0; i < numContainers; i++) {
            const containerType = containerTypes[Utils.randomInt(0, containerTypes.length - 1)];
            const x = Utils.randomInt(100, this.width - 100);
            const y = Utils.randomInt(100, this.height - 100);
            
            // 确保容器不在墙上
            if (this.isWalkable(x, y)) {
                const container = {
                    type: containerType,
                    position: new Vector2D(x, y),
                    isSearched: false,
                    isSearching: false,
                    searchProgress: 0,
                    searchStartTime: 0,
                    value: this.getContainerValue(containerType),
                    size: this.getContainerSize(containerType)
                };
                
                this.containers.push(container);
                
                // 添加到墙壁列表作为障碍物
                this.walls.push({
                    x: x - container.size.width/2,
                    y: y - container.size.height/2,
                    width: container.size.width,
                    height: container.size.height,
                    container: true
                });
            }
        }
    }
    
    // 获取容器价值
    getContainerValue(containerType) {
        const values = {
            'crate': { min: 50, max: 200 },
            'locker': { min: 100, max: 400 },
            'chest': { min: 200, max: 800 },
            'safe': { min: 500, max: 1500 }
        };
        
        const range = values[containerType];
        return Utils.random(range.min, range.max);
    }
    
    // 获取容器尺寸
    getContainerSize(containerType) {
        const sizes = {
            'crate': { width: 40, height: 40 },
            'locker': { width: 30, height: 60 },
            'chest': { width: 60, height: 40 },
            'safe': { width: 50, height: 50 }
        };
        
        return sizes[containerType] || { width: 40, height: 40 };
    }
    
    // 生成物品
    generateItems() {
        const itemTypes = ['WEAPON', 'AMMO', 'MEDKIT', 'LOOT'];
        const numItems = Utils.randomInt(10, 20); // 减少地面物品
        
        for (let i = 0; i < numItems; i++) {
            const itemIndex = Utils.randomInt(0, itemTypes.length - 1);
            const itemType = itemTypes[itemIndex];
            const x = Utils.randomInt(50, this.width - 50);
            const y = Utils.randomInt(50, this.height - 50);
            
            // 确保物品不在墙上
            if (this.isWalkable(x, y)) {
                this.items.push({
                    type: itemType.toLowerCase(),
                    position: new Vector2D(x, y),
                    collected: false,
                    value: this.getItemValue(itemType.toLowerCase())
                });
            }
        }
    }
    
    // 生成撤离区域
    generateExtractionZones() {
        const numZones = Utils.randomInt(1, 3);
        
        for (let i = 0; i < numZones; i++) {
            const x = Utils.randomInt(100, this.width - 100);
            const y = Utils.randomInt(100, this.height - 100);
            const radius = GameConfig.EXTRACTION.ZONE_SIZE;
            
            this.extractionZones.push({
                position: new Vector2D(x, y),
                radius: radius,
                available: true,
                time: GameConfig.EXTRACTION.EXTRACTION_TIME
            });
        }
    }
    
    // 生成出生点
    generateSpawnPoints() {
        // 玩家出生点
        for (let i = 0; i < 5; i++) {
            const x = Utils.randomInt(50, this.width - 50);
            const y = Utils.randomInt(50, this.height - 50);
            
            if (this.isWalkable(x, y)) {
                this.spawnPoints.player.push(new Vector2D(x, y));
            }
        }
        
        // 敌人出生点
        for (let i = 0; i < 15; i++) {
            const x = Utils.randomInt(50, this.width - 50);
            const y = Utils.randomInt(50, this.height - 50);
            
            if (this.isWalkable(x, y)) {
                this.spawnPoints.enemies.push(new Vector2D(x, y));
            }
        }
    }
    
    // 获取物品价值
    getItemValue(itemType) {
        const itemValues = {
            weapon: { min: 100, max: 500 },
            ammo: { min: 10, max: 50 },
            medkit: { min: 30, max: 100 },
            loot: { min: 20, max: 200 }
        };
        
        const range = itemValues[itemType];
        if (!range) {
            return Utils.random(20, 100); // 默认值
        }
        return Utils.random(range.min, range.max);
    }
    
    // 检查位置是否可行走
    isWalkable(x, y) {
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);
        
        if (gridX < 0 || gridX >= this.gridWidth || 
            gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        
        return this.grid[gridY][gridX].walkable;
    }
    
    // 检查碰撞
    checkCollision(x, y, radius) {
        for (const wall of this.walls) {
            if (this.circleRectCollision(x, y, radius, wall)) {
                return true;
            }
        }
        return false;
    }
    
    // 圆形与矩形碰撞检测
    circleRectCollision(circleX, circleY, radius, rect) {
        const closestX = Utils.clamp(circleX, rect.x, rect.x + rect.width);
        const closestY = Utils.clamp(circleY, rect.y, rect.y + rect.height);
        
        const distanceX = circleX - closestX;
        const distanceY = circleY - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
    }
    
    // 获取随机出生点
    getRandomSpawnPoint(type) {
        const points = this.spawnPoints[type];
        if (points.length === 0) return new Vector2D(this.width / 2, this.height / 2);
        
        if (points.length === 0) return new Vector2D(this.width / 2, this.height / 2);
        return points[Utils.randomInt(0, points.length - 1)];
    }
    
    // 收集物品
    collectItem(item) {
        item.collected = true;
        return item.value;
    }
    
    // 获取附近的物品
    getNearbyItems(position, range) {
        return this.items.filter(item => 
            !item.collected && position.distance(item.position) <= range
        );
    }
    
    // 检查是否在撤离区域
    isInExtractionZone(position) {
        for (const zone of this.extractionZones) {
            if (zone.available && position.distance(zone.position) <= zone.radius) {
                return zone;
            }
        }
        return null;
    }
    
    // 渲染地图
    render(ctx, camera) {
        // 获取视野范围
        const viewBounds = camera.getViewBounds();
        
        // 计算需要渲染的网格范围
        const startX = Math.max(0, Math.floor(viewBounds.left / this.tileSize));
        const endX = Math.min(this.gridWidth, Math.ceil(viewBounds.right / this.tileSize));
        const startY = Math.max(0, Math.floor(viewBounds.top / this.tileSize));
        const endY = Math.min(this.gridHeight, Math.ceil(viewBounds.bottom / this.tileSize));
        
        // 渲染地形
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.grid[y][x];
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;
                const screenPos = camera.worldToScreen(screenX, screenY);
                const screenSize = this.tileSize * camera.zoom;
                
                this.renderTile(ctx, tile, screenPos.x, screenPos.y, screenSize);
            }
        }
        
        // 渲染物品
        this.renderItems(ctx, camera);
        
        // 渲染容器
        this.renderContainers(ctx, camera);
        
        // 渲染撤离区域
        this.renderExtractionZones(ctx, camera);
    }
    
    // 渲染地块
    renderTile(ctx, tile, x, y, size) {
        switch (tile.type) {
            case 'floor':
                // 地板纹理
                ctx.fillStyle = GameConfig.MAP.FLOOR_COLOR;
                ctx.fillRect(x, y, size, size);
                
                // 添加地板纹理
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, size, size);
                break;
                
            case 'wall':
                // 墙壁主体
                ctx.fillStyle = GameConfig.MAP.WALL_COLOR;
                ctx.fillRect(x, y, size, size);
                
                // 墙壁纹理
                ctx.strokeStyle = '#1a252f';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
                
                // 砖块纹理
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i < size; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + i);
                    ctx.lineTo(x + size, y + i);
                    ctx.stroke();
                }
                break;
                
            case 'corridor':
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x, y, size, size);
                // 走廊标记
                ctx.strokeStyle = '#3a3a3a';
                ctx.strokeRect(x, y, size, size);
                break;
                
            case 'concrete_barrier':
                // 混凝土护栏
                ctx.fillStyle = '#808080';
                ctx.fillRect(x, y + size * 0.4, size, size * 0.6);
                ctx.strokeStyle = '#606060';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y + size * 0.4, size, size * 0.6);
                break;
                
            case 'sandbag':
                // 沙袋
                ctx.fillStyle = '#c2b280';
                ctx.beginPath();
                ctx.arc(x + size/2, y + size * 0.6, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#a0826d';
                ctx.stroke();
                break;
                
            case 'metal_crate':
                // 金属箱
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(x, y, size * 1.2, size);
                ctx.strokeStyle = '#4a4a4a';
                ctx.strokeRect(x, y, size * 1.2, size);
                // 金属反光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x + 2, y + 2, size * 0.3, size * 0.3);
                break;
                
            case 'wooden_box':
                // 木箱
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(x, y, size, size * 0.8);
                ctx.strokeStyle = '#654321';
                ctx.strokeRect(x, y, size, size * 0.8);
                // 木纹
                ctx.strokeStyle = '#7a3f0a';
                for (let i = 0; i < size; i += 5) {
                    ctx.beginPath();
                    ctx.moveTo(x + i, y);
                    ctx.lineTo(x + i, y + size * 0.8);
                    ctx.stroke();
                }
                break;
                
            case 'vehicle':
                // 车辆残骸
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(x, y, size * 2, size * 1.5);
                ctx.strokeStyle = '#1a252f';
                ctx.strokeRect(x, y, size * 2, size * 1.5);
                // 车窗
                ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
                ctx.fillRect(x + size * 0.5, y + size * 0.3, size * 0.8, size * 0.4);
                break;
                
            case 'obstacle':
                ctx.fillStyle = '#444444';
                ctx.fillRect(x, y, size, size);
                break;
                
            default:
                ctx.fillStyle = GameConfig.MAP.FLOOR_COLOR;
                ctx.fillRect(x, y, size, size);
        }
    }
    
    // 渲染物品
    renderItems(ctx, camera) {
        for (const item of this.items) {
            if (item.collected) continue;
            
            const screenPos = camera.worldToScreen(item.position.x, item.position.y);
            const itemConfig = GameConfig.ITEMS[item.type.toUpperCase()];
            if (!itemConfig) {
                continue; // 跳过无效的物品类型
            }
            const size = itemConfig.SIZE * camera.zoom;
            
            ctx.fillStyle = itemConfig.COLOR;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加发光效果
            ctx.strokeStyle = itemConfig.COLOR;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // 渲染撤离区域
    renderExtractionZones(ctx, camera) {
        for (const zone of this.extractionZones) {
            if (!zone.available) continue;
            
            const screenPos = camera.worldToScreen(zone.position.x, zone.position.y);
            const radius = zone.radius * camera.zoom;
            
            // 绘制撤离区域
            ctx.strokeStyle = zone.available ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 绘制中心标记
            ctx.fillStyle = zone.available ? '#00ff00' : '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('EX', screenPos.x, screenPos.y + 5);
        }
    }
    
    // 渲染容器
    renderContainers(ctx, camera) {
        for (const container of this.containers) {
            const screenPos = camera.worldToScreen(container.position.x, container.position.y);
            const containerScale = camera.zoom;
            
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.scale(containerScale, containerScale);
            
            // 根据容器类型渲染
            this.renderContainerByType(ctx, container.type, container.size, container.isSearching, container.searchProgress);
            
            ctx.restore();
            
            // 显示搜索进度
            if (container.isSearching && container.searchProgress > 0) {
                this.renderSearchProgress(ctx, screenPos, container.searchProgress, container.size, containerScale);
            }
            
            // 显示价值提示 - 修复camera.target访问
            if (camera.target && 
                Utils.distance(camera.target.x, camera.target.y, container.position.x, container.position.y) < GameConfig.PLAYER.SEARCH_RANGE) {
                this.renderContainerHint(ctx, screenPos, container.value, container.size, containerScale);
            }
        }
    }
    
    // 根据类型渲染容器
    renderContainerByType(ctx, type, size, isSearching, progress) {
        const width = size.width;
        const height = size.height;
        
        switch (type) {
            case 'crate':
                // 木箱
                ctx.fillStyle = isSearching ? '#cc8800' : '#8B4513';
                ctx.fillRect(-width/2, -height/2, width, height);
                
                // 木纹
                ctx.strokeStyle = isSearching ? '#aa6600' : '#654321';
                ctx.lineWidth = 2;
                for (let i = -width/2; i < width/2; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(i, -height/2);
                    ctx.lineTo(i, height/2);
                    ctx.stroke();
                }
                break;
                
            case 'locker':
                // 铁柜
                ctx.fillStyle = isSearching ? '#88aacc' : '#4169E1';
                ctx.fillRect(-width/2, -height/2, width, height);
                
                // 铁柜门线
                ctx.strokeStyle = isSearching ? '#6688aa' : '#1E90FF';
                ctx.lineWidth = 3;
                ctx.strokeRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
                
                // 把手
                ctx.fillStyle = isSearching ? '#ffcc00' : '#FFD700';
                ctx.fillRect(-5, -10, 10, 10);
                break;
                
            case 'chest':
                // 宝箱
                const gradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
                if (isSearching) {
                    gradient.addColorStop(0, '#cc6600');
                    gradient.addColorStop(1, '#ff9900');
                } else {
                    gradient.addColorStop(0, '#8B4513');
                    gradient.addColorStop(1, '#DAA520');
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(-width/2, -height/2, width, height);
                
                // 锁
                ctx.fillStyle = isSearching ? '#ff0000' : '#FF0000';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // 宝箱装饰
                ctx.strokeStyle = isSearching ? '#ffaa00' : '#FFD700';
                ctx.lineWidth = 4;
                ctx.strokeRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
                break;
                
            case 'safe':
                // 保险箱
                ctx.fillStyle = isSearching ? '#666666' : '#2F4F4F';
                ctx.fillRect(-width/2, -height/2, width, height);
                
                // 圆形把手
                ctx.fillStyle = isSearching ? '#ffcc00' : '#C0C0C0';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // 密码盘
                ctx.fillStyle = '#000000';
                ctx.fillRect(-15, -5, 30, 10);
                ctx.strokeStyle = isSearching ? '#ffcc00' : '#888888';
                ctx.lineWidth = 2;
                for (let i = -12; i <= 12; i += 6) {
                    ctx.beginPath();
                    ctx.arc(i, 0, 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
        }
    }
    
    // 渲染搜索进度
    renderSearchProgress(ctx, position, progress, size, scale) {
        const radius = Math.max(size.width, size.height) * scale * 0.8;
        
        // 进度环
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
        ctx.stroke();
        
        // 进度文字
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.floor(progress * 100)}%`, position.x, position.y);
    }
    
    // 渲染容器提示
    renderContainerHint(ctx, position, value, size, scale) {
        const hintY = position.y - size.height * scale / 2 - 20;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const text = `价值: ${Math.floor(value)}`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(position.x - textWidth/2 - 5, hintY - 8, textWidth + 10, 16);
        
        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(position.x - textWidth/2 - 5, hintY - 8, textWidth + 10, 16);
        
        // 文字
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, position.x, hintY);
    }
    
    // 获取地图信息
    getInfo() {
        return {
            width: this.width,
            height: this.height,
            itemCount: this.items.filter(item => !item.collected).length,
            containerCount: this.containers.filter(c => !c.isSearched).length,
            extractionZones: this.extractionZones.length,
            enemySpawns: this.spawnPoints.enemies.length
        };
    }
}