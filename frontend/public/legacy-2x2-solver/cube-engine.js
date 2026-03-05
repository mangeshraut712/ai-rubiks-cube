// ===== SIMPLE 3D CUBE - STATE-BASED RENDERING =====
// Fixed: Correct 2x2 cube representation with proper sticker mappings
// State format: U(0-3) R(4-7) F(8-11) D(12-15) L(16-19) B(20-23)
// Each face has 4 stickers: top-left, top-right, bottom-left, bottom-right

class CubeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cubeGroup = null;
    this.controls = null;

    // Color mapping - standard Rubik's cube colors
    this.colors = {
      W: 0xffffff, // White - Up
      R: 0xdd2c00, // Red - Right
      G: 0x00c853, // Green - Front
      Y: 0xffea00, // Yellow - Down
      O: 0xff6d00, // Orange - Left
      B: 0x2962ff // Blue - Back
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

    // Solved state: W=White(U), R=Red(R), G=Green(F), Y=Yellow(D), O=Orange(L), B=Blue(B)
    this.renderState("WWWWRRRRGGGGOOOOBBBB");
    this.animate();
    window.addEventListener("resize", () => this.onResize());
  }

  // Render cube from 24-char state string
  // Face order: U(0-3), R(4-7), F(8-11), D(12-15), L(16-19), B(20-23)
  // Each face: index 0=TL, 1=TR, 2=BL, 3=BR
  renderState(state) {
    if (this.cubeGroup) {
      this.scene.remove(this.cubeGroup);
    }

    this.cubeGroup = new THREE.Group();

    const size = 0.92;
    const gap = 0.48;
    const geo = new THREE.BoxGeometry(size, size, size);

    // 8 cubies positions for 2x2 cube
    // Position: x(left=-,right=+), y(up=+,down=-), z(front=+,back=-)
    const positions = [
      { x: -gap, y: gap, z: -gap }, // 0: top-left-back (L,U,B)
      { x: gap, y: gap, z: -gap }, // 1: top-right-back (R,U,B)
      { x: -gap, y: gap, z: gap }, // 2: top-left-front (L,U,F)
      { x: gap, y: gap, z: gap }, // 3: top-right-front (R,U,F)
      { x: -gap, y: -gap, z: -gap }, // 4: bottom-left-back (L,D,B)
      { x: gap, y: -gap, z: -gap }, // 5: bottom-right-back (R,D,B)
      { x: -gap, y: -gap, z: gap }, // 6: bottom-left-front (L,D,F)
      { x: gap, y: -gap, z: gap } // 7: bottom-right-front (R,D,F)
    ];

    // Correct mapping of state indices to cubie faces
    // Format: { +X(R), -X(L), +Y(U), -Y(D), +Z(F), -Z(B) }
    // State: U(0-3), R(4-7), F(8-11), D(12-15), L(16-19), B(20-23)
    const cubieColors = [
      // Cubie 0: top-left-back (x=-, y=+, z=-) -> needs L, U, B
      { right: null, left: state[17], up: state[0], down: null, front: null, back: state[20] },
      // Cubie 1: top-right-back (x=+, y=+, z=-) -> needs R, U, B
      { right: state[4], left: null, up: state[1], down: null, front: null, back: state[21] },
      // Cubie 2: top-left-front (x=-, y=+, z=+) -> needs L, U, F
      { right: null, left: state[16], up: state[2], down: null, front: state[8], back: null },
      // Cubie 3: top-right-front (x=+, y=+, z=+) -> needs R, U, F
      { right: state[5], left: null, up: state[3], down: null, front: state[9], back: null },
      // Cubie 4: bottom-left-back (x=-, y=-, z=-) -> needs L, D, B
      { right: null, left: state[19], up: null, down: state[14], front: null, back: state[23] },
      // Cubie 5: bottom-right-back (x=+, y=-, z=-) -> needs R, D, B
      { right: state[7], left: null, up: null, down: state[15], front: null, back: state[22] },
      // Cubie 6: bottom-left-front (x=-, y=-, z=+) -> needs L, D, F
      { right: null, left: state[18], up: null, down: state[12], front: state[10], back: null },
      // Cubie 7: bottom-right-front (x=+, y=-, z=+) -> needs R, D, F
      { right: state[6], left: null, up: null, down: state[13], front: state[11], back: null }
    ];

    const black = 0x111111;
    const darkGray = 0x222222;

    positions.forEach((pos, i) => {
      const c = cubieColors[i];

      // Materials: +X(R), -X(L), +Y(U), -Y(D), +Z(F), -Z(B)
      const mats = [
        new THREE.MeshPhongMaterial({ color: c.right ? this.colors[c.right] : black }), // +X (Right)
        new THREE.MeshPhongMaterial({ color: c.left ? this.colors[c.left] : black }), // -X (Left)
        new THREE.MeshPhongMaterial({ color: c.up ? this.colors[c.up] : darkGray }), // +Y (Up)
        new THREE.MeshPhongMaterial({ color: c.down ? this.colors[c.down] : darkGray }), // -Y (Down)
        new THREE.MeshPhongMaterial({ color: c.front ? this.colors[c.front] : black }), // +Z (Front)
        new THREE.MeshPhongMaterial({ color: c.back ? this.colors[c.back] : black }) // -Z (Back)
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
