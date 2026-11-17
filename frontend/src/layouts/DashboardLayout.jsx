import { useCallback, useState } from "react";
import Sidebar from "../components/layout/Sidebar.jsx";
import MobileNav from "../components/layout/MobileNav.jsx";
import Topbar from "../components/layout/Topbar.jsx";

/**
 * The app shell for all signed-in panels.
 * Wraps the student, staff and account pages with navigation.
 */
export default function DashboardLayout({
  title,
  subtitle,
  navItems = [],
  children,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="min-h-screen overflow-x-clip bg-ink-950">
      <Sidebar navItems={navItems} />

      <MobileNav
        open={mobileNavOpen}
        onClose={closeMobileNav}
        navItems={navItems}
      />

      <div className="lg:pl-[264px]">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
