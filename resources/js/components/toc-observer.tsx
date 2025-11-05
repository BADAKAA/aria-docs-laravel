import { useEffect, useMemo, useState } from "react";
import type { TocItem } from "@/lib/markdown-react";

type Props = {
  data: TocItem[];
};

export default function TocObserver({ data }: Props) {
  const [active, setActive] = useState<string>("");

  const ids = useMemo(() => data.map((d) => d.href.replace(/^#/, "")), [data]);

  useEffect(() => {
    setActive(ids[0] || "");
  },[]);
  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (headings.length === 0) return;

    const handler: IntersectionObserverCallback = (entries) => {
      // Find the entry closest to the top that's intersecting
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]) {
        setActive(visible[0].target.id);
        return;
      }

      // Fallback: if none are intersecting, find the last heading above the viewport
      const above = headings
        .filter((h) => h.getBoundingClientRect().top <= 80) // header offset
        .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
      if (above[0]) setActive(above[0].id);
    };

    const observer = new IntersectionObserver(handler, {
      root: null,
      rootMargin: "0px 0px -60% 0px",
      threshold: [0, 1.0],
    });

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [ids]);

  return (
    <ul className="text-sm space-y-1">
      {data.map((h) => {
        const id = h.href.replace(/^#/, "");
        const isActive = active === id;
        const pad = h.level === 2 ? "pl-0" : h.level === 3 ? "pl-3" : "pl-6";
        return (
          <li key={h.href} className={pad}>
            <a
              href={h.href}
              onClick={()=>setActive(id)}
              className={
                (isActive
                  ? "font-semibold text-foreground"
                  : "text-foreground/80 hover:text-foreground") +
                " transition-colors"
              }
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
