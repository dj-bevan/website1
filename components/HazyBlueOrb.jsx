import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const SPRING_CONFIG = { damping: 25, stiffness: 60, mass: 1.2 };
const ORB_SIZE = 550;

export default function HazyBlueOrb() {
  const cursorX = useMotionValue(-ORB_SIZE);
  const cursorY = useMotionValue(-ORB_SIZE);

  const x = useSpring(cursorX, SPRING_CONFIG);
  const y = useSpring(cursorY, SPRING_CONFIG);

  const canvasRef = useRef(null);

  // Generate grain texture once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = ORB_SIZE;
    canvas.height = ORB_SIZE;

    const imageData = ctx.createImageData(ORB_SIZE, ORB_SIZE);
    const data = imageData.data;
    const cx = ORB_SIZE / 2, cy = ORB_SIZE / 2, maxR = ORB_SIZE / 2;

    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % ORB_SIZE;
      const py = Math.floor(i / 4 / ORB_SIZE);
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const falloff = Math.max(0, 1 - (dist / maxR) ** 1.6);
      const noise = (Math.random() - 0.5) * 160;

      data[i]     = Math.min(255, Math.max(0, 33 + noise * 0.25));  // R
      data[i + 1] = Math.min(255, Math.max(0, 54 + noise * 0.25));  // G
      data[i + 2] = Math.min(255, Math.max(0, 111 + noise * 0.5));  // B
      data[i + 3] = falloff * (130 + noise * 0.35);                  // A
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      cursorX.set(e.clientX - ORB_SIZE / 2);
      cursorY.set(e.clientY - ORB_SIZE / 2);
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x,
        y,
        width: ORB_SIZE,
        height: ORB_SIZE,
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'screen',
      }}
    >
      {/* Base radial gradient — large, soft, hazy */}
      <div
        style={{
          position: 'absolute',
          inset: '-40%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(33,54,111,0.55) 0%, rgba(33,54,111,0.35) 20%, rgba(33,54,111,0.15) 40%, rgba(20,40,90,0.05) 65%, transparent 85%)',
          filter: 'blur(50px)',
        }}
      />
      {/* Grain texture layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          filter: 'blur(4px)',
          opacity: 0.75,
        }}
      />
    </motion.div>
  );
}
