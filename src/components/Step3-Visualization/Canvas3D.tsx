/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProjectState } from '../../types';
import { Info, ZoomIn, ZoomOut, RotateCcw, Box, Home, Eye, LayoutGrid, MousePointer2 } from 'lucide-react';

export type LightConfig = { pendant: boolean; spots: boolean; underCabinet: boolean };

interface Canvas3DProps {
  project: ProjectState;
  externalPreset?: 'perspective' | 'front' | 'side' | 'top' | 'isometric';
  onChangePreset?: (preset: 'perspective' | 'front' | 'side' | 'top' | 'isometric') => void;
  showHeatmap?: boolean;
  showWalls?: boolean;
  hiddenModules?: Set<string>;
  modulePositions?: Record<string, number>;
  moduleZOffsets?: Record<string, number>;
  moduleYOffsets?: Record<string, number>;
  moduleRotations?: Record<string, number>;
  lightConfig?: LightConfig;
  selectedModuleId?: string | null;
  onModuleClick?: (moduleId: string, moduleName: string) => void;
}

export default function Canvas3D({
  project,
  externalPreset,
  onChangePreset,
  showHeatmap = false,
  showWalls = true,
  hiddenModules,
  modulePositions,
  moduleZOffsets,
  moduleYOffsets,
  moduleRotations,
  lightConfig,
  selectedModuleId,
  onModuleClick,
}: Canvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const rotationRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.5 });
  const zoomRef = useRef<number>(7.2);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.1, 0));
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [activePreset, setActivePreset] = useState<'perspective' | 'front' | 'side' | 'top' | 'isometric'>('perspective');
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const totalMovedRef = useRef(0);

  // Selectable module tracking
  const selectableObjectsRef = useRef<THREE.Object3D[]>([]);
  const moduleGroupsRef = useRef<Map<string, { group: THREE.Object3D; name: string }>>(new Map());

  // Apply position offsets and Y rotation to a module group
  const applyModuleTransform = (obj: THREE.Object3D, moduleId: string) => {
    if (modulePositions?.[moduleId] !== undefined) obj.position.x += modulePositions[moduleId];
    if (moduleZOffsets?.[moduleId]  !== undefined) obj.position.z += moduleZOffsets[moduleId];
    if (moduleYOffsets?.[moduleId]  !== undefined) obj.position.y += moduleYOffsets[moduleId];
    if (moduleRotations?.[moduleId] !== undefined) obj.rotation.y  = moduleRotations[moduleId];
  };

  // Register a THREE object as a selectable module
  const registerModule = (obj: THREE.Object3D, moduleId: string, moduleName: string) => {
    obj.userData.moduleId = moduleId;
    obj.userData.moduleName = moduleName;
    obj.traverse((child) => {
      child.userData.moduleId = moduleId;
      if ((child as THREE.Mesh).isMesh) {
        selectableObjectsRef.current.push(child);
      }
    });
    moduleGroupsRef.current.set(moduleId, { group: obj, name: moduleName });
  };

  const getMaterialColor = (hex: string) => new THREE.Color(hex);

  useEffect(() => {
    if (externalPreset && externalPreset !== activePreset) {
      applyPreset(externalPreset);
    }
  }, [externalPreset]);

  // Re-apply highlight whenever selectedModuleId changes (without full scene rebuild)
  useEffect(() => {
    moduleGroupsRef.current.forEach(({ group }, id) => {
      const isSelected = id === selectedModuleId;
      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.emissive !== undefined) {
            mat.emissive.set(isSelected ? '#2563eb' : '#000000');
            mat.emissiveIntensity = isSelected ? 0.35 : 0;
          }
        }
      });
    });
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [selectedModuleId]);

  const applyPreset = (preset: 'perspective' | 'front' | 'side' | 'top' | 'isometric') => {
    setActivePreset(preset);
    if (onChangePreset) onChangePreset(preset);
    if (!cameraRef.current) return;
    switch (preset) {
      case 'perspective':
        rotationRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.5 };
        zoomRef.current = 7.5;
        targetRef.current.set(0, 1.1, 0);
        break;
      case 'front':
        rotationRef.current = { theta: 0, phi: Math.PI / 2 };
        zoomRef.current = 6.4;
        targetRef.current.set(0, 1.3, 0);
        break;
      case 'side':
        rotationRef.current = { theta: Math.PI / 2, phi: Math.PI / 2 };
        zoomRef.current = 6.4;
        targetRef.current.set(0, 1.3, 0);
        break;
      case 'top':
        rotationRef.current = { theta: 0, phi: 0.01 };
        zoomRef.current = 8.5;
        targetRef.current.set(0, 0.4, 0);
        break;
      case 'isometric':
        rotationRef.current = { theta: -Math.PI / 6, phi: Math.PI / 3 };
        zoomRef.current = 8.0;
        targetRef.current.set(0, 1.0, 0);
        break;
    }
    updateCameraPosition();
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const r = zoomRef.current;
    const theta = rotationRef.current.theta;
    const phi = rotationRef.current.phi;
    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x + targetRef.current.x, y + targetRef.current.y, z + targetRef.current.z);
    cameraRef.current.lookAt(targetRef.current);
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPointerDown(true);
    totalMovedRef.current = 0;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    totalMovedRef.current += Math.abs(deltaX) + Math.abs(deltaY);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    rotationRef.current.theta -= deltaX * 0.0075;
    rotationRef.current.phi -= deltaY * 0.0075;
    const minPhi = 0.01;
    const maxPhi = Math.PI - 0.05;
    rotationRef.current.phi = Math.max(minPhi, Math.min(maxPhi, rotationRef.current.phi));
    updateCameraPosition();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPointerDown(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);

    // Treat as click if pointer barely moved
    if (totalMovedRef.current < 8 && canvasRef.current && cameraRef.current && selectableObjectsRef.current.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(selectableObjectsRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const moduleId: string = hit.userData.moduleId || '';
        const moduleName: string = hit.userData.moduleName || '';
        if (moduleId && onModuleClick) {
          onModuleClick(moduleId, moduleName);
        }
      } else {
        // Click on empty space → deselect
        if (onModuleClick) {
          onModuleClick('', '');
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    zoomRef.current += e.deltaY * 0.005;
    zoomRef.current = Math.max(2.5, Math.min(15, zoomRef.current));
    updateCameraPosition();
  };

  const adjustZoom = (direction: 'in' | 'out') => {
    zoomRef.current += direction === 'in' ? -0.8 : 0.8;
    zoomRef.current = Math.max(2.5, Math.min(15, zoomRef.current));
    updateCameraPosition();
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Clear selectable objects and module groups for this build
    selectableObjectsRef.current = [];
    moduleGroupsRef.current.clear();

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // ── IBL: environment map via PMREMGenerator ───────────────────────────
    // Gives PBR materials (lacquered cabinets, countertops, glass, steel)
    // accurate reflections of the sky/room atmosphere.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const lightMode = project.lightingMode || 'natural';

    // ── Sky color per style / light mode ──────────────────────────────────
    let skyHex = '#f2ede8';
    if (project.selectedStyle === 'industrial') skyHex = lightMode === 'cold' ? '#e8ecf0' : '#eceae6';
    else if (project.selectedStyle === 'japandi') skyHex = '#f4f1ea';
    else if (project.selectedStyle === 'classic') skyHex = '#f6f5f2';
    else if (lightMode === 'cold') skyHex = '#edf1f5';
    else if (lightMode === 'warm') skyHex = '#f5ece1';
    scene.background = new THREE.Color(skyHex);

    // ── Palette per light mode ─────────────────────────────────────────────
    type LightPalette = {
      hemiSky: string; hemiGround: string; hemiInt: number;
      keyColor: string; keyInt: number;
      fillColor: string; fillInt: number;
      rimColor: string;  rimInt: number;
      ambientColor: string; ambientInt: number;
      exposure: number;
    };
    const palette: LightPalette = lightMode === 'cold'
      ? { hemiSky: '#b8cce0', hemiGround: '#d0dce8', hemiInt: 0.38,
          keyColor: '#d8eaf8', keyInt: 1.85,
          fillColor: '#a8bcd0', fillInt: 0.48,
          rimColor:  '#d8e4f0', rimInt: 0.28,
          ambientColor: '#c4d4e4', ambientInt: 0.10,
          exposure: 0.92 }
      : lightMode === 'warm'
      ? { hemiSky: '#e8cfa8', hemiGround: '#d8bb90', hemiInt: 0.44,
          keyColor: '#f8d898', keyInt: 2.00,
          fillColor: '#d8a870', fillInt: 0.52,
          rimColor:  '#e8c888', rimInt: 0.32,
          ambientColor: '#dcc8a0', ambientInt: 0.12,
          exposure: 0.98 }
      : { hemiSky: '#c4d8f0', hemiGround: '#e4d8c8', hemiInt: 0.40,
          keyColor: '#f8f0e4', keyInt: 1.80,
          fillColor: '#b8c8e0', fillInt: 0.46,
          rimColor:  '#e4dcd4', rimInt: 0.26,
          ambientColor: '#f0ece8', ambientInt: 0.10,
          exposure: 0.90 };

    renderer.toneMappingExposure = palette.exposure;

    // ── IBL: env map with directional window hint ──────────────────────────
    // A bright spot at the key-light position gives metals a realistic
    // specular blob rather than a flat uniform reflection.
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(skyHex);
    const winHint = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 2.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.keyColor).multiplyScalar(2.8) })
    );
    winHint.position.set(6, 8, 5);
    winHint.lookAt(0, 0, 0);
    envScene.add(winHint);
    const groundHint = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.hemiGround) })
    );
    groundHint.rotation.x = Math.PI / 2;
    groundHint.position.y = -4;
    envScene.add(groundHint);
    const envMap = pmrem.fromScene(envScene, 0.02).texture;
    scene.environment = envMap;
    pmrem.dispose();

    // Hemisphere — sky/ground bounce (primary ambient source)
    const hemi = new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, palette.hemiInt);
    scene.add(hemi);

    // Low ambient — fills extreme shadow corners
    const ambientLight = new THREE.AmbientLight(palette.ambientColor, palette.ambientInt);
    scene.add(ambientLight);

    // Key light — main window/sun, hard shadows
    const keyLight = new THREE.DirectionalLight(palette.keyColor, palette.keyInt);
    keyLight.position.set(7, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.mapSize.width  = 4096;
    keyLight.shadow.mapSize.height = 4096;
    keyLight.shadow.camera.near   = 1;
    keyLight.shadow.camera.far    = 30;
    // Frustum sized to room + margin so every pixel is used
    const _sr = Math.max(project.dimensions.length, project.dimensions.width) / 100 / 2 + 1.5;
    keyLight.shadow.camera.left   = -_sr;
    keyLight.shadow.camera.right  =  _sr;
    keyLight.shadow.camera.top    =  _sr;
    keyLight.shadow.camera.bottom = -_sr;
    keyLight.shadow.bias          = -0.0002;
    keyLight.shadow.normalBias    =  0.018;
    scene.add(keyLight);

    // Fill light — opposite side, softer (no shadows)
    const fillLight = new THREE.DirectionalLight(palette.fillColor, palette.fillInt);
    fillLight.position.set(-6, 4, -5);
    scene.add(fillLight);

    // Rim / back light — depth separation from behind
    const rimLight = new THREE.DirectionalLight(palette.rimColor, palette.rimInt);
    rimLight.position.set(0, 7, -9);
    scene.add(rimLight);

    const roomLen = project.dimensions.length / 100;
    const roomWid = project.dimensions.width / 100;
    const roomHgt = project.dimensions.height / 100;
    const offsetLen = -roomLen / 2;
    const offsetWid = -roomWid / 2;

    // ── ARCHITECTURAL CEILING LIGHTS ──────────────────────────────────────
    const pendantColor  = lightMode === 'warm' ? '#fde68a' : lightMode === 'cold' ? '#bae6fd' : '#fef9c3';
    const ceilSpotColor = lightMode === 'warm' ? '#fef3c7' : lightMode === 'cold' ? '#e0f2fe' : '#fffbf0';

    // Central pendant lamp mesh (conditional)
    if (lightConfig?.pendant !== false) {
    const pendantGroup = new THREE.Group();
    const cordMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 })
    );
    cordMesh.position.y = roomHgt - 0.225;
    pendantGroup.add(cordMesh);

    const shadeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.06, 0.20, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.15, metalness: 0.75, side: THREE.DoubleSide })
    );
    shadeMesh.position.y = roomHgt - 0.56;
    pendantGroup.add(shadeMesh);

    const glowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 20),
      new THREE.MeshBasicMaterial({ color: pendantColor })
    );
    glowDisc.rotation.x = Math.PI / 2;
    glowDisc.position.y = roomHgt - 0.648;
    pendantGroup.add(glowDisc);
    scene.add(pendantGroup);

    // Pendant key point light (with shadow)
    const pendantLight = new THREE.PointLight(pendantColor, 1.6, roomLen * 3);
    pendantLight.position.set(0, roomHgt - 0.66, 0);
    pendantLight.castShadow = true;
    pendantLight.shadow.mapSize.width = 512;
    pendantLight.shadow.mapSize.height = 512;
    pendantLight.shadow.bias = -0.002;
    scene.add(pendantLight);
    } // end pendant conditional

    // Recessed ceiling spots (can optics) distributed across ceiling
    if (lightConfig?.spots !== false) {
    const spotsX = Math.max(2, Math.floor(roomLen / 1.4));
    const spotsZ = Math.max(1, Math.floor(roomWid / 2.2));
    for (let sx = 0; sx < spotsX; sx++) {
      for (let sz = 0; sz < spotsZ; sz++) {
        const xPos = offsetLen + ((sx + 0.5) / spotsX) * roomLen;
        const zPos = offsetWid + ((sz + 0.5) / spotsZ) * roomWid;
        if (Math.abs(xPos) < 0.6 && Math.abs(zPos) < 0.6) continue; // leave room for pendant

        const canMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.032, 0.038, 12),
          new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.25, metalness: 0.8 })
        );
        canMesh.position.set(xPos, roomHgt - 0.019, zPos);
        scene.add(canMesh);

        const gDiscMesh = new THREE.Mesh(
          new THREE.CircleGeometry(0.030, 14),
          new THREE.MeshBasicMaterial({ color: ceilSpotColor })
        );
        gDiscMesh.rotation.x = Math.PI / 2;
        gDiscMesh.position.set(xPos, roomHgt - 0.039, zPos);
        scene.add(gDiscMesh);

        const spotPt = new THREE.PointLight(ceilSpotColor, 0.40, roomHgt * 2.2);
        spotPt.position.set(xPos, roomHgt - 0.04, zPos);
        scene.add(spotPt);
      }
    }

    // Zenithal top fill light (diffuse skylight simulation)
    const zenithFill = new THREE.DirectionalLight(ceilSpotColor, 0.25);
    zenithFill.position.set(0, roomHgt + 2, 0);
    zenithFill.target.position.set(0, 0, 0);
    scene.add(zenithFill);
    scene.add(zenithFill.target);
    } // end spots conditional

    // ── FLOOR — physically based ───────────────────────────────────────────
    type FloorDef = { color: string; roughness: number; metalness: number; tile?: boolean };
    const floorDef: FloorDef = (() => {
      switch (project.selectedStyle) {
        case 'contemporary':     return { color: '#d8dce0', roughness: 0.18, metalness: 0.06, tile: true };
        case 'industrial':       return { color: '#5a5e62', roughness: 0.72, metalness: 0.12 };
        case 'japandi':          return { color: '#d4c9b4', roughness: 0.55, metalness: 0.02 };
        case 'classic':          return { color: '#e8e4dc', roughness: 0.22, metalness: 0.04, tile: true };
        case 'rustic_traditional': return { color: '#8b5e3c', roughness: 0.80, metalness: 0.01 };
        default:                 return { color: '#cfc5b4', roughness: 0.50, metalness: 0.03 };
      }
    })();

    const floorGeo = new THREE.PlaneGeometry(roomLen, roomWid);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorDef.color,
      roughness: floorDef.roughness,
      metalness: floorDef.metalness,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    if (floorDef.tile) {
      const gridHelper = new THREE.GridHelper(Math.max(roomLen, roomWid) + 1, 12, '#c8ccd0', '#d4d8dc');
      gridHelper.position.set(0, 0.003, 0);
      scene.add(gridHelper);
    }

    // ── WALLS — matte plaster ──────────────────────────────────────────────
    const wallHeight = roomHgt;
    const wallThickness = 0.15;
    const wallMat = new THREE.MeshStandardMaterial({ color: '#f5f2ee', roughness: 0.92, metalness: 0.0 });

    if (showWalls) {
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomLen + wallThickness, wallHeight, wallThickness), wallMat);
      backWall.position.set(0, wallHeight / 2, offsetWid - wallThickness / 2);
      backWall.receiveShadow = true;
      scene.add(backWall);

      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, roomWid + wallThickness), wallMat);
      leftWall.position.set(offsetLen - wallThickness / 2, wallHeight / 2, 0);
      leftWall.receiveShadow = true;
      scene.add(leftWall);

      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, roomHgt, roomWid + wallThickness), wallMat);
      rightWall.position.set(roomLen / 2 + wallThickness / 2, roomHgt / 2, 0);
      rightWall.receiveShadow = true;
      scene.add(rightWall);

      // Skirting boards
      const skirtingMat = new THREE.MeshStandardMaterial({ color: '#f2eeea', roughness: 0.35, metalness: 0.0 });
      const skirtingBack = new THREE.Mesh(new THREE.BoxGeometry(roomLen, 0.10, 0.022), skirtingMat);
      skirtingBack.position.set(0, 0.05, offsetWid + 0.012); skirtingBack.castShadow = true; scene.add(skirtingBack);
      const skirtingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.10, roomWid), skirtingMat);
      skirtingLeft.position.set(offsetLen + 0.012, 0.05, 0); skirtingLeft.castShadow = true; scene.add(skirtingLeft);
      const skirtingRight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.10, roomWid), skirtingMat);
      skirtingRight.position.set(roomLen / 2 - 0.012, 0.05, 0); scene.add(skirtingRight);

      // Cornice molding
      const corniceMat = new THREE.MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.40, metalness: 0.0 });
      const corniceBack = new THREE.Mesh(new THREE.BoxGeometry(roomLen, 0.055, 0.055), corniceMat);
      corniceBack.position.set(0, roomHgt - 0.028, offsetWid + 0.028); scene.add(corniceBack);
      const corniceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, roomWid), corniceMat);
      corniceLeft.position.set(offsetLen + 0.028, roomHgt - 0.028, 0); scene.add(corniceLeft);
      const corniceRight = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, roomWid), corniceMat);
      corniceRight.position.set(roomLen / 2 - 0.028, roomHgt - 0.028, 0); scene.add(corniceRight);

      // Window on right wall
      const winH = Math.min(roomHgt * 0.55, 1.80);
      const winW = Math.min(roomWid * 0.55, 1.80);
      const winCY = roomHgt * 0.52;
      const winX  = roomLen / 2 - 0.02;
      const winPane = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.keyColor).multiplyScalar(2.6) }));
      winPane.rotation.y = -Math.PI / 2;
      winPane.position.set(winX, winCY, 0);
      scene.add(winPane);
      const frameMat = new THREE.MeshStandardMaterial({ color: '#dcd8d0', roughness: 0.30, metalness: 0.05 });
      const fW = 0.055; const fD = 0.045;
      ([
        [winW + fW*2, fW,  0,              winCY + winH/2 + fW/2],
        [winW + fW*2, fW,  0,              winCY - winH/2 - fW/2],
        [fW, winH + fW*2, -winW/2 - fW/2, winCY],
        [fW, winH + fW*2,  winW/2 + fW/2, winCY],
        [fW, winH,          0,             winCY],
      ] as const).forEach(([fw, fh, fz, fy]) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(fD, fh, fw), frameMat);
        bar.position.set(winX - fD/2, fy, fz); bar.castShadow = true; scene.add(bar);
      });
      const winSpot = new THREE.SpotLight(palette.keyColor,
        lightMode === 'warm' ? 2.2 : lightMode === 'cold' ? 1.9 : 2.0,
        roomLen * 2.8, Math.PI / 5, 0.45, 1.8);
      winSpot.position.set(roomLen/2 + 0.5, winCY, 0);
      winSpot.target.position.set(-1, 0, 0);
      winSpot.castShadow = true;
      winSpot.shadow.mapSize.width = winSpot.shadow.mapSize.height = 1024;
      winSpot.shadow.bias = -0.001;
      scene.add(winSpot); scene.add(winSpot.target);
    }

    // ── CEILING (always visible) ───────────────────────────────────────────
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: '#f9f7f4', roughness: 0.98, metalness: 0.0, envMapIntensity: 0.03,
    });
    const ceilingPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(roomLen + wallThickness * 2, roomWid + wallThickness * 2), ceilingMat);
    ceilingPlane.rotation.x = Math.PI / 2;
    ceilingPlane.position.set(0, roomHgt, 0);
    ceilingPlane.receiveShadow = true;
    scene.add(ceilingPlane);

    // ── ATMOSPHERIC FOG ────────────────────────────────────────────────────
    scene.fog = new THREE.Fog(skyHex, roomLen * 2.5, roomLen * 7);

    const cDepth = project.furnitureDimensions ? (project.furnitureDimensions.depth / 100) : (project.ergonomics.counterDepth / 100);
    const cHeight = project.furnitureDimensions ? (project.furnitureDimensions.height / 100) : (project.ergonomics.calculatedCounterHeight / 100);
    const cLength = project.furnitureDimensions ? (project.furnitureDimensions.length / 100) : (roomLen - 0.05);
    const hasDGLAdepth = project.furnitureDimensions ? (project.furnitureDimensions.depth >= 80) : (project.ergonomics.counterDepth === 80);
    const isKitchen = project.spaceType === 'cocina';
    const includeAppliances = isKitchen && (project.kitchenEquipment?.includeAppliances !== false);
    const inverseFactor = project.kitchenEquipment?.inverseDistribution ? -1 : 1;
    const includeHighCabinets    = !isKitchen || (project.kitchenEquipment?.includeHighCabinets !== false);
    const includeBuiltInOven     = isKitchen && (project.kitchenEquipment?.includeBuiltInOven !== false);
    const includeIsland          = isKitchen
      ? (project.kitchenEquipment?.includeIsland !== false)
      : project.ergonomics.includeIsland;
    const includeRefrigerator    = isKitchen && (project.kitchenEquipment?.includeRefrigerator !== false);
    const includeDishwasherUnit  = isKitchen && (project.kitchenEquipment?.includeDishwasher !== false);

    const furnColorHex = project.materials.furnitureColor;
    const counterColorHex = project.materials.countertopColor;
    const backColorsHex = project.materials.backsplashColor;

    const cabinetColor = new THREE.Color(furnColorHex);
    const counterColor = new THREE.Color(counterColorHex);
    const splashColor = new THREE.Color(backColorsHex);

    // ── Procedural texture helpers ─────────────────────────────────────────
    const _textures: THREE.Texture[] = []; // collected for disposal

    const makeTex = (w: number, h: number, fn: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      fn(cv.getContext('2d')!);
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      _textures.push(t);
      return t;
    };

    const noiseNormal = (size: number, str: number): THREE.DataTexture => {
      const d = new Uint8Array(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        d[i*4]   = 127 + Math.round((Math.random()-0.5) * 255 * str);
        d[i*4+1] = 127 + Math.round((Math.random()-0.5) * 255 * str);
        d[i*4+2] = 255;
        d[i*4+3] = 255;
      }
      const t = new THREE.DataTexture(d, size, size, THREE.RGBAFormat);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.needsUpdate = true;
      _textures.push(t);
      return t;
    };

    const col2rgb = (hex: string) => {
      const c = new THREE.Color(hex);
      return [Math.round(c.r*255), Math.round(c.g*255), Math.round(c.b*255)] as const;
    };

    // ── Cabinet texture ────────────────────────────────────────────────────
    const isLacquered = project.materials.furniture !== 'wood';
    let _cabMap: THREE.Texture | undefined;
    let _cabNormal: THREE.DataTexture;

    if (isLacquered) {
      // High-gloss lacquer: tight micro-scratch normal
      _cabNormal = noiseNormal(256, 0.035);
      _cabNormal.repeat.set(12, 12);
    } else {
      // Wood grain procedural
      const [wr, wg, wb] = col2rgb(furnColorHex);
      _cabMap = makeTex(256, 1024, (c) => {
        c.fillStyle = `rgb(${wr},${wg},${wb})`;
        c.fillRect(0, 0, 256, 1024);
        for (let y = 0; y < 1024; y += 1.5 + Math.random() * 5) {
          c.strokeStyle = `rgba(${Math.random()>0.5?'30,15,5':'210,170,100'},${0.035 + Math.random()*0.08})`;
          c.lineWidth = 0.4 + Math.random() * 1.4;
          c.beginPath(); c.moveTo(0, y);
          for (let px = 0; px < 256; px += 10) c.lineTo(px, y + (Math.random()-0.5)*3);
          c.stroke();
        }
        // Board joints
        c.strokeStyle = 'rgba(20,10,5,0.25)';
        c.lineWidth = 2;
        [256, 512, 768].forEach(jy => { c.beginPath(); c.moveTo(0,jy); c.lineTo(256,jy); c.stroke(); });
      });
      _cabMap.repeat.set(1, 3);
      _cabNormal = noiseNormal(256, 0.12);
      _cabNormal.repeat.set(4, 4);
    }

    const cabMaterial = new THREE.MeshStandardMaterial({
      color: cabinetColor,
      roughness: project.materials.furniture === 'lacquered_melamine' ? 0.18
               : project.materials.furniture === 'lacquered_3d'       ? 0.26
               : 0.68,
      metalness: isLacquered ? 0.03 : 0.0,
      map: _cabMap,
      normalMap: _cabNormal,
      normalScale: new THREE.Vector2(isLacquered ? 0.04 : 0.28, isLacquered ? 0.04 : 0.28),
      envMapIntensity: project.materials.furniture === 'lacquered_melamine' ? 0.75
                     : project.materials.furniture === 'lacquered_3d'       ? 0.50
                     : 0.22,
    });

    // ── Countertop texture ─────────────────────────────────────────────────
    let _topMap: THREE.Texture | undefined;
    let _topNormal: THREE.DataTexture;
    const [cr, cg, cb] = col2rgb(counterColorHex);

    if (project.materials.countertop === 'marble') {
      _topMap = makeTex(1024, 1024, (c) => {
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.fillRect(0, 0, 1024, 1024);
        for (let v = 0; v < 14; v++) {
          const opacity = 0.06 + Math.random() * 0.16;
          c.strokeStyle = `rgba(100,95,88,${opacity})`;
          c.lineWidth = 0.6 + Math.random() * 2.8;
          c.beginPath();
          c.moveTo(Math.random()*1024, 0);
          c.bezierCurveTo(Math.random()*1024, Math.random()*600, Math.random()*1024, Math.random()*800, Math.random()*1024, 1024);
          c.stroke();
          if (Math.random() > 0.45) {
            c.strokeStyle = `rgba(100,95,88,${opacity*0.35})`;
            c.lineWidth = 0.25;
            c.beginPath();
            c.moveTo(Math.random()*1024, 0);
            c.bezierCurveTo(Math.random()*1024, Math.random()*400, Math.random()*1024, Math.random()*700, Math.random()*1024, 1024);
            c.stroke();
          }
        }
      });
      _topMap.repeat.set(1, 1);
      _topNormal = noiseNormal(512, 0.05);
      _topNormal.repeat.set(4, 4);
    } else if (project.materials.countertop === 'granite') {
      _topMap = makeTex(512, 512, (c) => {
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 5000; i++) {
          const v = (Math.random()-0.5)*60;
          c.fillStyle = `rgba(${Math.min(255,cr+v)},${Math.min(255,cg+v)},${Math.min(255,cb+v)},${0.25+Math.random()*0.55})`;
          c.beginPath();
          c.ellipse(Math.random()*512, Math.random()*512, Math.random()*3+0.5, Math.random()*2+0.3, Math.random()*Math.PI, 0, Math.PI*2);
          c.fill();
        }
      });
      _topNormal = noiseNormal(256, 0.18);
      _topNormal.repeat.set(3, 3);
    } else if (project.materials.countertop === 'stainless_steel') {
      _topMap = makeTex(512, 256, (c) => {
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.fillRect(0, 0, 512, 256);
        for (let y = 0; y < 256; y++) {
          c.strokeStyle = Math.random()>0.5 ? `rgba(255,255,255,${0.015+Math.random()*0.045})` : `rgba(0,0,0,${0.01+Math.random()*0.03})`;
          c.lineWidth = 0.4 + Math.random()*0.5;
          c.beginPath(); c.moveTo(0,y); c.lineTo(512,y+(Math.random()-0.5)*0.4); c.stroke();
        }
      });
      _topMap.repeat.set(3, 2);
      _topNormal = noiseNormal(256, 0.04);
      _topNormal.repeat.set(8, 6);
    } else if (project.materials.countertop === 'quartz') {
      _topMap = makeTex(512, 512, (c) => {
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 2500; i++) {
          const v = (Math.random()-0.5)*45;
          c.fillStyle = `rgba(${Math.min(255,cr+v)},${Math.min(255,cg+v)},${Math.min(255,cb+v)},${0.15+Math.random()*0.35})`;
          c.beginPath();
          c.arc(Math.random()*512, Math.random()*512, 0.4+Math.random()*2, 0, Math.PI*2);
          c.fill();
        }
      });
      _topNormal = noiseNormal(256, 0.07);
      _topNormal.repeat.set(4, 4);
    } else {
      _topNormal = noiseNormal(256, 0.10);
      _topNormal.repeat.set(3, 3);
    }

    const topMaterial = new THREE.MeshStandardMaterial({
      color: counterColor,
      roughness: project.materials.countertop === 'quartz'          ? 0.12
               : project.materials.countertop === 'marble'          ? 0.14
               : project.materials.countertop === 'stainless_steel' ? 0.28
               : project.materials.countertop === 'granite'         ? 0.38
               : 0.50,
      metalness: project.materials.countertop === 'stainless_steel' ? 0.82 : 0.02,
      map: _topMap,
      normalMap: _topNormal,
      normalScale: new THREE.Vector2(0.40, 0.40),
      envMapIntensity: project.materials.countertop === 'stainless_steel' ? 0.95
                     : project.materials.countertop === 'quartz'          ? 0.80
                     : project.materials.countertop === 'marble'          ? 0.70
                     : project.materials.countertop === 'granite'         ? 0.40
                     : 0.35,
    });

    // ── Backsplash texture ─────────────────────────────────────────────────
    let _splashMap: THREE.Texture | undefined;
    let _splashNormal: THREE.DataTexture;
    const [sr, sg, sb] = col2rgb(backColorsHex);

    if (project.materials.backsplash === 'ceramic_tile') {
      _splashMap = makeTex(512, 512, (c) => {
        c.fillStyle = `rgb(${sr},${sg},${sb})`;
        c.fillRect(0, 0, 512, 512);
        c.strokeStyle = 'rgba(148,142,134,0.55)';
        c.lineWidth = 4;
        [0,128,256,384,512].forEach(x => { c.beginPath(); c.moveTo(x,0); c.lineTo(x,512); c.stroke(); });
        [0,128,256,384,512].forEach(y => { c.beginPath(); c.moveTo(0,y); c.lineTo(512,y); c.stroke(); });
        for (let tx=0;tx<4;tx++) for (let ty=0;ty<4;ty++) {
          if (Math.random()>0.55) {
            const v=(Math.random()-0.5)*18;
            c.fillStyle=`rgba(${Math.min(255,sr+v)},${Math.min(255,sg+v)},${Math.min(255,sb+v)},0.35)`;
            c.fillRect(tx*128+3, ty*128+3, 122, 122);
          }
        }
      });
      _splashMap.repeat.set(roomLen * 2, 1.2);
      _splashNormal = noiseNormal(256, 0.06);
      _splashNormal.repeat.set(roomLen * 4, 2);
    } else if (project.materials.backsplash === 'stainless_steel') {
      _splashMap = makeTex(256, 256, (c) => {
        c.fillStyle = `rgb(${sr},${sg},${sb})`;
        c.fillRect(0, 0, 256, 256);
        for (let y=0;y<256;y++) {
          c.strokeStyle=Math.random()>0.5?`rgba(255,255,255,${0.018+Math.random()*0.04})` : `rgba(0,0,0,${0.01+Math.random()*0.025})`;
          c.lineWidth=0.4+Math.random()*0.5;
          c.beginPath(); c.moveTo(0,y); c.lineTo(256,y); c.stroke();
        }
      });
      _splashMap.repeat.set(4, 2);
      _splashNormal = noiseNormal(128, 0.04);
      _splashNormal.repeat.set(10, 5);
    } else {
      _splashNormal = noiseNormal(256, 0.05);
      _splashNormal.repeat.set(4, 2);
    }

    const splashMaterial = new THREE.MeshStandardMaterial({
      color: splashColor,
      roughness: project.materials.backsplash === 'tempered_glass'  ? 0.06
               : project.materials.backsplash === 'stainless_steel' ? 0.24
               : project.materials.backsplash === 'mirror'          ? 0.02
               : 0.60,
      metalness: project.materials.backsplash === 'stainless_steel' ? 0.84
               : project.materials.backsplash === 'mirror'          ? 0.92
               : project.materials.backsplash === 'tempered_glass'  ? 0.05
               : 0.01,
      map: _splashMap,
      normalMap: _splashNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      envMapIntensity: project.materials.backsplash === 'mirror'          ? 1.10
                     : project.materials.backsplash === 'stainless_steel' ? 0.90
                     : project.materials.backsplash === 'tempered_glass'  ? 0.80
                     : 0.35,
    });

    // ── Floor & Wall procedural textures (applied to existing materials) ─────
    {
      // Floor
      const [fr, fg, fb] = col2rgb(floorDef.color);

      if (floorDef.tile) {
        const fMap = makeTex(512, 512, (c) => {
          c.fillStyle = `rgb(${fr},${fg},${fb})`;
          c.fillRect(0, 0, 512, 512);
          c.strokeStyle = `rgba(${Math.max(0,fr-22)},${Math.max(0,fg-22)},${Math.max(0,fb-22)},0.6)`;
          c.lineWidth = 5;
          [0,256,512].forEach(x => { c.beginPath(); c.moveTo(x,0); c.lineTo(x,512); c.stroke(); });
          [0,256,512].forEach(y => { c.beginPath(); c.moveTo(0,y); c.lineTo(512,y); c.stroke(); });
          for (let tx=0;tx<2;tx++) for (let ty=0;ty<2;ty++) {
            const v=(Math.random()-0.5)*14;
            c.fillStyle=`rgba(${Math.min(255,fr+v)},${Math.min(255,fg+v)},${Math.min(255,fb+v)},0.38)`;
            c.fillRect(tx*256+4,ty*256+4,248,248);
          }
        });
        fMap.repeat.set(roomLen * 1.8, roomWid * 1.8);
        const fNorm = noiseNormal(256, 0.04);
        fNorm.repeat.set(roomLen * 4, roomWid * 4);
        floorMat.map = fMap;
        floorMat.normalMap = fNorm;
        floorMat.normalScale = new THREE.Vector2(0.2, 0.2);
        floorMat.envMapIntensity = 0.45;
      } else if (project.selectedStyle === 'japandi' || project.selectedStyle === 'rustic_traditional') {
        const wMap = makeTex(256, 1024, (c) => {
          c.fillStyle = `rgb(${fr},${fg},${fb})`;
          c.fillRect(0, 0, 256, 1024);
          for (let y=0;y<1024;y+=1.2+Math.random()*6) {
            c.strokeStyle=`rgba(${Math.random()>0.5?'25,12,4':'200,160,90'},${0.04+Math.random()*0.09})`;
            c.lineWidth=0.4+Math.random()*1.2;
            c.beginPath(); c.moveTo(0,y);
            for (let px=0;px<256;px+=8) c.lineTo(px,y+(Math.random()-0.5)*2.5);
            c.stroke();
          }
          c.strokeStyle='rgba(15,8,3,0.22)'; c.lineWidth=2;
          [256,512,768].forEach(jy=>{c.beginPath();c.moveTo(0,jy);c.lineTo(256,jy);c.stroke();});
        });
        wMap.repeat.set(roomLen*1.0, roomWid*0.7);
        const wNorm = noiseNormal(256, 0.10);
        wNorm.repeat.set(roomLen*3, roomWid*2);
        floorMat.map = wMap;
        floorMat.normalMap = wNorm;
        floorMat.normalScale = new THREE.Vector2(0.30, 0.30);
        floorMat.envMapIntensity = 0.18;
      } else if (project.selectedStyle === 'industrial') {
        const cMap = makeTex(512, 512, (c) => {
          c.fillStyle = `rgb(${fr},${fg},${fb})`;
          c.fillRect(0, 0, 512, 512);
          for (let i=0;i<9000;i++) {
            const v=(Math.random()-0.5)*28;
            const g=Math.min(255,Math.max(0,fr+v));
            c.fillStyle=`rgba(${g},${g},${g},${0.08+Math.random()*0.22})`;
            c.beginPath();
            c.arc(Math.random()*512,Math.random()*512,Math.random()*2.5,0,Math.PI*2);
            c.fill();
          }
        });
        cMap.repeat.set(2, 2);
        const cNorm = noiseNormal(512, 0.20);
        cNorm.repeat.set(5, 5);
        floorMat.map = cMap;
        floorMat.normalMap = cNorm;
        floorMat.normalScale = new THREE.Vector2(0.40, 0.40);
        floorMat.envMapIntensity = 0.10;
      }
      floorMat.needsUpdate = true;

      // Wall plaster micro-texture
      const wallNorm = noiseNormal(512, 0.055);
      wallNorm.repeat.set(6, 3);
      wallMat.normalMap = wallNorm;
      wallMat.normalScale = new THREE.Vector2(0.12, 0.12);
      wallMat.needsUpdate = true;
    }

    // Backsplash (kitchen only)
    const splashH = 0.60;
    if (isKitchen) {
      const splashGeo = new THREE.BoxGeometry(roomLen, splashH, 0.015);
      const backsplash = new THREE.Mesh(splashGeo, splashMaterial);
      backsplash.position.set(0, cHeight + splashH / 2, offsetWid + 0.01);
      backsplash.receiveShadow = true;
      scene.add(backsplash);
    }

    // Under-cabinet LED strip (kitchen only + conditional)
    const ledColor = lightMode === 'warm' ? '#fde68a' : lightMode === 'cold' ? '#e0f9ff' : '#fef08a';
    if (isKitchen && lightConfig?.underCabinet !== false) {
      const ledStripMesh = new THREE.Mesh(
        new THREE.BoxGeometry(roomLen - 0.2, 0.015, 0.015),
        new THREE.MeshBasicMaterial({ color: ledColor })
      );
      ledStripMesh.position.set(0, cHeight + splashH - 0.008, offsetWid + cDepth - 0.14);
      scene.add(ledStripMesh);

      const ledCount = Math.max(3, Math.ceil(roomLen / 0.9));
      for (let li = 0; li < ledCount; li++) {
        const lx = offsetLen + 0.1 + ((li + 0.5) / ledCount) * (roomLen - 0.2);
        const ledPt = new THREE.PointLight(ledColor, 0.55, 1.6);
        ledPt.position.set(lx, cHeight + splashH - 0.06, offsetWid + cDepth - 0.10);
        scene.add(ledPt);
      }
    }

    // Helper: build a single base cabinet segment
    const createCounterSegment = (xPos: number, width: number, zPos: number, rotY: number = 0) => {
      const group = new THREE.Group();
      const kHeight = 0.12;
      const cabH = cHeight - kHeight;

      const carcassGeo = new THREE.BoxGeometry(width, cabH, cDepth - 0.02);
      const cabinet = new THREE.Mesh(carcassGeo, cabMaterial);
      cabinet.position.y = cabH / 2 + kHeight;
      cabinet.position.z = -0.01;
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      group.add(cabinet);

      const kickMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });
      const kickGeo = new THREE.BoxGeometry(width, kHeight, cDepth - 0.06);
      const kick = new THREE.Mesh(kickGeo, kickMat);
      kick.position.y = kHeight / 2;
      kick.position.z = 0.03;
      group.add(kick);

      const doorW = width / 2;
      const doorH = cabH - 0.02;
      const dcType = project.kitchenEquipment?.doorCloseType ?? 'soft_close';
      const handleMat = new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.92, roughness: 0.08 });

      for (let i = 0; i < 2; i++) {
        const xCenter = -doorW / 2 + doorW * i + (i === 0 ? 0.005 : -0.005);
        const door = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.01, doorH, 0.02), cabMaterial);
        door.position.set(xCenter, cabH / 2 + kHeight, cDepth / 2 - 0.01);
        door.castShadow = true;
        group.add(door);

        if (dcType === 'push_open') {
          // No handle — clean face, small push dot
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), handleMat);
          dot.rotation.x = -Math.PI / 2; dot.rotation.z = Math.PI / 2;
          dot.position.set(xCenter, door.position.y + doorH / 2 - 0.05, door.position.z + 0.011);
          group.add(dot);
        } else if (dcType === 'rail_handle') {
          // Full-width integrated profile groove
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(doorW - 0.04, 0.022, 0.012),
            new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.12, metalness: 0.85 })
          );
          rail.position.set(xCenter, door.position.y + doorH / 2 - 0.03, door.position.z + 0.011);
          group.add(rail);
        } else if (dcType === 'handle') {
          // Classic bar pull handle
          const pull = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.014, 0.022), handleMat);
          pull.position.set(xCenter, door.position.y + doorH / 2 - 0.06, door.position.z + 0.018);
          group.add(pull);
        } else {
          // soft_close — subtle line (existing style)
          const line = new THREE.Mesh(
            new THREE.BoxGeometry(doorW - 0.03, 0.018, 0.01),
            new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.1, metalness: 0.8 })
          );
          line.position.set(xCenter, door.position.y + doorH / 2 - 0.03, door.position.z + 0.011);
          group.add(line);
        }
      }

      group.position.set(xPos, 0, zPos);
      group.rotation.y = rotY;
      return group;
    };

    const activeLayout = project.newLayout !== 'none' ? project.newLayout : project.currentLayout;
    const slabL = cLength;

    // ── SHARED APPLIANCE MATERIALS (used inside and outside activeLayout block)
    const appStainless = new THREE.MeshStandardMaterial({
      color: '#bec8d0', metalness: 0.82, roughness: 0.24, envMapIntensity: 0.90,
    });
    const appDarkPanel = new THREE.MeshStandardMaterial({
      color: '#0d1117', roughness: 0.12, metalness: 0.18, envMapIntensity: 0.40,
    });
    const appGlass = new THREE.MeshStandardMaterial({
      color: '#1a2636', roughness: 0.06, metalness: 0.04,
      transparent: true, opacity: 0.68, envMapIntensity: 1.00,
    });
    const appRubber   = new THREE.MeshStandardMaterial({ color: '#191919', roughness: 0.97, metalness: 0.0 });
    const appHandle   = new THREE.MeshStandardMaterial({ color: '#d8e0e8', metalness: 0.88, roughness: 0.18, envMapIntensity: 0.85 });
    const appLedGreen  = new THREE.MeshBasicMaterial({ color: '#4ade80' });
    const appLedOrange = new THREE.MeshBasicMaterial({ color: '#fb923c' });
    const appDisp      = new THREE.MeshBasicMaterial({ color: '#050810' });
    const appDispLit   = new THREE.MeshBasicMaterial({ color: '#1e3a5f' });

    // ── BASE COUNTER SEGMENTS (back wall) ─────────────────────────────────
    if (activeLayout !== 'none') {
      const segWidth = 0.80;
      const counts = Math.max(1, Math.min(Math.floor(cLength / segWidth), 6));
      const startX = -((counts - 1) * segWidth) / 2;
      const skipIndex = !project.kitchenEquipment?.inverseDistribution ? 0 : (counts - 1);

      for (let i = 0; i < counts; i++) {
        if (i === skipIndex && project.ergonomics.dishwasherColumn && isKitchen && includeAppliances) continue;

        const moduleId = `back_counter_${i}`;
        if (hiddenModules?.has(moduleId)) continue;

        const xCoord = startX + i * segWidth;
        const segment = createCounterSegment(xCoord, segWidth - 0.02, offsetWid + cDepth / 2);
        applyModuleTransform(segment, moduleId);
        registerModule(segment, moduleId, `Módulo Base ${i + 1}`);
        scene.add(segment);
      }

      // ── MAIN COUNTERTOP SLAB ───────────────────────────────────────────
      if (!hiddenModules?.has('countertop_main')) {
        const slabGeo = new THREE.BoxGeometry(slabL, 0.04, cDepth);
        const slab = new THREE.Mesh(slabGeo, topMaterial);
        slab.receiveShadow = true;
        slab.castShadow = true;
        const slabGroup = new THREE.Group();
        slab.position.set(0, 0, 0);
        slabGroup.add(slab);
        slabGroup.position.set(0, cHeight - 0.02, offsetWid + cDepth / 2);
        applyModuleTransform(slabGroup, 'countertop_main');
        registerModule(slabGroup, 'countertop_main', 'Encimera Principal');
        scene.add(slabGroup);
      }

      // DGLA 80cm signature back channel (decorative, non-selectable)
      if (hasDGLAdepth && isKitchen) {
        const channelW = Math.max(0.4, slabL - 0.6);
        const channelD = 0.18;
        const channelH = 0.06;
        const channelGeo = new THREE.BoxGeometry(channelW, channelH, channelD);
        const channelMat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.2, metalness: 0.9 });
        const dgaChannel = new THREE.Mesh(channelGeo, channelMat);
        dgaChannel.position.set(0, cHeight - 0.01, offsetWid + channelD / 2 + 0.01);
        scene.add(dgaChannel);

        const herbColors = ['#4ade80', '#22c55e', '#166534'];
        for (let k = 0; k < 3; k++) {
          const potGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.08, 12);
          const potMat = new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.3 });
          const pot = new THREE.Mesh(potGeo, potMat);
          pot.position.set(-channelW / 4 + k * 0.15, cHeight + 0.03, offsetWid + 0.06);
          scene.add(pot);
          const leafGeo = new THREE.SphereGeometry(0.045, 8, 8);
          const leafMat = new THREE.MeshStandardMaterial({ color: herbColors[k], roughness: 0.9 });
          const leaves = new THREE.Mesh(leafGeo, leafMat);
          leaves.position.set(pot.position.x, pot.position.y + 0.04, pot.position.z);
          scene.add(leaves);
        }

        const knifeBlockGeo = new THREE.BoxGeometry(0.12, 0.05, 0.08);
        const knifeBlockMat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.7 });
        const knifeBlock = new THREE.Mesh(knifeBlockGeo, knifeBlockMat);
        knifeBlock.position.set(channelW / 4, cHeight + 0.02, offsetWid + 0.08);
        scene.add(knifeBlock);
        for (let j = 0; j < 3; j++) {
          const bladeGeo = new THREE.BoxGeometry(0.01, 0.08, 0.02);
          const bladeMat = new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.1, metalness: 0.95 });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.position.set(knifeBlock.position.x - 0.03 + j * 0.03, cHeight + 0.08, knifeBlock.position.z);
          scene.add(blade);
        }
      }

      // ── SINK ─────────────────────────────────────────────────────────────
      const includeSink = isKitchen && (project.kitchenEquipment?.includeSink !== false);
      if (includeSink && !hiddenModules?.has('sink')) {
        const sinkMatType = project.kitchenEquipment?.sinkColorAndMaterial || 'stainless';
        let sinkColor = '#c8d4dc'; let sinkMet = 0.92; let sinkRough = 0.08;
        if (sinkMatType === 'black_granite') { sinkColor = '#1c2530'; sinkMet = 0.05; sinkRough = 0.85; }
        else if (sinkMatType === 'white_ceramic') { sinkColor = '#f4f8fb'; sinkMet = 0.08; sinkRough = 0.18; }
        else if (sinkMatType === 'copper') { sinkColor = '#b45309'; sinkMet = 0.88; sinkRough = 0.22; }

        const bsnMat  = new THREE.MeshStandardMaterial({ color: sinkColor, roughness: sinkRough, metalness: sinkMet, envMapIntensity: 2.6 });
        const fctMat  = new THREE.MeshStandardMaterial({ color: '#d8e0e8', metalness: 0.96, roughness: 0.04, envMapIntensity: 3.2 });
        const isDouble = project.kitchenEquipment?.sinkType === 'double';
        const sW = Math.min(0.65, slabL * 0.35);
        const sD = Math.min(0.42, cDepth * 0.76);
        const bD = 0.17; // basin depth
        const sinkGroup = new THREE.Group();

        const buildBasin = (ox: number, bw: number) => {
          // Rim plate flush with countertop
          const rim = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.04, 0.016, sD + 0.04), bsnMat);
          rim.position.set(ox, 0, 0);
          rim.castShadow = true;
          sinkGroup.add(rim);
          // Basin walls (four faces) - left, right, back, floor
          const wallT = 0.012;
          const wallMat2 = bsnMat;
          // floor
          const floor2 = new THREE.Mesh(new THREE.BoxGeometry(bw, wallT, sD - wallT*2), wallMat2);
          floor2.position.set(ox, -bD, 0);
          sinkGroup.add(floor2);
          // sides
          for (const sx of [-1, 1]) {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(wallT, bD, sD), wallMat2);
            sw.position.set(ox + sx * bw / 2, -bD / 2, 0);
            sinkGroup.add(sw);
          }
          // back + front
          for (const sz of [-1, 1]) {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(bw + wallT*2, bD, wallT), wallMat2);
            sw.position.set(ox, -bD / 2, sz * sD / 2);
            sinkGroup.add(sw);
          }
          // Drain
          const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.012, 20), bsnMat);
          drain.position.set(ox, -bD + 0.006, sD * 0.12);
          sinkGroup.add(drain);
          const drainGrate = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.004, 20),
            new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.9, roughness: 0.15 }));
          drainGrate.position.set(ox, -bD + 0.011, sD * 0.12);
          sinkGroup.add(drainGrate);
        };

        if (isDouble) {
          const hw = (sW - 0.05) / 2;
          buildBasin(-hw / 2 - 0.025, hw);
          buildBasin( hw / 2 + 0.025, hw);
          // Centre divider
          const divid = new THREE.Mesh(new THREE.BoxGeometry(0.018, bD + 0.016, sD + 0.04), bsnMat);
          divid.position.set(0, -bD / 2, 0);
          sinkGroup.add(divid);
        } else {
          buildBasin(0, sW);
        }

        // ── Faucet assembly ──
        const fctZ = -sD / 2 + 0.07;
        // Base disk
        const fbas = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.026, 0.014, 18), fctMat);
        fbas.position.set(0, 0.007, fctZ);
        sinkGroup.add(fbas);
        // Column
        const fcol = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.24, 14), fctMat);
        fcol.position.set(0, 0.124, fctZ);
        fcol.castShadow = true;
        sinkGroup.add(fcol);
        // Neck arc
        const fneck = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 10, 28, Math.PI * 0.62), fctMat);
        fneck.rotation.z = -Math.PI / 2.1;
        fneck.position.set(0, 0.242, fctZ + 0.01);
        sinkGroup.add(fneck);
        // Spout tip
        const ftip = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.035, 12), fctMat);
        ftip.rotation.x = -Math.PI / 5;
        ftip.position.set(0, 0.268, fctZ + 0.055);
        sinkGroup.add(ftip);
        // Hot / cold lever handles
        for (const [sx, hColor] of [[-0.075, '#ef4444'], [0.075, '#3b82f6']] as [number, string][]) {
          const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.028, 12), fctMat);
          knob.position.set(sx, 0.014, fctZ - 0.02);
          sinkGroup.add(knob);
          const dot2 = new THREE.Mesh(new THREE.CircleGeometry(0.005, 10), new THREE.MeshBasicMaterial({ color: hColor }));
          dot2.rotation.x = -Math.PI / 2;
          dot2.position.set(sx, 0.029, fctZ - 0.02);
          sinkGroup.add(dot2);
        }

        sinkGroup.position.set(-slabL / 4 * inverseFactor, cHeight + 0.001, offsetWid + cDepth / 2);
        applyModuleTransform(sinkGroup, 'sink');
        registerModule(sinkGroup, 'sink', 'Lavaplatos');
        scene.add(sinkGroup);
      }

      // ── STOVE (induction cooktop) ─────────────────────────────────────────
      const includeStove = isKitchen && (project.kitchenEquipment?.includeStove !== false);
      if (includeStove && !hiddenModules?.has('stove')) {
        const stW = Math.min(0.70, slabL * 0.35);
        const stD = Math.min(0.50, cDepth * 0.82);
        const stoveGroup = new THREE.Group();

        // Glass ceramic body
        const glassCook = new THREE.MeshStandardMaterial({
          color: '#0a0d12', roughness: 0.03, metalness: 0.12,
          transparent: false, envMapIntensity: 3.0,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(stW, 0.026, stD), glassCook);
        body.castShadow = true;
        stoveGroup.add(body);

        // Stainless trim frame around perimeter
        const trimThk = 0.014;
        for (const [tw, td, tx, tz] of [
          [stW + trimThk*2, trimThk, 0, -stD/2 - trimThk/2],
          [stW + trimThk*2, trimThk, 0,  stD/2 + trimThk/2],
          [trimThk, stD, -stW/2 - trimThk/2, 0],
          [trimThk, stD,  stW/2 + trimThk/2, 0],
        ] as const) {
          const trim = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.028, td), appStainless);
          trim.position.set(tx, 0, tz);
          stoveGroup.add(trim);
        }

        // Induction burner zones
        const numPlates = project.kitchenEquipment?.stovePlates || 4;
        interface BL { dx: number; dz: number; r: number; }
        const bP: BL[] = numPlates === 2
          ? [{ dx: -0.13*inverseFactor, dz: 0,   r: 0.085 }, { dx: 0.13*inverseFactor,  dz: 0,   r: 0.075 }]
          : numPlates === 3
          ? [{ dx: -0.14*inverseFactor, dz:-0.07, r: 0.070 }, { dx: 0,                   dz: 0.06, r: 0.095 }, { dx: 0.14*inverseFactor, dz:-0.07, r: 0.080 }]
          : numPlates === 5
          ? [{ dx:-0.15*inverseFactor, dz:-0.09, r:0.060 }, { dx:-0.15*inverseFactor, dz:0.09, r:0.068 }, { dx:0, dz:0, r:0.090 }, { dx:0.15*inverseFactor, dz:-0.09, r:0.060 }, { dx:0.15*inverseFactor, dz:0.09, r:0.068 }]
          : [{ dx:-0.13*inverseFactor, dz:-0.09, r:0.065 }, { dx:-0.13*inverseFactor, dz:0.09, r:0.075 }, { dx:0.13*inverseFactor, dz:-0.09, r:0.075 }, { dx:0.13*inverseFactor, dz:0.09, r:0.065 }];

        const zoneMat = new THREE.MeshStandardMaterial({ color: '#1e2530', roughness: 0.02, metalness: 0.08 });
        const ringMatI = new THREE.MeshBasicMaterial({ color: '#2d3a4a', side: THREE.DoubleSide });

        bP.forEach(b => {
          // Zone disk
          const zone = new THREE.Mesh(new THREE.CircleGeometry(b.r + 0.004, 36), zoneMat);
          zone.rotation.x = -Math.PI / 2;
          zone.position.set(b.dx, 0.014, b.dz);
          stoveGroup.add(zone);
          // Three concentric indicator rings
          for (const [ri, ro] of [[b.r*0.35, b.r*0.40], [b.r*0.62, b.r*0.68], [b.r*0.88, b.r*0.94]] as const) {
            const ring = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 36), ringMatI);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(b.dx, 0.0145, b.dz);
            stoveGroup.add(ring);
          }
          // Centre dot
          const ctr = new THREE.Mesh(new THREE.CircleGeometry(b.r * 0.12, 14),
            new THREE.MeshBasicMaterial({ color: '#374151' }));
          ctr.rotation.x = -Math.PI / 2;
          ctr.position.set(b.dx, 0.0146, b.dz);
          stoveGroup.add(ctr);
        });

        // Control strip (front edge) with knobs
        const ctrlStrip = new THREE.Mesh(new THREE.BoxGeometry(stW * 0.8, 0.018, 0.028), appStainless);
        ctrlStrip.position.set(0, 0.004, stD / 2 - 0.016);
        stoveGroup.add(ctrlStrip);
        const knobCount = Math.min(numPlates, 4);
        for (let ki = 0; ki < knobCount; ki++) {
          const kx = -stW * 0.3 + ki * (stW * 0.6 / (knobCount - 1 || 1));
          const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.022, 16), appStainless);
          knob.position.set(kx, 0.016, stD / 2 - 0.014);
          stoveGroup.add(knob);
          const marker = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.018, 0.002),
            new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
          marker.position.set(kx, 0.028, stD / 2 - 0.014);
          stoveGroup.add(marker);
        }

        stoveGroup.position.set(slabL / 4 * inverseFactor, cHeight + 0.002, offsetWid + cDepth / 2);
        applyModuleTransform(stoveGroup, 'stove');
        registerModule(stoveGroup, 'stove', 'Encimera de Inducción');
        scene.add(stoveGroup);
      }

      // ── BUILT-IN OVEN ─────────────────────────────────────────────────────
      if (includeBuiltInOven && !hiddenModules?.has('built_in_oven')) {
        const ovW = 0.594; const ovH = 0.585; const ovD = 0.01;
        const ovFrontZ = cDepth / 2 - 0.005;
        const ovCY = cHeight - ovH / 2 - 0.04;
        const ovenGroup = new THREE.Group();

        // Outer surround frame (stainless)
        const surround = new THREE.Mesh(new THREE.BoxGeometry(ovW + 0.05, ovH + 0.06, ovD), appStainless);
        surround.position.set(0, ovCY, ovFrontZ);
        surround.castShadow = true;
        ovenGroup.add(surround);

        // Control panel (top strip)
        const ctrlH = 0.055;
        const ctrl = new THREE.Mesh(new THREE.BoxGeometry(ovW, ctrlH, ovD + 0.006), appDarkPanel);
        ctrl.position.set(0, ovCY + ovH / 2 - ctrlH / 2, ovFrontZ + 0.003);
        ovenGroup.add(ctrl);

        // Display window in ctrl
        const disp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.028, 0.002), appDispLit);
        disp.position.set(-ovW * 0.18, ovCY + ovH / 2 - ctrlH / 2, ovFrontZ + 0.009);
        ovenGroup.add(disp);
        const dispLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.002), appLedOrange);
        dispLed.position.set(dispLed.position.x + 0.07, disp.position.y, disp.position.z);
        ovenGroup.add(dispLed);

        // Control knobs
        for (const kx of [-ovW * 0.35, -ovW * 0.14, ovW * 0.14, ovW * 0.35]) {
          const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.018, 16), appStainless);
          kn.rotation.x = Math.PI / 2;
          kn.position.set(kx, ovCY + ovH / 2 - ctrlH / 2, ovFrontZ + ovD + 0.009);
          ovenGroup.add(kn);
        }

        // Door body (below control strip)
        const dH = ovH - ctrlH - 0.01;
        const door = new THREE.Mesh(new THREE.BoxGeometry(ovW, dH, ovD + 0.008), appDarkPanel);
        door.position.set(0, ovCY - ctrlH / 2 - 0.002, ovFrontZ + 0.004);
        door.castShadow = true;
        ovenGroup.add(door);

        // Glass window on door (inner glow)
        const glW = ovW - 0.06; const glH = dH - 0.055;
        const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(glW, glH, 0.006), appGlass);
        glassPanel.position.set(0, door.position.y + 0.01, ovFrontZ + 0.012);
        ovenGroup.add(glassPanel);

        // Window frame
        const wfMat = appStainless;
        for (const [fw, fh, fx, fy] of [
          [glW + 0.012, 0.010, 0, door.position.y + glH / 2 + 0.008],
          [glW + 0.012, 0.010, 0, door.position.y - glH / 2 - 0.008],
          [0.010, glH + 0.012, -glW / 2 - 0.005, door.position.y + 0.01],
          [0.010, glH + 0.012,  glW / 2 + 0.005, door.position.y + 0.01],
        ] as const) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.008), wfMat);
          bar.position.set(fx, fy, ovFrontZ + 0.011);
          ovenGroup.add(bar);
        }

        // Inner oven glow (visible through glass)
        const innerGlow = new THREE.Mesh(new THREE.BoxGeometry(glW - 0.02, glH - 0.02, 0.002),
          new THREE.MeshBasicMaterial({ color: '#7c1a00' }));
        innerGlow.position.set(0, door.position.y + 0.01, ovFrontZ + 0.007);
        ovenGroup.add(innerGlow);

        // Door handle bar
        const handleLen = ovW - 0.10;
        const handleBar = new THREE.Mesh(new THREE.BoxGeometry(handleLen, 0.022, 0.022), appHandle);
        handleBar.position.set(0, door.position.y - dH / 2 + 0.035, ovFrontZ + 0.04);
        handleBar.castShadow = true;
        ovenGroup.add(handleBar);
        // Handle end caps
        for (const hsx of [-handleLen / 2, handleLen / 2]) {
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), appHandle);
          cap.position.set(hsx, door.position.y - dH / 2 + 0.035, ovFrontZ + 0.04);
          ovenGroup.add(cap);
        }

        // Ventilation slots at bottom
        for (let vi = 0; vi < 5; vi++) {
          const slot = new THREE.Mesh(new THREE.BoxGeometry(ovW * 0.6, 0.004, 0.002),
            new THREE.MeshBasicMaterial({ color: '#0a0a0a' }));
          slot.position.set(0, ovCY - ovH / 2 + 0.008 + vi * 0.007, ovFrontZ + ovD + 0.001);
          ovenGroup.add(slot);
        }

        // Rubber seal strip around door perimeter
        const sealMat = appRubber;
        for (const [sw, sh, sx, sy] of [
          [ovW + 0.06, 0.008, 0, ovCY + ovH / 2 + 0.022],
          [ovW + 0.06, 0.008, 0, ovCY - ovH / 2 - 0.018],
          [0.008, ovH + 0.04,  ovW / 2 + 0.022, ovCY],
          [0.008, ovH + 0.04, -ovW / 2 - 0.022, ovCY],
        ] as const) {
          const seal = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.006), sealMat);
          seal.position.set(sx, sy, ovFrontZ - 0.002);
          ovenGroup.add(seal);
        }

        ovenGroup.position.set((slabL / 4) * inverseFactor, 0, offsetWid + cDepth / 2);
        applyModuleTransform(ovenGroup, 'built_in_oven');
        registerModule(ovenGroup, 'built_in_oven', 'Horno Empotrado');
        scene.add(ovenGroup);
      }
    }

    // ── L-WING (left arm) — each segment registered individually ──────────
    if (activeLayout === 'L_shaped' || activeLayout === 'U_shaped') {
      const segWidth = 0.85;
      const lWingLen = roomWid - cDepth;
      const counts = Math.min(Math.floor(lWingLen / segWidth), 4);

      for (let i = 0; i < counts; i++) {
        const moduleId = `left_wing_${i}`;
        if (hiddenModules?.has(moduleId)) continue;
        const zCoord = offsetWid + cDepth + i * segWidth + segWidth / 2;
        const segment = createCounterSegment(offsetLen + cDepth / 2, segWidth - 0.02, zCoord, Math.PI / 2);
        applyModuleTransform(segment, moduleId);
        registerModule(segment, moduleId, `Módulo Izquierdo ${i + 1}`);
        scene.add(segment);
      }

      if (!hiddenModules?.has('left_wing_slab')) {
        const slabLWild = lWingLen - 0.05;
        const slabLeft = new THREE.Mesh(new THREE.BoxGeometry(cDepth, 0.04, slabLWild), topMaterial);
        slabLeft.receiveShadow = true;
        slabLeft.castShadow = true;
        const leftSlabGroup = new THREE.Group();
        leftSlabGroup.add(slabLeft);
        leftSlabGroup.position.set(offsetLen + cDepth / 2, cHeight - 0.02, offsetWid + cDepth + slabLWild / 2);
        applyModuleTransform(leftSlabGroup, 'left_wing_slab');
        registerModule(leftSlabGroup, 'left_wing_slab', 'Encimera Izquierda');
        scene.add(leftSlabGroup);
      }
    }

    // ── R-WING (right arm, U-shape only) — each segment individually ───────
    if (activeLayout === 'U_shaped') {
      const segWidth = 0.85;
      const rWingLen = roomWid - cDepth;
      const counts = Math.min(Math.floor(rWingLen / segWidth), 4);

      for (let i = 0; i < counts; i++) {
        const moduleId = `right_wing_${i}`;
        if (hiddenModules?.has(moduleId)) continue;
        const zCoord = offsetWid + cDepth + i * segWidth + segWidth / 2;
        const segment = createCounterSegment(roomLen / 2 - cDepth / 2, segWidth - 0.02, zCoord, -Math.PI / 2);
        applyModuleTransform(segment, moduleId);
        registerModule(segment, moduleId, `Módulo Derecho ${i + 1}`);
        scene.add(segment);
      }

      if (!hiddenModules?.has('right_wing_slab')) {
        const slabRightL = rWingLen - 0.05;
        const slabRight = new THREE.Mesh(new THREE.BoxGeometry(cDepth, 0.04, slabRightL), topMaterial);
        slabRight.receiveShadow = true;
        slabRight.castShadow = true;
        const rightSlabGroup = new THREE.Group();
        rightSlabGroup.add(slabRight);
        rightSlabGroup.position.set(roomLen / 2 - cDepth / 2, cHeight - 0.02, offsetWid + cDepth + slabRightL / 2);
        applyModuleTransform(rightSlabGroup, 'right_wing_slab');
        registerModule(rightSlabGroup, 'right_wing_slab', 'Encimera Derecha');
        scene.add(rightSlabGroup);
      }
    }

    // ── WALL CABINETS (alacenas superiores) ───────────────────────────────
    if (includeHighCabinets) {
      const wallCabH = 0.65;
      const wallCabD = 0.35;
      const wallCabY = cHeight + splashH;

      // Helper: builds a single wall-cabinet group (faces +z before any rotation)
      const buildWallCabinetGroup = (): THREE.Group => {
        const g = new THREE.Group();
        const wcType = project.kitchenEquipment?.wallCabinetType ?? 'lift_door';

        // Carcass frame (always present)
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.78, wallCabH, wallCabD), cabMaterial);
        frame.position.y = wallCabH / 2;
        g.add(frame);

        // Internal shelves (visible in open_shelf and glass_door)
        if (wcType === 'open_shelf' || wcType === 'glass_door') {
          const shelfMat = new THREE.MeshStandardMaterial({ color: cabMaterial.color, roughness: 0.4 });
          const shelfGeo = new THREE.BoxGeometry(0.74, 0.016, wallCabD - 0.04);
          for (const yFrac of [0.30, 0.60]) {
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(0, wallCabH * yFrac, 0.01);
            g.add(shelf);
          }
        }

        if (wcType === 'open_shelf') {
          // No door — open front, nothing to add
        } else if (wcType === 'lift_door') {
          const doorLift = new THREE.Mesh(
            new THREE.BoxGeometry(0.78, wallCabH + 0.02, 0.015), cabMaterial
          );
          doorLift.position.set(0, wallCabH + 0.05, wallCabD / 2);
          doorLift.rotation.x = -Math.PI / 4;
          doorLift.castShadow = true;
          g.add(doorLift);
          const liftHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.01, 0.012),
            new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.95, roughness: 0.05 })
          );
          liftHandle.position.set(0, -wallCabH / 2 - 0.01, 0.007);
          doorLift.add(liftHandle);
        } else if (wcType === 'glass_door') {
          const glassMat = new THREE.MeshStandardMaterial({
            color: '#d4e8ff', roughness: 0.02, metalness: 0.05,
            transparent: true, opacity: 0.35,
          });
          const frameLineMat = new THREE.MeshStandardMaterial({ color: cabMaterial.color, roughness: 0.3 });
          for (let side = 0; side < 2; side++) {
            const xOff = side === 0 ? -0.1925 : 0.1925;
            // Glass panel
            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.365, wallCabH - 0.03, 0.006), glassMat);
            glass.position.set(xOff, wallCabH / 2, wallCabD / 2 + 0.005);
            g.add(glass);
            // Aluminium frame around glass
            for (const [w, h, ox, oy] of [
              [0.375, 0.012, xOff, wallCabH - 0.015] as const,
              [0.375, 0.012, xOff, 0.010] as const,
              [0.012, wallCabH, xOff - 0.185, wallCabH / 2] as const,
              [0.012, wallCabH, xOff + 0.185, wallCabH / 2] as const,
            ]) {
              const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.014), frameLineMat);
              bar.position.set(ox, oy, wallCabD / 2 + 0.007);
              g.add(bar);
            }
          }
        } else {
          // closed_door — standard bi-fold
          const doorGeo = new THREE.BoxGeometry(0.385, wallCabH - 0.01, 0.015);
          for (const [xOff] of [[-0.1925], [0.1925]] as const) {
            const door = new THREE.Mesh(doorGeo, cabMaterial);
            door.position.set(xOff, wallCabH / 2, wallCabD / 2 + 0.008);
            door.castShadow = true;
            g.add(door);
            const pull = new THREE.Mesh(
              new THREE.BoxGeometry(0.12, 0.012, 0.016),
              new THREE.MeshStandardMaterial({ color: '#9ca3af', metalness: 0.92, roughness: 0.08 })
            );
            pull.position.set(xOff, wallCabH * 0.18, wallCabD / 2 + 0.017);
            g.add(pull);
          }
        }
        return g;
      };

      // Back-wall cabinets
      const wCounts = Math.max(1, Math.min(Math.floor(cLength / 0.8), 6));
      const wStartX = -((wCounts - 1) * 0.8) / 2;
      for (let i = 0; i < wCounts; i++) {
        const wModuleId = `wall_cabinet_${i}`;
        if (hiddenModules?.has(wModuleId)) continue;
        const groupWall = buildWallCabinetGroup();
        groupWall.position.set(wStartX + i * 0.80, wallCabY, offsetWid + wallCabD / 2 + 0.02);
        applyModuleTransform(groupWall, wModuleId);
        registerModule(groupWall, wModuleId, `Alacena Superior ${i + 1}`);
        scene.add(groupWall);
      }

      // L-wing wall cabinets — each registered individually
      if (activeLayout === 'L_shaped' || activeLayout === 'U_shaped') {
        const lWingLen = roomWid - cDepth - 0.10;
        const lWCounts = Math.min(Math.floor(lWingLen / 0.80), 4);
        for (let i = 0; i < lWCounts; i++) {
          const wModuleId = `left_wcab_${i}`;
          if (hiddenModules?.has(wModuleId)) continue;
          const g = buildWallCabinetGroup();
          g.rotation.y = -Math.PI / 2;
          g.position.set(
            offsetLen + wallCabD / 2 + 0.02,
            wallCabY,
            offsetWid + cDepth + i * 0.80 + 0.40
          );
          applyModuleTransform(g, wModuleId);
          registerModule(g, wModuleId, `Alacena Izquierda ${i + 1}`);
          scene.add(g);
        }
      }

      // R-wing wall cabinets — each registered individually
      if (activeLayout === 'U_shaped') {
        const rWingLen = roomWid - cDepth - 0.10;
        const rWCounts = Math.min(Math.floor(rWingLen / 0.80), 4);
        for (let i = 0; i < rWCounts; i++) {
          const wModuleId = `right_wcab_${i}`;
          if (hiddenModules?.has(wModuleId)) continue;
          const g = buildWallCabinetGroup();
          g.rotation.y = Math.PI / 2;
          g.position.set(
            roomLen / 2 - wallCabD / 2 - 0.02,
            wallCabY,
            offsetWid + cDepth + i * 0.80 + 0.40
          );
          applyModuleTransform(g, wModuleId);
          registerModule(g, wModuleId, `Alacena Derecha ${i + 1}`);
          scene.add(g);
        }
      }
    }

    // ── REFRIGERADOR ──────────────────────────────────────────────────────
    if (includeRefrigerator && !hiddenModules?.has('refrigerator')) {
      const refW = 0.70; const refH = 1.90; const refD = 0.68;
      const isIndustrial = project.selectedStyle === 'industrial';
      const bodyColor = isIndustrial ? '#2d3340' : '#d4d8dc';
      const refBodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor, metalness: isIndustrial ? 0.55 : 0.88,
        roughness: isIndustrial ? 0.40 : 0.10, envMapIntensity: 2.4,
      });
      const refGroup = new THREE.Group();

      // Main body (carcass)
      const refBody = new THREE.Mesh(new THREE.BoxGeometry(refW, refH, refD), refBodyMat);
      refBody.position.y = refH / 2;
      refBody.castShadow = true; refBody.receiveShadow = true;
      refGroup.add(refBody);

      // Door seam line (fridge upper / freezer lower split)
      const seamY = refH * 0.33; // freezer bottom third
      const seam = new THREE.Mesh(new THREE.BoxGeometry(refW + 0.002, 0.008, 0.015), appRubber);
      seam.position.set(0, seamY, refD / 2 - 0.002);
      refGroup.add(seam);

      // Freezer door (bottom)
      const fzH = seamY - 0.004;
      const fzDoor = new THREE.Mesh(new THREE.BoxGeometry(refW - 0.004, fzH - 0.006, 0.025), refBodyMat);
      fzDoor.position.set(0, fzH / 2 + 0.003, refD / 2 + 0.006);
      fzDoor.castShadow = true;
      refGroup.add(fzDoor);

      // Fridge door (top)
      const fdH = refH - seamY - 0.008;
      const fdDoor = new THREE.Mesh(new THREE.BoxGeometry(refW - 0.004, fdH - 0.006, 0.025), refBodyMat);
      fdDoor.position.set(0, seamY + fdH / 2 + 0.004, refD / 2 + 0.006);
      fdDoor.castShadow = true;
      refGroup.add(fdDoor);

      // Door rubber seals (perimeter strips)
      const doorSealMat = appRubber;
      for (const [dY, dH2] of [[fzH / 2 + 0.003, fzH], [seamY + fdH / 2 + 0.004, fdH]] as const) {
        for (const [sw2, sh2, sx2, sy2] of [
          [refW - 0.008, 0.007, 0, dY + dH2 / 2 - 0.004],
          [refW - 0.008, 0.007, 0, dY - dH2 / 2 + 0.004],
          [0.007, dH2 - 0.01,  refW / 2 - 0.006, dY],
          [0.007, dH2 - 0.01, -refW / 2 + 0.006, dY],
        ] as const) {
          const seal = new THREE.Mesh(new THREE.BoxGeometry(sw2, sh2, 0.008), doorSealMat);
          seal.position.set(sx2, sy2, refD / 2 + 0.003);
          refGroup.add(seal);
        }
      }

      // Fridge door handle (right side, vertical bar)
      const fhLen = fdH * 0.45;
      const fHandle = new THREE.Mesh(new THREE.BoxGeometry(0.022, fhLen, 0.035), appHandle);
      fHandle.position.set(refW / 2 - 0.014, seamY + fdH * 0.55, refD / 2 + 0.045);
      fHandle.castShadow = true;
      refGroup.add(fHandle);
      for (const hy of [fhLen / 2, -fhLen / 2]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), appHandle);
        cap.position.set(refW / 2 - 0.014, seamY + fdH * 0.55 + hy, refD / 2 + 0.045);
        refGroup.add(cap);
      }

      // Freezer handle (horizontal bar)
      const fzHandle = new THREE.Mesh(new THREE.BoxGeometry(refW * 0.55, 0.018, 0.030), appHandle);
      fzHandle.position.set(0, fzH - 0.055, refD / 2 + 0.04);
      fzHandle.castShadow = true;
      refGroup.add(fzHandle);

      // Dispenser panel on fridge door
      const dispPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.015), appDarkPanel);
      dispPanel.position.set(-refW * 0.18, seamY + fdH * 0.28, refD / 2 + 0.018);
      refGroup.add(dispPanel);
      const dispBtn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.005), appDispLit);
      dispBtn.position.set(-refW * 0.18, seamY + fdH * 0.28, refD / 2 + 0.026);
      refGroup.add(dispBtn);

      // Logo strip
      const logoStrip = new THREE.Mesh(new THREE.BoxGeometry(refW * 0.38, 0.016, 0.004),
        new THREE.MeshBasicMaterial({ color: '#c8d0d8' }));
      logoStrip.position.set(refW * 0.1, refH - 0.055, refD / 2 + 0.016);
      refGroup.add(logoStrip);

      // Ventilation grille at bottom back
      for (let vi = 0; vi < 6; vi++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(refW - 0.06, 0.005, 0.01),
          new THREE.MeshBasicMaterial({ color: '#0a0a0a' }));
        slot.position.set(0, 0.018 + vi * 0.012, refD / 2 + 0.012);
        refGroup.add(slot);
      }

      const refX = !project.kitchenEquipment?.inverseDistribution
        ? (offsetLen + refW / 2 + 0.02)
        : (roomLen / 2 - refW / 2 - 0.02);
      refGroup.position.set(refX, 0, offsetWid + refD / 2);
      applyModuleTransform(refGroup, 'refrigerator');
      registerModule(refGroup, 'refrigerator', 'Refrigerador');
      scene.add(refGroup);
    }

    // ── LAVAVAJILLAS ──────────────────────────────────────────────────────
    if (includeDishwasherUnit && !hiddenModules?.has('dishwasher')) {
      const dwW = 0.598; const dwH = cHeight; const dwD = cDepth;
      const dwGroup = new THREE.Group();

      // Carcass body
      const dwBody = new THREE.Mesh(new THREE.BoxGeometry(dwW, dwH - 0.02, dwD - 0.01), cabMaterial);
      dwBody.position.y = (dwH - 0.02) / 2;
      dwBody.castShadow = true;
      dwGroup.add(dwBody);

      // Main door panel (stainless)
      const panH = dwH - 0.095;
      const dwFace = new THREE.Mesh(new THREE.BoxGeometry(dwW - 0.01, panH, 0.022), appStainless);
      dwFace.position.set(0, 0.065 + panH / 2, dwD / 2 + 0.011);
      dwFace.castShadow = true;
      dwGroup.add(dwFace);

      // Inner door detail (slightly recessed panel)
      const inPanel = new THREE.Mesh(new THREE.BoxGeometry(dwW - 0.06, panH - 0.06, 0.008),
        new THREE.MeshStandardMaterial({ color: '#b8c2cc', metalness: 0.88, roughness: 0.14, envMapIntensity: 2.5 }));
      inPanel.position.set(0, 0.065 + panH / 2, dwD / 2 + 0.018);
      dwGroup.add(inPanel);

      // Control panel (hidden top-edge — visible from above)
      const ctrlPan = new THREE.Mesh(new THREE.BoxGeometry(dwW - 0.01, 0.028, 0.022), appDarkPanel);
      ctrlPan.position.set(0, dwH - 0.044, dwD / 2 + 0.011);
      dwGroup.add(ctrlPan);

      // LED row on control panel
      const ledColors = ['#4ade80', '#4ade80', '#fb923c', '#f8fafc', '#f8fafc'];
      ledColors.forEach((c, li) => {
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6),
          new THREE.MeshBasicMaterial({ color: c }));
        led.position.set(-dwW * 0.2 + li * dwW * 0.10, dwH - 0.033, dwD / 2 + 0.023);
        dwGroup.add(led);
      });

      // Display digit (small LCD rect)
      const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.016, 0.002), appDispLit);
      lcd.position.set(dwW * 0.3, dwH - 0.038, dwD / 2 + 0.024);
      dwGroup.add(lcd);

      // Door handle
      const dwHandleLen = dwW - 0.10;
      const dwHandleBar = new THREE.Mesh(new THREE.BoxGeometry(dwHandleLen, 0.020, 0.026), appHandle);
      dwHandleBar.position.set(0, 0.085 + panH - 0.045, dwD / 2 + 0.036);
      dwHandleBar.castShadow = true;
      dwGroup.add(dwHandleBar);
      for (const hsx of [-dwHandleLen / 2, dwHandleLen / 2]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), appHandle);
        cap.position.set(hsx, dwHandleBar.position.y, dwHandleBar.position.z);
        dwGroup.add(cap);
      }

      // Door rubber seal
      for (const [sw2, sh2, sox, soy] of [
        [dwW - 0.012, 0.006, 0, 0.065 + panH - 0.003],
        [dwW - 0.012, 0.006, 0, 0.065 + 0.003],
        [0.006, panH - 0.01,  dwW / 2 - 0.007, 0.065 + panH / 2],
        [0.006, panH - 0.01, -dwW / 2 + 0.007, 0.065 + panH / 2],
      ] as const) {
        const seal = new THREE.Mesh(new THREE.BoxGeometry(sw2, sh2, 0.006), appRubber);
        seal.position.set(sox, soy, dwD / 2 + 0.009);
        dwGroup.add(seal);
      }

      // Kick plate (black)
      const kick = new THREE.Mesh(new THREE.BoxGeometry(dwW, 0.062, dwD - 0.05),
        new THREE.MeshStandardMaterial({ color: '#101010', roughness: 0.90, metalness: 0.0 }));
      kick.position.set(0, 0.031, 0.025);
      dwGroup.add(kick);

      // Ventilation slots on kick
      for (let vi = 0; vi < 4; vi++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(dwW * 0.70, 0.004, 0.002),
          new THREE.MeshBasicMaterial({ color: '#0a0a0a' }));
        slot.position.set(0, 0.010 + vi * 0.012, dwD / 2 - 0.02);
        dwGroup.add(slot);
      }

      const dwX = !project.kitchenEquipment?.inverseDistribution
        ? (offsetLen + dwW / 2 + (includeRefrigerator ? 0.74 : 0.02))
        : (roomLen / 2 - dwW / 2 - (includeRefrigerator ? 0.74 : 0.02));
      dwGroup.position.set(dwX, 0, offsetWid + dwD / 2);
      applyModuleTransform(dwGroup, 'dishwasher');
      registerModule(dwGroup, 'dishwasher', 'Lavavajillas');
      scene.add(dwGroup);
    }

    // ── TECH COLUMN (tall cabinet housing — kept for backward compat) ──────
    if (project.ergonomics.dishwasherColumn && includeAppliances && !hiddenModules?.has('tech_column')) {
      const colWidth = 0.65; const colHeight = roomHgt - 0.35; const colDepth = cDepth;
      const groupCol = new THREE.Group();

      const colCabinet = new THREE.Mesh(new THREE.BoxGeometry(colWidth, colHeight, colDepth), cabMaterial);
      colCabinet.position.y = colHeight / 2;
      colCabinet.castShadow = true; colCabinet.receiveShadow = true;
      groupCol.add(colCabinet);

      const panelCol = new THREE.Mesh(new THREE.BoxGeometry(colWidth - 0.02, 0.45, 0.02), cabMaterial);
      panelCol.position.set(0, colHeight - 0.235, colDepth / 2 + 0.005);
      groupCol.add(panelCol);

      const colX = !project.kitchenEquipment?.inverseDistribution
        ? (offsetLen + colWidth / 2 + 0.02)
        : (roomLen / 2 - colWidth / 2 - 0.02);
      groupCol.position.set(colX, 0, offsetWid + colDepth / 2);
      applyModuleTransform(groupCol, 'tech_column');
      registerModule(groupCol, 'tech_column', 'Columna Técnica');
      scene.add(groupCol);
    }

    // ── CENTRAL ISLAND ─────────────────────────────────────────────────────
    if (includeIsland && !hiddenModules?.has('island')) {
      const islandW = 1.40; const islandD = 0.85; const islandH = cHeight;
      const groupIsland = new THREE.Group();

      const carcassGeo = new THREE.BoxGeometry(islandW, islandH - 0.04, islandD - 0.02);
      const islandCarcass = new THREE.Mesh(carcassGeo, cabMaterial);
      islandCarcass.position.y = (islandH - 0.04) / 2;
      islandCarcass.castShadow = true; islandCarcass.receiveShadow = true;
      groupIsland.add(islandCarcass);

      const sSlabGeo = new THREE.BoxGeometry(islandW + 0.08, 0.04, islandD + 0.08);
      const islandSlab = new THREE.Mesh(sSlabGeo, topMaterial);
      islandSlab.position.y = islandH - 0.02;
      islandSlab.castShadow = true; islandSlab.receiveShadow = true;
      groupIsland.add(islandSlab);

      for (let s = 0; s < 2; s++) {
        const stoolGroup = new THREE.Group();
        const legMaterial = new THREE.MeshStandardMaterial({ color: '#111827', metalness: 0.8, roughness: 0.2 });
        for (let l = 0; l < 4; l++) {
          const legGeo = new THREE.CylinderGeometry(0.01, 0.006, 0.65, 8);
          const leg = new THREE.Mesh(legGeo, legMaterial);
          const xOffsetStool = (l === 0 || l === 1 ? 0.08 : -0.08);
          const zOffsetStool = (l === 0 || l === 2 ? 0.08 : -0.08);
          leg.position.set(xOffsetStool, 0.325, zOffsetStool);
          leg.rotation.z = xOffsetStool * -0.15;
          leg.rotation.x = zOffsetStool * 0.15;
          stoolGroup.add(leg);
        }
        const ringSGeo = new THREE.TorusGeometry(0.09, 0.006, 8, 16);
        const ringSMesh = new THREE.Mesh(ringSGeo, legMaterial);
        ringSMesh.rotation.x = Math.PI / 2; ringSMesh.position.y = 0.20;
        stoolGroup.add(ringSMesh);
        const seatGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.035, 16);
        const seatMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.5 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 0.66; seat.castShadow = true;
        stoolGroup.add(seat);
        stoolGroup.position.set(-0.35 + s * 0.70, 0, islandD / 2 + 0.25);
        groupIsland.add(stoolGroup);
      }

      groupIsland.position.set(0.1, 0, 0.35);
      applyModuleTransform(groupIsland, 'island');
      registerModule(groupIsland, 'island', 'Isla Central Social');
      scene.add(groupIsland);
    }

    // ── NON-KITCHEN SPACE-SPECIFIC ELEMENTS ───────────────────────────────
    const eq = project.kitchenEquipment;
    const spaceType = project.spaceType;

    // ── BAÑO (bathroom) ────────────────────────────────────────────────────
    if (spaceType === 'bano') {
      // Basin fixture on countertop slab (if includeSink)
      if (eq?.includeSink !== false) {
        const basinMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.1, metalness: 0.2 });
        const basinGeo = new THREE.BoxGeometry(0.55, 0.04, 0.38);
        const basin = new THREE.Mesh(basinGeo, basinMat);
        basin.position.set(0, cHeight + 0.02, offsetWid + cDepth / 2);
        scene.add(basin);
        // Faucet
        const faucetMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.05 });
        const faucetPost = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), faucetMat);
        faucetPost.position.set(0, cHeight + 0.11, offsetWid + cDepth / 2 - 0.14);
        scene.add(faucetPost);
        const faucetSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 10), faucetMat);
        faucetSpout.rotation.x = Math.PI / 2.5;
        faucetSpout.position.set(0, cHeight + 0.22, offsetWid + cDepth / 2 - 0.08);
        scene.add(faucetSpout);
      }
      // Mirror cabinet above vanity (if includeAppliances)
      if (eq?.includeAppliances !== false) {
        const mirrorW = Math.min(0.80, cLength * 0.7);
        const mirrorH = 0.55;
        const mirrorY = cHeight + splashH;
        const mirrorFrameMat = new THREE.MeshStandardMaterial({ color: cabMaterial.color, roughness: 0.2, metalness: 0.5 });
        const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(mirrorW + 0.04, mirrorH + 0.04, 0.06), mirrorFrameMat);
        mirrorFrame.position.set(0, mirrorY + mirrorH / 2, offsetWid + 0.03);
        scene.add(mirrorFrame);
        const mirrorSurfMat = new THREE.MeshStandardMaterial({ color: '#c8d8e8', roughness: 0.0, metalness: 0.9, envMapIntensity: 1 });
        const mirrorSurf = new THREE.Mesh(new THREE.BoxGeometry(mirrorW, mirrorH, 0.01), mirrorSurfMat);
        mirrorSurf.position.set(0, mirrorY + mirrorH / 2, offsetWid + 0.06);
        scene.add(mirrorSurf);
      }
      // Shower cabin on left wall (if includeStove)
      if (eq?.includeStove !== false) {
        const showW = 0.90; const showD = 0.90; const showH = roomHgt * 0.85;
        const glassMat = new THREE.MeshStandardMaterial({ color: '#cce5f5', roughness: 0.0, metalness: 0.1, transparent: true, opacity: 0.35 });
        const frameMat2 = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.1 });
        // Shower walls (3 sides)
        const showerBack = new THREE.Mesh(new THREE.BoxGeometry(showW, showH, 0.015), glassMat);
        showerBack.position.set(offsetLen + showW / 2 + 0.05, showH / 2, offsetWid + showD / 2 + 0.05);
        scene.add(showerBack);
        const showerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.015, showH, showD), glassMat);
        showerLeft.position.set(offsetLen + 0.05, showH / 2, offsetWid + showD / 2 + 0.05);
        scene.add(showerLeft);
        const showerRight = new THREE.Mesh(new THREE.BoxGeometry(0.015, showH, showD), glassMat);
        showerRight.position.set(offsetLen + showW + 0.05, showH / 2, offsetWid + showD / 2 + 0.05);
        scene.add(showerRight);
        // Shower head
        const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 16), frameMat2);
        showerHead.rotation.x = Math.PI / 2;
        showerHead.position.set(offsetLen + showW / 2 + 0.05, showH * 0.85, offsetWid + 0.07);
        scene.add(showerHead);
      }
      // Bathtub (if includeBuiltInOven)
      if (eq?.includeBuiltInOven) {
        const tubW = 1.50; const tubD = 0.75; const tubH = 0.52;
        const tubMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.1, metalness: 0.05 });
        const tub = new THREE.Mesh(new THREE.BoxGeometry(tubW, tubH, tubD), tubMat);
        tub.position.set(roomLen / 2 - tubW / 2 - 0.05, tubH / 2, offsetWid + tubD / 2 + 0.05);
        tub.castShadow = true;
        scene.add(tub);
        // Inner basin
        const tubInnerMat = new THREE.MeshStandardMaterial({ color: '#dbeafe', roughness: 0.05 });
        const tubInner = new THREE.Mesh(new THREE.BoxGeometry(tubW - 0.1, tubH - 0.08, tubD - 0.1), tubInnerMat);
        tubInner.position.set(roomLen / 2 - tubW / 2 - 0.05, tubH / 2 + 0.02, offsetWid + tubD / 2 + 0.05);
        scene.add(tubInner);
      }
    }

    // ── SALA (living room) ─────────────────────────────────────────────────
    if (spaceType === 'sala') {
      // TV unit base already rendered via counter segments + slab
      // Sofa (if includeSink)
      if (eq?.includeSink !== false) {
        const sofaColor = '#94a3b8';
        const sofaMat = new THREE.MeshStandardMaterial({ color: sofaColor, roughness: 0.8 });
        const sofaW = Math.min(2.2, roomLen * 0.7); const sofaD = 0.85; const sofaH = 0.42;
        // Base
        const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(sofaW, sofaH, sofaD), sofaMat);
        sofaBase.position.set(0, sofaH / 2, sofaD / 2 + 0.3);
        sofaBase.castShadow = true; sofaBase.receiveShadow = true;
        scene.add(sofaBase);
        // Backrest
        const backMat = new THREE.MeshStandardMaterial({ color: sofaColor, roughness: 0.75 });
        const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(sofaW, 0.50, 0.18), backMat);
        sofaBack.position.set(0, sofaH + 0.25, sofaD / 2 + 0.3 + sofaD / 2 - 0.09);
        sofaBack.castShadow = true;
        scene.add(sofaBack);
        // Armrests
        for (const side of [-1, 1]) {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, sofaD), sofaMat);
          arm.position.set(side * (sofaW / 2 + 0.09), sofaH / 2 + 0.065, sofaD / 2 + 0.3);
          scene.add(arm);
        }
        // Cushions
        const cushMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9 });
        const cushCount = Math.round(sofaW / 0.7);
        for (let ci = 0; ci < cushCount; ci++) {
          const cush = new THREE.Mesh(new THREE.BoxGeometry(sofaW / cushCount - 0.04, 0.18, 0.44), cushMat);
          cush.position.set(-sofaW / 2 + (ci + 0.5) * (sofaW / cushCount), sofaH + 0.09, sofaD / 2 + 0.3 - 0.20);
          scene.add(cush);
        }
      }
      // Coffee table (if includeStove)
      if (eq?.includeStove !== false) {
        const ctW = 1.10; const ctD = 0.55; const ctH = 0.38;
        const ctMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.4, metalness: 0.3 });
        const ct = new THREE.Mesh(new THREE.BoxGeometry(ctW, ctH, ctD), ctMat);
        ct.position.set(0, ctH / 2, ctD / 2 + 0.3 + 0.90);
        scene.add(ct);
        // Glass top
        const ctTopMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0, metalness: 0.1, transparent: true, opacity: 0.6 });
        const ctTop = new THREE.Mesh(new THREE.BoxGeometry(ctW - 0.04, 0.012, ctD - 0.04), ctTopMat);
        ctTop.position.set(0, ctH + 0.006, ctD / 2 + 0.3 + 0.90);
        scene.add(ctTop);
      }
    }

    // ── DORMITORIO (bedroom) ───────────────────────────────────────────────
    if (spaceType === 'dormitorio') {
      // Bed (if includeSink)
      if (eq?.includeSink !== false) {
        const isInverse = !!eq?.inverseDistribution;
        const bedW = 1.60; const bedL = 2.00; const bedH = 0.45;
        const bedMat = new THREE.MeshStandardMaterial({ color: cabMaterial.color, roughness: 0.6 });
        const mattressMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.9 });
        const headboardMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 });
        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(bedW, bedH, bedL), bedMat);
        frame.position.set(isInverse ? roomLen / 4 : -roomLen / 4, bedH / 2, bedL / 2 + 0.1);
        frame.castShadow = true; frame.receiveShadow = true;
        scene.add(frame);
        // Mattress
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(bedW - 0.06, 0.22, bedL - 0.10), mattressMat);
        mattress.position.set(frame.position.x, bedH + 0.11, frame.position.z);
        scene.add(mattress);
        // Headboard
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(bedW, 0.70, 0.10), headboardMat);
        headboard.position.set(frame.position.x, bedH + 0.35, frame.position.z - bedL / 2 + 0.05);
        headboard.castShadow = true;
        scene.add(headboard);
        // Pillow × 2
        const pillowMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
        for (const px of [-0.30, 0.30]) {
          const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.10, 0.36), pillowMat);
          pillow.position.set(frame.position.x + px, bedH + 0.27, frame.position.z - bedL / 2 + 0.28);
          scene.add(pillow);
        }
      }
      // Nightstands (if includeAppliances)
      if (eq?.includeAppliances !== false) {
        const nsW = 0.45; const nsH = 0.54; const nsD = 0.40;
        const nsMat = new THREE.MeshStandardMaterial({ color: cabMaterial.color, roughness: 0.5 });
        const bedX = !!eq?.inverseDistribution ? roomLen / 4 : -roomLen / 4;
        for (const side of [-1, 1]) {
          const ns = new THREE.Mesh(new THREE.BoxGeometry(nsW, nsH, nsD), nsMat);
          ns.position.set(bedX + side * (0.80 + nsW / 2 + 0.05), nsH / 2, nsD / 2 + 0.1);
          ns.castShadow = true;
          scene.add(ns);
          // Lamp
          const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.30, 10), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }));
          lampBase.position.set(ns.position.x, nsH + 0.15, ns.position.z);
          scene.add(lampBase);
        }
      }
    }

    // ── COMEDOR (dining room) ──────────────────────────────────────────────
    if (spaceType === 'comedor') {
      // Dining table (if includeSink)
      if (eq?.includeSink !== false) {
        const tableW = Math.min(2.20, roomLen * 0.60);
        const tableD = Math.min(1.00, roomWid * 0.45);
        const tableH = 0.76;
        const tableMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.4, metalness: 0.1 });
        const legMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.6 });
        // Tabletop
        const top = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.05, tableD), tableMat);
        top.position.set(0, tableH, tableD / 2 + 0.3);
        top.castShadow = true; top.receiveShadow = true;
        scene.add(top);
        // Legs
        for (const [lx, lz] of [[-tableW/2+0.08,top.position.z-tableD/2+0.08],[tableW/2-0.08,top.position.z-tableD/2+0.08],[-tableW/2+0.08,top.position.z+tableD/2-0.08],[tableW/2-0.08,top.position.z+tableD/2-0.08]]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, tableH, 0.06), legMat);
          leg.position.set(lx, tableH / 2, lz);
          scene.add(leg);
        }
        // Chairs (if includeAppliances)
        if (eq?.includeAppliances !== false) {
          const chairMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.7 });
          const chairs: Array<[number, number, number]> = [];
          const seatsPerSide = Math.round(tableW / 0.55);
          for (let ci = 0; ci < seatsPerSide; ci++) {
            const cx = -tableW / 2 + (ci + 0.5) * (tableW / seatsPerSide);
            chairs.push([cx, top.position.z - tableD / 2 - 0.40, 0]);
            chairs.push([cx, top.position.z + tableD / 2 + 0.40, Math.PI]);
          }
          for (const [cx, cz, ry] of chairs) {
            const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), chairMat);
            chairSeat.position.set(cx, 0.46, cz);
            chairSeat.rotation.y = ry;
            scene.add(chairSeat);
            const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.05), chairMat);
            chairBack.position.set(cx, 0.75, cz + (ry === 0 ? 0.20 : -0.20));
            chairBack.rotation.y = ry;
            scene.add(chairBack);
          }
        }
      }
    }

    // ── BODEGA (storage) ───────────────────────────────────────────────────
    if (spaceType === 'bodega') {
      if (eq?.includeHighCabinets !== false) {
        // Industrial metal shelving along back + left walls
        const shelfMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3, metalness: 0.8 });
        const shelfPlaneMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4, metalness: 0.5 });
        const shelfH = roomHgt * 0.9;
        const shelfLevels = 5;
        const shelfD = 0.50;
        // Back wall shelving
        const cols = Math.floor(roomLen / 1.0);
        for (let sc = 0; sc < cols; sc++) {
          const sx = offsetLen + (sc + 0.5) * (roomLen / cols);
          // Vertical uprights
          for (const side of [sx - roomLen / cols / 2 + 0.03, sx + roomLen / cols / 2 - 0.03]) {
            const upright = new THREE.Mesh(new THREE.BoxGeometry(0.04, shelfH, 0.04), shelfMat);
            upright.position.set(side, shelfH / 2, offsetWid + shelfD / 2);
            scene.add(upright);
          }
          // Horizontal shelves
          for (let sl = 0; sl <= shelfLevels; sl++) {
            const sy = (sl / shelfLevels) * shelfH;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(roomLen / cols - 0.04, 0.03, shelfD - 0.04), shelfPlaneMat);
            shelf.position.set(sx, sy, offsetWid + shelfD / 2);
            scene.add(shelf);
          }
        }
      }
    }

    // ── HEATMAP OVERLAY ────────────────────────────────────────────────────
    if (showHeatmap && isKitchen) {
      const xSink = -slabL / 4 * inverseFactor;
      const xStove = slabL / 4 * inverseFactor;
      const zSlabSurface = offsetWid + cDepth / 2;
      const hasColumn = !!project.ergonomics.dishwasherColumn && includeAppliances;
      const colWidth = 0.65; const refW = 0.70;
      const xStorage = !project.kitchenEquipment?.inverseDistribution
        ? (offsetLen + (hasColumn ? colWidth : refW) / 2 + 0.05)
        : (roomLen / 2 - (hasColumn ? colWidth : refW) / 2 - 0.05);
      const zStorage = offsetWid + cDepth / 2 + 0.25;

      const pSink = new THREE.Vector3(xSink, cHeight + 0.02, zSlabSurface);
      const pStove = new THREE.Vector3(xStove, cHeight + 0.02, zSlabSurface);
      const pPrep = new THREE.Vector3(0, cHeight + 0.02, zSlabSurface);
      const pStorage = new THREE.Vector3(xStorage, cHeight + 0.02, zStorage);

      const createGlowingSegment = (p1: THREE.Vector3, p2: THREE.Vector3, colorVal: string) => {
        const dist = p1.distanceTo(p2);
        const geo = new THREE.CylinderGeometry(0.012, 0.012, dist, 8);
        const mat = new THREE.MeshBasicMaterial({ color: colorVal, transparent: true, opacity: 0.7, depthWrite: false });
        const cylinder = new THREE.Mesh(geo, mat);
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        cylinder.position.copy(midpoint);
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        cylinder.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, direction));
        return cylinder;
      };

      scene.add(createGlowingSegment(pStove, pSink, '#f59e0b'));
      scene.add(createGlowingSegment(pSink, pStorage, '#3b82f6'));
      scene.add(createGlowingSegment(pStorage, pStove, '#ef4444'));

      const createHeatDisc = (pos: THREE.Vector3, coreRadius: number, auraRadius: number, colorVal: string) => {
        const group = new THREE.Group();
        const coreGeo = new THREE.CylinderGeometry(coreRadius, coreRadius, 0.005, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: colorVal, transparent: true, opacity: 0.75, depthWrite: false });
        const core = new THREE.Mesh(coreGeo, coreMat); core.position.copy(pos);
        group.add(core);
        const auraGeo = new THREE.CylinderGeometry(auraRadius, auraRadius, 0.002, 32);
        const auraMat = new THREE.MeshBasicMaterial({ color: colorVal, transparent: true, opacity: 0.35, depthWrite: false });
        const aura = new THREE.Mesh(auraGeo, auraMat); aura.position.copy(pos); aura.position.y -= 0.001;
        group.add(aura);
        const standH = 0.35;
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, standH, 8), new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 }));
        stand.position.set(pos.x, pos.y + standH / 2, pos.z);
        group.add(stand);
        const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.01), new THREE.MeshStandardMaterial({ color: colorVal, roughness: 0.3 }));
        badge.position.set(pos.x, pos.y + standH, pos.z);
        group.add(badge);
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
        sphere.position.set(pos.x, pos.y + standH + 0.04, pos.z);
        group.add(sphere);
        return group;
      };

      scene.add(createHeatDisc(pStove, 0.20, 0.38, '#ef4444'));
      scene.add(createHeatDisc(pSink, 0.18, 0.35, '#3b82f6'));
      scene.add(createHeatDisc(pPrep, 0.22, 0.44, '#f59e0b'));

      const storageGroup = new THREE.Group();
      const tubeGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.25, 16);
      const tubeMat = new THREE.MeshBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.25, wireframe: true, depthWrite: false });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(pStorage.x, 1.25 / 2, pStorage.z);
      storageGroup.add(tube);
      const ringGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.002, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pStorage.x, 0.015, pStorage.z);
      storageGroup.add(ring);
      scene.add(storageGroup);

      if (includeIsland) {
        const pIsland = new THREE.Vector3(0.1, cHeight + 0.02, 0.35);
        scene.add(createHeatDisc(pIsland, 0.25, 0.52, '#a855f7'));
      }
    }

    // Apply highlight for currently selected module after scene rebuild
    if (selectedModuleId) {
      const mod = moduleGroupsRef.current.get(selectedModuleId);
      if (mod) {
        mod.group.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat.emissive !== undefined) {
              mat.emissive.set('#2563eb');
              mat.emissiveIntensity = 0.35;
            }
          }
        });
      }
    }

    updateCameraPosition();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      rendererRef.current.render(sceneRef.current!, cameraRef.current);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current!);

    return () => {
      resizeObserver.disconnect();
      _textures.forEach(t => t.dispose());
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [project, showWalls, showHeatmap, hiddenModules, modulePositions, moduleZOffsets, moduleYOffsets, moduleRotations, lightConfig]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-slate-950">
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-0 cursor-crosshair active:cursor-grabbing outline-none overflow-hidden select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="block w-full h-full" id="dgla_interactive_3d" />

        {/* MOTOR badge — desktop only */}
        <div className="hidden lg:flex absolute top-4 left-4 pointer-events-none bg-slate-900/85 text-xs text-white px-3 py-1.5 rounded-full backdrop-blur-md items-center gap-1.5 border border-slate-700 font-mono tracking-tight shadow-md">
          <Box className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>MOTOR TRIDIMENSIONAL ACTIVO | DGLA RENDER</span>
        </div>

        {/* Camera hint — desktop only */}
        <div className="hidden lg:block absolute bottom-4 left-4 pointer-events-none bg-slate-900/85 text-xs text-slate-300 px-3 py-2 rounded-lg backdrop-blur-md border border-slate-700/80 shadow-lg max-w-xs leading-relaxed">
          <p className="font-semibold text-white mb-0.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Controles de Cámara 3D
          </p>
          <span className="text-slate-400">Arrastra para rotar. Rueda para zoom. Clic sobre muebles para seleccionar.</span>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1 z-10">
          <button onClick={() => adjustZoom('in')} className="p-2 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 border border-slate-700 shadow-md backdrop-blur-sm transition-all focus:outline-none" title="Aumentar Zoom" id="btn_zoom_in">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => adjustZoom('out')} className="p-2 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 border border-slate-700 shadow-md backdrop-blur-sm transition-all focus:outline-none" title="Reducir Zoom" id="btn_zoom_out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyPreset('perspective')} className="p-2 bg-slate-900/90 text-white rounded-lg hover:bg-slate-800 border border-slate-700 shadow-md backdrop-blur-sm transition-all focus:outline-none" title="Reiniciar Cámara" id="btn_reset_cam">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Views bar — scrollable on mobile, wrap on desktop */}
      <div className="bg-slate-900/95 border-t border-slate-800 py-2 px-3 flex items-center gap-2 backdrop-blur-md overflow-x-auto scrollbar-none">
        <span className="hidden lg:flex text-[10px] font-mono tracking-wide text-slate-500 items-center gap-1 uppercase shrink-0">
          <Eye className="w-3.5 h-3.5 text-emerald-500" /> Vistas:
        </span>
        <div className="flex gap-1.5 shrink-0">
          {([
            { id: 'perspective', label: 'Perspectiva',    short: 'Persp.',   icon: <Home    className="w-3 h-3" /> },
            { id: 'isometric',  label: 'Axonométrica',   short: 'Axon.',    icon: <Box     className="w-3 h-3" /> },
            { id: 'front',      label: 'Alzado Frontal', short: 'Alzado',   icon: <Eye     className="w-3 h-3" /> },
            { id: 'side',       label: 'Corte Lateral',  short: 'Lateral',  icon: <Eye     className="w-3 h-3" /> },
            { id: 'top',        label: 'Planta Aérea',   short: 'Planta',   icon: <LayoutGrid className="w-3 h-3" /> },
          ] as const).map(({ id, label, short, icon }) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all border whitespace-nowrap ${
                activePreset === id
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              id={`view_angle_${id}`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
