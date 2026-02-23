import { useCallback, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { toast } from 'sonner';

export interface DocumentVersion {
  versionId: string;
  version: string; // "1.0", "1.1", etc
  fields: Record<string, any>;
  html: string;
  createdAt: Date;
  reason?: string;
}

// In-memory version store (per document)
const versionStore = new Map<string, DocumentVersion[]>();

export function useDocumentVersioning() {
  const { 
    getActiveDocument, 
    updateDocumentFields,
    updateDocumentHtml,
  } = useProjectStore();

  // Save a version snapshot before editing
  const saveVersion = useCallback((docId: string, reason?: string) => {
    const doc = (() => {
      const store = useProjectStore.getState();
      for (const project of store.projects) {
        const found = project.documents.find(d => d.id === docId);
        if (found) return found;
      }
      return null;
    })();
    
    if (!doc) return null;

    const versions = versionStore.get(docId) || [];
    const nextVersion = getNextVersion(versions);
    
    const snapshot: DocumentVersion = {
      versionId: `ver_${Date.now()}`,
      version: nextVersion,
      fields: JSON.parse(JSON.stringify(doc.fields)),
      html: doc.html,
      createdAt: new Date(),
      reason: reason || '자동 저장',
    };

    versions.push(snapshot);
    versionStore.set(docId, versions);

    return snapshot;
  }, []);

  // Get all versions for a document
  const getVersions = useCallback((docId: string): DocumentVersion[] => {
    return versionStore.get(docId) || [];
  }, []);

  // Restore a specific version
  const restoreVersion = useCallback((docId: string, versionId: string) => {
    const versions = versionStore.get(docId) || [];
    const target = versions.find(v => v.versionId === versionId);
    
    if (!target) {
      toast.error('버전을 찾을 수 없습니다');
      return false;
    }

    // Save current state as a new version before restoring
    saveVersion(docId, `v${target.version} 복원 전 자동 백업`);

    // Restore fields and HTML
    updateDocumentFields(docId, target.fields);
    updateDocumentHtml(docId, target.html);

    toast.success(`v${target.version}으로 복원되었습니다`);
    return true;
  }, [saveVersion, updateDocumentFields, updateDocumentHtml]);

  // Update fields with auto-versioning
  const updateWithVersion = useCallback((docId: string, fields: Record<string, any>, reason?: string) => {
    // Auto-save current version before changes
    saveVersion(docId, reason || '필드 수정 전');
    
    // Apply the update
    updateDocumentFields(docId, fields);
  }, [saveVersion, updateDocumentFields]);

  return {
    saveVersion,
    getVersions,
    restoreVersion,
    updateWithVersion,
  };
}

function getNextVersion(versions: DocumentVersion[]): string {
  if (versions.length === 0) return '1.0';
  
  const lastVersion = versions[versions.length - 1].version;
  const parts = lastVersion.split('.');
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  
  return `${major}.${minor + 1}`;
}
