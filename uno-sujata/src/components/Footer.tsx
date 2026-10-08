import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { company } from "@/data/company";

const links = [
  { label: "Products", href: "/#products" },
  { label: "Industries", href: "/#industries" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Quality", href: "/#quality" },
  { label: "About", href: "/#about" },
  { label: "Resources", href: "/#resources" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-bone">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo inverted />
          <p className="mt-5 max-w-sm font-body text-sm leading-relaxed text-bone/70">
            Precision brass components manufactured in Jamnagar, Gujarat, since {company.founded}.
          </p>
          <Link to="/request-quote" className="btn-primary mt-8 !bg-brass !text-ink hover:!bg-brass-light">
            Request a Quote
          </Link>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow !text-brass-light">Navigate</p>
          <ul className="mt-5 space-y-3">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="font-body text-sm text-bone/80 hover:text-bone">{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="eyebrow !text-brass-light">Contact</p>
          <address className="mt-5 space-y-3 not-italic font-body text-sm text-bone/80">
            <p>{company.address}</p>
            <p><a className="hover:text-bone" href={`tel:${company.phone.replace(/\s|\//g, "")}`}>{company.phone}</a></p>
            <p><a className="hover:text-bone" href={`mailto:${company.email}`}>{company.email}</a></p>
          </address>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow !text-brass-light">Legal</p>
          <ul className="mt-5 space-y-3 font-body text-sm text-bone/80">
            <li><a href="/privacy" className="hover:text-bone">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-bone">Terms</a></li>
            <li><a href="/cookies" className="hover:text-bone">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-graphite">
        <div className="container-x flex flex-col gap-2 py-6 font-mono text-[11px] text-bone/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {company.legalName}. All rights reserved.</span>
          <span>Quality built to print.</span>
        </div>
      </div>
    </footer>
  );
}
