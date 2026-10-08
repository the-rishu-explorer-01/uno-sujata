import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import Logo from "@/components/Logo";

const nav = [
  { label: "Products", href: "/#products" },
  { label: "Industries", href: "/#industries" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Quality", href: "/#quality" },
  { label: "About", href: "/#about" },
  { label: "Resources", href: "/#resources" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer when the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-line bg-paper/95 backdrop-blur" : "border-transparent bg-bone"
      }`}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="UNO SUJATA home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 xl:flex">
          {nav.map((n) => (
            <a key={n.label} href={n.href} className="font-body text-sm font-medium text-ink/80 transition-colors hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/products" aria-label="Search products" className="inline-flex h-10 w-10 items-center justify-center text-ink/80 hover:text-ink">
            <Search size={19} />
          </Link>
          <NavLink to="/request-quote" className="btn-primary hidden !py-2.5 md:inline-flex">
            Request a Quote
          </NavLink>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center xl:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-ink/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-steel text-bone"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-[72px] items-center justify-between px-5">
                <Logo inverted />
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center">
                  <X size={22} />
                </button>
              </div>
              <div className="rule !border-graphite" />
              <nav aria-label="Mobile" className="flex flex-col px-5 py-6">
                {nav.map((n, i) => (
                  <motion.a
                    key={n.label}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-baseline justify-between border-b border-graphite py-4 font-display text-2xl font-medium"
                  >
                    {n.label}
                    <span className="font-mono text-[11px] text-brass-light">0{i + 1}</span>
                  </motion.a>
                ))}
              </nav>
              <div className="mt-auto space-y-3 p-5">
                <Link to="/request-quote" onClick={() => setOpen(false)} className="btn-primary w-full !bg-brass !text-ink hover:!bg-brass-light">
                  Request a Quote
                </Link>
                <Link to="/request-quote?type=drawing" onClick={() => setOpen(false)} className="btn-ghost w-full !border-bone/30 !text-bone hover:!border-bone">
                  Send Your Drawing
                </Link>
                <div className="pt-3 font-mono text-[11px] text-bone/60">
                  {/* Contact details are shown in the footer. */}
                  info@sujatabrass.com · +91 288 2570995
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
