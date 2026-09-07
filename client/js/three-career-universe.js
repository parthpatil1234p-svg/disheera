/**
 * three-career-universe.js — 3D Career Constellation Universe
 *
 * Renders an interactive 3D constellation of the 5 tech careers for the
 * CareerPath AI landing page hero section:
 * - 5 glowing planetary nodes with distinct career colors
 * - Interconnected laser constellation network lines
 * - Drifting ambient starfield background (800+ particles)
 * - Interactive raycasting: hovering over a career node displays its name
 * - Graceful fallback to 2D background gradient if WebGL is unavailable
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

  function initCareerUniverse(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const fallbackEl = document.getElementById(`${containerId}-fallback`);

    if (!isWebGLAvailable() || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.classList.remove('d-none');
      return;
    }

    // Cleanup
    if (activeRenderer) {
      if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
      if (activeRenderer.domElement && activeRenderer.domElement.parentNode) {
        activeRenderer.domElement.parentNode.removeChild(activeRenderer.domElement);
      }
      activeRenderer.dispose();
      activeRenderer = null;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1020, 0.018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    activeRenderer = renderer;

    // Tooltip
    let tooltip = container.querySelector('.universe-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'universe-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.padding = '8px 14px';
      tooltip.style.borderRadius = '8px';
      tooltip.style.fontSize = '13px';
      tooltip.style.fontWeight = '700';
      tooltip.style.color = '#fff';
      tooltip.style.background = 'rgba(15, 23, 42, 0.92)';
      tooltip.style.border = '1px solid rgba(34, 211, 238, 0.4)';
      tooltip.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.25)';
      tooltip.style.transition = 'opacity 0.15s ease';
      tooltip.style.opacity = '0';
      tooltip.style.zIndex = '15';
      container.appendChild(tooltip);
    }

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // 5 Career Stars definition
    const careers = [
      { name: 'Front-End Developer', color: 0x22d3ee, pos: [-10, 4, 0], icon: 'bi-code-slash' },
      { name: 'Full-Stack Developer', color: 0x4f46e5, pos: [8, 6, -3], icon: 'bi-layers-fill' },
      { name: 'Data Analyst', color: 0x10b981, pos: [0, -6, 2], icon: 'bi-graph-up' },
      { name: 'UI/UX Designer', color: 0xec4899, pos: [-7, -5, -2], icon: 'bi-palette-fill' },
      { name: 'Cybersecurity Analyst', color: 0xf59e0b, pos: [9, -3, 1], icon: 'bi-shield-lock-fill' },
    ];

    const interactiveMeshes = [];
    const nodeVectors = [];

    careers.forEach((c) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(c.pos[0], c.pos[1], c.pos[2]);

      // Core sphere
      const geo = new THREE.SphereGeometry(1.4, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { name: c.name, color: c.color };
      nodeGroup.add(mesh);
      interactiveMeshes.push(mesh);

      // Glowing wireframe aura
      const auraGeo = new THREE.IcosahedronGeometry(1.9, 1);
      const auraMat = new THREE.MeshBasicMaterial({
        color: c.color,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      nodeGroup.add(aura);

      // Orbital halo ring
      const ringGeo = new THREE.RingGeometry(2.3, 2.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: c.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      nodeGroup.add(ring);

      universeGroup.add(nodeGroup);
      nodeVectors.push(new THREE.Vector3(c.pos[0], c.pos[1], c.pos[2]));
    });

    // Connecting laser constellation lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      linewidth: 1.5,
    });

    for (let i = 0; i < nodeVectors.length; i++) {
      for (let j = i + 1; j < nodeVectors.length; j++) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          nodeVectors[i],
          nodeVectors[j],
        ]);
        const line = new THREE.Line(lineGeo, lineMat);
        universeGroup.add(line);
      }
    }

    // Drifting starfield
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < starCount; i++) {
      starCoords.push(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 70
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.5,
      transparent: true,
      opacity: 0.7,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('mousemove', (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Raycaster for hover
      const mouse = new THREE.Vector2(mouseX, mouseY);
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
          <div class="d-flex align-items-center gap-2">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22d3ee;"></span>
            <span>${hit.userData.name}</span>
          </div>
        `;
      } else {
        renderer.domElement.style.cursor = 'default';
        tooltip.style.opacity = '0';
      }
    });

    // Resize
    const onResize = () => {
      if (!container || !activeRenderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // GSAP Intro animation
    if (typeof gsap !== 'undefined') {
      gsap.from(universeGroup.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1.6, ease: 'power2.out' });
      gsap.from(camera.position, { z: 60, duration: 1.8, ease: 'power2.out' });
    }

    // Animation Loop
    let tick = 0;
    const animate = () => {
      activeAnimationId = requestAnimationFrame(animate);
      tick += 0.005;

      // Slow cosmic rotation
      universeGroup.rotation.y = tick * 0.4 + mouseX * 0.15;
      universeGroup.rotation.x = Math.sin(tick * 0.3) * 0.08 + -mouseY * 0.12;

      starPoints.rotation.y = tick * 0.08;

      renderer.render(scene, camera);
    };

    animate();
  }

  window.initCareerUniverse = initCareerUniverse;
})();
