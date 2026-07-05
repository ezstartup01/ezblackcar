import { legalContact, legalPages } from "../data/legalContent.js";

export default function LegalPage({ path }) {
  const page = legalPages[path];

  if (!page) return null;

  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
      </section>

      <section className="legal-section">
        <div className="legal-card">
          {page.sections.map((section) => (
            <section className="legal-block" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.cta ? (
                <a className="button primary legal-cta" href={section.cta.href}>
                  {section.cta.label}
                </a>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="legal-side-card">
          <h3>EZ Black Car</h3>
          <p>DTW Airport & Metro Detroit Black SUV Service</p>
          <p>{legalContact.serviceArea}</p>
          <a className="button dark" href="/#quote-form">
            Get Estimated Quote
          </a>
        </aside>
      </section>
    </main>
  );
}
