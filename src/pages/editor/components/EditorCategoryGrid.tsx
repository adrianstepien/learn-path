import { motion } from 'framer-motion';
import {
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category } from '@/types/learning';

interface EditorCategoryGridProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddCategory: () => void;
  getTotalTopics: (category: Category) => number;
}

export const EditorCategoryGrid = ({
  categories,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  getTotalTopics,
}: EditorCategoryGridProps) => {
  return (
    <>
      <motion.div
        key="categories"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
          >
            {/* Header - clickable */}
            <div
              onClick={() => onSelectCategory(category.id)}
              className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
            >
              <div className="mb-3 md:mb-4 flex items-center justify-between">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl">{category.icon}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => onEditCategory(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteCategory(category.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">
                {category.name}
              </h3>
              {category.description && (
                <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {category.roadmaps.length} roadmap
                  {category.roadmaps.length !== 1 ? 'y' : 'a'} •{' '}
                  {getTotalTopics(category)} tematów
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 md:w-20 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-2 rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${category.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {category.progress}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add category button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categories.length * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border-2 border-dashed border-border p-6 md:p-8 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
          onClick={onAddCategory}
        >
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-secondary/50 flex items-center justify-center">
            <Plus className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          <span className="font-medium text-sm md:text-base">
            Dodaj kategorię
          </span>
        </motion.button>
      </motion.div>

      {categories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">Nie znaleziono kategorii</p>
        </motion.div>
      )}
    </>
  );
};

