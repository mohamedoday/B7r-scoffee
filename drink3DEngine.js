/**
 * @module Drink3DEngine
 * @description Procedural WebGL / Three.js 3D Cup & Beverage Mesh Generator with Interactive Orbit.
 */
export class Drink3DEngine {
  constructor() {
    this.activeViewports = new Map();
    this.rafId = null;
    this.isRunning = false;
  }

  /**
   * Builds a rich 3D beverage mesh group based on drink model3D configuration
   */
  buildBeverageGroup(spec = {}) {
    const group = new THREE.Group();
    const vesselType = spec.vessel || 'tall_glass';

    let topRadius = 0.72;
    let bottomRadius = 0.52;
    let height = 1.95;
    let isGlass = true;

    if (vesselType === 'demitasse') {
      topRadius = 0.62;
      bottomRadius = 0.38;
      height = 1.05;
      isGlass = false;
    } else if (vesselType === 'ceramic_cup') {
      topRadius = 0.85;
      bottomRadius = 0.52;
      height = 1.25;
      isGlass = false;
    } else if (vesselType === 'gibraltar') {
      topRadius = 0.68;
      bottomRadius = 0.48;
      height = 1.35;
      isGlass = true;
    } else if (vesselType === 'rocks_glass') {
      topRadius = 0.76;
      bottomRadius = 0.68;
      height = 1.35;
      isGlass = true;
    } else if (vesselType === 'chemex_glass') {
      topRadius = 0.62;
      bottomRadius = 0.76;
      height = 1.85;
      isGlass = true;
    }

    // 1. Outer Vessel Geometry
    const cupGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 40, 1, true);
    const cupMat = isGlass
      ? new THREE.MeshPhysicalMaterial({
          color: 0xdff6ff,
          transparent: true,
          opacity: 0.34,
          roughness: 0.08,
          metalness: 0.05,
          reflectivity: 0.95,
          side: THREE.DoubleSide
        })
      : new THREE.MeshStandardMaterial({
          color: 0x111c2e,
          roughness: 0.25,
          metalness: 0.35,
          side: THREE.DoubleSide
        });

    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    group.add(cupMesh);

    // Base Disk
    const baseGeo = new THREE.CylinderGeometry(bottomRadius, bottomRadius * 0.96, 0.09, 40);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isGlass ? 0xa8dadc : 0xe2b857,
      roughness: 0.2,
      metalness: isGlass ? 0.1 : 0.85
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -height / 2;
    group.add(baseMesh);

    // Golden Rim Accent
    const rimGeo = new THREE.TorusGeometry(topRadius, 0.024, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf3d078,
      roughness: 0.18,
      metalness: 0.92
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = height / 2;
    group.add(rimMesh);

    // Ceramic Handle if hot cup
    if (!isGlass) {
      const handleGeo = new THREE.TorusGeometry(height * 0.3, 0.055, 14, 32, Math.PI);
      const handleMesh = new THREE.Mesh(handleGeo, rimMat);
      handleMesh.position.set(topRadius * 0.92, 0, 0);
      handleMesh.rotation.z = -Math.PI / 2;
      group.add(handleMesh);
    }

    // 2. Inner Beverage Liquid
    const liquidHeight = height * 0.76;
    const liqTopR = bottomRadius + (topRadius - bottomRadius) * 0.78 - 0.035;
    const liqBotR = bottomRadius - 0.035;
    const liquidGeo = new THREE.CylinderGeometry(liqTopR, liqBotR, liquidHeight, 36);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.liquidColor || '#3b1d0e'),
      roughness: 0.18,
      metalness: 0.08
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -height / 2 + liquidHeight / 2 + 0.05;
    group.add(liquidMesh);

    // 3. Cream / Foam Top Layer
    const foamH = Math.max(0.05, (spec.foamHeight || 0.12) * height * 0.6);
    const foamGeo = new THREE.CylinderGeometry(liqTopR * 1.01, liqTopR * 0.99, foamH, 36);
    const foamMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.foamColor || '#f5ebe0'),
      roughness: 0.55,
      metalness: 0.02
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    const surfaceY = liquidMesh.position.y + liquidHeight / 2 + foamH / 2 - 0.01;
    foamMesh.position.y = surfaceY;
    group.add(foamMesh);

    // 4. Procedural Ice Cubes
    if (spec.ice) {
      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65,
        roughness: 0.12,
        metalness: 0.1
      });
      for (let i = 0; i < 4; i++) {
        const size = 0.26 + (i % 2) * 0.06;
        const iceGeo = new THREE.BoxGeometry(size, size, size);
        const iceCube = new THREE.Mesh(iceGeo, iceMat);
        const angle = (i / 4) * Math.PI * 2;
        iceCube.position.set(
          Math.cos(angle) * (liqTopR * 0.42),
          surfaceY + 0.04,
          Math.sin(angle) * (liqTopR * 0.42)
        );
        iceCube.rotation.set(0.4 * i, 0.7 * i, 0.3);
        group.add(iceCube);
      }
    }

    // 5. Garnishes (Gold Flake, Mint/Citrus, Pistachio)
    if (spec.garnish === 'gold_flake') {
      const flakeMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 1.0,
        roughness: 0.12,
        emissive: 0x553b00
      });
      for (let i = 0; i < 6; i++) {
        const flake = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), flakeMat);
        flake.scale.set(1.4, 0.2, 1.1);
        flake.position.set(
          Math.cos(i * 1.1) * 0.25,
          surfaceY + foamH / 2 + 0.02,
          Math.sin(i * 1.1) * 0.25
        );
        group.add(flake);
      }
    } else if (spec.garnish === 'citrus_mint') {
      const mintMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.45 });
      const leaf1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mintMat);
      leaf1.scale.set(1.3, 0.18, 0.75);
      leaf1.position.set(0.15, surfaceY + foamH / 2 + 0.05, 0.1);
      leaf1.rotation.z = 0.35;
      group.add(leaf1);

      const limeMat = new THREE.MeshStandardMaterial({ color: 0x80b918, roughness: 0.35 });
      const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), limeMat);
      lime.position.set(-0.22, surfaceY + foamH / 2 + 0.08, -0.1);
      lime.rotation.set(0.6, 0.2, -0.4);
      group.add(lime);
    }

    // 6. Luxury Metallic Straw
    if (spec.straw) {
      const strawGeo = new THREE.CylinderGeometry(0.032, 0.032, height * 1.32, 16);
      const strawMat = new THREE.MeshStandardMaterial({
        color: 0xe2b857,
        metalness: 0.88,
        roughness: 0.2
      });
      const straw = new THREE.Mesh(strawGeo, strawMat);
      straw.position.set(0.24, height * 0.14, 0);
      straw.rotation.z = -0.22;
      group.add(straw);
    }

    // Slight luxury presentation tilt
    group.rotation.x = 0.14;
    return group;
  }

  /**
   * Mounts an interactive 3D viewport inside any DOM container
   */
  mountViewport(id, container, drinkSpec, options = {}) {
    if (!container || typeof THREE === 'undefined') return null;
    this.unmountViewport(id);

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.85, options.cameraZ || 4.35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Three-Point Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff1d0, 1.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5ce1e6, 0.95);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const meshGroup = this.buildBeverageGroup(drinkSpec);
    scene.add(meshGroup);

    const state = {
      id,
      container,
      scene,
      camera,
      renderer,
      meshGroup,
      autoRotate: options.autoRotate !== false,
      isDragging: false,
      prevX: 0,
      prevY: 0,
      rotY: 0.4,
      rotX: 0.16,
      wireframe: false
    };

    // Pointer Drag Orbit Interaction
    const domEl = renderer.domElement;
    const onPointerDown = (e) => {
      state.isDragging = true;
      state.prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      state.prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    };

    const onPointerMove = (e) => {
      if (!state.isDragging) return;
      const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const dx = cx - state.prevX;
      const dy = cy - state.prevY;
      state.rotY += dx * 0.012;
      state.rotX = Math.max(-0.55, Math.min(0.75, state.rotX + dy * 0.008));
      state.prevX = cx;
      state.prevY = cy;
    };

    const onPointerUp = () => {
      state.isDragging = false;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    state.cleanup = () => {
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };

    this.activeViewports.set(id, state);
    this.#startLoop();
    return state;
  }

  setWireframe(id, enabled) {
    const vp = this.activeViewports.get(id);
    if (!vp) return;
    vp.wireframe = enabled;
    vp.meshGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = enabled;
      }
    });
  }

  toggleAutoRotate(id) {
    const vp = this.activeViewports.get(id);
    if (!vp) return false;
    vp.autoRotate = !vp.autoRotate;
    return vp.autoRotate;
  }

  unmountViewport(id) {
    const vp = this.activeViewports.get(id);
    if (vp) {
      vp.cleanup();
      this.activeViewports.delete(id);
    }
  }

  clearCardViewports() {
    for (const [id] of this.activeViewports) {
      if (id.startsWith('card-')) {
        this.unmountViewport(id);
      }
    }
  }

  #startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const tick = () => {
      this.activeViewports.forEach((vp) => {
        if (vp.autoRotate && !vp.isDragging) {
          vp.rotY += 0.011;
        }
        vp.meshGroup.rotation.y = vp.rotY;
        vp.meshGroup.rotation.x = vp.rotX;
        vp.meshGroup.position.y = Math.sin(performance.now() * 0.0022) * 0.05;
        vp.renderer.render(vp.scene, vp.camera);
      });
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
