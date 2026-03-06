const { FACE_ORDER, SOLVED_STATE, STICKER_LAYOUT, validateState } = window.CubeCore2x2;

const STICKER_COLORS = {
  W: 0xf8fafc,
  R: 0xb71234,
  G: 0x009b48,
  Y: 0xffd500,
  O: 0xff5800,
  B: 0x0046ad
};

const STICKER_SIZE = 0.9;
const GRID_STEP = 0.98;
const FACE_OFFSET = 1.42;

function stickerTransform(face, row, col) {
  const offset = (index) => (index === 0 ? -GRID_STEP / 2 : GRID_STEP / 2);

  switch (face) {
    case "F":
      return {
        position: new THREE.Vector3(offset(col), offset(row) * -1, FACE_OFFSET),
        rotation: new THREE.Euler(0, 0, 0)
      };
    case "B":
      return {
        position: new THREE.Vector3(-offset(col), offset(row) * -1, -FACE_OFFSET),
        rotation: new THREE.Euler(0, Math.PI, 0)
      };
    case "U":
      return {
        position: new THREE.Vector3(offset(col), FACE_OFFSET, offset(row)),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0)
      };
    case "D":
      return {
        position: new THREE.Vector3(offset(col), -FACE_OFFSET, -offset(row)),
        rotation: new THREE.Euler(Math.PI / 2, 0, 0)
      };
    case "R":
      return {
        position: new THREE.Vector3(FACE_OFFSET, offset(row) * -1, -offset(col)),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0)
      };
    case "L":
      return {
        position: new THREE.Vector3(-FACE_OFFSET, offset(row) * -1, offset(col)),
        rotation: new THREE.Euler(0, Math.PI / 2, 0)
      };
    default:
      throw new Error(`Unknown face "${face}"`);
  }
}

class CubeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.frameId = null;
    this.themeObserver = null;
    this.stickers = new Map();
    this.coreMaterial = null;
    this.pedestalMaterial = null;
    this.shadowMaterial = null;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const width = this.canvas.clientWidth || 720;
    const height = this.canvas.clientHeight || 520;

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(5.5, 4.8, 6.6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.enablePan = false;
      this.controls.dampingFactor = 0.08;
      this.controls.minDistance = 4.5;
      this.controls.maxDistance = 10;
    }

    this.setupLighting();
    this.setupStage();
    this.setupCube();
    this.updateTheme();
    this.renderState(SOLVED_STATE);
    this.animate();

    this.themeObserver = new MutationObserver(() => this.updateTheme());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    window.addEventListener("resize", () => this.onResize());
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.72));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(7, 9, 8);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7ca0ff, 0.35);
    fillLight.position.set(-7, -4, -6);
    this.scene.add(fillLight);

    const accentLight = new THREE.DirectionalLight(0xfbbc04, 0.28);
    accentLight.position.set(-4, 6, 4);
    this.scene.add(accentLight);
  }

  setupStage() {
    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      transparent: true,
      opacity: 0.3
    });

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), this.shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.72;
    this.scene.add(shadow);

    this.pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.92,
      roughness: 0.5,
      metalness: 0.04
    });

    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.22, 3.7), this.pedestalMaterial);
    pedestal.position.y = -1.95;
    this.scene.add(pedestal);
  }

  setupCube() {
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.74,
      metalness: 0.06
    });

    const core = new THREE.Mesh(new THREE.BoxGeometry(2.78, 2.78, 2.78), this.coreMaterial);
    this.scene.add(core);

    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.5 });
    const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);

    STICKER_LAYOUT.forEach((descriptor) => {
      const { face, row, col } = descriptor;
      const transform = stickerTransform(face, row, col);
      const material = new THREE.MeshStandardMaterial({
        color: STICKER_COLORS[FACE_ORDER.includes(face) ? faceToColor(face) : "W"],
        roughness: 0.36,
        metalness: 0.08,
        side: THREE.DoubleSide
      });

      const sticker = new THREE.Mesh(stickerGeometry, material);
      sticker.position.copy(transform.position);
      sticker.rotation.copy(transform.rotation);
      this.scene.add(sticker);

      const stickerBorder = new THREE.LineSegments(new THREE.EdgesGeometry(stickerGeometry), borderMaterial);
      sticker.add(stickerBorder);

      this.stickers.set(descriptor.index, sticker);
    });
  }

  updateTheme() {
    const isDark = document.documentElement.classList.contains("dark");

    this.renderer.setClearColor(0x000000, 0);

    if (this.coreMaterial) {
      this.coreMaterial.color.set(isDark ? 0x101827 : 0x1e293b);
    }

    if (this.pedestalMaterial) {
      this.pedestalMaterial.color.set(isDark ? 0x14233a : 0xdbeafe);
      this.pedestalMaterial.opacity = isDark ? 0.78 : 0.92;
    }

    if (this.shadowMaterial) {
      this.shadowMaterial.color.set(isDark ? 0x020617 : 0xcbd5e1);
      this.shadowMaterial.opacity = isDark ? 0.44 : 0.28;
    }
  }

  renderState(state) {
    const nextState = validateState(state) ? state : SOLVED_STATE;

    STICKER_LAYOUT.forEach((descriptor) => {
      const sticker = this.stickers.get(descriptor.index);
      if (!sticker) {
        return;
      }

      const colorLetter = nextState[descriptor.index];
      sticker.material.color.setHex(STICKER_COLORS[colorLetter] || 0x334155);
    });
  }

  onResize() {
    const width = this.canvas.clientWidth || 720;
    const height = this.canvas.clientHeight || 520;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.frameId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

function faceToColor(face) {
  switch (face) {
    case "U":
      return "W";
    case "R":
      return "R";
    case "F":
      return "G";
    case "D":
      return "Y";
    case "L":
      return "O";
    case "B":
      return "B";
    default:
      return "W";
  }
}

window.CubeEngine = CubeEngine;
