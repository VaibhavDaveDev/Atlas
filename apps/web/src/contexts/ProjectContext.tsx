'use client';

import React, { createContext, useContext, useState } from 'react';

interface ProjectContextType {
  isCreateTaskModalOpen: boolean;
  setCreateTaskModalOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <ProjectContext.Provider value={{ 
      isCreateTaskModalOpen, 
      setCreateTaskModalOpen,
      refreshTrigger,
      triggerRefresh
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
