"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  p: number;
  s: number;
}

/** Ambient animated starfield background, ported from the prototype. Purely decorative. */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let raf = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 1.4 + 0.3,
        p: Math.random() * 6.28,
        s: 0.008 + Math.random() * 0.02,
      }));
    }

    resize();
    window.addEventListener("resize", resize);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const star of stars) {
        star.p += star.s;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.r, 0, 7);
        ctx!.fillStyle = `rgba(255,246,236,${0.3 + 0.5 * Math.abs(Math.sin(star.p))})`;
        ctx!.fill();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="starfield" ref={canvasRef} aria-hidden="true" />;
}
