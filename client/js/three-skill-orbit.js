/**
 * three-skill-orbit.js — 3D Interactive Skill Gap Planetary Orbit
 *
 * Visualizes a student's skill alignment around a central career star:
 * - Central sun: The Target Career (glowing sphere with wireframe corona)
 * - Inner Orbit: Matched Skills (emerald green spheres)
 * - Middle Orbit: Needs Upgrade Skills (amber / gold spheres)
 * - Outer Orbit: Missing Skills (coral red / crimson spheres)
 *
 * Features:
 * - Mouse drag orbital rotation & wheel zoom
 * - Raycaster hovering to display skill labels
 * - Progressive enhancement & WebGL feature detection with graceful 2D fallback
 * - Responsive canvas resize
 */

(function () {
  let activeRenderer = null;
  let activeAnimationId = null;

  // WebGL availability check
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

    // Clean up any previously active instance on this container
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

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1020, 0.025);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 320;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip overlay
    let tooltip = container.querySelector('.orbit-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'orbit-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '12px';
      tooltip.style.fontWeight = '600';
      tooltip.style.color = '#fff';
      tooltip.style.background = 'rgba(15, 23, 42, 0.9)';
      tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      tooltip.style.transition = 'opacity 0.15s ease';
      tooltip.style.opacity = '0';
      tooltip.style.zIndex = '10';
      container.appendChild(tooltip);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x22d3ee, 2.5, 60);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const secondaryLight = new THREE.DirectionalLight(0x7c3aed, 1.2);
    secondaryLight.position.set(10, 20, 10);
    scene.add(secondaryLight);

    // Group for all orbital objects
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // 1. Central Career Sun
    const sunGeometry = new THREE.SphereGeometry(2.2, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.userData = { name: careerTitle, type: 'career' };
    orbitGroup.add(sunMesh);

    // Wireframe corona around the sun
    const coronaGeo = new THREE.IcosahedronGeometry(2.7, 2);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    orbitGroup.add(coronaMesh);

    // 2. Orbits & Skill Spheres
    const interactiveMeshes = [sunMesh];

    function createOrbitRing(radius, colorHex) {
      const ringGeo = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      orbitGroup.add(ring);
    }

    function addPlanetsToOrbit(skills, radius, colorHex, typeName, size = 0.6) {
      if (!skills || skills.length === 0) return [];
      createOrbitRing(radius, colorHex);

      const count = skills.length;
      const angleStep = (Math.PI * 2) / count;
      const spheres = [];

      skills.forEach((skill, i) => {
        const angle = i * angleStep;
        const geo = new THREE.SphereGeometry(size, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.4,
          roughness: 0.3,
          metalness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        mesh.userData = {
          name: skill.displayName || skill.skill || 'Skill',
          type: typeName,
          skillData: skill,
        };
        orbitGroup.add(mesh);
        interactiveMeshes.push(mesh);
        spheres.push({ mesh, radius, baseAngle: angle, speed: 0.003 + (1 / radius) * 0.004 });
      });

      return spheres;
    }

    // Inner: Matched (Green) - Radius ~6
    const matchedPlanets = addPlanetsToOrbit(matchedSkills, 6.5, 0x10b981, 'Matched Skill', 0.55);
    // Middle: Needs Upgrade (Amber) - Radius ~10
    const weakPlanets = addPlanetsToOrbit(weakSkills, 10.5, 0xf59e0b, 'Needs Upgrade', 0.6);
    // Outer: Missing (Red) - Radius ~14.5
    const missingPlanets = addPlanetsToOrbit(missingSkills, 14.5, 0xef4444, 'Missing Skill', 0.65);

    // Stars in background
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 400; i++) {
      starCoords.push(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.6, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Interaction State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0.002;
    let rotationVelocityY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      // Raycasting for tooltip
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        tooltip.style.opacity = '1';
        tooltip.style.left = `${e.clientX - rect.left + 15}px`;
        tooltip.style.top = `${e.clientY - rect.top + 15}px`;
        
        let typeBadge = '';
        if (hit.userData.type === 'career') {
          typeBadge = '<span style="color:#22d3ee">★ Career Core</span>';
        } else if (hit.userData.type === 'Matched Skill') {
          typeBadge = '<span style="color:#34d399">✓ Matched</span>';
        } else if (hit.userData.type === 'Needs Upgrade') {
          typeBadge = '<span style="color:#fbbf24">▲ Upgrade Needed</span>';
        } else {
          typeBadge = '<span style="color:#f87171">+ Missing Skill</span>';
        }

        tooltip.innerHTML = `<div>${hit.userData.name}</div><div style="font-size:10px; opacity:0.8">${typeBadge}</div>`;
      } else {
        tooltip.style.opacity = '0';
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitGroup.rotation.y += deltaX * 0.008;
      orbitGroup.rotation.x += deltaY * 0.008;
      // Clamp vertical tilt
      orbitGroup.rotation.x = Math.max(-0.6, Math.min(0.6, orbitGroup.rotation.x));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.02;
      camera.position.z = Math.max(16, Math.min(45, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      orbitGroup.rotation.y += deltaX * 0.008;
    });
    window.addEventListener('touchend', () => { isDragging = false; });

    // Resize handler
    const onResize = () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Initial entrance animation with GSAP if available
    if (typeof gsap !== 'undefined') {
      gsap.from(orbitGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.2, ease: 'power2.out' });
      gsap.from(camera.position, { y: 40, z: 50, duration: 1.5, ease: 'power2.out' });
    }

    // Animation Loop
    let angle = 0;
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);

      angle += 0.005;

      // Rotate sun and corona
      sunMesh.rotation.y += 0.01;
      coronaMesh.rotation.y -= 0.006;
      coronaMesh.rotation.z += 0.004;

      // Gentle auto-rotation if user isn't dragging
      if (!isDragging) {
        orbitGroup.rotation.y += 0.002;
      }

      // Orbit planets
      [...matchedPlanets, ...weakPlanets, ...missingPlanets].forEach((p) => {
        const curAngle = p.baseAngle + angle * (p.speed * 80);
        p.mesh.position.x = Math.cos(curAngle) * p.radius;
        p.mesh.position.z = Math.sin(curAngle) * p.radius;
        p.mesh.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initSkillOrbit = initSkillOrbit;
})();
