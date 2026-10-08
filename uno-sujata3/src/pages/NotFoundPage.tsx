import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center bg-bone py-24">
      <Seo title="Page not found | UNO SUJATA" description="The page you are looking for does not exist." path="/404" indexable={false} />
      <div className="container-x">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold">Page not found.</h1>
        <Link to="/" className="btn-primary mt-8">Back to home</Link>
      </div>
    </section>
  );
}
