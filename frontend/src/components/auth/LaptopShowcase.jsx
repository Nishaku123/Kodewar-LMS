export default function LaptopShowcase() {
  return (
    <div
      className="relative aspect-[3/2] w-full select-none"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[5%] z-0 h-[24%] rounded-full bg-[radial-gradient(ellipse,rgba(255,190,26,0.34),transparent_72%)] blur-xl" />

      <img
        src="/login-laptop-rock.png"
        alt=""
        className="absolute inset-0 z-10 h-full w-full origin-bottom scale-y-[1.12] object-contain mix-blend-screen drop-shadow-[0_14px_26px_rgba(0,0,0,0.4)]"
      />
    </div>
  );
}
