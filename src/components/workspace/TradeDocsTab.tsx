import React from 'react';
import { FileText, Receipt, ScrollText, Package, AlertCircle, Edit, Download, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TradeDocument {
  id: string;
  type: 'pi' | 'contract' | 'ci' | 'pl';
  name: string;
  status: 'empty' | 'draft' | 'edited' | 'final';
  missingFields?: string[];
  version?: number;
  lastUpdated?: string;
}

interface TradeDocsTabProps {
  onNavigate?: (tab: string, docId?: string) => void;
  onCreateDraft?: (docType: string) => void;
  onExport?: (docId: string, format: 'pdf' | 'docx') => void;
}

const tradeDocuments: TradeDocument[] = [
  { 
    id: '1', 
    type: 'pi', 
    name: 'Proforma Invoice', 
    status: 'draft',
    missingFields: ['수량', '단가'],
    version: 2,
    lastUpdated: '2024-01-15'
  },
  { 
    id: '2', 
    type: 'contract', 
    name: 'Sales Contract', 
    status: 'empty'
  },
  { 
    id: '3', 
    type: 'ci', 
    name: 'Commercial Invoice 초안', 
    status: 'draft',
    version: 1,
    lastUpdated: '2024-01-14'
  },
  { 
    id: '4', 
    type: 'pl', 
    name: 'Packing List 초안', 
    status: 'empty'
  },
];

const docTypeConfig = {
  pi: { label: 'PI', icon: Receipt, color: 'text-blue-500' },
  contract: { label: 'Contract', icon: ScrollText, color: 'text-purple-500' },
  ci: { label: 'CI', icon: FileText, color: 'text-green-500' },
  pl: { label: 'PL', icon: Package, color: 'text-orange-500' },
};

export function TradeDocsTab({ onNavigate, onCreateDraft, onExport }: TradeDocsTabProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      empty: 'bg-muted text-muted-foreground',
      draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      edited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      final: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    const labels = { empty: '미생성', draft: '초안', edited: '편집됨', final: '최종' };
    return (
      <Badge className={cn("text-[10px] h-5 px-1.5", styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold">거래 서류</h3>
        
        <div className="grid gap-3">
          {tradeDocuments.map((doc) => {
            const config = docTypeConfig[doc.type];
            const Icon = config.icon;
            
            return (
              <Card 
                key={doc.id}
                className={cn(
                  "transition-all hover:shadow-md",
                  doc.status === 'empty' && "opacity-70"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-lg bg-muted", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {config.label}
                        </Badge>
                        <h4 className="text-sm font-medium truncate">{doc.name}</h4>
                      </div>
                      
                      {doc.version && (
                        <p className="text-xs text-muted-foreground mb-2">
                          v{doc.version} • {doc.lastUpdated}
                        </p>
                      )}
                      
                      {/* Missing Fields */}
                      {doc.missingFields && doc.missingFields.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            필수 입력: {doc.missingFields.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1.5">
                      {doc.status === 'empty' ? (
                        <Button 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => onCreateDraft?.(doc.type)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          초안
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => onNavigate?.('studio', doc.id)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            편집
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => onExport?.(doc.id, 'pdf')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            출력
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Quick Tips */}
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              💡 PI 작성 시 수량과 단가를 입력하면 자동으로 CI/PL 초안이 생성됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
