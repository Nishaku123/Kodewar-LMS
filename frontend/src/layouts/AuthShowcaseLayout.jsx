import { Link } from "react-router-dom";
import { Award, BarChart3, BookOpen, Layers, Users } from "lucide-react";
import LaptopShowcase from "../components/auth/LaptopShowcase.jsx";

const HIGHLIGHTS = [
  {
    icon: Layers,
    title: "Learn",
    description: "Structured, hands-on modules",
    iconStyle:
      "border-white/30 bg-gradient-to-br from-[#248cff] to-[#075ed2] text-white shadow-[0_8px_22px_rgba(13,102,220,0.25)]",
  },
  {
    icon: BarChart3,
    title: "Practice",
    description: "Assessments with real feedback",
    iconStyle:
      "border-white/30 bg-gradient-to-br from-[#20b9ed] to-[#0876ce] text-white shadow-[0_8px_22px_rgba(14,145,220,0.24)]",
  },
  {
    icon: Award,
    title: "Certify",
    description: "Earn verified certifications",
    iconStyle:
      "border-white/30 bg-gradient-to-br from-[#19c58a] to-[#058653] text-white shadow-[0_8px_22px_rgba(5,150,105,0.22)]",
  },
];

const STATS = [
  { icon: Users, value: "10K+", label: "Learners" },
  { icon: BookOpen, value: "500+", label: "Courses" },
  { icon: Award, value: "100+", label: "Certifications" },
];

/**
 * Full-screen authentication showcase matching the Kodewar visual identity:
 * brand story with the laptop illustration on the left, glowing form card on
 * the right. Auth pages supply the card body as children.
 */
export default function AuthShowcaseLayout({
  children,
  footer,
  footerMobileOnly = false,
}) {
  return (
    <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-x-clip px-4 py-6 sm:px-6 lg:px-14">
      <div className="relative z-10 grid w-full max-w-[1240px] items-center gap-8 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] xl:gap-14">
        {/* Brand story */}
        <section className="relative hidden pb-10 xl:block">
          <Link
            to="/"
            aria-label="Kodewar LMS home"
            className="inline-flex w-fit items-center gap-4 xl:-translate-x-8 2xl:-translate-x-16"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#071d3c] ring-1 ring-[#ffc21b]/70 shadow-[0_0_30px_rgba(27,113,216,0.28)]">
              <img
                src="/kodewar-mark.png"
                alt=""
                className="h-9 w-9 object-contain"
              />
            </span>
            <span className="h-11 w-px bg-[#0b1c3a]/20" aria-hidden="true" />
            <span>
              <span className="block font-display text-[20px] font-semibold leading-none tracking-[0.22em] text-[#0b1c3a]">
                KODEWAR
              </span>
              <span className="mt-2 block text-[9.5px] font-medium uppercase tracking-[0.26em] text-[#566a88]">
                Learning Platform
              </span>
            </span>
          </Link>

          <div className="relative mt-10">
            {/* Copy sits above the illustration and overlaps it slightly */}
            <div className="relative z-20 w-[60%] max-w-[380px] xl:-translate-x-8 2xl:-translate-x-16">
              <h1 className="w-[430px] max-w-[430px] font-display text-[40px] font-bold leading-[1.05] tracking-tight text-[#0b1c3a] xl:text-[44px]">
                Structured Learning,
                <br />
                Verified{" "}
                <span className="text-brand-gradient relative">Progress.</span>
              </h1>

              {/* Underline swoosh beneath "Progress." */}
              <svg
                className="ml-[152px] mt-1.5 h-3.5 w-[196px] text-[#ffbe16]"
                viewBox="0 0 196 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 10C54 4 124 2.6 193 6.2"
                  stroke="currentColor"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
                <path
                  d="M19 13C72 9 132 8 178 9.6"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>

              <p className="mt-4 max-w-[320px] text-[15px] leading-[1.7] text-[#253b5b]">
                A modern LMS for courses, assessments, and certifications —
                built to help you learn, practice, and grow.
              </p>

              <ul className="mt-6 max-w-[330px] space-y-4">
                {HIGHLIGHTS.map(
                  ({ icon: Icon, title, description, iconStyle }) => (
                    <li key={title} className="flex items-center gap-3.5">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyle}`}
                      >
                        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[15px] font-semibold text-[#102344]">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-[#1b2b45]">
                          {description}
                        </span>
                      </span>
                    </li>
                  )
                )}
              </ul>

              <div className="-ml-3 mt-15 flex w-[350px] max-w-[calc(100vw-48px)] items-center text-[#06172e]">
                {STATS.map(({ icon: Icon, value, label }, index) => (
                  <div key={label} className="flex flex-1 items-center">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={22}
                        strokeWidth={2}
                        className="shrink-0 text-[#064e9f]"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block text-[16px] font-bold leading-tight">
                          {value}
                        </span>
                        <span className="block whitespace-nowrap text-[11px] leading-tight text-[#14253f]">
                          {label}
                        </span>
                      </span>
                    </div>
                    {index < STATS.length - 1 ? (
                      <span
                        className="mx-3 h-7 w-px shrink-0 bg-[#8196b1]/55"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Laptop anchored beside the copy, resting on the rock */}
            <div className="pointer-events-none absolute -bottom-[40px] -right-[30%] z-10 w-[96%] max-w-[560px] xl:w-[96%] xl:max-w-[620px]">
              <LaptopShowcase />
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="flex w-full flex-col items-center justify-center xl:translate-x-16 xl:-translate-y-4 2xl:translate-x-30">
          <div className="auth-card w-full max-w-[400px] rounded-[28px] px-6 py-7 sm:px-8">
            {/* Blue corner accent */}
            <div
              className="pointer-events-none absolute -right-px -top-px z-0 h-32 w-32 overflow-hidden rounded-tr-[28px]"
              aria-hidden="true"
            >
              <div className="absolute -right-6 -top-8 h-36 w-36 rotate-[14deg] rounded-[46%] rounded-bl-[58%] bg-[radial-gradient(circle_at_32%_32%,rgba(52,176,255,0.58),rgba(11,99,196,0.24)_58%,transparent_78%)] blur-[2px]" />
              <span className="absolute right-8 top-6 h-1 w-1 rounded-full bg-white/70" />
              <span className="absolute right-14 top-10 h-[3px] w-[3px] rounded-full bg-white/35" />
            </div>

            <div className="relative z-10">{children}</div>
          </div>

          {footer ? (
            <div
              className={`mt-5 text-center text-[11px] text-[#536783] ${
                footerMobileOnly ? "lg:hidden" : ""
              }`}
            >
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
