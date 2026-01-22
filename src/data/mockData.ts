import { Category, Roadmap, Topic, Question, Resource, UserStats } from '@/types/learning';

// Mock user stats
export const mockUserStats: UserStats = {
  totalTopics: 156,
  masteredTopics: 42,
  totalQuestions: 847,
  answeredQuestions: 312,
  masteredQuestions: 189,
  dueForReview: 23,
  streakDays: 7,
  totalTimeMinutes: 2340,
  lastStudyDate: new Date(),
};

// Mock questions for Docker topic
const dockerQuestions: Question[] = [
  {
    id: 'q1',
    topicId: 'topic-docker',
    type: 'open_ended',
    content: 'Wyjaśnij różnicę między obrazem Docker a kontenerem.',
    answer: 'Obraz Docker to szablon tylko do odczytu zawierający instrukcje tworzenia kontenera. Kontener to uruchomiona instancja obrazu - izolowane środowisko z własnym systemem plików, siecią i procesami.',
    difficulty: 'beginner',
    importance: 'critical',
    tags: ['docker', 'basics', 'containers'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  },
  {
    id: 'q2',
    topicId: 'topic-docker',
    type: 'code_write',
    content: 'Napisz komendę Docker, która uruchomi kontener nginx na porcie 8080.',
    answer: 'docker run -d -p 8080:80 nginx',
    hint: 'Użyj flagi -p do mapowania portów',
    difficulty: 'beginner',
    importance: 'high',
    tags: ['docker', 'commands', 'nginx'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  },
  {
    id: 'q3',
    topicId: 'topic-docker',
    type: 'yes_no',
    content: 'Czy kontenery Docker współdzielą kernel systemu operacyjnego hosta?',
    answer: 'tak',
    explanation: 'Kontenery Docker używają tego samego kernela co system host, w przeciwieństwie do maszyn wirtualnych które mają własny kernel.',
    difficulty: 'intermediate',
    importance: 'medium',
    tags: ['docker', 'architecture'],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
  },
];

// Mock resources for Docker topic
const dockerResources: Resource[] = [
  {
    id: 'res1',
    topicId: 'topic-docker',
    type: 'description',
    title: 'Wprowadzenie do Docker',
    content: `# Docker - Podstawy

Docker to platforma do konteneryzacji aplikacji, która pozwala na pakowanie aplikacji wraz z jej zależnościami w przenośne kontenery.

## Kluczowe koncepcje:

- **Obraz (Image)** - szablon tylko do odczytu
- **Kontener** - uruchomiona instancja obrazu
- **Dockerfile** - skrypt do budowania obrazów
- **Registry** - repozytorium obrazów (np. Docker Hub)

## Zalety Docker:
1. Izolacja aplikacji
2. Przenośność między środowiskami
3. Szybkie wdrażanie
4. Efektywne wykorzystanie zasobów`,
    isCompleted: false,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'res2',
    topicId: 'topic-docker',
    type: 'article',
    title: 'Docker Getting Started Guide',
    url: 'https://docs.docker.com/get-started/',
    estimatedMinutes: 30,
    isCompleted: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'res3',
    topicId: 'topic-docker',
    type: 'video',
    title: 'Docker Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
    thumbnail: 'https://img.youtube.com/vi/fqMOX6JJhGo/maxresdefault.jpg',
    estimatedMinutes: 120,
    isCompleted: false,
    createdAt: new Date('2024-01-16'),
  },
];

// Mock topics for Backend roadmap
const backendTopics: Topic[] = [
  {
    id: 'topic-docker',
    roadmapId: 'roadmap-backend',
    title: 'Docker',
    description: 'Konteneryzacja aplikacji i zarządzanie środowiskami',
    position: { x: 400, y: 200 },
    status: 'in_progress',
    questions: dockerQuestions,
    resources: dockerResources,
    childTopicIds: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'topic-git',
    roadmapId: 'roadmap-backend',
    title: 'Git & Version Control',
    description: 'System kontroli wersji i współpraca w zespole',
    position: { x: 200, y: 100 },
    status: 'mastered',
    questions: [],
    resources: [],
    childTopicIds: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'topic-linux',
    roadmapId: 'roadmap-backend',
    title: 'Linux Basics',
    description: 'Podstawy systemu Linux i linia poleceń',
    position: { x: 200, y: 200 },
    status: 'mastered',
    questions: [],
    resources: [],
    childTopicIds: [],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'topic-databases',
    roadmapId: 'roadmap-backend',
    title: 'Databases',
    description: 'SQL, NoSQL i projektowanie baz danych',
    position: { x: 400, y: 300 },
    status: 'not_started',
    questions: [],
    resources: [],
    childTopicIds: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'topic-api',
    roadmapId: 'roadmap-backend',
    title: 'REST API',
    description: 'Projektowanie i implementacja REST API',
    position: { x: 600, y: 200 },
    status: 'due_review',
    questions: [],
    resources: [],
    childTopicIds: [],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'topic-kubernetes',
    roadmapId: 'roadmap-backend',
    title: 'Kubernetes',
    description: 'Orkiestracja kontenerów na dużą skalę',
    position: { x: 600, y: 300 },
    status: 'not_started',
    questions: [],
    resources: [],
    childTopicIds: [],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
];

// Mock roadmaps
const backendRoadmap: Roadmap = {
  id: 'roadmap-backend',
  categoryId: 'cat-it',
  title: 'Backend Developer',
  description: 'Kompletna ścieżka do zostania Backend Developerem',
  topics: backendTopics,
  connections: [
    { id: 'conn1', fromTopicId: 'topic-git', toTopicId: 'topic-docker', type: 'suggested_order' },
    { id: 'conn2', fromTopicId: 'topic-linux', toTopicId: 'topic-docker', type: 'prerequisite' },
    { id: 'conn3', fromTopicId: 'topic-docker', toTopicId: 'topic-kubernetes', type: 'suggested_order' },
    { id: 'conn4', fromTopicId: 'topic-databases', toTopicId: 'topic-api', type: 'prerequisite' },
  ],
  progress: 35,
  totalQuestions: 45,
  masteredQuestions: 16,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-22'),
};

const frontendRoadmap: Roadmap = {
  id: 'roadmap-frontend',
  categoryId: 'cat-it',
  title: 'Frontend Developer',
  description: 'Od HTML do zaawansowanego React',
  topics: [],
  connections: [],
  progress: 62,
  totalQuestions: 78,
  masteredQuestions: 48,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-20'),
};

const devopsRoadmap: Roadmap = {
  id: 'roadmap-devops',
  categoryId: 'cat-it',
  title: 'DevOps Engineer',
  description: 'CI/CD, Infrastructure as Code i automatyzacja',
  topics: [],
  connections: [],
  progress: 15,
  totalQuestions: 56,
  masteredQuestions: 8,
  createdAt: new Date('2024-01-05'),
  updatedAt: new Date('2024-01-18'),
};

// Mock categories
export const mockCategories: Category[] = [
  {
    id: 'cat-it',
    name: 'Informatyka',
    description: 'Programowanie, DevOps, architektura systemów',
    icon: '💻',
    color: 'primary',
    roadmaps: [backendRoadmap, frontendRoadmap, devopsRoadmap],
    progress: 37,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'cat-languages',
    name: 'Języki programowania',
    description: 'Java, Python, TypeScript i więcej',
    icon: '🔤',
    color: 'accent',
    roadmaps: [],
    progress: 45,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'cat-system-design',
    name: 'System Design',
    description: 'Projektowanie skalowalnych systemów',
    icon: '🏗️',
    color: 'success',
    roadmaps: [],
    progress: 12,
    createdAt: new Date('2024-01-03'),
  },
  {
    id: 'cat-soft-skills',
    name: 'Soft Skills',
    description: 'Komunikacja, zarządzanie czasem, praca zespołowa',
    icon: '🤝',
    color: 'warning',
    roadmaps: [],
    progress: 28,
    createdAt: new Date('2024-01-04'),
  },
];

export const getRoadmapById = (id: string): Roadmap | undefined => {
  for (const category of mockCategories) {
    const roadmap = category.roadmaps.find(r => r.id === id);
    if (roadmap) return roadmap;
  }
  return undefined;
};

export const getTopicById = (topicId: string): Topic | undefined => {
  for (const category of mockCategories) {
    for (const roadmap of category.roadmaps) {
      const topic = roadmap.topics.find(t => t.id === topicId);
      if (topic) return topic;
    }
  }
  return undefined;
};

export const getCategoryById = (id: string): Category | undefined => {
  return mockCategories.find(c => c.id === id);
};
