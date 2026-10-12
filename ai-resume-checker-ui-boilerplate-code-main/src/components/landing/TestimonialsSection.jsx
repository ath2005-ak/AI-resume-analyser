import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "./FeaturesSection";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    id: "faq-ats-score",
    question: "How does the ATS scoring engine evaluate my resume?",
    answer:
      "We parse your resume layout and extract structured entities—contact info, work history, skills, and education. We then benchmark your document against 2026 ATS standards, checking keyword density, quantitative metrics, layout readability, and role alignment.",
    icon: Zap,
    tag: "Scoring",
  },
  {
    id: "faq-privacy",
    question: "Is my resume data kept private and confidential?",
    answer:
      "Yes, completely. Your resume data is stored securely in your private account workspace. We never sell your personal information, share your resumes with third parties, or use your documents to train public AI models.",
    icon: ShieldCheck,
    tag: "Privacy & Security",
  },
  {
    id: "faq-job-description",
    question: "Can I customize the analysis for a specific job posting?",
    answer:
      "Absolutely. When analyzing any resume version, you can paste the target job description. Our system cross-references your experience with the exact requirements, highlighting missing keywords and skills gaps.",
    icon: Sparkles,
    tag: "Targeting",
  },
  {
    id: "faq-bullet-rewrites",
    question: "Will the AI-rewritten bullets sound natural or generic?",
    answer:
      "Our rewrite models are specifically instructed to eliminate generic corporate jargon (such as 'synergized' or 'spearheaded'). Instead, they emphasize strong action verbs, quantifiable metrics, and your authentic engineering voice.",
    icon: CheckCircle2,
    tag: "AI Rewrites",
  },
  {
    id: "faq-file-formats",
    question: "What file formats can I upload and export?",
    answer:
      "You can upload resumes in PDF (.pdf) and Microsoft Word (.docx, .doc) formats up to 5 MB. Once you're satisfied with your optimizations, you can export your polished resume as a clean, ATS-compliant PDF.",
    icon: FileText,
    tag: "Formats",
  },
  {
    id: "faq-versions",
    question: "How do version history and side-by-side diffs work?",
    answer:
      "Every time you update your resume or apply AI bullet rewrites, a new version snapshot is saved automatically. You can compare changes side-by-side with our diff viewer, track score progress, and restore previous drafts at any time.",
    icon: HelpCircle,
    tag: "Versions",
  },
];

export function FAQSection() {
  const [openId, setOpenId] = useState("faq-ats-score");

  function toggle(id) {
    setOpenId((curr) => (curr === id ? null : id));
  }

  return (
    <section
      id="faq"
      className="px-3 sm:px-6 mt-28 sm:mt-36"
      style={{ maxWidth: 1040, marginLeft: "auto", marginRight: "auto" }}
      aria-label="Frequently Asked Questions"
    >
      <SectionHeader
        eyebrow="Frequently Asked Questions"
        title={<>Everything you need to know about AI Resume Tracker.</>}
        sub="Clear answers on our ATS scoring algorithms, privacy policies, and AI bullet optimization."
      />

      <div className="mt-12 space-y-3.5">
        {FAQS.map((faq, i) => {
          const isOpen = openId === faq.id;
          const Icon = faq.icon;
          const answerId = `${faq.id}-answer`;
          const buttonId = `${faq.id}-button`;

          return (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.05 }}
              className={cn(
                "rounded-[22px] border transition-all duration-200 overflow-hidden",
                isOpen
                  ? "bg-[var(--surface)] border-[var(--accent)]/40 shadow-hover"
                  : "bg-[var(--surface)]/80 hover:bg-[var(--surface)] border-[var(--border)] shadow-card"
              )}
            >
              <button
                id={buttonId}
                type="button"
                onClick={() => toggle(faq.id)}
                aria-expanded={isOpen}
                aria-controls={answerId}
                className="w-full text-left p-5 sm:p-6 flex items-start gap-4 justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[22px]"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isOpen
                        ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-strong)] mb-1">
                      {faq.tag}
                    </span>
                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-[var(--ink)] leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                </div>

                <div
                  className={cn(
                    "h-8 w-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0 text-[var(--ink-muted)] transition-transform duration-200",
                    isOpen && "rotate-180 text-[var(--ink)] bg-[var(--accent-soft)]"
                  )}
                  aria-hidden="true"
                >
                  <ChevronDown size={15} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={answerId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-[14px] text-[var(--ink-muted)] leading-relaxed border-t border-[var(--border)]/60 ml-12 sm:ml-13 mr-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// Export as TestimonialsSection for seamless backwards compatibility
export { FAQSection as TestimonialsSection };
