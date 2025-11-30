/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/HomePage.tsx
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";


export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const goToQuote = async() => {

    if (!user) {
      navigate("/login", { state: { redirectTo: "/" }});
      return;
    }
    try {
      console.log("Starting questionnaire...");
      const res = await axiosClient.post("/questionnaire/start", {});
      console.log("Questionnaire started:", res.data);
      const questionnaireId = res.data.id;
      localStorage.setItem("questionnaireId", questionnaireId);
      navigate(`/product`);
    } catch (err: any) {
      console.log("Error response:", err.response);
      if (err?.response?.status === 401) {
        navigate("/login", { state: { redirectTo: "/product" }});
      } else {
        console.error("Error starting questionnaire:", err);
        alert("Failed to start questionnaire. Please try again later.");
      }
    }
  };
      
//   const goToQuote = () => {
//   window.location.href = "https://app.swisstaxonline.ch/blablabla";
// };
  return (
    <main className="home">
      {/* HERO: strengths left + price/right CTA */}
      <section className="home-hero">
        <div className="home-hero-left">
          <p className="home-hero-tagline">
            {t("home.hero.tagline")}
          </p>

          <h1 className="home-hero-title">
            {t("home.hero.title")}
          </h1>

          <div className="home-strengths">
            <h2>{t("home.strengths.title")}</h2>
            <ul>
              <li>{t("home.strengths.item1")}</li>
              <li>{t("home.strengths.item2")}</li>
              <li>{t("home.strengths.item3")}</li>
              <li>{t("home.strengths.item4")}</li>
            </ul>
          </div>
        </div>

        <div className="home-hero-right">
          <div className="home-price-card">
            <h2>{t("home.price.title")}</h2>
            <p>{t("home.price.text")}</p>

            <button className="primary" onClick={goToQuote}>
            {t("home.price.cta")} {/* Get a quote */}
            </button>

            <p className="muted">
              {t("home.price.note")}
            </p>
          </div>
        </div>
      </section>

      {/* GOOGLE REVIEWS */}
      <section className="home-section">
        <h2>{t("home.reviews.title")}</h2>
        <p className="home-section-intro">
          {t("home.reviews.subtitle")}
        </p>
        <div className="home-grid two">
          <div className="home-card">
            <p className="home-reviews-score">
              {t("home.reviews.score")}
            </p>
            <p className="home-reviews-count">
              {t("home.reviews.count")}
            </p>
          </div>
          <div className="home-card">
            <p>{t("home.reviews.placeholder")}</p>
          </div>
        </div>
      </section>

      {/* SEO / USEFUL INFORMATION */}
      <section className="home-section">
        <h2>{t("home.seo.title")}</h2>
        <p className="home-section-intro">
          {t("home.seo.intro")}
        </p>
        <div className="home-card">
          <p>{t("home.seo.text1")}</p>
          <p>{t("home.seo.text2")}</p>

          <div className="home-seo-links">
            <a href="https://www.swisstaxonline.ch/about" target="_blank" rel="noopener noreferrer">
              {t("home.seo.linkAbout")}
            </a>
            <a href="https://www.swisstaxonline.ch/blog" target="_blank" rel="noopener noreferrer">
              {t("home.seo.linkBlog")}
            </a>
            <a href="https://www.swisstaxonline.ch/faq" target="_blank" rel="noopener noreferrer">
              {t("home.seo.linkFaq")}
            </a>
            <a href="https://www.swisstaxonline.ch/contact" target="_blank" rel="noopener noreferrer">
              {t("home.seo.linkContact")}
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS – 5 steps */}
      <section className="home-section">
        <h2>{t("home.how.title")}</h2>
        <ol className="home-steps">
          <li>
            <strong>{t("home.how.step1.title")}</strong>
            <p>{t("home.how.step1.text")}</p>
            <a
              href="https://www.swisstaxonline.ch/faq#step1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.how.learnMore")}
            </a>
          </li>
          <li>
            <strong>{t("home.how.step2.title")}</strong>
            <p>{t("home.how.step2.text")}</p>
            <a
              href="https://www.swisstaxonline.ch/faq#step2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.how.learnMore")}
            </a>
          </li>
          <li>
            <strong>{t("home.how.step3.title")}</strong>
            <p>{t("home.how.step3.text")}</p>
            <a
              href="https://www.swisstaxonline.ch/faq#step3"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.how.learnMore")}
            </a>
          </li>
          <li>
            <strong>{t("home.how.step4.title")}</strong>
            <p>{t("home.how.step4.text")}</p>
            <a
              href="https://www.swisstaxonline.ch/faq#step4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.how.learnMore")}
            </a>
          </li>
          <li>
            <strong>{t("home.how.step5.title")}</strong>
            <p>{t("home.how.step5.text")}</p>
            <a
              href="https://www.swisstaxonline.ch/faq#step5"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.how.learnMore")}
            </a>
          </li>
        </ol>
      </section>

      {/* OUR GUARANTEES */}
      <section className="home-section">
        <h2>{t("home.guarantees.title")}</h2>
        <div className="home-grid four">
          <div className="home-card">
            <h3>{t("home.guarantees.item1.title")}</h3>
            <p>{t("home.guarantees.item1.text")}</p>
          </div>
          <div className="home-card">
            <h3>{t("home.guarantees.item2.title")}</h3>
            <p>{t("home.guarantees.item2.text")}</p>
          </div>
          <div className="home-card">
            <h3>{t("home.guarantees.item3.title")}</h3>
            <p>{t("home.guarantees.item3.text")}</p>
          </div>
          <div className="home-card">
            <h3>{t("home.guarantees.item4.title")}</h3>
            <p>{t("home.guarantees.item4.text")}</p>
          </div>
        </div>
      </section>

      {/* SHORT FAQ */}
      <section className="home-section">
        <h2>{t("home.faq.title")}</h2>
        <div className="home-faq">
          <div className="home-faq-item">
            <a
              href="https://www.swisstaxonline.ch/faq#processing-time"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.faq.q1.q")}
            </a>
            <p>{t("home.faq.q1.a")}</p>
          </div>
          <div className="home-faq-item">
            <a
              href="https://www.swisstaxonline.ch/faq#deductions"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.faq.q2.q")}
            </a>
            <p>{t("home.faq.q2.a")}</p>
          </div>
          <div className="home-faq-item">
            <a
              href="https://www.swisstaxonline.ch/faq#security"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("home.faq.q3.q")}
            </a>
            <p>{t("home.faq.q3.a")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
