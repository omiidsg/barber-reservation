import React, { useState, useEffect } from 'react';
import CustomerPanel from './components/CustomerPanel';
import AdminPanel from './components/AdminPanel';
import DarkModeToggle from './components/DarkModeToggle';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Electro-style background with interactive particles
  useEffect(() => {
    const createParticles = () => {
      const canvas = document.createElement('canvas');
      canvas.className = 'particles-js-canvas-el';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1';
      
      const particlesContainer = document.createElement('div');
      particlesContainer.id = 'particles-js';
      particlesContainer.style.position = 'fixed';
      particlesContainer.style.top = '0';
      particlesContainer.style.left = '0';
      particlesContainer.style.width = '100%';
      particlesContainer.style.height = '100%';
      particlesContainer.style.zIndex = '1';
      particlesContainer.appendChild(canvas);
      
      document.body.appendChild(particlesContainer);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Mouse position
      let mouseX = 0;
      let mouseY = 0;
      let isMouseMoving = false;
      
      // Track mouse movement
      const handleMouseMove = (e: MouseEvent) => {
        // Get mouse position relative to viewport
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMouseMoving = true;
        
        // Reset mouse movement flag after a shorter delay for more responsive interaction
        setTimeout(() => {
          isMouseMoving = false;
        }, 50);
      };
      
      // Track mouse movement on window for better coverage
      window.addEventListener('mousemove', handleMouseMove);
      
      // Particle system
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        opacity: number;
        originalSize: number;
      }> = [];
      
      // Create particles
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          originalSize: Math.random() * 3 + 1
        });
      }
      
      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
          // Calculate distance from mouse
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Mouse interaction
          if (distance < 120 && isMouseMoving) {
            // Repel particles from mouse with stronger force
            const angle = Math.atan2(dy, dx);
            const force = Math.max(0, (120 - distance) / 120);
            const repelForce = force * 0.3; // Increased force
            
            // Apply repulsion force away from mouse
            particle.vx += Math.cos(angle) * repelForce;
            particle.vy += Math.sin(angle) * repelForce;
            
            // Increase size and opacity when near mouse
            particle.size = particle.originalSize * (1 + force * 1.5);
            particle.opacity = Math.min(1, particle.opacity + force * 0.2);
          } else {
            // Gradually return to original size and opacity
            particle.size += (particle.originalSize - particle.size) * 0.05;
            particle.opacity += (0.4 - particle.opacity) * 0.05;
          }
          
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Apply velocity damping for more natural movement
          particle.vx *= 0.98;
          particle.vy *= 0.98;
          
          // Bounce off edges
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
          
          // Keep particles within bounds
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
          particle.y = Math.max(0, Math.min(canvas.height, particle.y));
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.fill();
          
          // Draw connections
          particles.forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - distance / 120)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        });
        
        requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('mousemove', handleMouseMove);
        if (particlesContainer.parentNode) {
          particlesContainer.parentNode.removeChild(particlesContainer);
        }
      };
    };
    
    const cleanup = createParticles();
    return cleanup;
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="App electro-background">
      <div className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>رزرو وقت آرایشگاه</h1>
            <p>سیستم رزرو آنلاین آرایشگاه مردانه</p>
          </div>
          <DarkModeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
        </div>
      </div>

      <div className="container">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            رزرو مشتری
          </button>
          <button
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            پنل مدیریت
          </button>
        </div>

        {activeTab === 'customer' ? <CustomerPanel /> : <AdminPanel />}
      </div>
    </div>
  );
};

export default App; 