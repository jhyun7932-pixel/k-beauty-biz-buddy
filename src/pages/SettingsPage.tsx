import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface CompanyForm {
  company_name: string; address: string; tel: string; email: string;
  contact_name: string; business_no: string; customs_code: string; ceo_name: string;
  bank_name: string; account_no: string; swift_code: string;
  logo_url: string; seal_url: string;
}

const EMPTY: CompanyForm = {
  company_name: "", address: "", tel: "", email: "",
  contact_name: "", business_no: "", customs_code: "", ceo_name: "",
  bank_name: "", account_no: "", swift_code: "",
  logo_url: "", seal_url: "",
};

const STORAGE_BUCKET = "company-assets";

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const { data: co } = await supabase.from("companies").select("*").eq("user_id", user!.id).maybeSingle();
      if (co) {
        setForm({
          company_name: co.company_name || "", address: co.address || "", tel: co.tel || "",
          email: co.email || "", contact_name: co.contact_name || "", business_no: co.business_no || "",
          customs_code: (co as any).customs_code || "", ceo_name: (co as any).ceo_name || "",
          bank_name: (co.bank_info as any)?.bank_name || "", account_no: (co.bank_info as any)?.account_no || "",
          swift_code: (co.bank_info as any)?.swift_code || "",
          logo_url: (co as any).logo_url || "", seal_url: (co as any).seal_url || "",
        });
      } else {
        const { data: pr } = await supabase.from("profiles").select("company_info,email").eq("id", user!.id).maybeSingle();
        if (pr?.company_info) {
          const ci = pr.company_info as any;
          setForm({
            company_name: ci.company_name || "", address: ci.address || "",
            tel: ci.tel || ci.phone || "", email: ci.email || pr.email || "",
            contact_name: ci.contact_person || "", business_no: ci.business_no || "",
            customs_code: ci.customs_code || "", ceo_name: ci.ceo_name || "",
            bank_name: ci.bank_name || "", account_no: ci.account_no || "", swift_code: ci.swift_code || "",
            logo_url: ci.logo_url || "", seal_url: ci.seal_url || "",
          });
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function uploadImage(file: File, folder: "logo" | "seal"): Promise<string | null> {
    if (!user) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${folder}_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
    if (uploadErr) { toast.error(`업로드 실패: ${uploadErr.message}`); return null; }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleImageUpload(file: File, field: "logo_url" | "seal_url") {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하 이미지만 업로드 가능합니다."); return; }

    const setter = field === "logo_url" ? setUploadingLogo : setUploadingSeal;
    setter(true);
    try {
      const url = await uploadImage(file, field === "logo_url" ? "logo" : "seal");
      if (url) {
        setForm(p => ({ ...p, [field]: url }));
        toast.success(field === "logo_url" ? "로고가 업로드되었습니다." : "직인이 업로드되었습니다.");
      }
    } finally { setter(false); }
  }

  async function save() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { error: e } = await supabase.from("companies").upsert({
        user_id: user.id, company_name: form.company_name, address: form.address, tel: form.tel,
        email: form.email, contact_name: form.contact_name, business_no: form.business_no,
        customs_code: form.customs_code, ceo_name: form.ceo_name,
        logo_url: form.logo_url, seal_url: form.seal_url,
        bank_info: { bank_name: form.bank_name, account_no: form.account_no, swift_code: form.swift_code },
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      if (e) throw e;
      await supabase.from("profiles").update({
        company_info: {
          company_name: form.company_name, address: form.address, tel: form.tel, email: form.email,
          contact_person: form.contact_name, business_no: form.business_no,
          customs_code: form.customs_code, ceo_name: form.ceo_name,
          bank_name: form.bank_name, account_no: form.account_no, swift_code: form.swift_code,
          logo_url: form.logo_url, seal_url: form.seal_url,
        },
        updated_at: new Date().toISOString(),
      } as any).eq("id", user.id);
      setSavedAt(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : "저장 실패"); } finally { setSaving(false); }
  }

  const f = (k: keyof CompanyForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">회사 정보를 불러오는 중...</div>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 pb-20 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회사 정보 설정</h1>
          <p className="text-sm text-gray-500 mt-1">PI, CI, PL 등 모든 무역 서류에 자동 반영됩니다.</p>
        </div>

        {/* 텍스트 필드 섹션들 */}
        {[
          { title: "기본 정보", fields: [
            { label: "회사명 (영문)", key: "company_name", ph: "KBEAUTY LABS CO., LTD.", req: true },
            { label: "영문 대표자명", key: "ceo_name", ph: "KIM, Jinhyun" },
            { label: "사업자등록번호", key: "business_no", ph: "123-45-67890" },
            { label: "수출자 관세부호", key: "customs_code", ph: "12345678" },
            { label: "주소 (영문)", key: "address", ph: "123 Beauty Street, Gangnam-gu, Seoul, Republic of Korea" },
          ]},
          { title: "연락처", fields: [
            { label: "담당자명", key: "contact_name", ph: "Kim, Minjun" },
            { label: "이메일", key: "email", ph: "export@kbeautylabs.com" },
            { label: "전화번호", key: "tel", ph: "+82-2-1234-5678" },
          ]},
          { title: "은행 정보", fields: [
            { label: "은행명 (영문)", key: "bank_name", ph: "Kookmin Bank" },
            { label: "계좌번호", key: "account_no", ph: "123-456-789012" },
            { label: "SWIFT Code", key: "swift_code", ph: "CZNBKRSEXXX" },
          ]},
        ].map(section => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">{section.title}</h2>
            {section.fields.map((fd: any) => (
              <div key={fd.key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {fd.label}{fd.req && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={(form as any)[fd.key]}
                  onChange={e => f(fd.key as keyof CompanyForm, e.target.value)}
                  placeholder={fd.ph}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            ))}
          </div>
        ))}

        {/* 로고 & 직인 업로드 섹션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            회사 로고 & 직인
          </h2>
          <p className="text-xs text-gray-400">PI, CI 등 무역 서류에 삽입됩니다. PNG/JPG, 5MB 이하 권장.</p>

          {/* 로고 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">로고 이미지</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "logo_url"); if (logoInputRef.current) logoInputRef.current.value = ""; }}
            />
            {form.logo_url ? (
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                  <img src={form.logo_url} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, logo_url: "" }))}
                    className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500 mx-auto" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">클릭하여 로고 이미지 업로드</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 5MB)</p>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 직인 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">직인 (Seal) 이미지</label>
            <input
              ref={sealInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "seal_url"); if (sealInputRef.current) sealInputRef.current.value = ""; }}
            />
            {form.seal_url ? (
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                  <img src={form.seal_url} alt="Company Seal" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => sealInputRef.current?.click()}
                    disabled={uploadingSeal}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, seal_url: "" }))}
                    className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => sealInputRef.current?.click()}
                disabled={uploadingSeal}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors"
              >
                {uploadingSeal ? (
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500 mx-auto" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">클릭하여 직인 이미지 업로드</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 5MB)</p>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-4">
          <button
            onClick={save}
            disabled={saving || !form.company_name}
            className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
          {savedAt && <span className="text-sm text-green-600">&#10003; {savedAt.toLocaleTimeString()}에 저장됨</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
