import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useArticles } from "./hooks/useArticles";
import { useBookmarks } from "./hooks/useBookmarks";
import { ToastProvider, useToast } from "./components/Toast";
import Landing from "./pages/Landing";
import Category from "./pages/Category";
import TopPicks from "./pages/TopPicks";
import Saved from "./pages/Saved";
import ScrollToTop from "./components/ScrollToTop";
import { useCallback } from "react";

function AppRoutes() {
  const { articles, loading, archiveMode, toggleArchive, refresh } =
    useArticles();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { showToast } = useToast();

  const handleToggleBookmark = useCallback(
    (link: string) => {
      const wasSaved = isBookmarked(link);
      toggleBookmark(link);
      showToast(wasSaved ? "Removed from saved" : "Saved for later");
    },
    [isBookmarked, toggleBookmark, showToast],
  );

  return (
    <Routes>
      <Route
        path="/"
        element={<Landing articles={articles} loading={loading} />}
      />
      <Route
        path="/category/:name"
        element={
          <Category
            articles={articles}
            loading={loading}
            archiveMode={archiveMode}
            onToggleArchive={toggleArchive}
            onRefresh={refresh}
            isBookmarked={isBookmarked}
            onToggleBookmark={handleToggleBookmark}
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
