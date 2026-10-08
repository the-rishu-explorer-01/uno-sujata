import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Seo from "@/components/Seo";
import { api } from "@/lib/api";
import { quoteRequestSchema, type QuoteRequest } from "@/lib/schemas";

const fields: { name: keyof QuoteRequest; label: string; type?: string }[] = [
  { name: "name", label: "Full name" },
  { name: "company", label: "Company" },
  { name: "email", label: "Work email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "country", label: "Country" },
  { name: "quantity", label: "Estimated quantity" },
];

export default function RequestQuotePage() {
  const [params] = useSearchParams();
  const wantsDrawing = params.get("type") === "drawing";
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [reference, setReference] = useState<string>();
  const productSlug = params.get("product") ?? undefined;
  const [productName, setProductName] = useState<string | null>(null);

  // Show which product the request refers to. A bad slug is ignored rather than blocking the form.
  useEffect(() => {
    if (!productSlug) return;
    const c = new AbortController();
    api
      .productBySlug(productSlug, c.signal)
      .then((p) => setProductName(p.name))
      .catch(() => {
        if (!c.signal.aborted) setProductName(null);
      });
    return () => c.abort();
  }, [productSlug]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequest>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: { hasDrawing: wantsDrawing, productSlug },
  });

  const onSubmit = async (data: QuoteRequest) => {
    setStatus("sending");
    try {
      const res = await api.submitQuote(data);
      setReference(res.reference);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <Seo
        title="Request a Quote | UNO SUJATA"
        description="Send your drawing, sample or specification and request a quote for precision brass components."
        path="/request-quote"
      />
      <section className="bg-bone py-16 lg:py-24">
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Request a quote</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.02]">
              {wantsDrawing ? "SEND YOUR DRAWING." : "TELL US WHAT YOU NEED."}
            </h1>
            <p className="mt-6 font-body text-base leading-relaxed text-ink/70">
              Share a drawing, sample, specification or application requirement. Attach files
              through the follow-up email if they do not fit here.
            </p>
            {productName && (
              <p className="mt-6 border-l-2 border-brass pl-4 font-body text-sm">
                Regarding: <span className="font-semibold">{productName}</span>
              </p>
            )}
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            {status === "done" ? (
              <div role="status" className="border border-ink p-10">
                <h2 className="font-display text-3xl font-bold">Request received.</h2>
                <p className="mt-4 font-body text-ink/70">
                  {reference ? `Reference ${reference}. ` : ""}Our team will review it and reply.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 sm:grid-cols-2">
                <input type="hidden" {...register("productSlug")} />
                {fields.map((f) => (
                  <div key={f.name} className={f.name === "quantity" ? "sm:col-span-2" : ""}>
                    <label htmlFor={f.name} className="block font-mono text-[11px] uppercase tracking-technical text-ink/70">
                      {f.label}
                    </label>
                    <input
                      id={f.name}
                      type={f.type ?? "text"}
                      aria-invalid={!!errors[f.name]}
                      aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
                      {...register(f.name)}
                      className="mt-2 w-full border-0 border-b border-ink/40 bg-transparent py-2.5 font-body text-base focus:border-ink focus:outline-none"
                    />
                    {errors[f.name] && (
                      <p id={`${f.name}-err`} className="mt-1 font-body text-xs text-red-700">
                        {errors[f.name]?.message as string}
                      </p>
                    )}
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label htmlFor="requirement" className="block font-mono text-[11px] uppercase tracking-technical text-ink/70">
                    Requirement
                  </label>
                  <textarea
                    id="requirement"
                    rows={5}
                    aria-invalid={!!errors.requirement}
                    {...register("requirement")}
                    className="mt-2 w-full border border-ink/40 bg-paper p-3 font-body text-base focus:border-ink focus:outline-none"
                  />
                  {errors.requirement && <p className="mt-1 font-body text-xs text-red-700">{errors.requirement.message}</p>}
                </div>

                <label className="flex items-center gap-3 font-body text-sm sm:col-span-2">
                  <input type="checkbox" {...register("hasDrawing")} className="h-4 w-4 accent-[#7D5F33]" />
                  I have a drawing or sample to share
                </label>

                <div className="sm:col-span-2">
                  <button type="submit" disabled={isSubmitting || status === "sending"} className="btn-primary disabled:opacity-60">
                    {status === "sending" ? "Sending…" : "Request a Quote"}
                  </button>
                  {status === "error" && (
                    <p role="alert" className="mt-3 font-body text-sm text-red-700">
                      Could not send. Please try again or email info@sujatabrass.com.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
