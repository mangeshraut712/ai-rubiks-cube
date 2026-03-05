// ===== SIMPLE 3D CUBE - STATE-BASED RENDERING =====
// Rebuilds cube from state string - guarantees visual matches logical

class CubeEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubeGroup = null;
        this.controls = null;

        // Color mapping
        this.colors = {
            'W': 0xFFFFFF,
            'R': 0xFF2222,
            'G': 0x22DD22,
            'Y': 0xFFFF22,
            'O': 0xFF8822,
            'B': 0x2266FF
        };

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f7);

        const width = this.canvas.clientWidth || 500;
        const height = this.canvas.clientHeight || 400;

        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(4, 3, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(5, 10, 7);
        this.scene.add(light);

        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.canvas);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
        }

        this.renderState("WWWWRRRRGGGGYYYYOOOOBBBB");
        this.animate();
        window.addEventListener('resize', () => this.onResize());
    }

    // Render cube from 24-char state string
    renderState(state) {
        if (this.cubeGroup) {
            this.scene.remove(this.cubeGroup);
        }

        this.cubeGroup = new THREE.Group();

        const size = 0.95;
        const gap = 0.55;
        const geo = new THREE.BoxGeometry(size, size, size);

        // 8 cubies positions
        const positions = [
            { x: -gap, y: gap, z: -gap },  // 0: top-left-back
            { x: gap, y: gap, z: -gap },   // 1: top-right-back
            { x: -gap, y: gap, z: gap },   // 2: top-left-front
            { x: gap, y: gap, z: gap },    // 3: top-right-front
            { x: -gap, y: -gap, z: -gap }, // 4: bottom-left-back
            { x: gap, y: -gap, z: -gap },  // 5: bottom-right-back
            { x: -gap, y: -gap, z: gap },  // 6: bottom-left-front
            { x: gap, y: -gap, z: gap }    // 7: bottom-right-front
        ];

        // Map state indices to cubie faces
        // State: U(0-3) R(4-7) F(8-11) D(12-15) L(16-19) B(20-23)
        const cubieColors = [
            // Cubie 0: top-left-back (has U, L, B)
            { U: state[0], L: state[16], B: state[21] },
            // Cubie 1: top-right-back (has U, R, B)
            { U: state[1], R: state[5], B: state[20] },
            // Cubie 2: top-left-front (has U, L, F)
            { U: state[2], L: state[17], F: state[8] },
            // Cubie 3: top-right-front (has U, R, F)
            { U: state[3], R: state[4], F: state[9] },
            // Cubie 4: bottom-left-back (has D, L, B)
            { D: state[14], L: state[18], B: state[23] },
            // Cubie 5: bottom-right-back (has D, R, B)
            { D: state[15], R: state[7], B: state[22] },
            // Cubie 6: bottom-left-front (has D, L, F)
            { D: state[12], L: state[19], F: state[10] },
            // Cubie 7: bottom-right-front (has D, R, F)
            { D: state[13], R: state[6], F: state[11] }
        ];

        positions.forEach((pos, i) => {
            const colors = cubieColors[i];
            const dark = 0x111111;

            // Materials: +X, -X, +Y, -Y, +Z, -Z
            const mats = [
                new THREE.MeshPhongMaterial({ color: colors.R ? this.colors[colors.R] : dark }),
                new THREE.MeshPhongMaterial({ color: colors.L ? this.colors[colors.L] : dark }),
                new THREE.MeshPhongMaterial({ color: colors.U ? this.colors[colors.U] : dark }),
                new THREE.MeshPhongMaterial({ color: colors.D ? this.colors[colors.D] : dark }),
                new THREE.MeshPhongMaterial({ color: colors.F ? this.colors[colors.F] : dark }),
                new THREE.MeshPhongMaterial({ color: colors.B ? this.colors[colors.B] : dark })
            ];

            const mesh = new THREE.Mesh(geo, mats);
            mesh.position.set(pos.x, pos.y, pos.z);

            // Black edges
            const edges = new THREE.EdgesGeometry(geo);
            mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 })));

            this.cubeGroup.add(mesh);
        });

        this.scene.add(this.cubeGroup);
    }

    onResize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
