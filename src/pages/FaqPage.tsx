// src/pages/FaqPage.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

type CategoryId =
  | "general"
  | "process"
  | "documents"
  | "payment"
  | "security";

type FaqItemId =
  | "q1"
  | "q2"
  | "q3";

type FaqKey = `${CategoryId}.${FaqItemId}`;

const CATEGORIES: { id: CategoryId; }[] = [
  { id: "general" },
  { id: "process" },
  { id: "documents" },
  { id: "payment" },
  { id: "security" },
];
// const [openItem, setOpenItem] = useState<string | null>(null);
// const isOpen = openItem ;
const ITEMS_PER_CATEGORY: Record<CategoryId, FaqItemId[]> = {
  general: ["q1", "q2", "q3"],
  process: ["q1", "q2", "q3"],
  documents: ["q1", "q2", "q3"],
  payment: ["q1", "q2", "q3"],
  security: ["q1", "q2", "q3"],
};

export default function FaqPage() {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState<FaqKey | null>(null);

  const toggleItem = (catId: CategoryId, itemId: FaqItemId) => {
    const key: FaqKey = `${catId}.${itemId}`;
    setOpenItem((current) => (current === key ? null : key));
  };

  return (
    <div className="faq-page">
      {/* Header */}
      <header className="faq-header">
        <div>
          <h1>{t("faq.title")}</h1>
          <p className="faq-subtitle">{t("faq.subtitle")}</p>
        </div>
      </header>

      <main className="faq-main">
        {CATEGORIES.map((cat) => {
          const catKey = `faq.categories.${cat.id}`;
          const items = ITEMS_PER_CATEGORY[cat.id];

          return (
            <section key={cat.id} className="faq-category">
              <h2 className="faq-category-title">
                {t(`${catKey}.title`)}
              </h2>
              <p className="faq-category-description">
                {t(`${catKey}.description`)}
              </p>

              <div className="faq-accordion">
                {items.map((itemId) => {
                  const fullKey: FaqKey = `${cat.id}.${itemId}`;
                  const isOpen = openItem === fullKey;

                  return (
                    <article
                      key={fullKey}
                      className={
                        "faq-item" + (isOpen ? " faq-item-open" : "")
                      }
                    >
                      <button
                        type="button"
                        className="faq-question-btn"
                        onClick={() => toggleItem(cat.id, itemId)}
                        aria-expanded={isOpen }
                        aria-controls={`faq-panel-${cat.id}-${itemId}`}
                      >
                        <span className="faq-question-text">
                          {t(`${catKey}.items.${itemId}.question`)}
                        </span>
                        <span
                          className={
                            "faq-toggle-icon" +
                            (isOpen ? " faq-toggle-icon-open" : "")
                          }
                          aria-hidden="true"
                        >
                          ▾
                        </span>
                      </button>

                      {isOpen && (
                        <div className="faq-answer">
                          <p>
                            {t(`${catKey}.items.${itemId}.answer`)}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
