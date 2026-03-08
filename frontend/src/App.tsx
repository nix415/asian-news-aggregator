import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useArticles } from "./hooks/useArticles";
import { useBookmarks } from "./hooks/useBookmarks";
import Landing from "./pages/Landing";
import Category from "./pages/Category";
import TopPicks from "./pages/TopPicks";
import Saved from "./pages/Saved";

export default function App() {
  const { articles, loading, archiveMode, toggleArchive, refresh } =
    useArticles();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  return (
    <BrowserRouter>
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
              onToggleBookmark={toggleBookmark}
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
              onToggleBookmark={toggleBookmark}
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
              onToggleBookmark={toggleBookmark}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
