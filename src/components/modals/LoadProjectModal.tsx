import React from 'react';
import { FolderOpen, Trash2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Project, COUNTRY_NAMES, TargetCountry } from '@/stores/projectStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface LoadProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  projects: Project[];
}

export function LoadProjectModal({ 
  open, 
  onClose, 
  onSelect,
  onDelete,
  projects 
}: LoadProjectModalProps) {
  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(projectId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            지난 프로젝트 불러오기
          </DialogTitle>
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">저장된 프로젝트가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              새 프로젝트를 시작하면 여기에 저장됩니다.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-2">
              {projects
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      "border-border hover:border-primary/50 hover:bg-muted/50",
                      "group"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {project.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {project.context.targetCountries.slice(0, 3).map((country) => (
                            <Badge key={country} variant="secondary" className="text-xs">
                              {COUNTRY_NAMES[country as TargetCountry] || country}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            {project.context.tradeStagePreset}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(project.updatedAt), 'yyyy.MM.dd', { locale: ko })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            문서 {project.documents.length}개
                          </span>
                        </div>
                      </div>
                      
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
