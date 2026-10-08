import { useEffect } from "react";

const SITE = "https://www.unosujata.com";

interface SeoProps {
  title: string;
  description: string;
  path: string;
}

/** Sets document title, description, canonical and Open Graph tags per page. */
export default function Seo({ title, description, path }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: `${SITE}${path}` });

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `${SITE}${path}`;
  }, [title, description, path]);

  return null;
}

function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    el.setAttribute("content", attrs.content);
  }
}
