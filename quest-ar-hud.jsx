import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function MetaQuestARHUD() {
  const containerRef = useRef(null);
  const [xrSupported, setXrSupported] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [stats, setStats] = useState({
    health: 100,
    ammo: 30,
    notifications: []
  });

  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setXrSupported(supported);
      });
    }

    let scene, camera, renderer, xrSession, hudGroup;
    let animationId;

    const initAR = async () => {
      // Scene setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

      // Renderer with XR support
      renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      // Create HUD elements group (fixed to camera)
      hudGroup = new THREE.Group();
      hudGroup.position.z = -2; // 2 meters in front
      hudGroup.position.y = 0.2; // Slight upward offset
      camera.add(hudGroup);
      scene.add(camera);

      // Create HUD panels
      createHealthPanel(hudGroup);
      createAmmoPanel(hudGroup);
      createMinimap(hudGroup);
      createNotificationArea(hudGroup);
      createCrosshair(hudGroup);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Animation loop
      const animate = () => {
        animationId = renderer.setAnimationLoop(() => {
          // HUD always follows camera since it's a child of camera
          renderer.render(scene, camera);
        });
      };

      animate();
    };

    // Create health panel
    const createHealthPanel = (parent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Health text
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 48px "Orbitron", monospace';
      ctx.fillText('HEALTH', 20, 50);
      
      // Health bar background
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(20, 70, 472, 40);
      
      // Health bar
      const healthWidth = (stats.health / 100) * 472;
      ctx.fillStyle = stats.health > 50 ? '#00ff00' : stats.health > 25 ? '#ffaa00' : '#ff0000';
      ctx.fillRect(20, 70, healthWidth, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(1, 0.25);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-1.5, 0.8, 0);
      parent.add(mesh);
    };

    // Create ammo panel
    const createAmmoPanel = (parent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = 'rgba(40, 20, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      
      // Ammo text
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 48px "Orbitron", monospace';
      ctx.fillText('AMMO', 20, 50);
      
      // Ammo count
      ctx.font = 'bold 64px "Orbitron", monospace';
      ctx.fillText(stats.ammo.toString().padStart(2, '0'), 360, 90);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(1, 0.25);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(1.5, 0.8, 0);
      parent.add(mesh);
    };

    // Create minimap
    const createMinimap = (parent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = 'rgba(0, 30, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      
      // Grid
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }
      
      // Player position (center)
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(128, 128, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(128, 100);
      ctx.stroke();
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(0.5, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-1.5, 0.2, 0);
      parent.add(mesh);
    };

    // Create notification area
    const createNotificationArea = (parent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Notifications
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px "Orbitron", monospace';
      ctx.fillText('> SYSTEM ONLINE', 20, 40);
      ctx.fillText('> AR HUD ACTIVE', 20, 80);
      ctx.fillText('> READY', 20, 120);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(1.2, 0.2, 0);
      parent.add(mesh);
    };

    // Create crosshair
    const createCrosshair = (parent) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      
      // Cross lines
      ctx.beginPath();
      ctx.moveTo(64, 44);
      ctx.lineTo(64, 54);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(64, 74);
      ctx.lineTo(64, 84);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(44, 64);
      ctx.lineTo(54, 64);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(74, 64);
      ctx.lineTo(84, 64);
      ctx.stroke();
      
      // Center dot
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(64, 64, 2, 0, Math.PI * 2);
      ctx.fill();
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        side: THREE.DoubleSide
      });
      const geometry = new THREE.PlaneGeometry(0.2, 0.2);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      parent.add(mesh);
    };

    initAR();

    return () => {
      if (renderer) {
        renderer.setAnimationLoop(null);
        if (renderer.domElement && containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, [stats]);

  const startARSession = async () => {
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      });
      setSessionActive(true);
    } catch (error) {
      console.error('Error starting AR session:', error);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      fontFamily: '"Orbitron", "Rajdhani", sans-serif',
      position: 'relative'
    }}>
      {/* WebXR Canvas Container */}
      <div ref={containerRef} style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }} />

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px 40px',
        borderRadius: '10px',
        border: '2px solid #00ffff',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        zIndex: 1000
      }}>
        <h1 style={{
          margin: '0 0 20px 0',
          color: '#00ffff',
          fontSize: '28px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
        }}>
          Meta Quest 3 AR HUD
        </h1>
        
        {xrSupported ? (
          <button
            onClick={startARSession}
            disabled={sessionActive}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: sessionActive ? '#444' : 'linear-gradient(135deg, #00ffff, #00aaff)',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: sessionActive ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              width: '100%',
              transition: 'all 0.3s',
              boxShadow: sessionActive ? 'none' : '0 0 15px rgba(0, 255, 255, 0.5)'
            }}
          >
            {sessionActive ? 'AR Session Active' : 'Start AR Experience'}
          </button>
        ) : (
          <div style={{
            color: '#ff6b6b',
            textAlign: 'center',
            fontSize: '16px'
          }}>
            WebXR not supported. Please use Meta Quest 3 browser.
          </div>
        )}
      </div>

      {/* Stats Display (2D fallback) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        gap: '20px',
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(0, 20, 40, 0.85)',
          padding: '15px 25px',
          borderRadius: '5px',
          border: '2px solid #00ffff',
          color: '#00ffff'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>HEALTH</div>
          <div style={{ 
            width: '200px', 
            height: '20px', 
            background: 'rgba(255, 0, 0, 0.3)',
            position: 'relative',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.health}%`,
              height: '100%',
              background: stats.health > 50 ? '#00ff00' : stats.health > 25 ? '#ffaa00' : '#ff0000',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        <div style={{
          background: 'rgba(40, 20, 0, 0.85)',
          padding: '15px 25px',
          borderRadius: '5px',
          border: '2px solid #ff8800',
          color: '#ff8800'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>AMMO</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.ammo}</div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 20px',
        borderRadius: '5px',
        border: '1px solid #666',
        color: '#aaa',
        fontSize: '14px',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '10px', color: '#fff', fontWeight: 'bold' }}>Instructions:</div>
        <div style={{ marginBottom: '5px' }}>• HUD is fixed to your view</div>
        <div style={{ marginBottom: '5px' }}>• Move your head to look around</div>
        <div style={{ marginBottom: '5px' }}>• HUD elements stay in position</div>
        <div>• Works in Meta Quest Browser</div>
      </div>
    </div>
  );
}
