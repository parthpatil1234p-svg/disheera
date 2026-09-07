/**
 * three-roadmap-path.js — 3D Interactive Milestone Path
 *
 * Renders a 3D winding trajectory of weekly milestones for the student's roadmap:
 * - Stepping stone platforms representing each week (Week 1 .. Week N)
 * - Connecting glowing curved laser beam / tube connecting all milestones
 * - Color-coded:
 *     Green = All tasks completed for this week
 *     Cyan  = Current in-progress week (with pulsing aura)
 *     Indigo/Gray = Upcoming week
 * - Clicking a node smoothly scrolls the page to that week's curriculum card
 * - Graceful fallback if WebGL is unavailable
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

  function initRoadmapPath(containerId, weeklyData = []) {
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

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1020, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip
    let tooltip = container.querySelector('.path-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'path-tooltip';
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x22d3ee, 2, 50);
    pointLight.position.set(0, 10, 5);
    scene.add(pointLight);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);

    const totalWeeks = weeklyData.length || 8;
    const points = [];
    const interactiveMeshes = [];
    const pulsingMeshes = [];

    // Generate sinusoidal coordinates along X axis
    const spacingX = 4.2;
    const startX = -((totalWeeks - 1) * spacingX) / 2;

    weeklyData.forEach((week, i) => {
      const x = startX + i * spacingX;
      const z = Math.sin(i * 0.9) * 3.5;
      const y = Math.cos(i * 0.9) * 1.2;
      const vec = new THREE.Vector3(x, y, z);
      points.push(vec);

      // Determine status & color
      let colorHex = 0x4f46e5; // Default upcoming
      let statusText = 'Upcoming';
      if (week.isCompleted) {
        colorHex = 0x10b981; // Green
        statusText = 'Completed';
      } else if (week.isActive) {
        colorHex = 0x22d3ee; // Cyan
        statusText = 'In Progress';
      }

      // Platform pedestal
      const cylGeo = new THREE.CylinderGeometry(1.1, 1.3, 0.4, 32);
      const cylMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: week.isActive ? 0.8 : week.isCompleted ? 0.4 : 0.15,
        roughness: 0.3,
        metalness: 0.7,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.position.copy(vec);
      cylMesh.userData = {
        weekNumber: week.weekNumber,
        title: week.title,
        statusText,
        colorHex,
      };
      pathGroup.add(cylMesh);
      interactiveMeshes.push(cylMesh);

      // Sphere beacon above pedestal
      const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorHex,
        emissiveIntensity: 0.9,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(x, y + 0.65, z);
      pathGroup.add(sphereMesh);

      if (week.isActive) {
        // Glowing halo for active week
        const haloGeo = new THREE.RingGeometry(1.5, 1.8, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.position.set(x, y + 0.05, z);
        pathGroup.add(haloMesh);
        pulsingMeshes.push(haloMesh);
      }
    });

    // Connecting spline curve
    if (points.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      pathGroup.add(tubeMesh);
    }

    // Grid floor helper
    const grid = new THREE.GridHelper(50, 25, 0x1e293b, 0x0f172a);
    grid.position.y = -3;
    scene.add(grid);

    // Mouse Interaction
    let isDragging = false;
    let prevMouseX = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onMouseMove = (e) => {
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
        renderer.domElement.style.cursor = 'pointer';
        tooltip.style.opacity = '1';
        tooltip.style.left = `${e.clientX - rect.left + 15}px`;
        tooltip.style.top = `${e.clientY - rect.top + 15}px`;
        tooltip.innerHTML = `
          <div>Week ${hit.userData.weekNumber}: ${hit.userData.title}</div>
          <div style="font-size:10px; color:#38bdf8">${hit.userData.statusText} • Click to inspect</div>
        `;
      } else {
        renderer.domElement.style.cursor = 'grab';
        tooltip.style.opacity = '0';
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      pathGroup.rotation.y += deltaX * 0.006;
    };

    const onMouseUp = () => { isDragging = false; };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const weekNum = intersects[0].object.userData.weekNumber;
        const targetEl = document.getElementById(`week-card-${weekNum}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.add('highlight-week');
          setTimeout(() => targetEl.classList.remove('highlight-week'), 1500);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick);

    // Window Resize
    const onResize = () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Initial entrance animation with GSAP
    if (typeof gsap !== 'undefined') {
      gsap.from(pathGroup.position, { y: -8, duration: 1.2, ease: 'power2.out' });
      gsap.from(camera.position, { z: 40, duration: 1.4, ease: 'power2.out' });
    }

    // Animation loop
    let tick = 0;
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      tick += 0.03;

      // Pulse halos
      pulsingMeshes.forEach((mesh) => {
        const scale = 1 + Math.sin(tick) * 0.15;
        mesh.scale.set(scale, scale, 1);
      });

      // Subtle float
      if (!isDragging) {
        pathGroup.position.y = Math.sin(tick * 0.5) * 0.2;
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initRoadmapPath = initRoadmapPath;
})();
