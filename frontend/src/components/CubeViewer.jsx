import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { FACE_ORDER, colorForFaceLetter, faceFromMove } from "../utils/cubeColors";

const STICKER_SIZE = 0.9;
const GRID_STEP = 1.02;
const FACE_OFFSET = 1.52;

const FACE_NORMAL = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1)
};

function stickerTransform(face, row, col) {
  switch (face) {
    case "F":
      return {
        position: new THREE.Vector3((col - 1) * GRID_STEP, (1 - row) * GRID_STEP, FACE_OFFSET),
        rotation: new THREE.Euler(0, 0, 0),
        coords: { x: col - 1, y: 1 - row, z: 1 }
      };
    case "B":
      return {
        position: new THREE.Vector3((1 - col) * GRID_STEP, (1 - row) * GRID_STEP, -FACE_OFFSET),
        rotation: new THREE.Euler(0, Math.PI, 0),
        coords: { x: 1 - col, y: 1 - row, z: -1 }
      };
    case "U":
      return {
        position: new THREE.Vector3((col - 1) * GRID_STEP, FACE_OFFSET, (row - 1) * GRID_STEP),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        coords: { x: col - 1, y: 1, z: row - 1 }
      };
    case "D":
      return {
        position: new THREE.Vector3((col - 1) * GRID_STEP, -FACE_OFFSET, (1 - row) * GRID_STEP),
        rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        coords: { x: col - 1, y: -1, z: 1 - row }
      };
    case "R":
      return {
        position: new THREE.Vector3(FACE_OFFSET, (1 - row) * GRID_STEP, (1 - col) * GRID_STEP),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0),
        coords: { x: 1, y: 1 - row, z: 1 - col }
      };
    case "L":
      return {
        position: new THREE.Vector3(-FACE_OFFSET, (1 - row) * GRID_STEP, (col - 1) * GRID_STEP),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        coords: { x: -1, y: 1 - row, z: col - 1 }
      };
    default:
      throw new Error(`Unknown face ${face}`);
  }
}

function layerMatch(face, coords) {
  if (face === "U") return coords.y === 1;
  if (face === "D") return coords.y === -1;
  if (face === "R") return coords.x === 1;
  if (face === "L") return coords.x === -1;
  if (face === "F") return coords.z === 1;
  if (face === "B") return coords.z === -1;
  return false;
}

function getMoveAngle(move) {
  if (!move) {
    return 0;
  }

  let base = -Math.PI / 2;
  if (move.includes("'")) {
    base *= -1;
  }
  if (move.includes("2")) {
    base *= 2;
  }
  return base;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Three.js Rubik's Cube viewer with sticker-level rendering and move guidance animation.
 * @param {{cubeState: Record<string, string[][]>, activeMove: string}} props
 */
export default function CubeViewer({ cubeState, activeMove }) {
  const containerRef = useRef(null);

  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    frameId: null,
    stickers: new Map(),
    baseTransforms: new Map(),
    arrowGroup: null,
    animation: null
  });

  const normalizedActiveMove = useMemo(() => (activeMove || "").trim().toUpperCase(), [activeMove]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1224");

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(5.5, 5.5, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 12;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(7, 9, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7ca0ff, 0.35);
    fillLight.position.set(-7, -4, -6);
    scene.add(fillLight);

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 3.1, 3.1),
      new THREE.MeshStandardMaterial({ color: "#10141f", roughness: 0.6, metalness: 0.1 })
    );
    scene.add(core);

    const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
    const stickers = new Map();
    const baseTransforms = new Map();

    for (const face of FACE_ORDER) {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const key = `${face}-${row}-${col}`;
          const transform = stickerTransform(face, row, col);
          const color = cubeState?.[face]?.[row]?.[col] || face;

          const material = new THREE.MeshStandardMaterial({
            color: colorForFaceLetter(color),
            roughness: 0.35,
            metalness: 0.1,
            emissive: new THREE.Color("#000000"),
            emissiveIntensity: 0
          });

          const mesh = new THREE.Mesh(stickerGeometry, material);
          mesh.position.copy(transform.position);
          mesh.rotation.copy(transform.rotation);
          mesh.userData = {
            key,
            face,
            row,
            col,
            coords: transform.coords
          };

          scene.add(mesh);
          stickers.set(key, mesh);
          baseTransforms.set(key, {
            position: transform.position.clone(),
            quaternion: mesh.quaternion.clone(),
            coords: transform.coords
          });
        }
      }
    }

    const arrowGroup = new THREE.Group();
    scene.add(arrowGroup);

    function resize() {
      const width = containerRef.current?.clientWidth || 100;
      const height = containerRef.current?.clientHeight || 100;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const renderLoop = () => {
      const now = performance.now();
      const animation = threeRef.current.animation;

      if (animation) {
        const progress = Math.min(1, (now - animation.startTime) / animation.durationMs);
        const eased = easeOutCubic(progress);
        const angle = animation.totalAngle * eased;
        const rotationQuat = new THREE.Quaternion().setFromAxisAngle(animation.axis, angle);

        for (const key of animation.keys) {
          const mesh = stickers.get(key);
          const base = baseTransforms.get(key);
          if (!mesh || !base) {
            continue;
          }

          mesh.position.copy(base.position).applyAxisAngle(animation.axis, angle);
          mesh.quaternion.copy(base.quaternion).premultiply(rotationQuat);
        }

        if (progress >= 1) {
          for (const [key, mesh] of stickers.entries()) {
            const base = baseTransforms.get(key);
            mesh.position.copy(base.position);
            mesh.quaternion.copy(base.quaternion);
          }
          threeRef.current.animation = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      threeRef.current.frameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("resize", resize);
    resize();
    renderLoop();

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      frameId: threeRef.current.frameId,
      stickers,
      baseTransforms,
      arrowGroup,
      animation: null
    };

    return () => {
      window.removeEventListener("resize", resize);

      if (threeRef.current.frameId) {
        cancelAnimationFrame(threeRef.current.frameId);
      }

      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const stickers = threeRef.current.stickers;
    if (!stickers?.size || !cubeState) {
      return;
    }

    for (const face of FACE_ORDER) {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const key = `${face}-${row}-${col}`;
          const mesh = stickers.get(key);
          if (!mesh) {
            continue;
          }

          const letter = cubeState?.[face]?.[row]?.[col] || face;
          mesh.material.color.set(colorForFaceLetter(letter));
        }
      }
    }
  }, [cubeState]);

  useEffect(() => {
    const { stickers, baseTransforms, arrowGroup } = threeRef.current;
    if (!stickers?.size) {
      return;
    }

    const activeFace = faceFromMove(normalizedActiveMove);

    for (const mesh of stickers.values()) {
      const isActive = activeFace && mesh.userData.face === activeFace;
      mesh.material.emissive.set(isActive ? "#ffffff" : "#000000");
      mesh.material.emissiveIntensity = isActive ? 0.24 : 0;
    }

    while (arrowGroup.children.length > 0) {
      const child = arrowGroup.children.pop();
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }

    if (!activeFace) {
      return;
    }

    const axis = FACE_NORMAL[activeFace].clone();

    const arcMaterial = new THREE.MeshStandardMaterial({
      color: "#7dd3fc",
      emissive: new THREE.Color("#7dd3fc"),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.2
    });

    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.035, 10, 80, Math.PI * 1.25), arcMaterial);
    arc.position.copy(axis.clone().multiplyScalar(1.62));

    const arcGroup = new THREE.Group();
    arcGroup.add(arc);

    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      axis.clone().normalize()
    );
    arcGroup.quaternion.copy(alignQuat);

    const isPrime = normalizedActiveMove.includes("'");
    if (isPrime) {
      arcGroup.rotateOnAxis(axis, Math.PI);
    }

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.24, 12),
      new THREE.MeshStandardMaterial({
        color: "#7dd3fc",
        emissive: new THREE.Color("#7dd3fc"),
        emissiveIntensity: 0.8
      })
    );

    cone.position.set(1.18, 1.2, 0);
    cone.rotation.z = -Math.PI / 5;
    arcGroup.add(cone);

    arrowGroup.add(arcGroup);

    const layerKeys = [];
    for (const [key, base] of baseTransforms.entries()) {
      if (layerMatch(activeFace, base.coords)) {
        layerKeys.push(key);
      }
    }

    const totalAngle = getMoveAngle(normalizedActiveMove);
    threeRef.current.animation = {
      startTime: performance.now(),
      durationMs: 420,
      axis,
      totalAngle,
      keys: layerKeys
    };
  }, [normalizedActiveMove]);

  return <div ref={containerRef} className="h-full w-full rounded-2xl border border-[#444746] shadow-xl" />;
}
