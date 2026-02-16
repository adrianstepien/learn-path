import { motion } from 'framer-motion';
import {
  ChevronRight,
  Map,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Category, Roadmap } from '@/types/learning';

interface EditorRoadmapGridProps {
  category: Category;
  onSelectRoadmap: (roadmapId: string) => void;
  onEditRoadmap: (roadmap: Roadmap) => void;
  onDeleteRoadmap: (roadmapId: string) => void;
  onAddRoadmap: () => void;
}

export const EditorRoadmapGrid = ({
  category,
  onSelectRoadmap,
  onEditRoadmap,
  onDeleteRoadmap,
  onAddRoadmap,
}: EditorRoadmapGridProps) => {
  return (
    <motion.div
      key="roadmaps"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {category.roadmaps.map((roadmap, index) => (
        <motion.div
          key={roadmap.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4 }}
          className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
        >
          {/* Header - clickable */}
          <div
            onClick={() => onSelectRoadmap(roadmap.id)}
            className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
          >
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Map className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div className="flex items-center gap-1">
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </div>
            <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">
              {roadmap.title}
            </h3>
            {roadmap.description && (
              <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">
                {roadmap.description}
              </p>
            )}
          </div>
          <div className="border-t border-border/50 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-b from-secondary/30 to-secondary/10">
            <div className="flex gap-2">
              <Button
                className="flex-1 h-9 flex items-center justify-center gap-2"
                size="sm"
                onClick={() => onEditRoadmap(roadmap)}
              >
                <Pencil className="h-4 w-4" />
                Edytuj
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-9 flex items-center justify-center gap-2"
                size="sm"
                onClick={() => onDeleteRoadmap(roadmap.id)}
              >
                <Trash2 className="h-4 w-4" />
                Usuń
              </Button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Add roadmap button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: category.roadmaps.length * 0.05 }}
        whileHover={{ scale: 1.02 }}
        className="rounded-2xl border-2 border-dashed border-border p-6 md:p-8 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
        onClick={onAddRoadmap}
      >
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-secondary/50 flex items-center justify-center">
          <Plus className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <span className="font-medium text-sm md:text-base">Dodaj roadmapę</span>
      </motion.button>
    </motion.div>
  );
};

