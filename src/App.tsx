import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import LearnPage from "./pages/learn/LearnPage";
import CategoryPage from "./pages/CategoryPage";
import RoadmapViewPage from "./pages/RoadmapViewPage";
import StudyPage from "./pages/StudyPage";
import EditorPage from "./pages/editor/EditorPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import ImportPage from "./pages/ImportPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/category/:categoryId" element={<CategoryPage />} />
            <Route path="/learn/roadmap/:roadmapId" element={<RoadmapViewPage />} />
            <Route path="/learn/study/:topicId?" element={<StudyPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
