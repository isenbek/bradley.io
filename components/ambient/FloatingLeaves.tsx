"use client";

import { useEffect, useRef } from "react";

interface Leaf {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
  rotation: number;
  rotationSpeed: number;
}

function getLeafColor(): string {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue("--secondary").trim() || "#7acfd6";
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  leaf: Leaf,
  color: string
) {
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate(leaf.rotation);
  ctx.globalAlpha = leaf.opacity;

  // Leaf shape via bezier curves
  ctx.beginPath();
  ctx.moveTo(0, -leaf.size / 2);
  ctx.bezierCurveTo(
    leaf.size / 2, -leaf.size / 4,
    leaf.size / 2, leaf.size / 4,
    0, leaf.size / 2
  );
  ctx.bezierCurveTo(
    -leaf.size / 2, leaf.size / 4,
    -leaf.size / 2, -leaf.size / 4,
    0, -leaf.size / 2
  );
  ctx.fillStyle = color;
  ctx.fill();

  // Leaf vein
  ctx.beginPath();
  ctx.moveTo(0, -leaf.size / 2);
  ctx.lineTo(0, leaf.size / 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = leaf.opacity * 0.5;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

export function FloatingLeaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const rafRef = useRef<number>(0);
  const breezeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    // Skip on mobile (< 768px)
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      if (disposed) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const color = getLeafColor();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const leaves = leavesRef.current;
      for (let i = leaves.length - 1; i >= 0; i--) {
        const leaf = leaves[i];

        leaf.x -= leaf.speed;
        leaf.wobbleOffset += leaf.wobbleSpeed;
        leaf.y += Math.sin(leaf.wobbleOffset) * 0.5;
        leaf.rotation += leaf.rotationSpeed;

        // Remove leaves that exit the viewport
        if (leaf.x < -leaf.size * 2) {
          leaves.splice(i, 1);
          continue;
        }

        drawLeaf(ctx, leaf, color);
      }

      // Stop animation loop if no leaves remain
      if (leaves.length === 0) {
        isAnimatingRef.current = false;
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const scheduleBreeze = () => {
      if (disposed) return;
      const delay = 20000 + Math.random() * 25000; // 20-45 seconds
      breezeTimerRef.current = setTimeout(spawnBreeze, delay);
    };

    const spawnBreeze = () => {
      if (disposed) return;

      const leafCount = 3 + Math.floor(Math.random() * 4); // 3-6 leaves
      for (let i = 0; i < leafCount; i++) {
        leavesRef.current.push({
          x: canvas.width + Math.random() * 100,
          y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
          size: 10 + Math.random() * 8,
          opacity: 0.15 + Math.random() * 0.15,
          speed: 0.8 + Math.random() * 1.2,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.01 + Math.random() * 0.02,
          wobbleAmplitude: 15 + Math.random() * 25,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: 0.005 + Math.random() * 0.015,
        });
      }

      // Start animation loop if not running
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animate();
      }

      scheduleBreeze();
    };

    resize();
    window.addEventListener("resize", resize);

    // Schedule first breeze (5-15s after mount)
    const initialDelay = 5000 + Math.random() * 10000;
    breezeTimerRef.current = setTimeout(spawnBreeze, initialDelay);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      if (breezeTimerRef.current) clearTimeout(breezeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      isAnimatingRef.current = false;
      leavesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none hidden md:block"
      style={{ zIndex: 30 }}
      aria-hidden="true"
    />
  );
}
