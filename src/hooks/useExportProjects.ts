import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProjectStage = "proposal" | "sample" | "order" | "shipping" | "done";

export interface ExportProject {
  id: string;
  project_name: string;
  buyer_id?: string;
  buyer_name?: string;
  stage: ProjectStage;
  total_amount?: number;
  currency: string;
  products: any[];
  documents: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useExportProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ExportProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("export_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) setProjects(data as ExportProject[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createProject = async (input: Partial<ExportProject>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("export_projects")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      setProjects(p => [data as ExportProject, ...p]);
      return data as ExportProject;
    }
    return null;
  };

  const updateStage = async (id: string, stage: ProjectStage) => {
    const { error } = await supabase
      .from("export_projects")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) setProjects(p => p.map(pr => pr.id === id ? { ...pr, stage } : pr));
  };

  const updateProject = async (id: string, updates: Partial<ExportProject>) => {
    const { error } = await supabase
      .from("export_projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) setProjects(p => p.map(pr => pr.id === id ? { ...pr, ...updates } : pr));
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from("export_projects")
      .delete()
      .eq("id", id);
    if (!error) setProjects(p => p.filter(pr => pr.id !== id));
  };

  const byStage = (stage: ProjectStage) =>
    projects.filter(p => p.stage === stage);

  return { projects, loading, load, createProject, updateStage, updateProject, deleteProject, byStage };
}
