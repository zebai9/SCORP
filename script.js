(() => {
  // Only enable reveal-hidden mode when JS is actually running.
  document.documentElement.classList.add("js");

  // Staggered reveal on scroll (kept minimal and respectful of reduced-motion).
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      },
      { root: null, threshold: 0.12 }
    );
    for (const el of revealEls) io.observe(el);
  } else {
    for (const el of revealEls) el.classList.add("is-visible");
  }

  // Mark missing local videos (keeps the page usable when MP4s are not present yet).
  const videoCards = Array.from(document.querySelectorAll(".media-card"));
  for (const card of videoCards) {
    const video = card.querySelector("video");
    if (!video) continue;

    const markMissing = () => card.classList.add("is-missing");
    const clearMissing = () => card.classList.remove("is-missing");

    // Some browsers surface the error on <source>, others on <video>.
    video.addEventListener("error", markMissing, true);
    for (const srcEl of Array.from(video.querySelectorAll("source"))) {
      srcEl.addEventListener("error", markMissing, true);
    }
    video.addEventListener("loadeddata", clearMissing, true);
    video.addEventListener("canplay", clearMissing, true);

    // Best-effort autoplay (works with muted + playsinline in modern browsers).
    if (video.muted) {
      const tryPlay = () => {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      };
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
      tryPlay();
    }

  }

  // Explicit fullscreen trigger for the main demo reel.
  const fsButtons = Array.from(document.querySelectorAll("[data-fullscreen-target]"));
  for (const btn of fsButtons) {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-fullscreen-target");
      if (!targetId) return;
      const media = document.getElementById(targetId);
      if (!media) return;

      if (typeof media.requestFullscreen === "function") {
        media.requestFullscreen().catch(() => {});
        return;
      }
      if (typeof media.webkitRequestFullscreen === "function") {
        media.webkitRequestFullscreen();
        return;
      }
      if (typeof media.webkitEnterFullscreen === "function") {
        media.webkitEnterFullscreen();
      }
    });
  }

  // Auto-play the featured reel when it enters view. Browsers may reject
  // autoplay with audio; if they do, leave it paused instead of muting it.
  const demoReel = document.getElementById("demo-reel-video");
  if (demoReel && "IntersectionObserver" in window) {
    const forceAudible = () => {
      demoReel.muted = false;
      if (typeof demoReel.volume === "number") {
        demoReel.volume = 1;
      }
    };

    forceAudible();
    demoReel.addEventListener("loadedmetadata", forceAudible, { once: true });

    const inViewEnough = () => {
      const rect = demoReel.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      const ratio = rect.height > 0 ? visible / rect.height : 0;
      return ratio >= 0.55;
    };

    const tryPlayReel = () => {
      const p = demoReel.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const reelObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== demoReel) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            tryPlayReel();
          } else if (entry.intersectionRatio <= 0.2 && !demoReel.paused) {
            demoReel.pause();
          }
        }
      },
      { threshold: [0.2, 0.55, 0.8] }
    );

    reelObserver.observe(demoReel);

    const tryPlayFromUserGesture = () => {
      if (inViewEnough()) tryPlayReel();
    };

    window.addEventListener("wheel", tryPlayFromUserGesture, { passive: true });
    window.addEventListener("touchstart", tryPlayFromUserGesture, { passive: true });
    window.addEventListener("pointerdown", tryPlayFromUserGesture, { passive: true });
    window.addEventListener("keydown", tryPlayFromUserGesture);
  }
})();
