import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, PIPELINE_STAGES, type PipelineStage } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderKanban, Plus, FileText, Calendar, Trash2, Edit, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectStageStepper } from '@/components/projects/ProjectStageStepper';
import { StageAdvanceModal } from '@/components/projects/StageAdvanceModal';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects, activeProjectId, createProject, setActiveProject,
    deleteProject, updateProject, updateProjectStage,
    createDocumentInstance,
  } = useProjectStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // AI trigger modal state
  const [advanceModal, setAdvanceModal] = useState<{ projectId: string; projectName: string } | null>(null);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('프로젝트 이름을 입력해주세요.');
      return;
    }
    const id = createProject(newProjectName.trim());
    setActiveProject(id);
    setShowCreateDialog(false);
    setNewProjectName('');
    toast.success('새 프로젝트가 생성되었습니다.');
    navigate('/home');
  };

  const handleSelectProject = (id: string) => {
    setActiveProject(id);
    navigate('/home');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(id);
    toast.success('프로젝트가 삭제되었습니다.');
  };

  const handleRenameProject = (id: string) => {
    if (!editName.trim()) return;
    updateProject(id, { name: editName.trim() });
    setEditingProject(null);
    setEditName('');
    toast.success('프로젝트 이름이 변경되었습니다.');
  };

  const handleStageAdvance = (projectId: string, projectName: string, currentStage: PipelineStage, nextStage: PipelineStage) => {
    // If advancing from 샘플 검토 -> 본 오더 및 계약, show AI trigger modal
    if (currentStage === '샘플 검토' && nextStage === '본 오더 및 계약') {
      updateProjectStage(projectId, nextStage);
      setAdvanceModal({ projectId, projectName });
    } else {
      updateProjectStage(projectId, nextStage);
      toast.success(`"${projectName}" → ${nextStage}`);
    }
  };

  const handleGenerateDocs = () => {
    if (!advanceModal) return;
    const { projectId } = advanceModal;
    // Generate PI and Sales Contract
    createDocumentInstance(projectId, 'DOC_FINAL_PI');
    createDocumentInstance(projectId, 'DOC_SALES_CONTRACT');
    setAdvanceModal(null);
    setActiveProject(projectId);
    toast.success('PI(견적서) 및 판매 계약서 초안이 생성되었습니다.');
    navigate('/workspace');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              수출 프로젝트
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              프로젝트 파이프라인을 관리하고 진행 상태를 추적하세요.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">아직 프로젝트가 없어요</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              새 프로젝트를 만들어서 바이어에게 보낼 서류를 준비하세요.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              첫 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const stage = project.pipelineStage || '첫 제안 진행';
              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeProjectId === project.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectProject(project.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project.id);
                            setEditName(project.name);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            이름 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Pipeline Stepper */}
                    <div className="mt-2">
                      <ProjectStageStepper
                        currentStage={stage}
                        onAdvance={(next) => handleStageAdvance(project.id, project.name, stage, next)}
                      />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {project.context.tradeStagePreset}
                      </Badge>
                      {project.context.targetCountries.slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                      {project.context.targetCountries.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.context.targetCountries.length - 2}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{project.documents.length}개 문서</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(project.updatedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Stage Advance AI Trigger Modal */}
      {advanceModal && (
        <StageAdvanceModal
          open={!!advanceModal}
          onClose={() => setAdvanceModal(null)}
          onGenerate={handleGenerateDocs}
          projectName={advanceModal.projectName}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 프로젝트 만들기</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="프로젝트 이름 (예: 일본 A사 첫 제안)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>취소</Button>
            <Button onClick={handleCreateProject}>만들기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 이름 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="새 프로젝트 이름"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && editingProject && handleRenameProject(editingProject)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>취소</Button>
            <Button onClick={() => editingProject && handleRenameProject(editingProject)}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
