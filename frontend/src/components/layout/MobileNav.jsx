import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SidebarContent } from "./Sidebar.jsx";

/**
 * Slide-in navigation for phones and tablets.
 * The desktop sidebar is hidden below the `lg` breakpoint.
 */
export default function MobileNav({ open, onClose, navItems }) {
  const closeButtonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close navigation menu"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-slide-in absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-ink-800 bg-ink-950 shadow-2xl shadow-black/50"
      >
        <SidebarContent
          navItems={navItems}
          onNavigate={onClose}
          showClose
          onClose={onClose}
          closeButtonRef={closeButtonRef}
        />
      </div>
    </div>,
    document.body
  );
}
