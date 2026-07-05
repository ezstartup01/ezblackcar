import { useState } from "react";
import { Headphones, Minus, Plus } from "lucide-react";
import { faqItems } from "../data/faqContent.js";

export default function FaqSection({ imageSrc }) {
  const [openItems, setOpenItems] = useState(() => new Set([0]));
  const leftColumn = faqItems.filter((_, index) => index % 2 === 0);
  const rightColumn = faqItems.filter((_, index) => index % 2 === 1);

  function toggleItem(index) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function renderFaqCard(item, index) {
    const isOpen = openItems.has(index);

    return (
      <article className={`faq-card${isOpen ? " open" : ""}`} key={item.question}>
        <button
          type="button"
          className="faq-question"
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${index}`}
          onClick={() => toggleItem(index)}
        >
          <span className="faq-icon-badge">{isOpen ? <Minus size={18} /> : <Plus size={18} />}</span>
          <span className="faq-question-text">{item.question}</span>
          <span className="faq-question-trailing" aria-hidden="true">
            {isOpen ? <Minus size={22} /> : <Plus size={22} />}
          </span>
        </button>

        {isOpen ? (
          <div id={`faq-answer-${index}`} className="faq-answer">
            <p>{item.answer}</p>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className="section faq-section" aria-labelledby="faq-title">
      <div className="section-heading faq-heading">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">Frequently Asked Questions</h2>
        <span className="faq-heading-divider" aria-hidden="true" />
        <p>Answers to common questions about quotes, airport service, billing, and ride confirmation.</p>
      </div>

      <div className="faq-grid">
        <div className="faq-column">
          {leftColumn.map((item, columnIndex) => renderFaqCard(item, columnIndex * 2))}
        </div>

        <div className="faq-column">
          {rightColumn.map((item, columnIndex) => renderFaqCard(item, columnIndex * 2 + 1))}
        </div>
      </div>

      <div className="faq-cta-card">
        <div className="faq-cta-copy">
          <div className="faq-cta-icon">
            <Headphones size={50} aria-hidden="true" />
          </div>
          <div className="faq-cta-text">
            <h3>Still have questions?</h3>
            <p>Contact EZ Black Car for help with airport transfers, executive rides, and corporate accounts.</p>
            <a className="button primary faq-cta-button" href="/contact">
              Contact Us
            </a>
          </div>
        </div>

        {imageSrc ? (
          <div className="faq-cta-image-panel">
            <img src={imageSrc} alt="Black executive SUV ready for airport and corporate transportation" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
