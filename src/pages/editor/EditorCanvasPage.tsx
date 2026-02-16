import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { EditorCanvasLayout } from '@/pages/editor/components/EditorCanvasLayout';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorCanvasService } from '@/pages/editor/hooks/editorCanvasService';

const EditorCanvasPage = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const store = useEditorStore();
  const canvas = useEditorCanvasService(store);

  // Synchronizacja URL ze stanem w store
  useEffect(() => {
    if (roadmapId) {
      store.selectRoadmap(roadmapId);
    }

    // Cleanup przy wyjściu z komponentu
    return () => {
      store.selectRoadmap(null);
    };
  }, [roadmapId]); // Uruchom ponownie, jeśli zmieni się ID w URL

  // Jeśli dane się ładują lub nie ma wybranej mapy, można pokazać loading
  if (store.state.isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          Loading...
        </div>
      </MainLayout>
    );
  }

  // Jeśli mapa nie została znaleziona (a ładowanie zakończone)
  if (!store.state.selectedRoadmapId && !store.state.isLoading) {
     // Opcjonalnie przekieruj z powrotem do listy
     // navigate('/editor');
     return null;
  }

  return (
    <MainLayout>
      <EditorCanvasLayout
        canvas={canvas}
        onBack={() => navigate('/editor')} // Powrót nawiguje do listy, zamiast zmieniać stan
        onStartStudy={() =>
          navigate(`/learn/study?roadmap=${roadmapId}`)
        }
      />
    </MainLayout>
  );
};

export default EditorCanvasPage;