// ---- PARTICLES MULTI-STYLE SEGÚN SECCIÓN ----
const PARTICLE_STYLES = [
    // Sección 0: Inicio (Big Bang)
    {
        particles: {
            number: { value: 56 },
            color: { value: "#fff" },
            shape: { type: "circle" },
            opacity: { value: 0.44 },
            size: { value: 4 },
            line_linked: { enable: true, opacity: 0.35, distance: 140, color: "#fff" },
            move: { enable: true, speed: 0.6 }
        }
    },
    // Sección 1: ADN (celeste y sin líneas)
    {
        particles: {
            number: { value: 44 },
            color: { value: "#40e0ff" },
            shape: { type: "edge" },
            opacity: { value: 0.39 },
            size: { value: 5 },
            line_linked: { enable: false },
            move: { enable: true, speed: 2.0, direction: "bottom-right", random: true }
        }
    },
    // Sección 2: Humanidad (círculos y triángulos)
    {
        particles: {
            number: { value: 38 },
            color: { value: "#fffaa8" },
            shape: { type: ["circle", "triangle"] },
            opacity: { value: 0.37 },
            size: { value: 7 },
            line_linked: { enable: false },
            move: { enable: true, speed: 1.7 }
        }
    },
    // Sección 3: Da Vinci (líneas doradas)
    {
        particles: {
            number: { value: 55 },
            color: { value: "#ffd700" },
            shape: { type: "polygon", polygon: { nb_sides: 6 } },
            opacity: { value: 0.27 },
            size: { value: 5 },
            line_linked: { enable: true, color: "#ffd700", opacity: 0.13 },
            move: { enable: true, speed: 0.9 }
        }
    },
    // Sección 4: Árbol/manzana (verde)
    {
        particles: {
            number: { value: 45 },
            color: { value: "#4ecb5f" },
            shape: { type: "circle" },
            opacity: { value: 0.41 },
            size: { value: 6 },
            line_linked: { enable: false },
            move: { enable: true, speed: 1.5, direction: "bottom" }
        }
    }
];

let currentParticleIdx = -1;
function setParticlesForSection(idx) {
    if (currentParticleIdx === idx) return;
    currentParticleIdx = idx;
    if (window.pJSDom && window.pJSDom.length) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
    }
    particlesJS("particles-bg", PARTICLE_STYLES[idx]);
}

// ---- CONFIGURACIÓN DE OBJETOS Y RANGOS DE SCROLL ---- //
const SECTIONS = [
    { name: 'Brazos',   start: 0.00, end: 0.19 },
    { name: 'ADN',      start: 0.19, end: 0.39 },
    { name: 'Humano',   start: 0.39, end: 0.56 }, // <- HUMANO sólo aquí
    { name: 'DaVinci',  start: 0.56, end: 0.76 }, // <- DA VINCI solo aquí
    { name: 'Manzana',  start: 0.76, end: 1.00 }
];

let scrollProgress = 0; // 0 a 1

// ---- THREE.JS SETUP ---- //
let scene, camera, renderer, objects = {};
let width = window.innerWidth;
let height = window.innerHeight;

function brazoConMano(lado = 1) {
    const grupo = new THREE.Group();
    const brazo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.40, 6.7, 20),
        new THREE.MeshPhongMaterial({ color: 0xffe6b0 })
    );
    brazo.rotation.z = Math.PI / 2.3 * lado;
    grupo.add(brazo);
    const mano = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.4, 0.7),
        new THREE.MeshPhongMaterial({ color: 0xfde6b6 })
    );
    mano.position.set(lado * 3.3, 0, 0);
    grupo.add(mano);
    for (let i = 0; i < 5; i++) {
        let dedo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.1, 0.85, 16),
            new THREE.MeshPhongMaterial({ color: 0xf9d998 })
        );
        dedo.position.set(lado * 3.65, 0.19 - 0.10 * i, 0.19 * (i-2));
        dedo.rotation.z = Math.PI / 2;
        dedo.rotation.y = Math.PI * 0.03 * (i-2);
        grupo.add(dedo);
    }
    return grupo;
}

function humanoDummy(color = 0xaebeff, alfa = 1) {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 2.2, 32),
        new THREE.MeshStandardMaterial({ color, transparent: alfa < 1, opacity: alfa })
    );
    torso.position.y = 0;
    g.add(torso);
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 28, 28),
        new THREE.MeshStandardMaterial({ color, transparent: alfa < 1, opacity: alfa })
    );
    head.position.y = 1.45;
    g.add(head);
    for (let i = 0; i < 2; i++) {
        let arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.18, 2.1, 18),
            new THREE.MeshStandardMaterial({ color, transparent: alfa < 1, opacity: alfa })
        );
        arm.position.set(i == 0 ? -1.23 : 1.23, 0.85, 0);
        arm.rotation.z = Math.PI / 2;
        g.add(arm);
    }
    for (let i = 0; i < 2; i++) {
        let leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.17, 0.19, 2.6, 18),
            new THREE.MeshStandardMaterial({ color, transparent: alfa < 1, opacity: alfa })
        );
        leg.position.set(i == 0 ? -0.36 : 0.36, -1.35, 0);
        g.add(leg);
    }
    return g;
}

function vitruvianoDummy() {
    const group = new THREE.Group();
    const circle = new THREE.Mesh(
        new THREE.TorusGeometry(2.8, 0.08, 16, 120),
        new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    group.add(circle);
    const humano1 = humanoDummy(0xeaeaea, 0.96);
    humano1.scale.set(1.15, 1.13, 1.08);
    humano1.rotation.z = Math.PI/7;
    group.add(humano1);
    const humano2 = humanoDummy(0xaebeff, 0.98);
    humano2.scale.set(1.05, 1, 1);
    humano2.rotation.z = -Math.PI/8;
    group.add(humano2);
    return group;
}

function arbolLowpoly() {
    const group = new THREE.Group();
    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.35, 2.7, 9),
        new THREE.MeshPhongMaterial({ color: 0x9c6b3f })
    );
    tronco.position.y = -1.6;
    group.add(tronco);
    const hojas = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.48),
        new THREE.MeshPhongMaterial({ color: 0x5dc46b, flatShading: true })
    );
    hojas.position.y = 0.2;
    group.add(hojas);
    return group;
}

function manzanaDummy() {
    const group = new THREE.Group();
    const apple = new THREE.Mesh(
        new THREE.SphereGeometry(0.37, 18, 18),
        new THREE.MeshPhongMaterial({ color: 0xe74c3c })
    );
    group.add(apple);
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8),
        new THREE.MeshPhongMaterial({ color: 0x6e3d17 })
    );
    stem.position.y = 0.24;
    group.add(stem);
    return group;
}

function adnDummy() {
    const group = new THREE.Group();
    for (let i = 0; i < 14; i++) {
        let t = i / 13 * Math.PI * 2 * 2;
        let sph1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x4ecdc4 })
        );
        let sph2 = sph1.clone();
        sph1.position.set(Math.cos(t) * 0.88, i-7, Math.sin(t) * 0.88);
        sph2.position.set(Math.cos(t+Math.PI) * 0.88, i-7, Math.sin(t+Math.PI) * 0.88);
        group.add(sph1, sph2);
        if (i < 13) {
            let stick = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.65, 8),
                new THREE.MeshPhongMaterial({ color: 0xc3fce6 })
            );
            stick.position.y = i - 7 + 0.5;
            stick.rotation.z = Math.PI/2;
            group.add(stick);
        }
    }
    return group;
}

function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(65, width/height, 0.1, 100);
    camera.position.set(0, 0, 14);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);

    // ---- OBJETOS DUMMY ----
    objects.leftArm = brazoConMano(-1);
    objects.leftArm.position.set(-6, 3.5, 0);
    scene.add(objects.leftArm);

    objects.rightArm = brazoConMano(1);
    objects.rightArm.position.set(6, 3.5, 0);
    scene.add(objects.rightArm);

    objects.dna = adnDummy();
    objects.dna.position.set(0, 6, 0);
    scene.add(objects.dna);

    objects.human = humanoDummy();
    objects.human.position.set(0, -2, 0);
    scene.add(objects.human);

    objects.vitruvio = vitruvianoDummy();
    objects.vitruvio.position.set(0, -1, 0);
    scene.add(objects.vitruvio);

    objects.tree = arbolLowpoly();
    objects.tree.position.set(0, -7, 0);
    scene.add(objects.tree);

    objects.apple = manzanaDummy();
    objects.apple.position.set(0, -4.2, 1.2);
    scene.add(objects.apple);

    // LUCES
    const ambient = new THREE.AmbientLight(0xffffff, 0.83);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfffbe8, 1.17);
    dir.position.set(7, 13, 6);
    scene.add(dir);
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

function getScrollProgress() {
    const scrollY = window.scrollY;
    const docH = document.body.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(1, scrollY / docH));
}

function animate() {
    scrollProgress = getScrollProgress();
    updateObjects(scrollProgress);
    renderer.render(scene, camera);
    syncText(scrollProgress);
    requestAnimationFrame(animate);
}

function updateObjects(p) {
    // --- BRAZOS --- //
    if (p < SECTIONS[0].end) {
        let t = (p - SECTIONS[0].start) / (SECTIONS[0].end - SECTIONS[0].start);
        t = Math.max(0, Math.min(1, t));
        objects.leftArm.visible = objects.rightArm.visible = true;
        objects.leftArm.position.x = -6 + 4.85 * t;
        objects.rightArm.position.x = 6 - 4.85 * t;
    } else {
        objects.leftArm.visible = objects.rightArm.visible = false;
    }

    // --- ADN --- //
    if (p >= SECTIONS[0].end && p < SECTIONS[1].end) {
        let t = (p - SECTIONS[0].end) / (SECTIONS[1].end - SECTIONS[0].end);
        objects.dna.position.y = 6 - 7 * t;
        objects.dna.rotation.y = t * Math.PI * 3;
        objects.dna.visible = true;
    } else {
        objects.dna.visible = false;
    }

    // --- HUMANO --- //
    if (p >= SECTIONS[2].start && p < SECTIONS[2].end) {
        let t = (p - SECTIONS[2].start) / (SECTIONS[2].end - SECTIONS[2].start);
        objects.human.position.y = -2 + 3.5 * t;
        objects.human.visible = true;
    } else {
        objects.human.visible = false;
    }

    // --- DA VINCI / VITRUVIO --- //
    if (p >= SECTIONS[3].start && p < SECTIONS[3].end) {
        let t = (p - SECTIONS[3].start) / (SECTIONS[3].end - SECTIONS[3].start);
        objects.vitruvio.position.y = -1 + 2 * t;
        objects.vitruvio.visible = true;
    } else {
        objects.vitruvio.visible = false;
    }

    // --- ÁRBOL Y MANZANA --- //
    if (p >= SECTIONS[4].start) {
        let t = (p - SECTIONS[4].start) / (SECTIONS[4].end - SECTIONS[4].start);
        t = Math.max(0, Math.min(1, t));
        objects.tree.position.y = -7 + 7 * t;
        objects.tree.visible = true;

        // Manzana cae, rebota al llegar abajo
        if (t < 0.75) {
            objects.apple.position.y = -4.2 - 6.2 * t;
        } else {
            let rest = (t-0.75) / 0.25;
            objects.apple.position.y = -9.8 + Math.abs(Math.sin(rest * Math.PI * 3)) * (1-rest);
        }
        objects.apple.visible = true;
    } else {
        objects.tree.visible = false;
        objects.apple.visible = false;
    }
}

// ---- SINCRONIZAR TEXTOS EN EL SCROLL Y NAVBAR ---- //
function syncText(p) {
    // Calcula el índice de sección correcta
    let idx = 0;
    for (let i = 0; i < SECTIONS.length; i++) {
        if (
            p >= SECTIONS[i].start &&
            (i === SECTIONS.length - 1 || p < SECTIONS[i + 1].start)
        ) {
            idx = i;
            break;
        }
    }
    setParticlesForSection(idx);

    // Activa solo el texto de la sección correcta
    document.querySelectorAll('.story').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
    });

    // Navbar highlight
    document.querySelectorAll('#main-navbar ul li a').forEach((a, i) => {
        a.classList.toggle('active', i === idx);
    });
}




// Smooth scroll al hacer click en navbar (opcional)
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar con partículas sección 0
    setParticlesForSection(0);

    document.querySelectorAll('#main-navbar a').forEach((a) => {
        a.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').replace('#', '');
            const section = document.getElementById(targetId);
            if (section) {
                e.preventDefault();
                window.scrollTo({
                    top: section.offsetTop - 35,
                    behavior: 'smooth'
                });
            }
        });
    });
    initThree();
    resize();
    animate();
});
