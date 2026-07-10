import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import "../styles/home.css";

const Home = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const particlesRef = useRef([]);
  const spotsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Spotlight class (like stage spotlights)
    class Spotlight {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height * 0.3;
        this.targetX = this.x;
        this.radius = 150 + Math.random() * 100;
        this.intensity = 0.3 + Math.random() * 0.2;
        this.moveSpeed = 0.02;
      }

      update(mouse) {
        // Slowly follow mouse
        const dx = mouse.x - this.x;
        this.x += dx * this.moveSpeed;
      }

      draw() {
        // Spotlight effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.intensity})`);
        gradient.addColorStop(0.3, `rgba(139, 92, 246, ${this.intensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Floating ticket/confetti particles
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = 0.5 + Math.random() * 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.width = 4 + Math.random() * 6;
        this.height = 8 + Math.random() * 12;
        this.color = this.getColor();
        this.opacity = 0.6 + Math.random() * 0.4;
      }

      getColor() {
        const colors = [
          'rgba(139, 92, 246, 0.8)',   // Purple - ticket
          'rgba(255, 215, 0, 0.8)',    // Gold - VIP
          'rgba(47, 230, 198, 0.8)',   // Teal - event
          'rgba(255, 107, 107, 0.8)',  // Red - live
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update(mouse) {
        // Gentle mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.vx += (dx / distance) * force * 0.3;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        this.vx *= 0.98;

        // Reset when off screen
        if (this.y > canvas.height + 20) {
          this.reset();
        }

        if (this.x < -20 || this.x > canvas.width + 20) {
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Ticket shape
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height / 3);
        
        ctx.restore();
      }
    }

    // Create spotlights (3)
    for (let i = 0; i < 3; i++) {
      spotsRef.current.push(new Spotlight());
    }

    // Create floating particles (60)
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(new Particle());
    }

    // Mouse move handler
    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      // Dark theater background
      ctx.fillStyle = 'rgba(15, 20, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw spotlights
      spotsRef.current.forEach(spot => {
        spot.update(mouseRef.current);
        spot.draw();
      });

      // Draw particles
      particlesRef.current.forEach(particle => {
        particle.update(mouseRef.current);
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      particlesRef.current = [];
      spotsRef.current = [];
    };
  }, []);

  return (
    <div>
      <section className="hero">
        <canvas ref={canvasRef} className="hero__canvas" />
        <div className="container hero__inner">
          <h1 className="hero__title">
            Book the moment. <span className="hero__title-accent">Own it, verified.</span>
          </h1>
          <p className="hero__subtitle">
            Real-time seat maps, fraud-proof QR tickets, and a resale marketplace where prices can only go down —
            never up.
          </p>
          <div className="hero__actions">
            <Link to="/events" className="btn btn-primary">
              Browse events
            </Link>
            <Link to="/marketplace" className="btn btn-outline">
              Explore resale
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
