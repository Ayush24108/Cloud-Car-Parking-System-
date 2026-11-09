/**
 * CloudPark 3D - Three.js Visual Parking Lot Engine
 * High-performance 3D scene rendering campus parking spaces, procedural cars,
 * atmospheric day/night lighting, and interactive raycasting.
 */

class Parking3DEngine {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        this.onSlotSelect = options.onSlotSelect || (() => {});
        this.onHoverChange = options.onHoverChange || (() => {});

        this.spaces = [];
        this.slotMeshes = [];
        this.carMeshes = [];
        this.streetLamps = [];
        this.selectedSlotId = null;
        this.hoveredSlotMesh = null;
        this.isNight = true;

        this.initThree();
        this.initLights();
        this.initEnvironment();
        this.initEventListeners();
        this.animate();
    }

    initThree() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.isNight ? 0x090d16 : 0xdfe9f3);
        this.scene.fog = new THREE.FogExp2(this.isNight ? 0x090d16 : 0xdfe9f3, 0.009);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
        this.camera.position.set(0, 32, 42);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.isNight ? 1.05 : 1.25;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.05; // Prevent sub-ground view
        this.controls.minDistance = 6;
        this.controls.maxDistance = 140;
        this.controls.target.set(0, 0, 0);

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Clock
        this.clock = new THREE.Clock();
    }

    initLights() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(
            this.isNight ? 0x223355 : 0xffffff,
            this.isNight ? 0.7 : 0.85
        );
        this.scene.add(this.ambientLight);

        // Sun / Moon Directional Light
        this.dirLight = new THREE.DirectionalLight(
            this.isNight ? 0x88bbff : 0xfffaed,
            this.isNight ? 0.8 : 1.4
        );
        this.dirLight.position.set(30, 45, 25);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 10;
        this.dirLight.shadow.camera.far = 130;
        this.dirLight.shadow.camera.left = -50;
        this.dirLight.shadow.camera.right = 50;
        this.dirLight.shadow.camera.top = 50;
        this.dirLight.shadow.camera.bottom = -50;
        this.dirLight.shadow.bias = -0.0005;
        this.scene.add(this.dirLight);

        // Subtle fill light
        this.fillLight = new THREE.DirectionalLight(this.isNight ? 0x112244 : 0xcce0ff, 0.4);
        this.fillLight.position.set(-30, 25, -25);
        this.scene.add(this.fillLight);
    }

    initEnvironment() {
        this.envGroup = new THREE.Group();
        this.scene.add(this.envGroup);

        // 1. Asphalt Ground
        const groundGeo = new THREE.PlaneGeometry(160, 110);
        const groundMat = new THREE.MeshStandardMaterial({
            color: this.isNight ? 0x141821 : 0x242831,
            roughness: 0.88,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.02;
        ground.receiveShadow = true;
        this.envGroup.add(ground);

        // 2. Concrete curbs and green grass lawn surrounds
        const lawnGeo = new THREE.PlaneGeometry(240, 180);
        const lawnMat = new THREE.MeshStandardMaterial({
            color: this.isNight ? 0x0d2216 : 0x1d472c,
            roughness: 0.95
        });
        const lawn = new THREE.Mesh(lawnGeo, lawnMat);
        lawn.rotation.x = -Math.PI / 2;
        lawn.position.y = -0.05;
        lawn.receiveShadow = true;
        this.envGroup.add(lawn);

        // 3. Central Driveway lines and arrows
        this.createRoadMarkings();

        // 4. Campus Entrance Gate
        this.createEntranceGate();

        // 5. Surrounding decorative trees & light poles
        this.createPerimeterDecorations();
    }

    createRoadMarkings() {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });

        // Center dashed yellow lane line
        for (let x = -55; x <= 55; x += 4.5) {
            const dashGeo = new THREE.PlaneGeometry(2.5, 0.25);
            const dash = new THREE.Mesh(dashGeo, yellowMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(x, 0.01, 0);
            this.envGroup.add(dash);
        }

        // Driveway edge white solid lines
        [-5.2, 5.2].forEach(z => {
            const edgeGeo = new THREE.PlaneGeometry(120, 0.2);
            const edge = new THREE.Mesh(edgeGeo, lineMat);
            edge.rotation.x = -Math.PI / 2;
            edge.position.set(0, 0.01, z);
            this.envGroup.add(edge);
        });
    }

    createEntranceGate() {
        const gateGroup = new THREE.Group();
        gateGroup.position.set(58, 0, 0);

        // Gate Posts
        const postGeo = new THREE.BoxGeometry(0.8, 3.2, 0.8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });

        const postLeft = new THREE.Mesh(postGeo, postMat);
        postLeft.position.set(0, 1.6, -5.2);
        postLeft.castShadow = true;

        const postRight = new THREE.Mesh(postGeo, postMat);
        postRight.position.set(0, 1.6, 5.2);
        postRight.castShadow = true;

        gateGroup.add(postLeft, postRight);

        // Overhead Portal Beam
        const beamGeo = new THREE.BoxGeometry(1.2, 0.8, 11.2);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 3.6, 0);
        beam.castShadow = true;
        gateGroup.add(beam);

        // Illuminated Sign Board
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512;
        signCanvas.height = 64;
        const ctx = signCanvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 64);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CLOUDPARK • CAMPUS SMART ACCESS', 256, 32);

        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
        const signGeo = new THREE.PlaneGeometry(8, 1);
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(-0.62, 3.6, 0);
        signMesh.rotation.y = -Math.PI / 2;
        gateGroup.add(signMesh);

        // Barrier arms (striped red & white)
        [-2.6, 2.6].forEach(z => {
            const barrierGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.8);
            const barrierMat = new THREE.MeshStandardMaterial({
                color: 0xef4444,
                roughness: 0.4
            });
            const barrier = new THREE.Mesh(barrierGeo, barrierMat);
            barrier.rotation.x = Math.PI / 2;
            barrier.position.set(0, 1.1, z);
            gateGroup.add(barrier);
        });

        this.envGroup.add(gateGroup);
    }

    createPerimeterDecorations() {
        // Street Lamps along North and South curbs
        const lampPositions = [
            [-50, -14], [-25, -14], [0, -14], [25, -14], [50, -14],
            [-50, 14], [-25, 14], [0, 14], [25, 14], [50, 14]
        ];

        lampPositions.forEach(([x, z]) => {
            this.createStreetLamp(x, z);
        });

        // Trees along borders
        for (let x = -65; x <= 65; x += 15) {
            this.createStylizedTree(x, -20);
            this.createStylizedTree(x, 20);
        }
        for (let z = -18; z <= 18; z += 9) {
            this.createStylizedTree(-65, z);
        }
    }

    createStreetLamp(x, z) {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(x, 0, z);

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3;
        pole.castShadow = true;
        lampGroup.add(pole);

        // Lamp head
        const headGeo = new THREE.BoxGeometry(0.4, 0.2, 0.9);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 6, z < 0 ? 0.4 : -0.4);
        lampGroup.add(head);

        // Light bulb emitter
        const bulbGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const bulbMat = new THREE.MeshBasicMaterial({
            color: this.isNight ? 0xffeaad : 0xffeecc
        });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(0, 5.9, z < 0 ? 0.4 : -0.4);
        lampGroup.add(bulb);

        // Point Light
        const pointLight = new THREE.PointLight(0xffeaad, this.isNight ? 1.2 : 0.2, 18, 1.8);
        pointLight.position.set(0, 5.8, z < 0 ? 0.4 : -0.4);
        pointLight.castShadow = false; // keep perf snappy
        lampGroup.add(pointLight);
        this.streetLamps.push(pointLight);

        this.envGroup.add(lampGroup);
    }

    createStylizedTree(x, z) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Canopy (Low poly layers)
        const foliageMat = new THREE.MeshStandardMaterial({
            color: this.isNight ? 0x164e32 : 0x228b48,
            roughness: 0.8
        });

        [2.6, 3.6, 4.4].forEach((y, i) => {
            const rad = 1.8 - i * 0.45;
            const coneGeo = new THREE.ConeGeometry(rad, 1.6, 6);
            const cone = new THREE.Mesh(coneGeo, foliageMat);
            cone.position.y = y;
            cone.castShadow = true;
            treeGroup.add(cone);
        });

        this.envGroup.add(treeGroup);
    }

    /**
     * Rebuilds the 3D parking slots from backend spaces data
     */
    loadSpaces(spaces) {
        this.spaces = spaces;

        // Clear existing slots & cars
        this.slotMeshes.forEach(m => this.scene.remove(m));
        this.carMeshes.forEach(c => this.scene.remove(c));
        this.slotMeshes = [];
        this.carMeshes = [];
        this.hoveredSlotMesh = null;
        this.selectedSlotId = null;

        if (!spaces || spaces.length === 0) return;

        // Calculate 2-row layout (North: Row 0, South: Row 1)
        const total = spaces.length;
        const slotsPerRow = Math.ceil(total / 2);
        const slotWidth = 3.2;
        const slotLength = 6.2;
        const rowOffsetZ = 8.6; // distance from central driving lane
        const startX = -((slotsPerRow - 1) * slotWidth) / 2;

        spaces.forEach((space, index) => {
            const isNorth = index < slotsPerRow;
            const col = isNorth ? index : index - slotsPerRow;

            const posX = startX + col * slotWidth;
            const posZ = isNorth ? -rowOffsetZ : rowOffsetZ;
            const rotY = isNorth ? 0 : Math.PI;

            const slotMesh = this.createParkingSlotMesh(space, posX, posZ, rotY, slotWidth, slotLength);
            this.scene.add(slotMesh);
            this.slotMeshes.push(slotMesh);

            // If occupied or reserved, spawn a 3D Car!
            if (space.status === 'OCCUPIED' || space.status === 'RESERVED') {
                const carMesh = this.createProceduralCar(space, posX, posZ, rotY);
                this.scene.add(carMesh);
                this.carMeshes.push(carMesh);
            }
        });
    }

    createParkingSlotMesh(space, x, z, rotY, width, length) {
        const group = new THREE.Group();
        group.position.set(x, 0.02, z);
        group.rotation.y = rotY;
        group.userData = { space, id: space.id, spaceNumber: space.spaceNumber };

        // Colors based on Status
        let colorHex = 0x10b981; // Green for AVAILABLE
        let emissiveIntensity = 0.25;

        if (space.status === 'RESERVED') {
            colorHex = 0xf59e0b; // Amber
            emissiveIntensity = 0.35;
        } else if (space.status === 'OCCUPIED') {
            colorHex = 0xef4444; // Red
            emissiveIntensity = 0.2;
        } else if (space.status === 'MAINTENANCE') {
            colorHex = 0x64748b; // Steel Gray
            emissiveIntensity = 0.05;
        }

        // Special Space Type Border Accent
        let typeAccent = '#10b981';
        if (space.type === 'EV_CHARGING') typeAccent = '#06b6d4'; // Cyan
        else if (space.type === 'HANDICAP') typeAccent = '#8b5cf6'; // Violet
        else if (space.type === 'COMPACT') typeAccent = '#3b82f6'; // Blue

        // 1. Slot Base Plate (Interactive Clickable Area)
        const baseGeo = new THREE.BoxGeometry(width - 0.4, 0.08, length - 0.4);
        const baseMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.4,
            metalness: 0.1,
            transparent: true,
            opacity: space.status === 'AVAILABLE' ? 0.65 : 0.85
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.04;
        baseMesh.receiveShadow = true;
        baseMesh.userData = group.userData;
        group.add(baseMesh);
        group.baseMesh = baseMesh;

        // 2. White Parking Line Stripes (Sides and back)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
        const leftLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, length), lineMat);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-(width / 2) + 0.1, 0.05, 0);
        group.add(leftLine);

        const rightLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, length), lineMat);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set((width / 2) - 0.1, 0.05, 0);
        group.add(rightLine);

        const backLine = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.12), lineMat);
        backLine.rotation.x = -Math.PI / 2;
        backLine.position.set(0, 0.05, -(length / 2) + 0.1);
        group.add(backLine);

        // 3. Floating 3D Text Badge (Slot ID & Type)
        const textSprite = this.createSlotLabelSprite(space.spaceNumber, space.type, space.status);
        textSprite.position.set(0, 1.5, -(length / 2) + 0.6);
        group.add(textSprite);

        // 4. Highlight Ring (Shown on hover/selection)
        const ringGeo = new THREE.PlaneGeometry(width - 0.2, length - 0.2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.09;
        group.add(ring);
        group.highlightRing = ring;

        return group;
    }

    createSlotLabelSprite(spaceNumber, type, status) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(16, 16, 224, 96, 20);
        ctx.fill();

        // Border color
        let borderColor = '#10b981';
        if (status === 'RESERVED') borderColor = '#f59e0b';
        else if (status === 'OCCUPIED') borderColor = '#ef4444';
        else if (status === 'MAINTENANCE') borderColor = '#64748b';

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Space Number Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(spaceNumber, 128, 62);

        // Type tag (e.g. EV, COMPACT, etc.)
        let tag = 'STD';
        if (type === 'EV_CHARGING') tag = '⚡ EV';
        else if (type === 'HANDICAP') tag = '♿ VIP';
        else if (type === 'COMPACT') tag = '🚙 MINI';

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(tag, 128, 96);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2.4, 1.2, 1);
        return sprite;
    }

    /**
     * Procedural low-poly 3D Car Model
     */
    createProceduralCar(space, x, z, rotY) {
        const carGroup = new THREE.Group();
        carGroup.position.set(x, 0.1, z);
        carGroup.rotation.y = rotY;

        // Color palette
        const colors = [0x2563eb, 0xdc2626, 0x059669, 0xf8fafc, 0x1e293b, 0xd97706, 0x7c3aed];
        const carColor = colors[Math.abs(space.id || 1) % colors.length];

        // 1. Lower Chassis
        const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: carColor,
            roughness: 0.25,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.55;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);

        // 2. Cabin / Windshield Roof
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.3);
        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x0a101d,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.85
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.15, -0.3);
        cabin.castShadow = true;
        carGroup.add(cabin);

        // 3. Four Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
        const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 8);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });

        const wheelPositions = [
            [-1.05, 0.35, 1.3],
            [1.05, 0.35, 1.3],
            [-1.05, 0.35, -1.3],
            [1.05, 0.35, -1.3]
        ];

        wheelPositions.forEach(([wx, wy, wz]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, wy, wz);
            wheel.castShadow = true;

            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            rim.position.set(wx, wy, wz);

            carGroup.add(wheel, rim);
        });

        // 4. Headlights (Front is +Z)
        const headGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hlLeft = new THREE.Mesh(headGeo, headMat);
        hlLeft.position.set(-0.65, 0.6, 2.22);
        const hlRight = new THREE.Mesh(headGeo, headMat);
        hlRight.position.set(0.65, 0.6, 2.22);
        carGroup.add(hlLeft, hlRight);

        // 5. Taillights (Rear is -Z)
        const tailGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const tlLeft = new THREE.Mesh(tailGeo, tailMat);
        tlLeft.position.set(-0.65, 0.6, -2.22);
        const tlRight = new THREE.Mesh(tailGeo, tailMat);
        tlRight.position.set(0.65, 0.6, -2.22);
        carGroup.add(tlLeft, tlRight);

        return carGroup;
    }

    /**
     * Interactivity: Mouse Move & Raycasting
     */
    initEventListeners() {
        const getCanvasCoords = (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            getCanvasCoords(e);
            this.handleRaycastHover(e);
        });

        this.renderer.domElement.addEventListener('click', (e) => {
            getCanvasCoords(e);
            this.handleRaycastClick(e);
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    handleRaycastHover(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const interactiveMeshes = this.slotMeshes.map(m => m.baseMesh);
        const intersects = this.raycaster.intersectObjects(interactiveMeshes);

        if (intersects.length > 0) {
            const hitGroup = intersects[0].object.parent;
            if (this.hoveredSlotMesh !== hitGroup) {
                // Unhover previous
                if (this.hoveredSlotMesh && this.hoveredSlotMesh.highlightRing) {
                    this.hoveredSlotMesh.highlightRing.material.opacity = 0;
                }
                this.hoveredSlotMesh = hitGroup;
                this.hoveredSlotMesh.highlightRing.material.opacity = 0.9;
                this.container.style.cursor = 'pointer';
                this.onHoverChange(hitGroup.userData.space, e);
            }
        } else {
            if (this.hoveredSlotMesh) {
                if (this.hoveredSlotMesh.highlightRing && this.hoveredSlotMesh.userData.id !== this.selectedSlotId) {
                    this.hoveredSlotMesh.highlightRing.material.opacity = 0;
                }
                this.hoveredSlotMesh = null;
                this.container.style.cursor = 'default';
                this.onHoverChange(null, e);
            }
        }
    }

    handleRaycastClick(e) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const interactiveMeshes = this.slotMeshes.map(m => m.baseMesh);
        const intersects = this.raycaster.intersectObjects(interactiveMeshes);

        if (intersects.length > 0) {
            const hitGroup = intersects[0].object.parent;
            this.selectSlot(hitGroup.userData.id);
        }
    }

    selectSlot(slotId) {
        this.selectedSlotId = slotId;
        const targetMesh = this.slotMeshes.find(m => m.userData.id === slotId);

        // Reset all highlights
        this.slotMeshes.forEach(m => {
            if (m.highlightRing) m.highlightRing.material.opacity = 0;
        });

        if (targetMesh) {
            if (targetMesh.highlightRing) {
                targetMesh.highlightRing.material.opacity = 1;
                targetMesh.highlightRing.material.color.setHex(0x38bdf8);
            }

            // Smoothly fly camera towards the spot!
            this.focusCameraOn(targetMesh.position.x, targetMesh.position.z);
            this.onSlotSelect(targetMesh.userData.space);
        }
    }

    focusCameraOn(x, z) {
        const targetX = x;
        const targetZ = z + 9;
        const targetY = 10;

        if (window.gsap) {
            gsap.to(this.camera.position, {
                x: targetX,
                y: targetY,
                z: targetZ,
                duration: 1.1,
                ease: 'power2.out'
            });
            gsap.to(this.controls.target, {
                x: x,
                y: 0.5,
                z: z,
                duration: 1.1,
                ease: 'power2.out'
            });
        } else {
            this.camera.position.set(targetX, targetY, targetZ);
            this.controls.target.set(x, 0.5, z);
        }
    }

    setCameraPreset(viewName) {
        const duration = 1.2;
        let pos = { x: 0, y: 32, z: 42 };
        let target = { x: 0, y: 0, z: 0 };

        switch (viewName) {
            case 'isometric':
                pos = { x: 30, y: 35, z: 35 };
                target = { x: 0, y: 0, z: 0 };
                break;
            case 'top':
                pos = { x: 0, y: 65, z: 0.1 };
                target = { x: 0, y: 0, z: 0 };
                break;
            case 'driver':
                pos = { x: 48, y: 3.5, z: 0 };
                target = { x: -30, y: 1.2, z: 0 };
                break;
            case 'reset':
            default:
                pos = { x: 0, y: 32, z: 42 };
                target = { x: 0, y: 0, z: 0 };
                break;
        }

        if (window.gsap) {
            gsap.to(this.camera.position, { ...pos, duration, ease: 'power2.inOut' });
            gsap.to(this.controls.target, { ...target, duration, ease: 'power2.inOut' });
        } else {
            this.camera.position.set(pos.x, pos.y, pos.z);
            this.controls.target.set(target.x, target.y, target.z);
        }
    }

    toggleDayNight() {
        this.isNight = !this.isNight;

        const bg = this.isNight ? 0x090d16 : 0xdfe9f3;
        this.scene.background.setHex(bg);
        this.scene.fog.color.setHex(bg);

        this.ambientLight.color.setHex(this.isNight ? 0x223355 : 0xffffff);
        this.ambientLight.intensity = this.isNight ? 0.7 : 0.9;

        this.dirLight.color.setHex(this.isNight ? 0x88bbff : 0xfffaed);
        this.dirLight.intensity = this.isNight ? 0.8 : 1.4;

        this.streetLamps.forEach(lamp => {
            lamp.intensity = this.isNight ? 1.2 : 0.1;
        });

        this.renderer.toneMappingExposure = this.isNight ? 1.05 : 1.25;
        return this.isNight;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Subtle breathing glow animation for available slots
        this.slotMeshes.forEach(mesh => {
            if (mesh.userData.space && mesh.userData.space.status === 'AVAILABLE' && mesh.baseMesh) {
                const pulse = 0.2 + 0.1 * Math.sin(elapsedTime * 2.5 + mesh.position.x);
                mesh.baseMesh.material.emissiveIntensity = pulse;
            }
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.Parking3DEngine = Parking3DEngine;
