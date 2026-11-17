/**
 * Kodewar brand lockup used in headers and authentication screens.
 * The image lives in frontend/public so Vite serves it at /kodewar-mark.png.
 */
export default function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700/80 bg-ink-900 shadow-inner shadow-black/40">
        <img
          src="/kodewar-mark.png"
          alt=""
          width="32"
          height="32"
          className="h-8 w-8 object-contain"
        />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-[0.14em] text-white">
          KODEWAR
        </span>
        <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.34em] text-mist-500">
          LMS
        </span>
      </span>
    </div>
  );
}
