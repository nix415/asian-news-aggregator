import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useArticles } from "./hooks/useArticles";
import Landing from "./pages/Landing";
import Category from "./pages/Category";

export default function App() {
  const { articles, loading, archiveMode, toggleArchive, refresh } =
    useArticles();

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
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
