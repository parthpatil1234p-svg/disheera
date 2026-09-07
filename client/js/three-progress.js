/**
 * three-progress.js — 3D Interactive Dashboard Progress Orb
 *
 * Renders an interactive 3D holographic energy sphere that visually responds
 * to the student's roadmap completion progress:
 * - < 30%: Indigo / Violet core with gentle ambient orbit
 * - 30% - 70%: Bright Cyan / Neon Teal pulsing sphere with dual orbiting rings
 * - > 70%: Radiant Emerald Green / Golden energy core with fast particle field
 * - Interactive mouse tilt and GSAP tweening
 * - Graceful fallback for non-WebGL environments
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

  function initProgressOrb(containerId, percentage = 0) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`);

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.classList.remove('d-none');
      return;
    }

    // Cleanup previous instance
    if (activeRenderer) {
      if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
      if (activeRenderer.domElement && activeRenderer.domElement.parentNode) {
        activeRenderer.domElement.parentNode.removeChild(activeRenderer.domElement);
      }
      activeRenderer.dispose();
      activeRenderer = null;
    }

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Color determination based on progress percentage
    let primaryColor = 0x4f46e5;
    let accentColor = 0x7c3aed;

    if (percentage >= 75) {
      primaryColor = 0x10b981; // Green
      accentColor = 0x34d399;
    } else if (percentage >= 30) {
      primaryColor = 0x22d3ee; // Cyan
      accentColor = 0x38bdf8;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(primaryColor, 3, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Inner Core Sphere
    const coreGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(coreMesh);

    // Outer Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(2.1, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    orbGroup.add(cageMesh);

    // Dynamic Orbiting Rings
    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.6,
    });

    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    orbGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 3;
    orbGroup.add(ring2);

    // Particle Swarm
    const particleCount = Math.max(30, Math.floor(percentage * 1.5));
    const particleGeo = new THREE.BufferGeometry();
    const particleCoords = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particleCoords.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particleCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: accentColor,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(particlePoints);

    // Interactive mouse tilt
    let mouseX = 0;
    let mouseY = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    });

    // Resize
    const onResize = () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // GSAP Intro
    if (typeof gsap !== 'undefined') {
      gsap.from(orbGroup.scale, { x: 0, y: 0, z: 0, duration: 1, ease: 'back.out(1.7)' });
    }

    // Animation loop
    const rotationSpeed = 0.008 + (percentage / 100) * 0.015;
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);

      // Core rotation
      coreMesh.rotation.y += rotationSpeed * 0.8;
      cageMesh.rotation.y -= rotationSpeed;
      cageMesh.rotation.x += rotationSpeed * 0.5;

      ring1.rotation.z += rotationSpeed * 1.2;
      ring2.rotation.x += rotationSpeed * 0.9;

      particlePoints.rotation.y += rotationSpeed * 0.6;

      // Mouse tilt dampening
      orbGroup.rotation.y += (mouseX * 0.5 - orbGroup.rotation.y) * 0.08;
      orbGroup.rotation.x += (-mouseY * 0.5 - orbGroup.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initProgressOrb = initProgressOrb;
})();
