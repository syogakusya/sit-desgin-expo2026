"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import CircularLensEffect from "./CircularLensEffect";

const horizontalBase = { w: 1280, h: 720 } as const;
const verticalBase = { w: 1080, h: 1920 } as const;
const COLOR_FADE_DURATION_MS = 800;
const TE_FADE_DURATION_MS = 300;
const FINAL_TO_ZOOM_THRESHOLD = 0.15;
const ZOOM_SCROLL_PAGES = 3.0;
const KV_COMPLETED_STORAGE_KEY = "keyvisual:completed";

const COLOR_THRESHOLD = 0.15;
const TE_THRESHOLD = 0.15;
const FINAL_THRESHOLD = 0.15;

const PRE_ZOOM_MIN =
  COLOR_THRESHOLD + TE_THRESHOLD + FINAL_THRESHOLD + FINAL_TO_ZOOM_THRESHOLD + 0.05;
const SCROLL_PAGES = Math.max(
  Math.ceil(ZOOM_SCROLL_PAGES / (1 - PRE_ZOOM_MIN)) + 1,
  6,
);
const ZOOM_RANGE = ZOOM_SCROLL_PAGES / (SCROLL_PAGES - 1);
const COLOR_SHOWN_MAX = 1 - TE_THRESHOLD - FINAL_THRESHOLD - FINAL_TO_ZOOM_THRESHOLD - ZOOM_RANGE;
const TE_SHOWN_MAX = 1 - FINAL_THRESHOLD - FINAL_TO_ZOOM_THRESHOLD - ZOOM_RANGE;
const FINAL_SHOWN_MAX = 1 - FINAL_TO_ZOOM_THRESHOLD - ZOOM_RANGE;

const TE_H = { x: 550, y: 721, s: 0.25, r: 0 } as const;
const TE_V = { x: 700, y: 1090, s: 0.75, r: 0 } as const;


export default function KeyVisual() {
  const [scale, setScale] = useState(1);
  const [coverScale, setCoverScale] = useState(1);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [layoutReady, setLayoutReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [colorRevealed, setColorRevealed] = useState(false);
  const [teRevealed, setTeRevealed] = useState(false);
  const [finalRevealed, setFinalRevealed] = useState(false);
  const [kvEverCompleted, setKvEverCompleted] = useState(false);
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const coverBgRef = useRef<HTMLDivElement>(null);
  const whiteFadeRef = useRef<HTMLDivElement>(null);
  const radialFadeRef = useRef<HTMLDivElement>(null);
  const textInfoRef = useRef<HTMLDivElement>(null);
  const teLayerRef = useRef<HTMLImageElement>(null);

  const progressRef = useRef(0);
  const colorShownRef = useRef<number | null>(null);
  const teShownRef = useRef<number | null>(null);
  const finalShownRef = useRef<number | null>(null);
  const colorFadeDoneRef = useRef(false);
  const teFadeDoneRef = useRef(false);
  const colorTimerRef = useRef<number | null>(null);
  const teTimerRef = useRef<number | null>(null);
  const colorRevRef = useRef(false);
  const teRevRef = useRef(false);
  const finalRevRef = useRef(false);

  const kvDoneRef = useRef(false);
  const scaleRef = useRef(1);
  const coverScaleRef = useRef(1);
  const layoutRef = useRef<"horizontal" | "vertical">("horizontal");
  const hasDispatchedCompleteRef = useRef(false);
  const scrollAdjustedRef = useRef(false);
  const savedContentOffsetRef = useRef(0);
  const scrollIndicatorTimerRef = useRef<number | null>(null);
  const maxAllowedProgressRef = useRef(TE_SHOWN_MAX + 0.01);
  const hasInitializedLayoutRef = useRef(false);
  const initialRevealRafRef = useRef<number | null>(null);
  const hasStartedRevealRef = useRef(false);
  const restoredFromStorageRef = useRef(false);
  const applyZoomRef = useRef<(zp: number) => void>(() => {});

  kvDoneRef.current = kvEverCompleted;

  const startInitialReveal = useCallback((isVertical: boolean) => {
    if (hasStartedRevealRef.current) return;
    hasStartedRevealRef.current = true;
    const sources = isVertical
      ? [
          "/key-visual/back-vertical.png",
          "/key-visual/vertical/hoka.svg",
          "/key-visual/vertical/setu.svg",
          "/key-visual/vertical/ten.svg",
        ]
      : [
          "/key-visual/back-horizontal.png",
          "/key-visual/horizontal/hoka.svg",
          "/key-visual/horizontal/setu.svg",
          "/key-visual/horizontal/ten.svg",
        ];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      initialRevealRafRef.current = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    };
    const tid = window.setTimeout(finish, 1200);
    Promise.allSettled(
      sources.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    ).then(() => {
      window.clearTimeout(tid);
      finish();
    });
  }, []);

  const updateScale = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isVertical = vw / vh <= 4 / 3;
    const base = isVertical ? verticalBase : horizontalBase;
    const s = isVertical
      ? Math.min(vw / base.w, vh / base.h)
      : Math.max(vw / base.w, vh / base.h);
    const cs = Math.max(vw / base.w, vh / base.h);
    setLayout(isVertical ? "vertical" : "horizontal");
    setScale(s);
    setCoverScale(cs);
    layoutRef.current = isVertical ? "vertical" : "horizontal";
    scaleRef.current = s;
    coverScaleRef.current = cs;
    if (!hasInitializedLayoutRef.current) {
      hasInitializedLayoutRef.current = true;
      setLayoutReady(true);
      startInitialReveal(isVertical);
    }
  }, [startInitialReveal]);

  useEffect(() => {
    let restoreRaf: number | null = null;
    const stored = window.sessionStorage.getItem(KV_COMPLETED_STORAGE_KEY) === "1";
    if (stored) {
      restoredFromStorageRef.current = true;
      hasStartedRevealRef.current = true;
      hasDispatchedCompleteRef.current = true;
      kvDoneRef.current = true;
      document.body.dataset.keyvisualComplete = "1";
      restoreRaf = requestAnimationFrame(() => {
        setLayoutReady(true);
        setIsVisible(true);
        setKvEverCompleted(true);
        setScrollIndicatorVisible(false);
      });
    }

    const initialRaf = requestAnimationFrame(updateScale);
    window.addEventListener("resize", updateScale);
    return () => {
      if (restoreRaf !== null) cancelAnimationFrame(restoreRaf);
      if (initialRevealRafRef.current !== null) cancelAnimationFrame(initialRevealRafRef.current);
      cancelAnimationFrame(initialRaf);
      window.removeEventListener("resize", updateScale);
      if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current);
      if (teTimerRef.current !== null) window.clearTimeout(teTimerRef.current);
    };
  }, [updateScale]);

  useEffect(() => {
    let ticking = false;

    const updateMax = () => {
      if (!colorFadeDoneRef.current) maxAllowedProgressRef.current = TE_SHOWN_MAX + 0.01;
      else if (!teFadeDoneRef.current) maxAllowedProgressRef.current = FINAL_SHOWN_MAX + 0.01;
      else maxAllowedProgressRef.current = 1;
    };

    const resetAll = () => {
      colorRevRef.current = false;
      colorShownRef.current = null;
      colorFadeDoneRef.current = false;
      if (colorTimerRef.current !== null) { window.clearTimeout(colorTimerRef.current); colorTimerRef.current = null; }
      teRevRef.current = false;
      teShownRef.current = null;
      teFadeDoneRef.current = false;
      if (teTimerRef.current !== null) { window.clearTimeout(teTimerRef.current); teTimerRef.current = null; }
      finalRevRef.current = false;
      finalShownRef.current = null;
      updateMax();
      setColorRevealed(false);
      setTeRevealed(false);
      setFinalRevealed(false);
    };

    const applyZoom = (zp: number) => {
      const isVert = layoutRef.current === "vertical";
      const target = isVert ? 4.1 : 3.2;
      const zoom = 1 + (target - 1) * zp;
      const wo = Math.min(zp * 1.2, 1);
      const fv = kvDoneRef.current || finalRevRef.current;

      if (sceneRef.current) {
        sceneRef.current.style.transform = `translate(-50%, -50%) scale(${scaleRef.current * zoom})`;
      }
      if (coverBgRef.current) {
        coverBgRef.current.style.transform = `translate(-50%, -50%) scale(${coverScaleRef.current * zoom * 1.1})`;
      }
      if (whiteFadeRef.current) {
        whiteFadeRef.current.style.opacity = String(wo);
      }
      if (radialFadeRef.current) {
        radialFadeRef.current.style.opacity = String(fv ? 0.8 * (1 - wo) : 0);
      }
      if (textInfoRef.current) {
        textInfoRef.current.style.opacity = String(fv ? 1 - wo : 0);
      }
      if (teLayerRef.current) {
        const te = isVert ? TE_V : TE_H;
        const follow = isVert ? 0.42 : 0.5;
        const y = zp > 0
          ? Math.min(Math.max(te.y * (1 - follow * zp), te.y - 100), te.y + 100)
          : te.y;
        teLayerRef.current.style.transform =
          `translate(-50%, -50%) translate(${te.x}px, ${y}px) scale(${te.s}) rotate(${te.r}deg)`;
      }

      if (!hasDispatchedCompleteRef.current && finalRevRef.current && wo >= 1) {
        hasDispatchedCompleteRef.current = true;
        window.sessionStorage.setItem(KV_COMPLETED_STORAGE_KEY, "1");
        document.body.dataset.keyvisualComplete = "1";
        window.dispatchEvent(new Event("keyvisual:complete"));
        setScrollIndicatorVisible(false);
      }
    };

    applyZoomRef.current = applyZoom;

    const computeZP = () => {
      if (kvDoneRef.current) return 0;
      const p = progressRef.current;
      const fp = finalShownRef.current;
      const ready = fp !== null && p > fp + FINAL_TO_ZOOM_THRESHOLD;
      const start = fp !== null ? fp + FINAL_TO_ZOOM_THRESHOLD : 1;
      return finalRevRef.current && ready
        ? Math.min(Math.max((p - start) / ZOOM_RANGE, 0), 1)
        : 0;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) { ticking = false; return; }
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - window.innerHeight;

        if (scrollable > 0) {
          const raw = Math.min(Math.max(-rect.top / scrollable, 0), 1);
          progressRef.current = Math.min(raw, maxAllowedProgressRef.current);
          const p = progressRef.current;

          if (!kvDoneRef.current) {
            const wasColor = colorRevRef.current;
            const nowColor = p > COLOR_THRESHOLD;

            if (nowColor && !wasColor) {
              colorRevRef.current = true;
              colorShownRef.current = Math.min(p, COLOR_SHOWN_MAX);
              setColorRevealed(true);
              if (colorTimerRef.current !== null) window.clearTimeout(colorTimerRef.current);
              colorTimerRef.current = window.setTimeout(() => {
                colorFadeDoneRef.current = true;
                colorTimerRef.current = null;
                updateMax();
              }, COLOR_FADE_DURATION_MS);
            } else if (!nowColor && wasColor) {
              resetAll();
            }

            if (colorRevRef.current && colorFadeDoneRef.current && !teRevRef.current) {
              const cs = colorShownRef.current;
              if (cs !== null && p > cs + TE_THRESHOLD) {
                teRevRef.current = true;
                teShownRef.current = Math.min(p, TE_SHOWN_MAX);
                setTeRevealed(true);
                if (teTimerRef.current !== null) window.clearTimeout(teTimerRef.current);
                teTimerRef.current = window.setTimeout(() => {
                  teFadeDoneRef.current = true;
                  teTimerRef.current = null;
                  updateMax();
                }, TE_FADE_DURATION_MS);
              }
            }

            if (teRevRef.current && teFadeDoneRef.current && !finalRevRef.current) {
              const ts = teShownRef.current;
              if (ts !== null && p > ts + FINAL_THRESHOLD) {
                finalRevRef.current = true;
                finalShownRef.current = Math.min(p, FINAL_SHOWN_MAX);
                setFinalRevealed(true);
              }
            }

            applyZoom(computeZP());
          }
        }

        if (hasDispatchedCompleteRef.current && rect.bottom <= 0) {
          savedContentOffsetRef.current = Math.max(0, window.scrollY - el.offsetHeight);
          setKvEverCompleted(true);
        }

        ticking = false;
      });
    };

    const clampScroll = () => {
      if (hasDispatchedCompleteRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const maxScroll = el.offsetTop + scrollable * maxAllowedProgressRef.current;
      if (window.scrollY > maxScroll) {
        window.scrollTo(0, maxScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", clampScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", clampScroll);
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- ref-based zoom reapply after React renders
  useLayoutEffect(() => {
    const p = progressRef.current;
    const fp = finalShownRef.current;
    const ready = fp !== null && p > fp + FINAL_TO_ZOOM_THRESHOLD;
    const start = fp !== null ? fp + FINAL_TO_ZOOM_THRESHOLD : 1;
    const zp = kvDoneRef.current
      ? 0
      : finalRevRef.current && ready
        ? Math.min(Math.max((p - start) / ZOOM_RANGE, 0), 1)
        : 0;
    applyZoomRef.current(zp);
  });

  useEffect(() => {
    const onScroll = () => {
      setScrollIndicatorVisible(false);
      if (scrollIndicatorTimerRef.current !== null) {
        window.clearTimeout(scrollIndicatorTimerRef.current);
      }
      scrollIndicatorTimerRef.current = window.setTimeout(() => {
        if (!hasDispatchedCompleteRef.current) {
          setScrollIndicatorVisible(true);
        }
      }, 1500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollIndicatorTimerRef.current !== null) {
        window.clearTimeout(scrollIndicatorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (kvEverCompleted) setScrollIndicatorVisible(false);
  }, [kvEverCompleted]);

  useLayoutEffect(() => {
    if (!kvEverCompleted) return;
    if (restoredFromStorageRef.current) return;
    if (scrollAdjustedRef.current) return;
    scrollAdjustedRef.current = true;
    const el = containerRef.current;
    if (!el) return;
    const kvBottom = el.offsetTop + el.offsetHeight;
    window.scrollTo(0, kvBottom + savedContentOffsetRef.current);
  }, [kvEverCompleted]);

  const effectiveColorRevealed = kvEverCompleted || colorRevealed;
  const effectiveTeRevealed = kvEverCompleted || teRevealed;

  const horizontalLayers = [
    {
      src: "/key-visual/horizontal/hoka.svg",
      w: 1280, h: 720, x: 618, y: 360,
      scale: 1, rotate: 0, z: -30, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/horizontal/setu.svg",
      w: 509, h: 519, x: -71, y: 158.971,
      scale: 1, rotate: 0, z: -20, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/horizontal/setu-color.svg",
      w: 509, h: 519, x: -71, y: 159.071,
      scale: 1, rotate: 0, z: -21,
      opacity: effectiveColorRevealed ? 1 : 0, animate: true,
    },
    {
      src: "/key-visual/center-text.svg",
      w: 179, h: 179, x: 89.5, y: 89.5,
      scale: 1, rotate: 0, z: -5, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/center-circle.svg",
      w: 179, h: 179, x: 89.5, y: 89.5,
      scale: 1, rotate: 0, z: -5, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/horizontal/ten.svg",
      w: 521, h: 549, x: 513, y: 360,
      scale: 1, rotate: 0, z: -9, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/horizontal/ten-color.svg",
      w: 521, h: 549, x: 513, y: 368,
      scale: 1.03, rotate: 0, z: -10,
      opacity: effectiveColorRevealed ? 1 : 0, animate: true,
    },
    {
      src: "/key-visual/te.png",
      w: 942, h: 964, x: 550, y: 721,
      scale: 0.25, rotate: 0, z: 20,
      opacity: effectiveTeRevealed ? 1 : 0, animate: true,
    },
  ];

  const verticalLayers = [
    {
      src: "/key-visual/vertical/hoka.svg",
      w: 1080, h: 1920, x: 540, y: 960,
      scale: 1, rotate: 0, z: -30, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/vertical/setu.svg",
      w: 649, h: 648, x: 203, y: -119,
      scale: 0.98, rotate: 0, z: -20, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/vertical/setu-color.svg",
      w: 649, h: 648, x: 203, y: -126,
      scale: 1, rotate: 0, z: -21,
      opacity: effectiveColorRevealed ? 1 : 0, animate: true,
    },
    {
      src: "/key-visual/center-text.svg",
      w: 179, h: 179, x: 89.5, y: 89.5,
      scale: 1.69, rotate: 0, z: -5, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/center-circle.svg",
      w: 179, h: 179, x: 89.5, y: 89.5,
      scale: 1.69, rotate: 0, z: -5, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/vertical/ten.svg",
      w: 600, h: 651, x: 439, y: 775,
      scale: 1, rotate: 0, z: -9, opacity: 1, animate: false,
    },
    {
      src: "/key-visual/vertical/ten-color.svg",
      w: 600, h: 651, x: 439, y: 794,
      scale: 1, rotate: 0, z: -10,
      opacity: effectiveColorRevealed ? 1 : 0, animate: true,
    },
    {
      src: "/key-visual/te.png",
      w: 942, h: 964, x: 700, y: 1090,
      scale: 0.75, rotate: 0, z: 20,
      opacity: effectiveTeRevealed ? 1 : 0, animate: true,
    },
  ];

  const layers = layout === "vertical" ? verticalLayers : horizontalLayers;
  const base = layout === "vertical" ? verticalBase : horizontalBase;
  const backgroundSrc =
    layout === "vertical"
      ? "/key-visual/back-vertical.png"
      : "/key-visual/back-horizontal.png";

  return (
    <div ref={containerRef} style={{ height: kvEverCompleted ? "100vh" : `${SCROLL_PAGES * 100}vh`, overflowAnchor: "none" as const }}>
      <section className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {layout === "vertical" && (
          <div
            aria-hidden="true"
            className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-in ${
              layoutReady && isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ zIndex: -1 }}
          >
            <div
              ref={coverBgRef}
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                transform: `translate(-50%, -50%) scale(${coverScale * 1.1})`,
                width: base.w,
                height: base.h,
                filter: "blur(0px)",
                willChange: "transform",
              }}
            >
              <img
                src={backgroundSrc}
                alt=""
                width={base.w}
                height={base.h}
                className="absolute inset-0 h-full w-full"
              />
              <img
                src={layers[0].src}
                alt=""
                width={layers[0].w}
                height={layers[0].h}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${layers[0].x}px, ${layers[0].y}px) scale(${layers[0].scale})`,
                }}
              />
            </div>
          </div>
        )}
        <div
          ref={sceneRef}
          className={`absolute left-1/2 top-1/2 origin-center transition-opacity duration-1000 ease-in ${
            layoutReady && isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: `translate(-50%, -50%) scale(${scale})`,
            width: base.w,
            height: base.h,
            willChange: "transform",
          }}
        >
          <img
            src={backgroundSrc}
            alt=""
            aria-hidden="true"
            width={base.w}
            height={base.h}
            className="absolute inset-0 h-full w-full bg-repeat"
            style={{ zIndex: -100 }}
          />
          {layers.map((l) => {
            const isColor = l.src.includes("-color");
            const isCenterText = l.src === "/key-visual/center-text.svg";
            const isTe = l.src === "/key-visual/te.png";
            const common = {
              transform: `translate(-50%, -50%) translate(${l.x}px, ${l.y}px) scale(${l.scale}) rotate(${l.rotate}deg)`,
              zIndex: l.z,
              opacity: l.opacity,
              transition: l.animate ? "opacity 0.8s ease-in" : undefined,
            } as const;

            if (isCenterText) {
              return (
                <div
                  key={l.src}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{ ...common, width: l.w, height: l.h }}
                >
                  <CircularLensEffect
                    width={l.w}
                    height={l.h}
                    textureSrc={l.src}
                    lens={{
                      x: l.w / 2,
                      y: l.h / 2,
                      radius: Math.min(l.w / 2, l.h / 2) * 1.085,
                      refraction: 0.3,
                      depth: 1.8,
                      dispersion: 0.35,
                      frost: 40,
                      spread: 10,
                    }}
                    className="absolute inset-0"
                  />
                </div>
              );
            }

            if (isColor) {
              return (
                <div
                  key={l.src}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{
                    ...common,
                    width: l.w,
                    height: l.h,
                    isolation: "isolate",
                    willChange: "opacity",
                  }}
                >
                  <img
                    src={l.src}
                    alt=""
                    aria-hidden="true"
                    width={l.w}
                    height={l.h}
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                    draggable={false}
                    className="block h-full w-full"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      mixBlendMode: "screen",
                      backgroundImage: `url(${backgroundSrc})`,
                      backgroundSize: `${base.w / l.scale}px ${base.h / l.scale}px`,
                      backgroundPosition: `${(l.w - l.x - base.w / 2) / l.scale}px ${(l.h - l.y - base.h / 2) / l.scale}px`,
                      backgroundColor: "white",
                      backgroundRepeat: "no-repeat",
                      filter: " invert(1) brightness(3.4) contrast(1.0)",
                      WebkitMaskImage: `url(${l.src})`,
                      maskImage: `url(${l.src})`,
                      WebkitMaskSize: "100% 100%",
                      maskSize: "100% 100%",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat" as const,
                    }}
                  />
                </div>
              );
            }

            return (
              <img
                key={l.src}
                ref={isTe ? teLayerRef : undefined}
                src={l.src}
                alt=""
                aria-hidden="true"
                width={l.w}
                height={l.h}
                decoding="async"
                loading="eager"
                fetchPriority="high"
                draggable={false}
                className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  ...common,
                  willChange: isTe ? ("transform, opacity" as const) : undefined,
                }}
              />
            );
          })}
        </div>
        <div
          ref={radialFadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 40,
            opacity: 0,
            transition: "opacity 0.8s ease-in",
            willChange: "opacity",
            background:
              "radial-gradient(circle at center, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.80) 100%)",
          }}
        />
        <div
          ref={whiteFadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white"
          style={{
            zIndex: 41,
            opacity: 0,
            transition: "opacity 0.2s linear",
            willChange: "opacity",
          }}
        />
        <div
          ref={textInfoRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[48px] left-[40px] inline-flex flex-col items-start gap-2"
          style={{
            zIndex: 42,
            opacity: 0,
            transition: "opacity 0.8s ease-in",
            willChange: "opacity",
            color: "#3C3C3C",
            textShadow: "0 2px 20px rgba(0,0,0,0.25)",
          }}
        >
          <div className="flex gap-2 flex-col flex-start">
            <p className="text-[17px] font-bold leading-none [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">令和7年</p>
            <div className="flex flex-col gap-1 flex-start self-stretch">
              <p className="text-[36px] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] font-bold leading-none">芝浦工業大学</p>
              <p className="text-[36px] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] font-bold leading-none">卒業・修了研究展</p>
            </div>
            <p className="text-[17px] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] font-bold leading-none">デザイン工学部 / 大学院理工学研究科</p>
          </div>
          <p className="text-[16px] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] font-bold leading-none">2026年3月7日（土）~ 3月17日（火）</p>
        </div>

        <div
          className={`pointer-events-none absolute bottom-8 right-8 flex flex-col items-center text-neutral-700 transition-opacity ease-in [font-family:var(--font-roboto),'Hiragino_Kaku_Gothic_ProN',sans-serif] ${isVisible && scrollIndicatorVisible && !kvEverCompleted ? "opacity-100 duration-1000" : "opacity-0 duration-500"}`}
          style={{ zIndex: 10 }}
        >
          <p
            className="whitespace-nowrap rotate-90 text-center text-[14px] font-medium tracking-[2.1px] [text-shadow:0_0_8px_rgba(106,115,120,0.15)]"
            style={{ animation: "kv-scroll-pulse 2000ms linear infinite" }}
          >
            SCROLL
          </p>
          <div className="relative mt-8 h-[60px] w-px overflow-hidden bg-neutral-700 drop-shadow-[0_0_8px_rgba(106,115,120,0.15)]">
            <div
              className="absolute inset-0 origin-top bg-neutral-50"
              style={{
                animation: "kv-scroll-bar-light-fill 2000ms linear infinite",
              }}
            />
            <div
              className="absolute inset-0 origin-top bg-neutral-700"
              style={{
                animation: "kv-scroll-bar-dark-fill 2000ms linear infinite",
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes kv-scroll-pulse {
            0% {
              color: var(--color-neutral-700);
              animation-timing-function: ease-in;
            }
            50% {
              color: var(--color-neutral-50);
              animation-timing-function: ease-out;
            }
            100% {
              color: var(--color-neutral-700);
            }
          }
          @keyframes kv-scroll-bar-light-fill {
            0% {
              transform: scaleY(0);
              animation-timing-function: ease-in;
            }
            50% {
              transform: scaleY(1);
              animation-timing-function: ease-out;
            }
            100% {
              transform: scaleY(1);
            }
          }
          @keyframes kv-scroll-bar-dark-fill {
            0% {
              transform: scaleY(0);
            }
            50% {
              transform: scaleY(0);
              animation-timing-function: ease-out;
            }
            100% {
              transform: scaleY(1);
              animation-timing-function: ease-in;
            }
          }
        `}</style>
      </section>
    </div>
  );
}
