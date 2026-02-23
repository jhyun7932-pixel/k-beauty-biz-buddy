import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, DOC_METADATA } from '@/stores/projectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { projects, setActiveProject, setActiveDocument } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Flatten all documents from all projects
  const allDocuments = projects.flatMap((project) =>
    project.documents.map((doc) => ({
      ...doc,
      projectId: project.id,
      projectName: project.name,
    }))
  );
  
  // Filter documents
  const filteredDocuments = allDocuments.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const handleViewDocument = (doc: typeof allDocuments[0]) => {
    setActiveProject(doc.projectId);
    setActiveDocument(doc.id);
    navigate('/home');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              문서함
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              모든 프로젝트의 문서를 한곳에서 관리하세요.
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="문서 또는 프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="final">최종</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? '검색 결과가 없어요' 
                : '아직 문서가 없어요'
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? '다른 검색어나 필터를 시도해보세요.'
                : '프로젝트에서 문서를 생성하면 여기에 표시됩니다.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => {
              const meta = DOC_METADATA[doc.docKey];
              return (
                <Card key={doc.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-2xl">{meta?.icon || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{doc.title}</span>
                        <Badge variant={doc.status === 'final' ? 'default' : 'secondary'} className="text-xs">
                          {doc.status === 'final' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              최종
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              초안
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>프로젝트: {doc.projectName}</span>
                        <span>•</span>
                        <span>{new Date(doc.updatedAt).toLocaleString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                      {doc.status === 'final' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          다운로드
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {/* Summary Footer */}
      <div className="p-3 border-t border-border bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            총 {filteredDocuments.length}개 문서
            {statusFilter !== 'all' && ` (${statusFilter === 'final' ? '최종' : '초안'})`}
          </span>
          <span>
            최종: {filteredDocuments.filter(d => d.status === 'final').length}개 / 
            초안: {filteredDocuments.filter(d => d.status === 'draft').length}개
          </span>
        </div>
      </div>
    </div>
  );
}
