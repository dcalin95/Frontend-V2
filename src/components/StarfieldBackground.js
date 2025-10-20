import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const StarfieldBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    console.log("🌌 StarfieldBackground mounted");
    const currentMount = mountRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });// NEGRU COMPLET
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // FUNDAL NEGRU TOTAL
    currentMount.appendChild(renderer.domElement);
    renderer.domElement.id = "starfield-canvas";


    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load(
      "https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/sprites/circle.png"
    );
    const nebulaTexture = textureLoader.load(
      "https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/textures/lensflare/lensflare0_alpha.png"
    );

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 2000;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Cosmic Dust
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 6000;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 3000;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 3000;
    }

    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3)
    );
    dustGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(dustColors, 3)
    );

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.7,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const cosmicDust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(cosmicDust);

    // Nebula
    const nebulaMaterial = new THREE.SpriteMaterial({
      map: nebulaTexture,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    });

    const nebula = new THREE.Sprite(nebulaMaterial);
    nebula.position.set(-300, 50, -500);
    nebula.scale.set(300, 300, 1);
    scene.add(nebula);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      stars.rotation.y += 0.0005;
      cosmicDust.rotation.y += 0.0003;

      nebula.position.x += 0.02;
      if (nebula.position.x > 300) nebula.position.x = -300;

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return (
<div
  ref={mountRef}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: -1, // sau -1 dacă e suficient
  }}
/>
  );
};

export default StarfieldBackground;

