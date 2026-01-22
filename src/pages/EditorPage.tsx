import { motion } from 'framer-motion';
import { 
  Plus, 
  Folder, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { mockCategories } from '@/data/mockData';

const EditorPage = () => {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Edytor roadmap</h1>
          <p className="mt-2 text-muted-foreground">
            Twórz i zarządzaj swoimi roadmapami i pytaniami
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <button className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Nowa kategoria</p>
              <p className="text-sm text-muted-foreground">Utwórz grupę tematyczną</p>
            </div>
          </button>
          
          <button className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-6 transition-all hover:border-accent hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Folder className="h-6 w-6 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Nowa roadmapa</p>
              <p className="text-sm text-muted-foreground">Zaprojektuj ścieżkę nauki</p>
            </div>
          </button>

          <button className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-6 transition-all hover:border-success hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <FileText className="h-6 w-6 text-success" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Nowe pytanie</p>
              <p className="text-sm text-muted-foreground">Dodaj materiał do nauki</p>
            </div>
          </button>
        </motion.div>

        {/* Categories List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card shadow-md"
        >
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Twoje kategorie</h2>
          </div>
          <div className="divide-y divide-border">
            {mockCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.roadmaps.length} roadmap • {category.roadmaps.reduce((acc, r) => acc + r.totalQuestions, 0)} pytań
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    Edytuj
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl gradient-primary p-6 text-primary-foreground"
        >
          <h3 className="text-lg font-semibold mb-2">💡 Wskazówka</h3>
          <p className="text-primary-foreground/80">
            Edytor roadmap pozwala na tworzenie wizualnych ścieżek nauki podobnych do roadmap.sh. 
            Możesz przeciągać i łączyć tematy, definiować zależności oraz dodawać różnorodne typy pytań.
          </p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default EditorPage;
