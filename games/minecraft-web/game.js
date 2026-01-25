class MinecraftGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = {};
        this.blocks = new THREE.Group();
        this.chunkGroup = new THREE.Group();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedBlock = 'grass';
        this.isPointerLocked = false;
        
        // 相机控制 - 我的世界风格
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.sneak = false;
        this.sprint = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = true;
        this.flyMode = false;
        
        // 性能监控
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.fps = 60;
        this.lastTime = performance.now();
        
        // 渲染距离优化
        this.renderDistance = 50;
        this.chunkSize = 16;
        this.chunks = new Map();
        
        // 方块材质
        this.blockMaterials = null;
        
        // 鼠标灵敏度
        this.mouseSensitivity = 0.002;
        this.invertY = false;
        
        // 玩家属性
        this.playerHeight = 1.8;
        this.playerWidth = 0.6;
        this.eyeHeight = 1.62;
        this.walkSpeed = 4.317;
        this.sprintSpeed = 5.612;
        this.jumpVelocity = 0.42;
        
        // 物理属性
        this.gravity = 0.08;
        this.friction = 0.91;
        
        // 破坏和放置距离
        this.reachDistance = 4.5;
        
        // 玩家模型
        this.player = null;
        this.playerBody = null;
        this.playerHead = null;
        this.playerArms = [];
        this.playerLegs = [];
        
        this.init();
    }
    
    createBlockMaterials() {
        return {
            grass: {
                top: new THREE.MeshLambertMaterial({ color: 0x7CFC00 }),
                bottom: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
                sides: new THREE.MeshLambertMaterial({ color: 0x90EE90 })
            },
            stone: {
                all: new THREE.MeshLambertMaterial({ color: 0x8B8682 })
            },
            wood: {
                top: new THREE.MeshLambertMaterial({ color: 0x8B6969 }),
                bottom: new THREE.MeshLambertMaterial({ color: 0x8B6969 }),
                sides: new THREE.MeshLambertMaterial({ color: 0x654321 })
            },
            dirt: {
                all: new THREE.MeshLambertMaterial({ color: 0x8B7355 })
            },
            leaves: {
                all: new THREE.MeshLambertMaterial({ 
                    color: 0x228B22, 
                    transparent: true, 
                    opacity: 0.8,
                    side: THREE.DoubleSide
                })
            },
            water: {
                all: new THREE.MeshLambertMaterial({ 
                    color: 0x4169E1, 
                    transparent: true, 
                    opacity: 0.7,
                    side: THREE.DoubleSide
                })
            },
            sand: {
                all: new THREE.MeshLambertMaterial({ color: 0xF4A460 })
            },
            brick: {
                all: new THREE.MeshLambertMaterial({ color: 0xB22222 })
            },
            glass: {
                all: new THREE.MeshLambertMaterial({ 
                    color: 0xE6F3FF, 
                    transparent: true, 
                    opacity: 0.3,
                    side: THREE.DoubleSide
                })
            },
            gold: {
                all: new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            },
            cobblestone: {
                all: new THREE.MeshLambertMaterial({ color: 0x696969 })
            }
        };
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createControls();
        this.createPlayer();
        this.generateWorld();
        this.clearPlayerArea();
        this.setPlayerStartPosition();
        this.animate();
        
        document.getElementById('loading').style.display = 'none';
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
        this.scene.add(this.blocks);
        this.scene.add(this.chunkGroup);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.05,
            this.renderDistance * 2
        );
        this.camera.position.set(0, 10, 0);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);
    }
    
    createPlayer() {
        this.player = new THREE.Group();
        
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0x0066CC });
        const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0x3B3B3B });
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x3B2317 });
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.playerHead = new THREE.Mesh(headGeometry, skinMaterial);
        this.playerHead.position.set(0, this.eyeHeight + 0.4, 0);
        this.player.add(this.playerHead);
        
        const hairGeometry = new THREE.BoxGeometry(0.82, 0.3, 0.82);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, this.eyeHeight + 0.75, 0);
        this.player.add(hair);
        
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.4);
        this.playerBody = new THREE.Mesh(bodyGeometry, shirtMaterial);
        this.playerBody.position.set(0, this.eyeHeight - 0.2, 0);
        this.player.add(this.playerBody);
        
        const armGeometry = new THREE.BoxGeometry(0.3, 1.3, 0.3);
        
        const leftArm = new THREE.Mesh(armGeometry, shirtMaterial);
        leftArm.position.set(-0.55, this.eyeHeight - 0.2, 0);
        this.player.add(leftArm);
        this.playerArms.push(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, shirtMaterial);
        rightArm.position.set(0.55, this.eyeHeight - 0.2, 0);
        this.player.add(rightArm);
        this.playerArms.push(rightArm);
        
        const legGeometry = new THREE.BoxGeometry(0.35, 1.3, 0.35);
        
        const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        leftLeg.position.set(-0.2, this.eyeHeight - 1.6, 0);
        this.player.add(leftLeg);
        this.playerLegs.push(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
        rightLeg.position.set(0.2, this.eyeHeight - 1.6, 0);
        this.player.add(rightLeg);
        this.playerLegs.push(rightLeg);
        
        const shoeGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
        
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(-0.2, this.eyeHeight - 2.2, 0);
        this.player.add(leftShoe);
        
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(0.2, this.eyeHeight - 2.2, 0);
        this.player.add(rightShoe);
        
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const leftEye = new THREE.Mesh(eyeGeometry, new THREE.MeshLambertMaterial({ color: 0x000000 }));
        leftEye.position.set(-0.15, this.eyeHeight + 0.45, 0.41);
        this.playerHead.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, new THREE.MeshLambertMaterial({ color: 0x000000 }));
        rightEye.position.set(0.15, this.eyeHeight + 0.45, 0.41);
        this.playerHead.add(rightEye);
        
        const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
        const mouth = new THREE.Mesh(mouthGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        mouth.position.set(0, this.eyeHeight + 0.25, 0.41);
        this.playerHead.add(mouth);
        
        this.player.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.player.visible = true;
        this.scene.add(this.player);
        
        this.createThirdPersonCamera();
    }
    
    createThirdPersonCamera() {
        this.thirdPersonOffset = new THREE.Vector3(0, 2, 3);
        const initialOffset = this.thirdPersonOffset.clone();
        this.camera.position.add(initialOffset);
    }
    
    createBlockGeometry(materials) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        if (materials.top || materials.bottom || materials.sides) {
            const materialsArray = [
                materials.sides || materials.all,
                materials.sides || materials.all,
                materials.top || materials.all,
                materials.bottom || materials.all,
                materials.sides || materials.all,
                materials.sides || materials.all
            ];
            return { geometry, materials: materialsArray };
        }
        
        return { geometry, materials: materials.all };
    }
    
    createBlock(x, y, z, type) {
        if (!this.blockMaterials) {
            this.blockMaterials = this.createBlockMaterials();
        }
        
        const materials = this.blockMaterials[type];
        if (!materials) {
            return null;
        }
        
        const { geometry, materials: blockMaterials } = this.createBlockGeometry(materials);
        
        const block = new THREE.Mesh(geometry, blockMaterials);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type: type, position: { x, y, z } };
        
        this.blocks.add(block);
        this.world[`${x},${y},${z}`] = block;
        
        return block;
    }
    
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.world[key]) {
            this.blocks.remove(this.world[key]);
            delete this.world[key];
        }
    }
    
    generateWorld() {
        const worldSize = 15;
        const height = 5;
        
        for (let x = -worldSize; x <= worldSize; x++) {
            for (let z = -worldSize; z <= worldSize; z++) {
                const noise = this.generateTerrainNoise(x, z);
                const terrainHeight = Math.floor(noise * 3 + height);
                
                for (let y = 0; y <= terrainHeight; y++) {
                    let blockType = 'stone';
                    
                    if (y === terrainHeight) {
                        blockType = 'grass';
                    } else if (y >= terrainHeight - 2) {
                        blockType = 'dirt';
                    }
                    
                    this.createBlock(x, y, z, blockType);
                }
                
                if (Math.random() > 0.98 && terrainHeight > 3) {
                    this.generateTree(x, terrainHeight + 1, z);
                }
            }
        }
    }
    
    generateTerrainNoise(x, z) {
        const scale = 0.1;
        const height = Math.sin(x * scale) * 0.5 + Math.cos(z * scale) * 0.5;
        const detail = Math.sin(x * scale * 4) * 0.2 + Math.cos(z * scale * 4) * 0.2;
        return (height + detail) / 1.4;
    }
    
    generateTree(x, y, z) {
        for (let i = 0; i < 5; i++) {
            this.createBlock(x, y + i, z, 'wood');
        }
        
        const leafHeight = 3;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 3; dy <= 5; dy++) {
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance <= 2.5 && Math.random() > 0.1) {
                        this.createBlock(x + dx, y + dy, z + dz, 'leaves');
                    }
                }
            }
        }
    }
    
    clearPlayerArea() {
        const clearRadius = 1;
        const playerX = 0;
        const playerY = 8;
        const playerZ = 0;
        
        for (let x = -clearRadius; x <= clearRadius; x++) {
            for (let y = -clearRadius; y <= clearRadius; y++) {
                for (let z = -clearRadius; z <= clearRadius; z++) {
                    const blockX = playerX + x;
                    const blockY = playerY + y;
                    const blockZ = playerZ + z;
                    
                    if (blockY > 2) {
                        this.removeBlock(blockX, blockY, blockZ);
                    }
                }
            }
        }
    }
    
    setPlayerStartPosition() {
        this.camera.position.set(0, 8, 0);
        this.velocity.set(0, 0, 0);
    }
    
    createControls() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        document.addEventListener('click', () => this.requestPointerLock());
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('wheel', (event) => this.onMouseWheel(event));
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => this.selectInventorySlot(index));
        });
        
        document.addEventListener('contextmenu', (event) => {
            if (this.isPointerLocked) {
                event.preventDefault();
            }
        });
    }
    
    selectInventorySlot(index) {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach(s => s.classList.remove('active'));
        slots[index].classList.add('active');
        this.selectedBlock = slots[index].dataset.block;
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'Space':
                event.preventDefault();
                this.jump = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.sneak = true;
                break;
            case 'ControlLeft':
            case 'ControlRight':
                this.sprint = true;
                break;
            case 'Escape':
                document.exitPointerLock();
                break;
            case 'KeyE':
                this.flyMode = !this.flyMode;
                break;
        }
        
        if (event.key >= '1' && event.key <= '9') {
            this.selectInventorySlot(parseInt(event.key) - 1);
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
            case 'Space':
                this.jump = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.sneak = false;
                break;
            case 'ControlLeft':
            case 'ControlRight':
                this.sprint = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (!this.isPointerLocked) return;
        
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
        this.camera.rotation.y -= movementX * this.mouseSensitivity;
        this.camera.rotation.x -= movementY * this.mouseSensitivity * (this.invertY ? -1 : 1);
        
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        this.player.rotation.y = this.camera.rotation.y;
    }
    
    onMouseWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        const slots = document.querySelectorAll('.inventory-slot');
        const activeIndex = Array.from(slots).findIndex(s => s.classList.contains('active'));
        const newIndex = (activeIndex + delta + slots.length) % slots.length;
        this.selectInventorySlot(newIndex);
    }
    
    onMouseDown(event) {
        if (!this.isPointerLocked) return;
        
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.blocks.children);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            
            const distance = intersect.distance;
            if (distance > this.reachDistance) return;
            
            const block = intersect.object;
            const position = block.userData.position;
            const faceNormal = intersect.face.normal;
            
            if (event.button === 0) {
                this.removeBlock(position.x, position.y, position.z);
            } else if (event.button === 2) {
                const newX = Math.floor(position.x + faceNormal.x);
                const newY = Math.floor(position.y + faceNormal.y);
                const newZ = Math.floor(position.z + faceNormal.z);
                
                if (!this.world[`${newX},${newY},${newZ}`]) {
                    this.createBlock(newX, newY, newZ, this.selectedBlock);
                }
            }
        }
        
        event.preventDefault();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    requestPointerLock() {
        document.getElementById('gameCanvas').requestPointerLock();
    }
    
    updateCamera() {
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        const speed = this.sprint ? this.sprintSpeed : (this.sneak ? this.walkSpeed * 0.3 : this.walkSpeed);
        
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        
        if (this.direction.x !== 0 || this.direction.z !== 0) {
            this.direction.normalize();
            
            const forward = new THREE.Vector3(0, 0, -1);
            const right = new THREE.Vector3(1, 0, 0);
            
            forward.applyQuaternion(this.player.quaternion);
            right.applyQuaternion(this.player.quaternion);
            
            const moveVector = new THREE.Vector3();
            moveVector.addScaledVector(forward, -this.direction.z);
            moveVector.addScaledVector(right, this.direction.x);
            moveVector.normalize();
            moveVector.multiplyScalar(speed * deltaTime);
            
            this.player.position.add(moveVector);
        }
        
        if (this.jump && this.canJump && !this.flyMode) {
            this.velocity.y = this.jumpVelocity;
            this.canJump = false;
        }
        
        if (!this.flyMode) {
            this.velocity.y -= this.gravity * deltaTime * 60;
            const newY = this.player.position.y + this.velocity.y * deltaTime;
            
            const groundLevel = 2;
            if (newY <= groundLevel + 1.8) {
                this.player.position.y = groundLevel + 1.8;
                this.velocity.y = 0;
                this.canJump = true;
            } else {
                this.player.position.y = newY;
                this.canJump = false;
            }
        } else {
            if (this.jump) {
                this.player.position.y += speed * deltaTime;
            }
            if (this.sneak) {
                this.player.position.y -= speed * deltaTime;
            }
        }
    }
    
    updatePlayerModel() {
        if (!this.player) return;
        
        const time = Date.now() * 0.001;
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        
        if (isMoving && !this.flyMode) {
            this.playerArms[0].rotation.x = Math.sin(time * 3) * 0.3;
            this.playerArms[1].rotation.x = -Math.sin(time * 3) * 0.3;
            
            this.playerLegs[0].rotation.x = -Math.sin(time * 3) * 0.3;
            this.playerLegs[1].rotation.x = Math.sin(time * 3) * 0.3;
            
            if (!this.canJump) {
                this.playerBody.rotation.x = Math.sin(time * 6) * 0.05;
            } else {
                this.playerBody.rotation.x = 0;
            }
        } else {
            this.playerArms.forEach(arm => arm.rotation.x = 0);
            this.playerLegs.forEach(leg => leg.rotation.x = 0);
            this.playerBody.rotation.x = 0;
        }
        
        if (this.sneak) {
            this.player.scale.y = 0.8;
            this.player.position.y -= 0.3;
        } else {
            this.player.scale.y = 1;
        }
    }
    
    updateThirdPersonCamera() {
        const playerPosition = this.player.position.clone();
        const cameraOffset = this.thirdPersonOffset.clone().applyQuaternion(this.player.quaternion);
        this.camera.position.copy(playerPosition.add(cameraOffset));
        this.camera.lookAt(this.player.position);
    }
    
    updateUI() {
        const pos = this.player.position;
        document.getElementById('position').textContent = 
            `${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;
        
        this.frameCount++;
        if (this.frameCount % 30 === 0) {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;
            this.fps = Math.round(30000 / deltaTime);
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }
        
        const modeText = this.flyMode ? '飞行' : (this.sprint ? '疾跑' : (this.sneak ? '潜行' : '行走'));
        document.getElementById('mode').textContent = modeText;
        document.getElementById('camera').textContent = '第三人称';
    }
    
    optimizeRendering() {
        const cameraPosition = this.camera.position;
        
        for (const [key, block] of Object.entries(this.world)) {
            const distance = cameraPosition.distanceTo(block.position);
            if (distance > this.renderDistance) {
                block.visible = false;
            } else {
                block.visible = true;
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateCamera();
        this.updateThirdPersonCamera();
        this.updatePlayerModel();
        this.optimizeRendering();
        this.updateUI();
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('pointerlockchange', () => {
    if (game) {
        game.isPointerLocked = document.pointerLockElement === document.getElementById('gameCanvas');
    }
});

let game;
window.addEventListener('load', () => {
    game = new MinecraftGame();
});