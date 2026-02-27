import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CompanyForm {
  company_name:string; address:string; tel:string; email:string;
  contact_name:string; business_no:string; bank_name:string; account_no:string; swift_code:string;
}
const EMPTY:CompanyForm = { company_name:"",address:"",tel:"",email:"",contact_name:"",business_no:"",bank_name:"",account_no:"",swift_code:"" };

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ if(user) load(); },[user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const { data:co } = await supabase.from("companies").select("*").eq("user_id",user!.id).maybeSingle();
      if (co) {
        setForm({ company_name:co.company_name||"", address:co.address||"", tel:co.tel||"", email:co.email||"", contact_name:co.contact_name||"", business_no:co.business_no||"", bank_name:(co.bank_info as any)?.bank_name||"", account_no:(co.bank_info as any)?.account_no||"", swift_code:(co.bank_info as any)?.swift_code||"" });
      } else {
        const { data:pr } = await supabase.from("profiles").select("company_info,email").eq("id",user!.id).maybeSingle();
        if (pr?.company_info) {
          const ci = pr.company_info as any;
          setForm({ company_name:ci.company_name||"", address:ci.address||"", tel:ci.tel||ci.phone||"", email:ci.email||pr.email||"", contact_name:ci.contact_person||"", business_no:ci.business_no||"", bank_name:ci.bank_name||"", account_no:ci.account_no||"", swift_code:ci.swift_code||"" });
        }
      }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }

  async function save() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const { error:e } = await supabase.from("companies").upsert({
        user_id:user.id, company_name:form.company_name, address:form.address, tel:form.tel,
        email:form.email, contact_name:form.contact_name, business_no:form.business_no,
        bank_info:{ bank_name:form.bank_name, account_no:form.account_no, swift_code:form.swift_code },
        updated_at:new Date().toISOString(),
      } as any,{ onConflict:"user_id" });
      if (e) throw e;
      await supabase.from("profiles").update({ company_info:{ company_name:form.company_name, address:form.address, tel:form.tel, email:form.email, contact_person:form.contact_name, business_no:form.business_no, bank_name:form.bank_name, account_no:form.account_no, swift_code:form.swift_code }, updated_at:new Date().toISOString() } as any).eq("id",user.id);
      setSavedAt(new Date());
    } catch(e){ setError(e instanceof Error?e.message:"저장 실패"); } finally { setSaving(false); }
  }

  const f = (k:keyof CompanyForm,v:string)=>setForm(p=>({...p,[k]:v}));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">회사 정보를 불러오는 중...</div>;

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-2xl mx-auto p-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">회사 정보 설정</h1>
        <p className="text-sm text-gray-500 mt-1">PI, CI, PL 등 모든 무역 서류에 자동 반영됩니다.</p>
      </div>
      {[
        { title:"기본 정보", fields:[
          {label:"회사명 (영문)",key:"company_name",ph:"KBEAUTY LABS CO., LTD.",req:true},
          {label:"사업자등록번호",key:"business_no",ph:"123-45-67890"},
          {label:"주소 (영문)",key:"address",ph:"123 Beauty Street, Gangnam-gu, Seoul, Republic of Korea"},
        ]},
        { title:"연락처", fields:[
          {label:"담당자명",key:"contact_name",ph:"Kim, Minjun"},
          {label:"이메일",key:"email",ph:"export@kbeautylabs.com"},
          {label:"전화번호",key:"tel",ph:"+82-2-1234-5678"},
        ]},
        { title:"은행 정보", fields:[
          {label:"은행명 (영문)",key:"bank_name",ph:"Kookmin Bank"},
          {label:"계좌번호",key:"account_no",ph:"123-456-789012"},
          {label:"SWIFT Code",key:"swift_code",ph:"CZNBKRSEXXX"},
        ]},
      ].map(section=>(
        <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">{section.title}</h2>
          {section.fields.map((fd:any)=>(
            <div key={fd.key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{fd.label}{fd.req&&<span className="text-red-500 ml-1">*</span>}</label>
              <input type="text" value={(form as any)[fd.key]} onChange={e=>f(fd.key as keyof CompanyForm,e.target.value)} placeholder={fd.ph} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"/>
            </div>
          ))}
        </div>
      ))}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving||!form.company_name} className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {saving?"저장 중...":"저장하기"}
        </button>
        {savedAt&&<span className="text-sm text-green-600">&#10003; {savedAt.toLocaleTimeString()}에 저장됨</span>}
        {error&&<span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
    </div>
  );
}
