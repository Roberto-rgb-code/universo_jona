/**
 * @file app.js
 * @description Main JavaScript file for an interactive 3D web experience.
 * Manages Three.js scenes, model loading, and scroll-based animations inspired by Michelangelo’s style
 * to create a continuous storytelling experience from Big Bang to Newton’s apple.
 */

/* global THREE, particlesJS */

// --- Global Configuration and Variables ---
const CONFIG = {
    modelsPath: './models/',
    scenes: {}, // Stores Three.js scene instances
    renderers: {}, // Stores Three.js renderer instances
    cameras: {}, // Stores Three.js camera instances
    mixers: [], // Stores Three.js AnimationMixers for FBX animations
    animations: {}, // Stores animation functions for each section
    currentSection: 0,
    isLoading: true,
    totalSections: 5,
    scrollPositions: [], // Stores scroll Y-positions for each section
    animationSpeedFactor: 1.5, // Global speed multiplier for animations
    animationSequence: {
        current: 'bigbang', // Tracks the current animation in the sequence
        order: ['bigbang', 'adn', 'humano', 'vitruvio', 'newton'], // Animation playback order
        progress: {
            bigbang: 0,
            adn: 0,
            humano: 0,
            vitruvio: 0,
            newton: 0
        }
    },
    bigBangAnimationState: {
        leftArm: null,
        rightArm: null,
        initialLeftX: -3,
        initialRightX: 3,
        touchDistance: 0.5,
        targetScale: 0.4,
        initialScale: 0.1,
        opacity: 1
    },
    adnAnimationState: {
        dnaModel: null,
        initialScale: 0.1,
        targetScale: 0.4,
        opacity: 0,
        rotationSpeed: 0.008
    },
    humanoAnimationState: {
        humanModel: null,
        initialOpacity: 0,
        targetOpacity: 0.8,
        initialScale: 0.1,
        targetScale: 0.4
    },
    vitruvioAnimationState: {
        vitruvioModel: null,
        initialScale: 0.1,
        targetScale: 0.4,
        opacity: 0,
        rotationSpeed: 0.003
    },
    newtonAnimationState: {
        treeModel: null,
        appleModel: null,
        handModel: null,
        appleStartY: 5,
        appleFallSpeed: 0.08,
        appleProgress: 0,
        opacity: 0
    }
};

// --- Loading Manager Setup ---
const loadingManager = new THREE.LoadingManager();
let modelsLoadedCount = 0;
const expectedModels = 8; // izquierdo.obj, derecho.obj, DNA.fbx, Male.OBJ, DaVinci_Model.fbx, 01_Arbol.fbx, manzana.fbx, hand.obj

loadingManager.onLoad = () => {
    setTimeout(() => {
        hideLoading();
        initScrollEffects();
        startGlobalAnimationLoop();
        console.log('All models loaded. Application ready.');
    }, 1000);
};

loadingManager.onProgress = (url, loaded, total) => {
    console.log(`Loading: ${url.split('/').pop()} (${loaded}/${total})`);
    modelsLoadedCount++;
    updateLoadingProgress();
};

loadingManager.onError = (url) => {
    console.error(`Error loading: ${url}`);
    modelsLoadedCount++;
    updateLoadingProgress();
};

// --- Model Loaders ---
let objLoader;
let fbxLoader;

/**
 * Initializes OBJLoader and FBXLoader with fallbacks for unavailable loaders.
 */
function initLoaders() {
    try {
        if (typeof THREE !== 'undefined' && THREE.OBJLoader) {
            objLoader = new THREE.OBJLoader(loadingManager);
            console.log('OBJLoader initialized.');
        } else {
            console.warn('OBJLoader not available. Using basic geometries as fallback.');
            objLoader = null;
        }
    } catch (error) {
        console.error('Error initializing OBJLoader:', error);
        objLoader = null;
    }

    try {
        if (typeof THREE !== 'undefined' && THREE.FBXLoader) {
            fbxLoader = new THREE.FBXLoader(loadingManager);
            console.log('FBXLoader initialized.');
        } else {
            console.warn('FBXLoader not available. Using basic geometries as fallback.');
            fbxLoader = null;
        }
    } catch (error) {
        console.error('Error initializing FBXLoader:', error);
        fbxLoader = null;
    }

    if (!objLoader && !fbxLoader) {
        console.log('No 3D loaders available. Simulating load completion.');
        for (let i = 0; i < expectedModels; i++) {
            modelsLoadedCount++;
            updateLoadingProgress();
        }
    }
}

// --- Utility Functions ---

/**
 * Hides the loading overlay and updates the loading state.
 */
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    CONFIG.isLoading = false;
}

/**
 * Updates the loading progress bar and triggers hideLoading when complete.
 */
function updateLoadingProgress() {
    const loadingProgressFill = document.getElementById('loadingProgressFill');
    if (loadingProgressFill) {
        const progress = Math.min(100, (modelsLoadedCount / expectedModels) * 100);
        loadingProgressFill.style.width = `${progress}%`;
    }
}

/**
 * Creates a Three.js scene, camera, and renderer for a given container with standard lighting.
 * @param {string} containerId - The ID of the HTML container element.
 * @returns {object|null} - Scene, camera, and renderer object, or null if container not found.
 */
function createScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4ecdc4, 0.6, 100);
    pointLight.position.set(-10, 10, 10);
    scene.add(pointLight);

    return { scene, camera, renderer };
}

// --- Particle Effects Initialization ---

/**
 * Initializes particles.js for each section with unique configurations.
 */
function initParticles() {
    const particleConfigs = {
        'particles-bigbang': {
            particles: {
                number: { value: 100, density: { enable: true, value_area: 1000 } },
                color: { value: ['#ff6b6b', '#ffd93d', '#6BCF7F', '#4D96FF', '#9B59B6'] },
                shape: { type: 'circle' },
                opacity: { value: 0.8, random: true, anim: { enable: true, speed: 2 } },
                size: { value: 4, random: true, anim: { enable: true, speed: 3 } },
                line_linked: { enable: false },
                move: {
                    enable: true,
                    speed: 8,
                    direction: 'none',
                    random: true,
                    out_mode: 'out',
                    attract: { enable: true, rotateX: 600, rotateY: 1200 }
                }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'repulse' } },
                modes: { repulse: { distance: 150, duration: 0.4 } }
            },
            retina_detect: true
        },
        'particles-adn': {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: ['#4ecdc4', '#45b7d1', '#96CEB4'] },
                shape: { type: 'circle' },
                opacity: { value: 0.6, anim: { enable: true, speed: 1 } },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#4ecdc4', opacity: 0.4, width: 2 },
                move: { enable: true, speed: 2, direction: 'none' }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'grab' } },
                modes: { grab: { distance: 200, line_linked: { opacity: 1 } } }
            },
            retina_detect: true
        },
        'particles-humano': {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ['#00ffff', '#ff00ff', '#ffff00'] },
                shape: { type: 'edge', nb_sides: 6 },
                opacity: { value: 0.5, anim: { enable: true, speed: 1.5 } },
                size: { value: 2, random: true },
                line_linked: { enable: true, distance: 120, color: '#00ffff', opacity: 0.3, width: 1 },
                move: { enable: true, speed: 3, direction: 'none', straight: false }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'bubble' } },
                modes: { bubble: { distance: 100, size: 6, duration: 2 } }
            },
            retina_detect: true
        },
        'particles-vitruvio': {
            particles: {
                number: { value: 50, density: { enable: true, value_area: 800 } },
                color: { value: ['#ffd700', '#ffeb3b', '#fff176'] },
                shape: { type: 'polygon', nb_sides: 5 },
                opacity: { value: 0.7, anim: { enable: true, speed: 0.5 } },
                size: { value: 4, random: true },
                line_linked: { enable: true, distance: 200, color: '#ffd700', opacity: 0.5, width: 1 },
                move: {
                    enable: true,
                    speed: 1,
                    direction: 'none',
                    attract: { enable: true, rotateX: 300, rotateY: 300 }
                }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'slow' } },
                modes: { slow: { factor: 3, radius: 200 } }
            },
            retina_detect: true
        },
        'particles-newton': {
            particles: {
                number: { value: 100, density: { enable: true, value_area: 800 } },
                color: { value: ['#43e97b', '#38f9d7', '#4facfe'] },
                shape: { type: 'circle' },
                opacity: { value: 0.6, random: true },
                size: { value: 3, random: true, anim: { enable: true, speed: 2 } },
                line_linked: { enable: true, distance: 100, color: '#43e97b', opacity: 0.2, width: 1 },
                move: {
                    enable: true,
                    speed: 4,
                    direction: 'bottom',
                    straight: false,
                    out_mode: 'bounce',
                    bounce: { horizontal: { random: { enable: true, minimumValue: 0.1 } } }
                }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'attract' } },
                modes: { attract: { distance: 200, duration: 0.4 } }
            },
            retina_detect: true
        }
    };

    Object.keys(particleConfigs).forEach(id => {
        if (document.getElementById(id)) {
            particlesJS(id, particleConfigs[id]);
            console.log(`Particles initialized for ${id}`);
        }
    });
}

/**
 * Initializes the "Big Bang" section with two arms reaching like Michelangelo’s Creation of Adam.
 * @returns {Function|null} - Animation function or null if initialization fails.
 */
function initBigBang() {
    const sceneData = createScene('bigbang-canvas');
    if (!sceneData) return null;

    const { scene, camera, renderer } = sceneData;
    CONFIG.scenes.bigbang = scene;
    CONFIG.cameras.bigbang = camera;
    CONFIG.renderers.bigbang = renderer;
    camera.position.set(0, 0, 8);

    const state = CONFIG.bigBangAnimationState;

    const loadArm = (path, initialX, rotationY, armKey) => {
        if (objLoader) {
            objLoader.load(
                CONFIG.modelsPath + path,
                (object) => {
                    state[armKey] = object;
                    state[armKey].scale.set(state.initialScale, state.initialScale, state.initialScale);
                    state[armKey].position.set(initialX, 0, 0);
                    state[armKey].rotation.y = rotationY;
                    state[armKey].traverse(child => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshPhongMaterial({
                                color: 0xead9c2,
                                emissive: 0x332211,
                                shininess: 50,
                                transparent: true,
                                opacity: state.opacity
                            });
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    scene.add(state[armKey]);
                    console.log(`Big Bang: ${path} loaded and added to scene.`);
                },
                undefined,
                (error) => {
                    console.error(`Error loading ${path}:`, error);
                    state[armKey] = null;
                }
            );
        } else {
            const armGeometry = new THREE.BoxGeometry(0.5, 3, 0.3);
            const armMaterial = new THREE.MeshPhongMaterial({
                color: 0xead9c2,
                emissive: 0x332211,
                transparent: true,
                opacity: state.opacity
            });
            state[armKey] = new THREE.Mesh(armGeometry, armMaterial);
            state[armKey].scale.set(state.initialScale, state.initialScale, state.initialScale);
            state[armKey].position.set(initialX, 0, 0);
            state[armKey].rotation.y = rotationY;
            scene.add(state[armKey]);
            console.log(`Big Bang: Fallback arm added for ${path}.`);
        }
    };

    loadArm('izquierdo.obj', state.initialLeftX, Math.PI / 4, 'leftArm');
    loadArm('derecho.obj', state.initialRightX, -Math.PI / 4, 'rightArm');

    function animateBigBang(progress) {
        if (!state.leftArm || !state.rightArm) return;

        const targetX = progress * (state.initialLeftX * -1); // Move from -3 to 0
        state.leftArm.position.x = state.initialLeftX + (targetX - state.initialLeftX) * progress;
        state.rightArm.position.x = state.initialRightX - (targetX - state.initialLeftX) * progress;
        const scaleProgress = Math.min(progress * 2, 1); // Double speed for scaling
        state.leftArm.scale.set(state.initialScale + (state.targetScale - state.initialScale) * scaleProgress, state.initialScale + (state.targetScale - state.initialScale) * scaleProgress, state.initialScale + (state.targetScale - state.initialScale) * scaleProgress);
        state.rightArm.scale.set(state.initialScale + (state.targetScale - state.initialScale) * scaleProgress, state.initialScale + (state.targetScale - state.initialScale) * scaleProgress, state.initialScale + (state.targetScale - state.initialScale) * scaleProgress);
        state.leftArm.traverse(child => { if (child.isMesh) child.material.opacity = Math.max(1 - progress, 0); });
        state.rightArm.traverse(child => { if (child.isMesh) child.material.opacity = Math.max(1 - progress, 0); });

        if (progress >= 1 && Math.abs(state.leftArm.position.x) <= state.touchDistance) {
            console.log('Big Bang: Arms touched, transitioning to ADN.');
        }
    }

    CONFIG.animations.bigbang = animateBigBang;
    return animateBigBang;
}

/**
 * Initializes the "ADN" section with a DNA model transitioning from the arms.
 * @returns {Function|null} - Animation function or null if initialization fails.
 */
function initADN() {
    const sceneData = createScene('adn-canvas');
    if (!sceneData) return null;

    const { scene, camera, renderer } = sceneData;
    CONFIG.scenes.adn = scene;
    CONFIG.cameras.adn = camera;
    CONFIG.renderers.adn = renderer;
    camera.position.set(0, 0, 10);

    const state = CONFIG.adnAnimationState;

    if (fbxLoader) {
        fbxLoader.load(
            CONFIG.modelsPath + 'DNA.fbx',
            (object) => {
                state.dnaModel = object;
                state.dnaModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
                state.dnaModel.position.set(0, 0, 0);
                state.dnaModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0x4ecdc4,
                            emissive: 0x001122,
                            shininess: 100,
                            transparent: true,
                            opacity: state.opacity
                        });
                    }
                });
                scene.add(state.dnaModel);
                console.log('ADN: DNA model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading DNA (FBX):', error);
                state.dnaModel = null;
            }
        );
    }

    if (!state.dnaModel) {
        const dnaGroup = new THREE.Group();
        const dnaMaterial = new THREE.MeshPhongMaterial({
            color: 0x4ecdc4,
            emissive: 0x001122,
            transparent: true,
            opacity: state.opacity
        });

        for (let i = 0; i < 50; i++) {
            const y = (i - 25) * 0.4;
            const angle1 = i * 0.3;
            const angle2 = angle1 + Math.PI;

            const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), dnaMaterial);
            sphere1.position.set(Math.cos(angle1) * 2, y, Math.sin(angle1) * 2);
            dnaGroup.add(sphere1);

            const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), dnaMaterial);
            sphere2.position.set(Math.cos(angle2) * 2, y, Math.sin(angle2) * 2);
            dnaGroup.add(sphere2);

            const rodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
            const rod = new THREE.Mesh(rodGeometry, dnaMaterial);
            rod.position.set(0, y, 0);
            rod.rotation.z = Math.PI / 2;
            dnaGroup.add(rod);
        }

        state.dnaModel = dnaGroup;
        state.dnaModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
        scene.add(state.dnaModel);
        console.log('ADN: Fallback helix added with enhanced visibility.');
    }

    function animateADN(progress) {
        if (!state.dnaModel) return;

        const prevProgress = Math.max(CONFIG.animationSequence.progress.bigbang, 0);
        state.dnaModel.scale.set(state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress);
        state.dnaModel.rotation.y += state.rotationSpeed * CONFIG.animationSpeedFactor * progress;
        state.dnaModel.traverse(child => { if (child.isMesh) child.material.opacity = Math.min(prevProgress + progress, 1); });

        if (progress >= 1) {
            console.log('ADN: Transformation to human starting.');
        }
    }

    CONFIG.animations.adn = animateADN;
    return animateADN;
}

/**
 * Initializes the "Humano" section with a human model transitioning from DNA.
 * @returns {Function|null} - Animation function or null if initialization fails.
 */
function initHumano() {
    const sceneData = createScene('humano-canvas');
    if (!sceneData) return null;

    const { scene, camera, renderer } = sceneData;
    CONFIG.scenes.humano = scene;
    CONFIG.cameras.humano = camera;
    CONFIG.renderers.humano = renderer;
    camera.position.set(0, 0, 8);

    const state = CONFIG.humanoAnimationState;

    if (objLoader) {
        objLoader.load(
            CONFIG.modelsPath + 'Male.OBJ',
            (object) => {
                state.humanModel = object;
                state.humanModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
                state.humanModel.position.set(0, -2, 0);
                state.humanModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0x00ffff,
                            wireframe: true,
                            transparent: true,
                            opacity: state.initialOpacity
                        });
                    }
                });
                scene.add(state.humanModel);
                console.log('Humano: Human model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading human model:', error);
                state.humanModel = null;
            }
        );
    }

    if (!state.humanModel) {
        const humanGroup = new THREE.Group();
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: state.initialOpacity
        });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4, 12), material);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), material);
        head.position.y = 2.5;
        humanGroup.add(body, head);
        state.humanModel = humanGroup;
        state.humanModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
        scene.add(state.humanModel);
        console.log('Humano: Fallback human figure added with enhanced visibility.');
    }

    function animateHumano(progress) {
        if (!state.humanModel) return;

        const prevProgress = Math.max(CONFIG.animationSequence.progress.adn, 0);
        state.humanModel.scale.set(state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress);
        state.humanModel.traverse(child => {
            if (child.isMesh && child.material.transparent) {
                child.material.opacity = state.initialOpacity + (state.targetOpacity - state.initialOpacity) * progress;
            }
        });

        if (progress >= 1) {
            console.log('Humano: Transformation to Vitruvio starting.');
        }
    }

    CONFIG.animations.humano = animateHumano;
    return animateHumano;
}

/**
 * Initializes the "Vitruvio" section with a Vitruvian Man model transitioning from human.
 * @returns {Function|null} - Animation function or null if initialization fails.
 */
function initVitruvio() {
    const sceneData = createScene('vitruvio-canvas');
    if (!sceneData) return null;

    const { scene, camera, renderer } = sceneData;
    CONFIG.scenes.vitruvio = scene;
    CONFIG.cameras.vitruvio = camera;
    CONFIG.renderers.vitruvio = renderer;
    camera.position.set(0, 0, 10);

    const state = CONFIG.vitruvioAnimationState;

    if (fbxLoader) {
        fbxLoader.load(
            CONFIG.modelsPath + 'DaVinci_Model.fbx',
            (object) => {
                state.vitruvioModel = object;
                state.vitruvioModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
                state.vitruvioModel.position.set(0, -1, 0);
                state.vitruvioModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0xffd700,
                            emissive: 0x332200,
                            shininess: 100,
                            transparent: true,
                            opacity: state.opacity
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(state.vitruvioModel);
                console.log('Vitruvio: Vitruvian model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading Vitruvian model:', error);
                state.vitruvioModel = null;
            }
        );
    }

    if (!state.vitruvioModel) {
        const vitruvioGroup = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0x332200,
            shininess: 100,
            transparent: true,
            opacity: state.opacity
        });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3, 12), material);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), material);
        head.position.y = 2;
        vitruvioGroup.add(body, head);
        state.vitruvioModel = vitruvioGroup;
        state.vitruvioModel.scale.set(state.initialScale, state.initialScale, state.initialScale);
        scene.add(state.vitruvioModel);
        console.log('Vitruvio: Fallback figure added with enhanced visibility.');
    }

    const circle = new THREE.Mesh(
        new THREE.RingGeometry(3, 3.1, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    circle.rotation.x = Math.PI / 2;
    scene.add(circle);

    function animateVitruvio(progress) {
        if (!state.vitruvioModel) return;

        const prevProgress = Math.max(CONFIG.animationSequence.progress.humano, 0);
        state.vitruvioModel.scale.set(state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress, state.initialScale + (state.targetScale - state.initialScale) * progress);
        state.vitruvioModel.rotation.y += state.rotationSpeed * CONFIG.animationSpeedFactor * progress;
        state.vitruvioModel.traverse(child => { if (child.isMesh) child.material.opacity = Math.min(prevProgress + progress, 1); });
        circle.rotation.z += 0.002 * CONFIG.animationSpeedFactor * progress;
        circle.material.opacity = 0.3 * progress;

        if (progress >= 1) {
            console.log('Vitruvio: Transition to Newton starting.');
        }
    }

    CONFIG.animations.vitruvio = animateVitruvio;
    return animateVitruvio;
}

/**
 * Initializes the "Newton" section with a tree, apple, and hand model.
 * @returns {Function|null} - Animation function or null if initialization fails.
 */
function initNewton() {
    const sceneData = createScene('newton-canvas');
    if (!sceneData) return null;

    const { scene, camera, renderer } = sceneData;
    CONFIG.scenes.newton = scene;
    CONFIG.cameras.newton = camera;
    CONFIG.renderers.newton = renderer;
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    const state = CONFIG.newtonAnimationState;

    if (fbxLoader) {
        fbxLoader.load(
            CONFIG.modelsPath + '01_Arbol.fbx',
            (object) => {
                state.treeModel = object;
                state.treeModel.scale.set(0.1, 0.1, 0.1);
                state.treeModel.position.set(0, -3, 0);
                state.treeModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: child.material.name?.includes('leaf') ? 0x228B22 : 0x8B4513,
                            emissive: child.material.name?.includes('leaf') ? 0x001100 : 0x110000
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(state.treeModel);
                console.log('Newton: Tree model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading tree:', error);
                state.treeModel = null;
            }
        );

        fbxLoader.load(
            CONFIG.modelsPath + 'manzana.fbx',
            (object) => {
                state.appleModel = object;
                state.appleModel.scale.set(0.1, 0.1, 0.1);
                state.appleModel.position.set(2, state.appleStartY, 0);
                state.appleModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0xff0000,
                            emissive: 0x220000,
                            shininess: 100
                        });
                        child.castShadow = true;
                    }
                });
                scene.add(state.appleModel);
                console.log('Newton: Apple model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading apple:', error);
                state.appleModel = null;
            }
        );
    }

    if (!state.treeModel) {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.7, 5, 12),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        trunk.position.y = -0.5;
        const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(3, 12, 8),
            new THREE.MeshPhongMaterial({ color: 0x228B22 })
        );
        leaves.position.y = 3;
        treeGroup.add(trunk, leaves);
        state.treeModel = treeGroup;
        state.treeModel.scale.set(0.1, 0.1, 0.1);
        state.treeModel.position.set(0, -2, 0);
        scene.add(state.treeModel);
        console.log('Newton: Fallback tree added with enhanced visibility.');
    }

    if (!state.appleModel) {
        state.appleModel = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 12, 8),
            new THREE.MeshPhongMaterial({ color: 0xff0000 })
        );
        state.appleModel.scale.set(0.1, 0.1, 0.1);
        state.appleModel.position.set(2, state.appleStartY, 0);
        state.appleModel.castShadow = true;
        scene.add(state.appleModel);
        console.log('Newton: Fallback apple added with enhanced visibility.');
    }

    if (objLoader) {
        objLoader.load(
            CONFIG.modelsPath + 'hand.obj',
            (object) => {
                state.handModel = object;
                state.handModel.scale.set(0.1, 0.1, 0.1);
                state.handModel.position.set(2, -2, 0);
                state.handModel.rotation.set(Math.PI / 4, 0, 0);
                state.handModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0xead9c2,
                            emissive: 0x332211,
                            shininess: 50,
                            transparent: true,
                            opacity: state.opacity
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(state.handModel);
                console.log('Newton: Hand model loaded and added to scene.');
            },
            undefined,
            (error) => {
                console.error('Error loading hand model:', error);
                state.handModel = null;
            }
        );
    }

    if (!state.handModel) {
        const handGeometry = new THREE.BoxGeometry(0.7, 0.3, 1.5);
        const handMaterial = new THREE.MeshPhongMaterial({
            color: 0xead9c2,
            emissive: 0x332211,
            transparent: true,
            opacity: state.opacity
        });
        state.handModel = new THREE.Mesh(handGeometry, handMaterial);
        state.handModel.scale.set(0.1, 0.1, 0.1);
        state.handModel.position.set(2, -1.5, 0);
        state.handModel.rotation.set(Math.PI / 4, 0, 0);
        state.handModel.castShadow = true;
        state.handModel.receiveShadow = true;
        scene.add(state.handModel);
        console.log('Newton: Fallback hand added with enhanced visibility.');
    }

    function animateNewton(progress) {
        if (!state.treeModel || !state.appleModel || !state.handModel) return;

        const prevProgress = Math.max(CONFIG.animationSequence.progress.vitruvio, 0);
        state.treeModel.scale.set(0.1 + (0.3 * progress), 0.1 + (0.3 * progress), 0.1 + (0.3 * progress));
        state.treeModel.traverse(child => { if (child.isMesh) child.material.opacity = prevProgress + progress; });
        state.appleModel.position.y = state.appleStartY - (state.appleStartY + 1.5) * progress;
        state.appleModel.rotation.x += 0.1 * CONFIG.animationSpeedFactor * progress;
        state.appleModel.rotation.z += 0.05 * CONFIG.animationSpeedFactor * progress;
        state.appleModel.traverse(child => { if (child.isMesh) child.material.opacity = prevProgress + progress; });
        state.handModel.traverse(child => { if (child.isMesh) child.material.opacity = prevProgress + progress; });

        if (progress >= 1 && state.appleModel.position.y <= -1.5) {
            console.log('Newton: Animation completed.');
        }
    }

    CONFIG.animations.newton = animateNewton;
    return animateNewton;
}

/**
 * Initializes the navigation bar with mobile toggle and scroll-based styling.
 */
function initNavbar() {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', () => {
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navbarToggle?.classList.remove('active');
            navbarMenu?.classList.remove('active');
        });
    });

    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 100);
        }
        updateProgress();
        updateAnimationProgress();
    });

    /**
     * Updates the active navigation link and dot based on the current section.
     * @param {number} activeIndex - Index of the active section.
     */
    function updateActiveNavLink(activeIndex) {
        navLinks.forEach((link, index) => {
            link.classList.toggle('active', index === activeIndex);
        });
        document.querySelectorAll('.nav-dots .dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    CONFIG.updateActiveNavLink = updateActiveNavLink;
}

/**
 * Updates camera aspect ratios and renderer sizes on window resize.
 */
function handleResize() {
    Object.values(CONFIG.renderers).forEach(renderer => {
        const camera = CONFIG.cameras[Object.keys(CONFIG.renderers).find(key => CONFIG.renderers[key] === renderer)];
        const container = renderer.domElement.parentElement;
        if (container && camera) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    calculateSectionScrollPositions();
    updateAnimationProgress();
}

/**
 * Calculates the scroll positions for each section.
 */
function calculateSectionScrollPositions() {
    CONFIG.scrollPositions = Array.from(document.querySelectorAll('.section')).map(section => section.offsetTop);
    console.log('Scroll positions calculated:', CONFIG.scrollPositions);
}

/**
 * Updates the animation progress based on scroll position.
 */
function updateAnimationProgress() {
    const scrollY = window.scrollY + window.innerHeight * 0.5;
    let newSectionIndex = 0;
    const sectionHeight = window.innerHeight;

    for (let i = 0; i < CONFIG.scrollPositions.length; i++) {
        if (scrollY >= CONFIG.scrollPositions[i]) {
            newSectionIndex = i;
        }
    }

    if (newSectionIndex !== CONFIG.currentSection) {
        CONFIG.currentSection = newSectionIndex;
        CONFIG.updateActiveNavLink(newSectionIndex);
        console.log(`Switching section: ${CONFIG.currentSection}`);
    }

    const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const sectionProgress = Math.min(1, (scrollY - CONFIG.scrollPositions[newSectionIndex]) / sectionHeight);
    CONFIG.animationSequence.progress[CONFIG.animationSequence.order[newSectionIndex]] = sectionProgress;

    // Show all content elements
    document.querySelectorAll('.content').forEach(content => {
        content.classList.add('visible');
    });
    document.querySelectorAll('.narrative').forEach(narrative => {
        narrative.classList.add('visible');
    });
}

/**
 * Updates the progress bar based on scroll position.
 */
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / scrollHeight) * 100;
        progressFill.style.width = `${progress}%`;
    }

    const scrollIndicator = document.getElementById('scrollIndicator');
    if (scrollIndicator) {
        scrollIndicator.classList.toggle('hidden', window.scrollY > 50 || window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50);
    }
}

/**
 * Initializes scroll-related event listeners and canvas visibility.
 */
function initScrollEffects() {
    calculateSectionScrollPositions();
    updateProgress();
    updateAnimationProgress();
    document.querySelectorAll('.canvas-container').forEach(container => {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    });
}

// --- Global Animation Loop ---
const clock = new THREE.Clock();

/**
 * Main animation loop for rendering all scenes and updating animations sequentially.
 */
function startGlobalAnimationLoop() {
    function animateAllScenes() {
        requestAnimationFrame(animateAllScenes);
        const deltaTime = clock.getDelta();

        CONFIG.mixers.forEach(mixer => mixer.update(deltaTime));

        const { animations, scenes, cameras, renderers } = CONFIG;

        // Update and render all scenes with scroll-based progress
        const sectionNames = ['bigbang', 'adn', 'humano', 'vitruvio', 'newton'];
        sectionNames.forEach(sectionName => {
            if (animations[sectionName] && scenes[sectionName] && cameras[sectionName] && renderers[sectionName]) {
                animations[sectionName](CONFIG.animationSequence.progress[sectionName]);
                renderers[sectionName].render(scenes[sectionName], cameras[sectionName]);
            } else {
                console.warn(`Skipping render for ${sectionName}: missing animation, scene, camera, or renderer.`);
            }
        });
    }
    animateAllScenes();
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded. Initializing application.');
    initLoaders();
    initParticles();
    initBigBang();
    initADN();
    initHumano();
    initVitruvio();
    initNewton();
    initNavbar();
    window.addEventListener('resize', handleResize);
});