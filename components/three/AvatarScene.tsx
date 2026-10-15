"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { avatarConfig } from "../../data/avatar";

type ModelState = "loading" | "ready" | "error";

function disposeModel(object: THREE.Object3D, extraTextures: THREE.Texture[] = []) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>(extraTextures);
  const bitmaps = new Set<ImageBitmap>();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (!mesh.material) return;

    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (!(value instanceof THREE.Texture)) return;
        textures.add(value);
        const images = Array.isArray(value.source.data)
          ? value.source.data
          : [value.source.data];
        images.forEach((image) => {
          if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
            bitmaps.add(image);
          }
        });
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  bitmaps.forEach((bitmap) => bitmap.close());
}

function upperBodyBounds(object: THREE.Object3D, cutoff: number, samples: number[]) {
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();

  object.traverse((child) => {
    if ((child as THREE.Sprite).isSprite) return;
    const mesh = child as THREE.Mesh;
    const positions = mesh.geometry?.attributes.position;
    if (!positions) return;

    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
      if (point.y >= cutoff) {
        bounds.expandByPoint(point);
        samples.push(point.x, point.y, point.z);
      }
    }
  });

  return bounds;
}

function createScreenTexture(design: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = design ? "#dce6f5" : "#142640";
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = "#19263b";
    context.fillRect(0, 0, 512, 25);
    ["#8cadd9", "#689aff", "#c6dcff"].forEach((color, index) => {
      context.fillStyle = color;
      context.beginPath();
      context.arc(14 + index * 14, 12, 3, 0, Math.PI * 2);
      context.fill();
    });

    if (design) {
      context.fillStyle = "#22324b";
      context.fillRect(0, 25, 54, 231);
      context.fillStyle = "#afbdd1";
      for (let row = 0; row < 7; row += 1) context.fillRect(13, 45 + row * 22, 27, 4);
      context.fillStyle = "#f8faff";
      context.fillRect(87, 45, 336, 177);
      context.fillStyle = "#689aff";
      context.fillRect(102, 60, 144, 100);
      context.fillStyle = "#20314c";
      context.font = "bold 44px sans-serif";
      context.fillText("DM", 122, 127);
      context.fillStyle = "#2e405e";
      context.fillRect(264, 69, 126, 8);
      context.fillStyle = "#b2c3db";
      for (let row = 0; row < 4; row += 1) context.fillRect(264, 94 + row * 14, 117 - row * 9, 4);
      ["#20314c", "#689aff", "#b8d3ff", "#dce6f5"].forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(104 + index * 72, 178, 57, 24);
      });
    } else {
      context.fillStyle = "#101e32";
      context.fillRect(0, 25, 80, 231);
      context.fillStyle = "#526f98";
      for (let row = 0; row < 8; row += 1) context.fillRect(13, 46 + row * 18, 44 - row % 3 * 8, 3);
      const lines = [
        "const portfolio = () => {",
        "  const ideas = create();",
        "  return (",
        "    <Experience>",
        "      <Design />",
        "      <Development />",
        "    </Experience>",
        "  );",
        "};",
      ];
      context.font = "13px monospace";
      lines.forEach((line, index) => {
        context.fillStyle = index % 3 === 0 ? "#a5c6ff" : index % 3 === 1 ? "#8ee0ea" : "#d5e3fb";
        context.fillText(line, 111 + index % 2 * 7, 51 + index * 20);
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createScreenGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255, 255, 255, .55)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, .28)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, .08)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLaptopScreen() {
  const textures = [createScreenTexture(false), createScreenTexture(true), createScreenGlowTexture()];
  const geometry = new THREE.BufferGeometry();
  const coordinates = [
    -0.16, 0.0974, 0.2486,
    0.307, 0.0964, 0.2466,
    0.347, 0.3054, 0.3556,
    -0.15, 0.3064, 0.3576,
  ];
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(coordinates, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([1, 0, 0, 0, 0, 1, 1, 1], 2));
  geometry.setIndex([0, 2, 1, 0, 3, 2]);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x263149,
    map: textures[0],
    emissive: 0xffffff,
    emissiveMap: textures[0],
    emissiveIntensity: 0,
    roughness: 0.95,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const panel = new THREE.Mesh(geometry, material);
  const light = new THREE.SpotLight(0xaacfff, 0, 5, 0.5, 1, 2);
  light.position.set(0.085, 0.245, 0.309);
  const target = new THREE.Object3D();
  target.position.set(0.015, 0.555, -0.1);
  light.target = target;
  const chestLight = new THREE.SpotLight(0x9dc5ff, 0, 4.5, 0.48, 1, 2);
  chestLight.position.set(0.1, 0.185, 0.285);
  const chestTarget = new THREE.Object3D();
  chestTarget.position.set(0.015, 0.355, -0.13);
  chestLight.target = chestTarget;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: textures[2],
    color: 0x689aff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  }));
  glow.position.set(0.095, 0.213, 0.304);
  glow.scale.set(0.69, 0.4, 1);
  glow.renderOrder = 1;
  glow.visible = false;
  const group = new THREE.Group();
  group.name = "laptop-screen";
  group.add(panel, light, target, chestLight, chestTarget, glow);
  return { group, light, chestLight, material, textures, glow };
}

export default function AvatarScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const stateContainer = canvas?.closest<HTMLElement>(".story-avatar");
    const hero = canvas?.closest<HTMLElement>("#hero");
    const stage = canvas?.closest<HTMLElement>(".story-stage");
    if (!canvas || !container) return;

    const compactQuery = window.matchMedia("(max-width: 767px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    let reducedMotion = motionQuery.matches;
    let mobile = compactQuery.matches;
    let disposed = false;
    let loaded = false;
    let contextLost = false;
    let inView = true;
    let modelState: ModelState = "loading";
    let frame = 0;
    let lastTimestamp = 0;
    const pointer = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let laptopScreen: ReturnType<typeof createLaptopScreen> | null = null;

    const setModelState = (state: ModelState, message?: string) => {
      if (disposed) return;
      const changed = modelState !== state;
      modelState = state;
      canvas.dataset.modelState = state;
      if (stateContainer) stateContainer.dataset.modelState = state;

      if (state === "ready") canvas.dataset.sceneReady = "true";
      else delete canvas.dataset.sceneReady;

      if (changed && state !== "loading") {
        (stateContainer ?? container).dispatchEvent(
          new CustomEvent(`avatar:${state}`, {
            bubbles: true,
            detail: { state, message },
          }),
        );
      }
    };

    setModelState("loading");
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: mobile ? "low-power" : "high-performance",
      });
    } catch {
      canvas.style.display = "none";
      setModelState("error", "WebGL is unavailable.");
      return;
    }

    canvas.style.display = "block";
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    const pivot = new THREE.Group();
    const placement = new THREE.Group();
    const centered = new THREE.Group();
    placement.position.set(...avatarConfig.position);
    placement.rotation.set(...avatarConfig.rotation);
    placement.add(centered);
    pivot.add(placement);
    scene.add(pivot);

    const ambient = new THREE.HemisphereLight(0xb8c7df, 0x48576f, 1.45);
    // Keep the warm lamp color while lifting the face and the shaded side.
    const key = new THREE.DirectionalLight(0xffeddc, 1.65);
    const roomKeyColor = new THREE.Color(0xffeddc);
    const portraitKeyColor = new THREE.Color(0xffd39b);
    key.position.set(-3, 3.5, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.camera.far = 16;
    key.shadow.normalBias = 0.02;
    key.shadow.bias = -0.0002;
    key.shadow.intensity = 0.018;
    const fill = new THREE.DirectionalLight(0xb8c9e0, 0.85);
    fill.position.set(4, 1.5, 4);
    const rim = new THREE.DirectionalLight(0x6f9fff, 0.85);
    rim.position.set(2.5, 3, -3.8);
    scene.add(ambient, key, fill, rim);

    const framing = {
      width: 1,
      height: 3,
      points: new Float32Array(0),
      target: new THREE.Vector3(),
    };

    const readTurn = () => {
      if (reducedMotion) return avatarConfig.poses[0];
      const value = Number.parseFloat(hero?.dataset.avatarTurn ?? "");
      return Number.isFinite(value) ? value : avatarConfig.poses[0];
    };

    const updatePose = () => {
      const motion = reducedMotion ? 0 : 1;
      const yaw = readTurn() + current.x * 0.014 * motion;
      pivot.rotation.set(current.y * 0.008 * motion, yaw, 0);
      const angle = yaw.toFixed(4);
      canvas.dataset.avatarAngle = angle;
      canvas.dataset.modelYaw = angle;
      const beat = stage?.dataset.activeBeat;
      const storyProgress = Number.parseFloat(hero?.dataset.storyProgress ?? "0") || 0;
      const introLight = reducedMotion || stage?.classList.contains("is-static")
        ? 1
        : 1 - THREE.MathUtils.smoothstep(storyProgress, 0.1, 0.3);
      const closingLight = THREE.MathUtils.smoothstep(storyProgress, 0.55, 0.7);
      const portraitLight = Math.max(introLight, closingLight);
      // Match the opening and closing portraits with a soft golden lamp light.
      key.color.lerpColors(roomKeyColor, portraitKeyColor, portraitLight);
      key.intensity = 1.65 + portraitLight * 0.8;
      ambient.intensity = 1.45 + portraitLight * 0.35;
      fill.intensity = 0.85 + portraitLight * 0.15;
      const screenBeat = beat === "1" || beat === "2";
      const screenVisibility = screenBeat && !reducedMotion
        ? THREE.MathUtils.smoothstep(-Math.cos(yaw), 0.08, 0.8)
        : 0;

      if (laptopScreen) {
        const texture = laptopScreen.textures[beat === "2" ? 1 : 0];
        const screenPower = beat === "2" ? 1 : 0.85;
        laptopScreen.material.map = texture;
        laptopScreen.material.emissiveMap = texture;
        // Screen illumination follows the model even when its back faces the
        // camera. Only the decorative halo depends on the viewing angle.
        laptopScreen.material.emissiveIntensity = screenPower * 1.35;
        laptopScreen.light.intensity = screenPower * 2.75;
        laptopScreen.chestLight.intensity = screenPower * 1.5;
        laptopScreen.glow.visible = screenVisibility > 0.001;
        laptopScreen.glow.material.opacity = screenVisibility * (beat === "2" ? 0.2 : 0.35);
      }
      canvas.dataset.screenLight = (laptopScreen?.light.intensity ?? 0).toFixed(3);
      canvas.dataset.screenChestLight = (laptopScreen?.chestLight.intensity ?? 0).toFixed(3);
      canvas.dataset.screenGlow = (laptopScreen?.glow.material.opacity ?? 0).toFixed(3);
    };

    const fitCamera = () => {
      const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const tangent = Math.tan(halfFov);
      const heightDistance = framing.height * 0.98 / (2 * tangent);
      const widthDistance = framing.width * 1.1 / (2 * tangent * camera.aspect);
      let distance = Math.max(heightDistance, widthDistance);

      for (let index = 0; index < framing.points.length; index += 3) {
        const x = Math.abs(framing.points[index] - framing.target.x);
        const y = Math.max(0, framing.points[index + 1] - framing.target.y);
        const z = framing.points[index + 2] - framing.target.z;
        distance = Math.max(distance, x * 1.1 / (tangent * camera.aspect) + z, y * 1.04 / tangent + z);
      }
      distance += framing.height * 0.04;
      camera.position.set(
        framing.target.x,
        framing.target.y + 0.08,
        framing.target.z + distance,
      );
      camera.lookAt(framing.target);
      camera.zoom = stage?.classList.contains("is-static") ? 1 : mobile ? 1.02 : 1.07;
      camera.updateProjectionMatrix();
    };

    const renderScene = () => {
      if (disposed || !loaded || contextLost) return;
      updatePose();

      try {
        renderer.render(scene, camera);
        setModelState("ready");
      } catch {
        setModelState("error", "The avatar could not be rendered.");
      }
    };

    const canRender = () =>
      !disposed && loaded && modelState !== "error" && !contextLost && inView && !document.hidden;

    const animate = (timestamp: number) => {
      frame = 0;
      if (!canRender()) return;
      const interval = 1000 / (mobile ? 30 : 60);

      if (lastTimestamp && timestamp - lastTimestamp < interval - 0.5) {
        frame = window.requestAnimationFrame(animate);
        return;
      }

      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : interval / 1000;
      lastTimestamp = timestamp;
      const smoothing = 1 - Math.exp(-delta * 5);
      current.x += (pointer.x - current.x) * smoothing;
      current.y += (pointer.y - current.y) * smoothing;
      const moving = !reducedMotion && (Math.abs(pointer.x - current.x) > 0.001 || Math.abs(pointer.y - current.y) > 0.001);
      if (!moving) {
        current.x = pointer.x;
        current.y = pointer.y;
      }
      renderScene();
      if (canRender() && moving) frame = window.requestAnimationFrame(animate);
      else lastTimestamp = 0;
    };

    const syncAnimation = () => {
      if (canRender()) {
        if (!frame) {
          lastTimestamp = 0;
          frame = window.requestAnimationFrame(animate);
        }
      } else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const resize = () => {
      if (disposed) return;
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      mobile = compactQuery.matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      fitCamera();
      syncAnimation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch" || !inView) return;
      pointer.x = THREE.MathUtils.clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
      pointer.y = THREE.MathUtils.clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
      syncAnimation();
    };

    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
      syncAnimation();
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      current.x = 0;
      current.y = 0;
      pointer.x = 0;
      pointer.y = 0;
      syncAnimation();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      setModelState("error", "The WebGL context was lost.");
      syncAnimation();
    };

    const onContextRestored = () => {
      contextLost = false;
      setModelState("loading");
      renderScene();
      syncAnimation();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncAnimation();
      },
      { threshold: 0.01 },
    );

    resizeObserver.observe(container);
    intersectionObserver.observe(stateContainer ?? container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", syncAnimation);
    motionQuery.addEventListener("change", onMotionChange);
    compactQuery.addEventListener("change", resize);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    canvas.addEventListener("avatar:render", syncAnimation);
    resize();

    const loadModel = async () => {
      let model: THREE.Object3D | null = null;

      try {
        if (!avatarConfig.modelUrl) throw new Error("No avatar model is configured.");
        const response = await fetch(avatarConfig.modelUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Model request failed (${response.status}).`);
        const buffer = await response.arrayBuffer();
        if (disposed) return;
        const basePath = new URL(".", new URL(avatarConfig.modelUrl, window.location.href)).href;
        const gltf = await new GLTFLoader().parseAsync(buffer, basePath);
        model = gltf.scene;

        if (disposed) {
          disposeModel(model);
          return;
        }

        model.updateMatrixWorld(true);
        const originalBounds = new THREE.Box3().setFromObject(model);
        const size = originalBounds.getSize(new THREE.Vector3());
        const center = originalBounds.getCenter(new THREE.Vector3());
        if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("The model has invalid bounds.");
        model.position.sub(center);
        centered.scale.setScalar(3 / size.y * (avatarConfig.scale ?? 1));
        centered.add(model);

        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            if (!(material instanceof THREE.MeshStandardMaterial)) return;
            material.metalness = Math.min(material.metalness, 0.1);
            material.roughness = THREE.MathUtils.clamp(material.roughness, 0.45, 0.9);
            if (material.map) {
              material.map.anisotropy = Math.min(mobile ? 2 : 8, renderer.capabilities.getMaxAnisotropy());
            }
          });
        });

        laptopScreen = createLaptopScreen();
        model.add(laptopScreen.group);
        let maxWidth = 0;
        const samples: number[] = [];
        for (const pose of avatarConfig.poses) {
          pivot.rotation.y = pose;
          pivot.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(pivot);
          const extent = bounds.getSize(new THREE.Vector3());
          const focus = upperBodyBounds(pivot, bounds.min.y + extent.y * 0.27, samples);
          const horizontalRadius = focus.isEmpty()
            ? extent.x * 0.5
            : Math.max(
                Math.abs(focus.min.x - avatarConfig.position[0]),
                Math.abs(focus.max.x - avatarConfig.position[0]),
              );
          maxWidth = Math.max(maxWidth, horizontalRadius * 2);
          framing.height = extent.y;
          framing.target.set(
            avatarConfig.position[0],
            bounds.max.y - extent.y * 0.43,
            avatarConfig.position[2],
          );
        }
        framing.width = maxWidth || framing.height * 0.75;
        framing.points = Float32Array.from(samples);
        loaded = true;
        resize();
        syncAnimation();
      } catch (error) {
        if (disposed) return;
        if (model) {
          centered.remove(model);
          disposeModel(model, laptopScreen?.textures ?? []);
          laptopScreen = null;
        }
        setModelState("error", error instanceof Error ? error.message : "The avatar could not be loaded.");
      }
    };

    void loadModel();

    return () => {
      disposed = true;
      controller.abort();
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", syncAnimation);
      motionQuery.removeEventListener("change", onMotionChange);
      compactQuery.removeEventListener("change", resize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      canvas.removeEventListener("avatar:render", syncAnimation);
      disposeModel(scene, laptopScreen?.textures ?? []);
      key.shadow.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      delete canvas.dataset.sceneReady;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="avatar-canvas"
      data-model-state="loading"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
