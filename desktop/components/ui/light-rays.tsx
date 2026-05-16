import { useRef, useEffect, useState } from "react";
import { Renderer, Program, Triangle, Mesh } from "ogl";
import { cn } from "@/lib/utils";
import { lightRaysVertex, lightRaysFragment } from "./light-rays-shaders";

type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "right"
  | "left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

const DEFAULT_COLOR = "#ffffff";

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return m
    ? [
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1];
};

const getAnchorAndDir = (
  origin: RaysOrigin,
  w: number,
  h: number,
): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2;

  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h], dir: [0, 1] };

    case "top-right":
      return { anchor: [w, -outside * h], dir: [0, 1] };

    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };

    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };

    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };

    case "bottom-center":
      return {
        anchor: [0.5 * w, (1 + outside) * h],
        dir: [0, -1],
      };

    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };

    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface Uniforms {
  iTime: { value: number };
  iResolution: { value: Vec2 };

  rayPos: { value: Vec2 };
  rayDir: { value: Vec2 };

  raysColor: { value: Vec3 };
  raysSpeed: { value: number };
  lightSpread: { value: number };
  rayLength: { value: number };
  pulsating: { value: number };
  fadeDistance: { value: number };
  saturation: { value: number };

  mousePos: { value: Vec2 };
  mouseInfluence: { value: number };

  noiseAmount: { value: number };
  distortion: { value: number };
}

const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = "top-center",
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1,
  saturation = 1,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0,
  distortion = 0,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<Renderer | null>(null);
  const uniformsRef = useRef<Uniforms | null>(null);
  const meshRef = useRef<Mesh | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });

  const observerRef = useRef<ResizeObserver | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;

    const renderer = new Renderer({
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });

    rendererRef.current = renderer;

    const gl = renderer.gl;

    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    container.innerHTML = "";
    container.appendChild(gl.canvas);

    const uniforms: Uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },

      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },

      raysColor: { value: hexToRgb(raysColor) },
      raysSpeed: { value: raysSpeed },
      lightSpread: { value: lightSpread },
      rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1 : 0 },
      fadeDistance: { value: fadeDistance },
      saturation: { value: saturation },

      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: mouseInfluence },

      noiseAmount: { value: noiseAmount },
      distortion: { value: distortion },
    };

    uniformsRef.current = uniforms;

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: lightRaysVertex,
      fragment: lightRaysFragment,
      uniforms,
    });

    const mesh = new Mesh(gl, {
      geometry,
      program,
    });

    meshRef.current = mesh;

    const updateSize = () => {
      if (!containerRef.current || !rendererRef.current) return;

      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      if (!width || !height) return;

      rendererRef.current.setSize(width, height);

      const dpr = rendererRef.current.dpr;

      const realWidth = width * dpr;
      const realHeight = height * dpr;

      uniforms.iResolution.value = [realWidth, realHeight];

      const { anchor, dir } = getAnchorAndDir(
        raysOrigin,
        realWidth,
        realHeight,
      );

      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    };

    updateSize();

    requestAnimationFrame(() => {
      updateSize();
    });

    observerRef.current = new ResizeObserver(() => {
      updateSize();
    });

    observerRef.current.observe(container);

    const animate = (time: number) => {
      if (!rendererRef.current || !uniformsRef.current || !meshRef.current) {
        return;
      }

      uniformsRef.current.iTime.value = time * 0.001;

      if (followMouse) {
        const smoothing = 0.92;

        smoothMouseRef.current.x =
          smoothMouseRef.current.x * smoothing +
          mouseRef.current.x * (1 - smoothing);

        smoothMouseRef.current.y =
          smoothMouseRef.current.y * smoothing +
          mouseRef.current.y * (1 - smoothing);

        uniformsRef.current.mousePos.value = [
          smoothMouseRef.current.x,
          smoothMouseRef.current.y,
        ];
      }

      rendererRef.current.render({
        scene: meshRef.current,
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    if (followMouse) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      observerRef.current?.disconnect();

      if (followMouse) {
        window.removeEventListener("mousemove", handleMouseMove);
      }

      try {
        const loseContext = gl.getExtension("WEBGL_lose_context");

        loseContext?.loseContext();
      } catch {}

      rendererRef.current = null;
      uniformsRef.current = null;
      meshRef.current = null;
    };
  }, [
    mounted,
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-20",
        className,
      )}
    />
  );
};

export default LightRays;
