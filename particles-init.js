/* particles-init.js */
// Puedes cambiar la config para cada sección si quieres animación distinta
particlesJS("particles-bg", {
  "particles": {
    "number": {
      "value": 65,
      "density": { "enable": true, "value_area": 700 }
    },
    "color": { "value": "#fff" },
    "shape": { "type": "circle" },
    "opacity": {
      "value": 0.5,
      "random": true
    },
    "size": {
      "value": 3.5,
      "random": true
    },
    "move": {
      "enable": true,
      "speed": 1.1,
      "direction": "none",
      "random": true,
      "out_mode": "out"
    }
  },
  "interactivity": {
    "events": {
      "onhover": { "enable": true, "mode": "repulse" },
      "onclick": { "enable": false }
    },
    "modes": {
      "repulse": { "distance": 90, "duration": 0.6 }
    }
  },
  "retina_detect": true
});
