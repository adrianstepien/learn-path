import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorCanvasService } from '@/pages/editor/hooks/editorCanvasService';
import { EditorCanvasLayout } from '@/pages/editor/components/EditorCanvasLayout';
import { Loader2 } from 'lucide-react';

const EditorTopicPage = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const ui = useEditorStore();
  const canvas = useEditorCanvasService(roadmapId);

  useEffect(() => {
    if (roadmapId && ui.selectedRoadmapId !== roadmapId) {
      ui.setSelectedRoadmapId(roadmapId);
    }
  }, [roadmapId, ui.selectedRoadmapId]);

  const selectedRoadmap = canvas.selectedRoadmap;

  if (canvas.isLoading && !selectedRoadmap) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!selectedRoadmap) return null;

  return (
    <MainLayout>
      <EditorCanvasLayout
        canvas={canvas}
        onBack={() => navigate(`/editor/roadmap/${selectedRoadmap.categoryId}`)}
      />
    </MainLayout>
  );
};

export default EditorTopicPage;