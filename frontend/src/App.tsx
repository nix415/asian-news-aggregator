import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useCallback, lazy, Suspense } from "react";
import { useArticles } from "./hooks/useArticles";
import { useBookmarks } from "./hooks/useBookmarks";
import { useDarkMode } from "./hooks/useDarkMode";
import { ToastProvider, useToast } from "./components/Toast";
import ScrollToTop from "./components/ScrollToTop";
import MobileNav from "./components/MobileNav";
import DesktopNav from "./components/DesktopNav";

const Landing = lazy(() => import("./pages/Landing"));
const Category = lazy(() => import("./pages/Category"));
const TopPicks = lazy(() => import("./pages/TopPicks"));
const Saved = lazy(() => import("./pages/Saved"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-8 h-8 border-2 border-[var(--color-line)] border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { articles, loading, archiveMode, toggleArchive } = useArticles();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { showToast } = useToast();

  const handleToggleBookmark = useCallback(
    (link: string) => {
      const wasSaved = isBookmarked(link);
      toggleBookmark(link);
      showToast(wasSaved ? "Removed from saved" : "Saved for later");
    },
    [isBookmarked, toggleBookmark, showToast],
  );

  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!isLanding && <DesktopNav dark={dark} onToggleDark={toggleDark} />}
      <main id="main-content" className={isLanding ? "" : "pt-0 sm:pt-12"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <Landing
                  articles={articles}
                  loading={loading}
                  dark={dark}
                  onToggleDark={toggleDark}
                />
              }
            />
            <Route
              path="/category/:name"
              element={
                <Category
                  articles={articles}
                  loading={loading}
                  archiveMode={archiveMode}
                  onToggleArchive={toggleArchive}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={handleToggleBookmark}
                  dark={dark}
                  onToggleDark={toggleDark}
                />
              }
            />
            <Route
              path="/top-picks"
              element={
                <TopPicks
                  articles={articles}
                  loading={loading}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
            <Route
              path="/saved"
              element={
                <Saved
                  articles={articles}
                  loading={loading}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
          </Routes>
        </Suspense>
      </main>
      {!isLanding && <MobileNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
        <ScrollToTop />
      </ToastProvider>
    </BrowserRouter>
  );
}
