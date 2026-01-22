import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { mockCategories } from '@/data/mockData';
import { Category } from '@/types/learning';

const CategoryCard = ({ category, delay }: { category: Category; delay: number }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate(`/learn/category/${category.id}`)}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/30"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-4xl">{category.icon}</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{category.name}</h3>
      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{category.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {category.roadmaps.length} roadmap{category.roadmaps.length !== 1 ? 'y' : 'a'}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-secondary">
            <div 
              className="h-2 rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${category.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{category.progress}%</span>
        </div>
      </div>
    </motion.div>
  );
};

const LearnPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = mockCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Nauka</h1>
          <p className="mt-2 text-muted-foreground">
            Wybierz kategorię, aby rozpocząć naukę
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj kategorii lub roadmapy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} delay={0.1 + index * 0.05} />
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Nie znaleziono kategorii</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default LearnPage;
