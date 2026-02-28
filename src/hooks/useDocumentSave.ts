import { supabase } from "@/integrations/supabase/client";

export interface SavedDocument {
  id: string;
  doc_type: "PI" | "CI" | "PL" | "NDA" | "SALES_CONTRACT" | "PROPOSAL" | "EMAIL";
  doc_number: string;
  created_at: string;
  data: any;
}

export async function saveDocumentToProject(
  projectId: string,
  document: SavedDocument
): Promise<boolean> {
  const { data: project } = await supabase
    .from("export_projects")
    .select("documents")
    .eq("id", projectId)
    .single();

  const currentDocs = (project?.documents as SavedDocument[]) || [];

  // 같은 doc_type이 있으면 교체, 없으면 추가
  const updatedDocs = currentDocs.filter(d => d.doc_type !== document.doc_type);
  updatedDocs.push(document);

  const { error } = await supabase
    .from("export_projects")
    .update({
      documents: updatedDocs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  return !error;
}
