// Email Generator API Client

export type EmailType = 'first_proposal' | 'sample_followup' | 'closing';

export interface EmailContext {
  companyName?: string;
  brandName?: string;
  buyerName?: string;
  buyerCompany?: string;
  buyerCountry?: string;
  products?: Array<{ name: string; category?: string }>;
  sampleDetails?: string;
  dealTerms?: {
    incoterms?: string;
    paymentTerms?: string;
    moq?: number;
    leadTime?: string;
    currency?: string;
    totalAmount?: number;
  };
  language?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  type: EmailType;
  language: string;
}

export interface GenerateEmailResult {
  success: boolean;
  email?: GeneratedEmail;
  error?: string;
}

const EMAIL_TYPE_LABELS: Record<EmailType, { ko: string; en: string; icon: string }> = {
  first_proposal: { ko: '첫 제안 이메일', en: 'First Proposal', icon: '📧' },
  sample_followup: { ko: '샘플 후속 이메일', en: 'Sample Follow-up', icon: '📦' },
  closing: { ko: '클로징 이메일', en: 'Closing', icon: '🤝' },
};

export function getEmailTypeLabel(type: EmailType, lang: 'ko' | 'en' = 'ko'): string {
  return EMAIL_TYPE_LABELS[type]?.[lang] || type;
}

export function getEmailTypeIcon(type: EmailType): string {
  return EMAIL_TYPE_LABELS[type]?.icon || '✉️';
}

export async function generateEmail(
  emailType: EmailType,
  context: EmailContext
): Promise<GenerateEmailResult> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ emailType, context }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
      }
      if (response.status === 402) {
        return { success: false, error: 'AI 크레딧이 부족합니다.' };
      }
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'AI 서비스에 연결할 수 없습니다.' };
    }

    const data = await response.json();
    return {
      success: true,
      email: data.email,
    };
  } catch (error) {
    console.error('Generate email error:', error);
    return { success: false, error: '네트워크 오류가 발생했습니다.' };
  }
}

// 이메일 클립보드 복사
export async function copyEmailToClipboard(email: GeneratedEmail): Promise<boolean> {
  try {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Gmail 링크 생성
export function createGmailLink(email: GeneratedEmail, to?: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    su: email.subject,
    body: email.body,
  });
  if (to) {
    params.set('to', to);
  }
  return `https://mail.google.com/mail/?${params.toString()}`;
}

// Outlook 링크 생성
export function createOutlookLink(email: GeneratedEmail, to?: string): string {
  const params = new URLSearchParams({
    subject: email.subject,
    body: email.body,
  });
  if (to) {
    params.set('to', to);
  }
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

// Mailto 링크 생성
export function createMailtoLink(email: GeneratedEmail, to?: string): string {
  const params = new URLSearchParams({
    subject: email.subject,
    body: email.body,
  });
  return `mailto:${to || ''}?${params.toString()}`;
}
