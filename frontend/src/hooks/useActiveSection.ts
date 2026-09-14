import { useState, useEffect } from "react";

export function useActiveSection(sectionIds: string[], offsetPx = 120) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sectionIds[0] || "");

  useEffect(() => {
    if (!sectionIds.length) return;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Buscar la sección que esté intersectando dentro de la ventana de lectura
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveSectionId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: `-${offsetPx}px 0px -60% 0px`, // Activa cuando el encabezado pasa el tercio superior
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, offsetPx]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return { activeSectionId, scrollToSection };
}