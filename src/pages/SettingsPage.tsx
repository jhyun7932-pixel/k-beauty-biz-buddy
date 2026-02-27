import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CompanyForm {
  company_name: string;
  address: string;
  tel: string;
  email: string;
  contact_name: string;
  business_no: string;
  ceo_name: string;
  customs_code: string;
  bank_name: string;
  account_no: string;
  swift_code: string;
  logo_url: string;
  seal_url: string;
}

const EMPTY: CompanyForm = {
  company_name: "", address: "", tel: "", email: "",
  contact_name: "", business_no: "", ceo_name: "", customs_code: "",
  bank_name: "", account_no: "", swift_code: "",
  logo_url: "", seal_url: "",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [sealPreview, setSealPreview] = useState<string>("");

  useEffect(() => {
    if (user) loadData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    try {
      const { data, error: e } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (e) { console.error("load error:", e); }

      if (data) {
        const d = data as any;
        setForm({
          company_name: d.company_name || "",
          address: d.address || "",
          tel: d.tel || "",
          email: d.email || "",
          contact_name: d.contact_name || "",
          business_no: d.business_no || "",
          ceo_name: d.ceo_name || "",
          customs_code: d.customs_code || "",
          bank_name: d.bank_info?.bank_name || "",
          account_no: d.bank_info?.account_no || "",
          swift_code: d.bank_info?.swift_code || "",
          logo_url: d.logo_url || "",
          seal_url: d.seal_url || "",
        });
        if (d.logo_url) setLogoPreview(d.logo_url);
        if (d.seal_url) setSealPreview(d.seal_url);
      }
    } catch (err) {
      console.error("loadData error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, type: "logo" | "seal"): Promise<string | null> {
    if (!user) return null;
    if (file.size > 5 * 1024 * 1024) { setError("5MB 이하 이미지만 업로드 가능합니다."); return null; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true });

    if (upErr) { setError(`이미지 업로드 실패: ${upErr.message}`); return null; }

    const { data: urlData } = supabase.storage
      .from("company-assets")
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  async function save() {
    if (!user || !form.company_name.trim()) {
      setError("회사명은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        user_id: user.id,
        company_name: form.company_name,
        address: form.address,
        tel: form.tel,
        email: form.email,
        contact_name: form.contact_name,
        business_no: form.business_no,
        ceo_name: form.ceo_name,
        customs_code: form.customs_code,
        logo_url: form.logo_url,
        seal_url: form.seal_url,
        bank_info: {
          bank_name: form.bank_name,
          account_no: form.account_no,
          swift_code: form.swift_code,
        },
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("companies")
        .upsert(payload as any, { onConflict: "user_id" });

      if (upsertErr) {
        console.error("upsert error:", upsertErr);
        throw new Error(upsertErr.message);
      }

      setSavedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const f = (k: keyof CompanyForm, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      불러오는 중...
    </div>
  );

  const sections = [
    {
      title: "기본 정보",
      fields: [
        { label: "회사명 (영문)", key: "company_name", ph: "KBEAUTY LAB CO., LTD.", req: true },
        { label: "영문 대표자명", key: "ceo_name", ph: "KIM, Jinhyun" },
        { label: "사업자등록번호", key: "business_no", ph: "123-45-67890" },
        { label: "수출자 관세부호", key: "customs_code", ph: "12345678" },
        { label: "주소 (영문)", key: "address", ph: "123 Teheran-ro, Gangnam-gu, Seoul, Republic of Korea" },
      ],
    },
    {
      title: "연락처",
      fields: [
        { label: "담당자명 (영문)", key: "contact_name", ph: "Kim, Minjun" },
        { label: "이메일", key: "email", ph: "export@kbeautylab.com" },
        { label: "전화번호", key: "tel", ph: "+82-2-1234-5678" },
      ],
    },
    {
      title: "은행 정보",
      fields: [
        { label: "은행명 (영문)", key: "bank_name", ph: "Kookmin Bank" },
        { label: "계좌번호", key: "account_no", ph: "123-456-7890123" },
        { label: "SWIFT Code", key: "swift_code", ph: "CZNBKRSEXXX" },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회사 정보 설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            PI, CI, PL 등 모든 무역 서류에 자동 반영됩니다.
          </p>
        </div>

        {sections.map(sec => (
          <div key={sec.title} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">{sec.title}</h2>
            {sec.fields.map((fd: any) => (
              <div key={fd.key}>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {fd.label}
                  {fd.req && <span className="text-red-500 ml-1">*</span>}
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

        {/* 로고 & 직인 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">회사 로고 & 직인</h2>
          <p className="text-xs text-gray-400">PI, CI 등 무역 서류에 자동 삽입됩니다. PNG/JPG, 5MB 이하</p>

          {[
            { label: "로고 이미지", type: "logo" as const, preview: logoPreview, setPreview: setLogoPreview, formKey: "logo_url" as keyof CompanyForm },
            { label: "직인 (Seal) 이미지", type: "seal" as const, preview: sealPreview, setPreview: setSealPreview, formKey: "seal_url" as keyof CompanyForm },
          ].map(item => (
            <div key={item.type}>
              <label className="block text-sm font-medium text-gray-600 mb-2">{item.label}</label>
              <div className="flex items-center gap-3">
                {item.preview ? (
                  <img src={item.preview} alt={item.label} className="w-16 h-16 object-contain border rounded-lg bg-gray-50" />
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    없음
                  </div>
                )}
                <label className="cursor-pointer px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  {item.preview ? "변경" : "업로드"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file, item.type);
                      if (url) {
                        item.setPreview(url);
                        f(item.formKey, url);
                      }
                    }}
                  />
                </label>
                {item.preview && (
                  <button
                    onClick={() => { item.setPreview(""); f(item.formKey, ""); }}
                    className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-4 pb-4">
          <button
            onClick={save}
            disabled={saving || !form.company_name}
            className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
          {savedAt && (
            <span className="text-sm text-green-600">
              &#10003; {savedAt.toLocaleTimeString()}에 저장됨
            </span>
          )}
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
