/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * three-skill-orbit.js — High-Tech 3D Skill Map & Planetary Orbit
 *
 * Visualizes a student's skill alignment around a central target career:
 * - Radiant stardust particles creating depth
 * - Central luminous career core with glowing orbital rings
 * - Skill satellites with high-intensity emissive glow:
 *     - Matched Skills: Radiant Emerald (#10B981)
 *     - Developing Skills: Luminous Amber (#F59E0B)
 *     - Missing Skills: Hot Rose (#F43F5E)
 * - Luminous orbital rings and laser connection beams
 * - Raycaster hover displays glowing glassmorphic HUD tooltip
 * - Performance: clamped pixel ratio, WebGL fallback
 */

(function () {
  let activeRenderer = null;
  let activeAnimationId = null;

  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  function initSkillOrbit(containerId, data = {}) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`);

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.classList.remove('d-none');
      return;
    }

    // Clean up any previously active instance
    if (activeRenderer) {
      if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
      if (activeRenderer.domElement && activeRenderer.domElement.parentNode) {
        activeRenderer.domElement.parentNode.removeChild(activeRenderer.domElement);
      }
      activeRenderer.dispose();
      activeRenderer = null;
    }

    const {
      careerTitle = 'Target Career',
      matchedSkills = [],
      weakSkills = [],
      missingSkills = [],
    } = data;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip overlay
    let tooltip = container.querySelector('.orbit-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'orbit-tooltip';
      container.appendChild(tooltip);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00F2FE, 2.5, 60);
    pointLight.position.set(0, 10, 5);
    scene.add(pointLight);

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    // Stardust Field
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const stardust = new THREE.Points(pGeo, pMat);
    mapGroup.add(stardust);

    // 1. Central Career Core
    const sunGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0x00F2FE,
      emissive: 0x00F2FE,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.7,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    mapGroup.add(sunMesh);

    // Halo around center
    const sunHaloGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 64);
    const sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0x8B5CF6,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const sunHalo = new THREE.Mesh(sunHaloGeo, sunHaloMat);
    sunHalo.rotation.x = Math.PI / 2.2;
    mapGroup.add(sunHalo);

    // 2. Prepare Skill Nodes — tier by category
    const allSkills = [
      ...matchedSkills.map((s) => ({ ...s, status: 'matched', color: 0x10B981, colorHex: '#10B981', label: 'MATCHED', tier: 0 })),
      ...weakSkills.map((s) => ({ ...s, status: 'weak', color: 0xF59E0B, colorHex: '#F59E0B', label: 'DEVELOPING', tier: 1 })),
      ...missingSkills.map((s) => ({ ...s, status: 'missing', color: 0xF43F5E, colorHex: '#F43F5E', label: 'MISSING', tier: 2 })),
    ].slice(0, 12);

    // Three-tier orbit radii
    const ORBIT_RADII = [6, 9, 12.5];

    // Orbit Ring Tracks
    ORBIT_RADII.forEach((r) => {
      const trackGeo = new THREE.RingGeometry(r - 0.08, r + 0.05, 64);
      const trackMat = new THREE.MeshBasicMaterial({
        color: 0x38BDF8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.rotation.x = Math.PI / 2;
      mapGroup.add(track);
    });

    const interactiveMeshes = [];

    // Group skills by tier for even angle distribution
    const tiers = [[], [], []];
    allSkills.forEach((s) => tiers[s.tier].push(s));

    tiers.forEach((tierSkills, tierIdx) => {
      const orbitRadius = ORBIT_RADII[tierIdx];
      tierSkills.forEach((skill, idx) => {
        const angle = (idx / Math.max(tierSkills.length, 1)) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = (Math.sin(angle * 3) * 1.5);

      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(x, y, z);

      // Sphere
      const sphereGeo = new THREE.SphereGeometry(0.85, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: skill.color,
        emissive: skill.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.5,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = skill;
      nodeGroup.add(sphereMesh);
      interactiveMeshes.push(sphereMesh);

      // Glowing Aura Ring
      const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: skill.color,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      nodeGroup.add(ringMesh);

      mapGroup.add(nodeGroup);

      // Laser connector to center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: skill.color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      mapGroup.add(new THREE.Line(lineGeo, lineMat));
      });
    });

    // Raycasting & Parallax
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    let hoveredMesh = null;
    let targetRotY = 0;
    let targetRotX = 0;
    let lastClientX = null;
    let lastClientY = null;

    const updateTooltipPosition = (clientX, clientY) => {
      if (!tooltip || clientX === null || clientY === null) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const pad = 12;
      const tipWidth = Math.min(260, Math.max(180, rect.width - pad * 2));
      const tipRect = tooltip.getBoundingClientRect();
      const tipHeight = tipRect.height || tooltip.offsetHeight || 140;

      let left;
      if (x > rect.width * 0.45 || (x + 14 + tipWidth > rect.width - pad)) {
        left = x - tipWidth - 14;
      } else {
        left = x + 14;
      }

      if (left < pad) {
        left = pad;
      }
      if (left + tipWidth > rect.width - pad) {
        left = Math.max(pad, rect.width - tipWidth - pad);
      }

      let top = y - 14;
      if (top + tipHeight > rect.height - pad) {
        top = Math.max(pad, rect.height - tipHeight - pad);
      }
      if (top < pad) {
        top = pad;
      }

      tooltip.style.width = `${Math.round(tipWidth)}px`;
      tooltip.style.maxWidth = `${rect.width - pad * 2}px`;
      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
    };

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      lastClientX = e.clientX;
      lastClientY = e.clientY;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      targetRotY = (x / rect.width - 0.5) * 0.6;
      targetRotX = (y / rect.height - 0.5) * 0.3;

      updateTooltipPosition(e.clientX, e.clientY);
    });

    container.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
      lastClientX = null;
      lastClientY = null;
      if (tooltip) tooltip.classList.remove('visible');
      if (hoveredMesh) {
        hoveredMesh.scale.set(1, 1, 1);
        hoveredMesh = null;
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    });

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      stardust.rotation.y = elapsed * 0.02;
      sunMesh.rotation.y = elapsed * 0.3;
      sunHalo.rotation.z = elapsed * 0.4;

      mapGroup.rotation.y += (targetRotY - mapGroup.rotation.y) * 0.05;
      mapGroup.rotation.x += (targetRotX - mapGroup.rotation.x) * 0.05;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) hoveredMesh.scale.set(1, 1, 1);
          hoveredMesh = hit;
          hoveredMesh.scale.set(1.35, 1.35, 1.35);

          const s = hit.userData;
          tooltip.innerHTML = `
            <div class="tooltip-header" style="border-left: 3px solid ${s.colorHex};">
              <span class="tooltip-code" style="color: ${s.colorHex};">${s.label}</span>
              <h4 class="tooltip-title">${s.skill || s.name}</h4>
            </div>
            <p class="tooltip-body">Required: ${s.requiredProficiency || 'Intermediate'} · Weight: ${s.weight || 'Core'}</p>
          `;
          tooltip.classList.add('visible');
          updateTooltipPosition(lastClientX, lastClientY);
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh.scale.set(1, 1, 1);
          hoveredMesh = null;
          tooltip.classList.remove('visible');
        }
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initSkillOrbit = initSkillOrbit;
})();
