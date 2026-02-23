// 다국어 번역 시스템 - K-뷰티 AI 무역비서
import type { Language, SalesChannel } from '@/types';

// 언어 코드 매핑
export type LanguageCode = 'ko' | 'en' | 'zh' | 'ja';

export const LANGUAGE_MAP: Record<Language, LanguageCode> = {
  '한국어': 'ko',
  '영어': 'en',
  '중국어': 'zh',
  '일본어': 'ja',
  '독일어': 'en', // 독일어는 영어로 대체 (추후 확장 가능)
};

// 번역 타입 정의
export interface DocumentTranslations {
  // 공통
  draftBadge: string;
  contact: string;
  generatedBy: string;
  validFor: string;
  
  // One-Pager
  brandIntroTitle: string;
  brandIntroContent: string;
  coreProducts: string;
  productName: string;
  category: string;
  keyIngredients: string;
  target: string;
  certAndQuality: string;
  cgmpCert: string;
  veganFormula: string;
  spfTestComplete: string;
  
  // 채널별 라벨
  channelLabels: Record<SalesChannel, string>;
  
  // 도매 조건
  wholesaleConditions: string;
  moq: string;
  wholesalePriceRange: string;
  leadTime: string;
  exclusiveOption: string;
  regionalNegotiable: string;
  
  // 리테일 입점
  retailInfo: string;
  recommendedRetailPrice: string;
  expectedMargin: string;
  displayPoint: string;
  promotion: string;
  launchPromoSupport: string;
  
  // 온라인 리스팅
  onlineListingGuide: string;
  heroClaim: string;
  mainKeywords: string;
  imageRecommend: string;
  prohibitedExpressions: string;
  
  // 수출 준비 요약
  exportReadinessTitle: string;
  readinessStatus: string;
  item: string;
  status: string;
  note: string;
  productLabeling: string;
  caution: string;
  localTranslationNeeded: string;
  ingredientCompliance: string;
  ok: string;
  inciConfirmed: string;
  certDocuments: string;
  spfReportAttached: string;
  veganCert: string;
  certInProgress: string;
  channelChecklist: string;
  nextSteps: string;
  step1VeganCert: string;
  step2LocalLabel: string;
  step3SampleShipment: string;
  
  // Deal Sheet
  dealSheetTitle: string;
  product: string;
  unitPrice: string;
  incoterms: string;
  paymentTerms: string;
  paymentTermsValue: string;
  leadTimeValue: string;
  validity: string;
  samplePolicy: string;
  samplePolicyValue: string;
  volumeDiscount: string;
  quantity: string;
  discount: string;
  
  // 이메일 템플릿
  emailTemplatesTitle: string;
  firstProposal: string;
  sampleProposal: string;
  orderConfirmation: string;
  emailSubjectFirst: string;
  emailSubjectSample: string;
  emailSubjectOrder: string;
  emailGreeting: string;
  emailIntro: string;
  emailPartnership: string;
  keyHighlights: string;
  highlight1: string;
  highlight2: string;
  highlight3: string;
  emailClosing: string;
  emailSampleIntro: string;
  samplePackageIncludes: string;
  emailOrderIntro: string;
  orderSummary: string;
  productionNotice: string;
  
  // 체크리스트
  referenceNote: string;
  checklistNote: string;
}

// 한국어 번역
const ko: DocumentTranslations = {
  // 공통
  draftBadge: '⚠️ 초안 - 최종 제출 전 확인 필요',
  contact: '문의',
  generatedBy: 'K-Beauty AI 무역비서로 생성됨',
  validFor: '유효기간',
  
  // One-Pager
  brandIntroTitle: '브랜드 소개',
  brandIntroContent: '글로우스킨 코스메틱은 2018년 설립된 K-뷰티 전문 기업으로, 비건 & 클린뷰티 포뮬러를 통해 글로벌 시장에서 빠르게 성장하고 있습니다.',
  coreProducts: '핵심 제품',
  productName: '제품명',
  category: '카테고리',
  keyIngredients: '핵심 성분',
  target: '타겟',
  certAndQuality: '인증 및 품질',
  cgmpCert: '✓ CGMP 인증 생산시설',
  veganFormula: '✓ 비건 포뮬러 (동물성 원료 0%)',
  spfTestComplete: '✓ ISO 24444:2019 SPF 테스트 완료',
  
  // 채널별 라벨
  channelLabels: {
    distributor: '유통/도매',
    retail: '리테일(오프라인)',
    online_market: '온라인 마켓',
    d2c: 'D2C',
  },
  
  // 도매 조건
  wholesaleConditions: '도매/유통 조건',
  moq: 'MOQ',
  wholesalePriceRange: '도매 단가 범위',
  leadTime: '리드타임',
  exclusiveOption: '독점 옵션',
  regionalNegotiable: '지역별 협의 가능',
  
  // 리테일 입점
  retailInfo: '리테일 입점 정보',
  recommendedRetailPrice: '권장 소비자가',
  expectedMargin: '예상 마진',
  displayPoint: '매대 포인트',
  promotion: '프로모션',
  launchPromoSupport: '런칭 프로모션 지원 가능',
  
  // 온라인 리스팅
  onlineListingGuide: '온라인 리스팅 가이드',
  heroClaim: '히어로 클레임',
  mainKeywords: '주요 키워드',
  imageRecommend: '이미지 권장',
  prohibitedExpressions: '금지 표현',
  
  // 수출 준비 요약
  exportReadinessTitle: '수출 준비 요약',
  readinessStatus: '준비 상태',
  item: '항목',
  status: '상태',
  note: '비고',
  productLabeling: '제품 라벨링',
  caution: '주의',
  localTranslationNeeded: '현지어 번역 필요',
  ingredientCompliance: '성분 적합성',
  ok: '괜찮음',
  inciConfirmed: 'INCI 명칭 확인 완료',
  certDocuments: '인증서류',
  spfReportAttached: 'SPF 테스트 리포트 첨부',
  veganCert: '비건 인증',
  certInProgress: '인증서 준비 중',
  channelChecklist: '체크리스트',
  nextSteps: '다음 단계',
  step1VeganCert: '비건 인증서 발급 신청',
  step2LocalLabel: '현지어 라벨 번역 의뢰',
  step3SampleShipment: '바이어 샘플 발송 준비',
  
  // Deal Sheet
  dealSheetTitle: '거래 조건 요약표',
  product: '제품',
  unitPrice: '단가',
  incoterms: '인코텀즈',
  paymentTerms: '결제 조건',
  paymentTermsValue: 'T/T 30% 계약금, 70% 선적 전',
  leadTimeValue: '20일 (주문 확정 후)',
  validity: '유효 기간',
  samplePolicy: '샘플 정책',
  samplePolicyValue: '샘플 무료, 배송비 바이어 부담',
  volumeDiscount: '수량별 단가',
  quantity: '수량',
  discount: '할인율',
  
  // 이메일 템플릿
  emailTemplatesTitle: '이메일/답장 문구 세트',
  firstProposal: '첫 제안 메일',
  sampleProposal: '샘플 제안 메일',
  orderConfirmation: '조건 확정 메일',
  emailSubjectFirst: 'K-Beauty 비건 선스크린 SPF50+ - 파트너십 문의',
  emailSubjectSample: '샘플 발송 안내 - GLOWSKIN 비건 선세럼',
  emailSubjectOrder: '주문 확정 - PO#[NUMBER]',
  emailGreeting: '안녕하세요',
  emailIntro: 'GLOWSKIN 코스메틱의 [담당자]입니다. 비건 및 클린뷰티 제품 전문 K-뷰티 브랜드입니다.',
  emailPartnership: '당사의 주력 제품인 비건 선세럼 SPF50+에 대한 파트너십 기회를 모색하고자 연락드립니다.',
  keyHighlights: '주요 특징:',
  highlight1: '• 병풀 추출물이 함유된 100% 비건 포뮬러',
  highlight2: '• SPF50+ PA++++ 자외선 차단',
  highlight3: '• 가볍고 끈적임 없는 마무리감',
  emailClosing: '감사합니다.',
  emailSampleIntro: 'GLOWSKIN 제품에 관심 가져주셔서 감사합니다. 평가를 위한 샘플을 기꺼이 보내드리겠습니다.',
  samplePackageIncludes: '샘플 패키지 구성:',
  emailOrderIntro: '주문해 주셔서 감사합니다. 검토를 위해 견적서(PI)를 첨부합니다.',
  orderSummary: '주문 요약:',
  productionNotice: '계약금 확인 후 생산을 시작하며, 예상 리드타임은 20일입니다.',
  
  // 체크리스트
  referenceNote: '참고 사항',
  checklistNote: '위 체크리스트는 해당 채널 진출 시 일반적으로 필요한 항목입니다. 실제 요구사항은 바이어/플랫폼에 따라 다를 수 있으니 반드시 확인하시기 바랍니다.',
};

// 영어 번역
const en: DocumentTranslations = {
  // 공통
  draftBadge: '⚠️ DRAFT - Review required before final submission',
  contact: 'Contact',
  generatedBy: 'Generated by K-Beauty AI Trade Assistant',
  validFor: 'Valid for',
  
  // One-Pager
  brandIntroTitle: 'Brand Introduction',
  brandIntroContent: 'GLOWSKIN Cosmetics, established in 2018, is a K-Beauty specialist company rapidly growing in the global market through vegan & clean beauty formulations.',
  coreProducts: 'Core Products',
  productName: 'Product Name',
  category: 'Category',
  keyIngredients: 'Key Ingredients',
  target: 'Target',
  certAndQuality: 'Certifications & Quality',
  cgmpCert: '✓ CGMP Certified Manufacturing Facility',
  veganFormula: '✓ Vegan Formula (0% Animal-derived Ingredients)',
  spfTestComplete: '✓ ISO 24444:2019 SPF Test Completed',
  
  // 채널별 라벨
  channelLabels: {
    distributor: 'Distributor/Wholesale',
    retail: 'Retail (Offline)',
    online_market: 'Online Marketplace',
    d2c: 'D2C',
  },
  
  // 도매 조건
  wholesaleConditions: 'Wholesale/Distribution Terms',
  moq: 'MOQ',
  wholesalePriceRange: 'Wholesale Price Range',
  leadTime: 'Lead Time',
  exclusiveOption: 'Exclusive Option',
  regionalNegotiable: 'Regional exclusivity negotiable',
  
  // 리테일 입점
  retailInfo: 'Retail Entry Information',
  recommendedRetailPrice: 'Recommended Retail Price',
  expectedMargin: 'Expected Margin',
  displayPoint: 'Display Points',
  promotion: 'Promotion',
  launchPromoSupport: 'Launch promotion support available',
  
  // 온라인 리스팅
  onlineListingGuide: 'Online Listing Guide',
  heroClaim: 'Hero Claim',
  mainKeywords: 'Main Keywords',
  imageRecommend: 'Image Recommendations',
  prohibitedExpressions: 'Prohibited Expressions',
  
  // 수출 준비 요약
  exportReadinessTitle: 'Export Readiness Summary',
  readinessStatus: 'Readiness Status',
  item: 'Item',
  status: 'Status',
  note: 'Note',
  productLabeling: 'Product Labeling',
  caution: 'Caution',
  localTranslationNeeded: 'Local translation required',
  ingredientCompliance: 'Ingredient Compliance',
  ok: 'OK',
  inciConfirmed: 'INCI names confirmed',
  certDocuments: 'Certification Documents',
  spfReportAttached: 'SPF test report attached',
  veganCert: 'Vegan Certification',
  certInProgress: 'Certification in progress',
  channelChecklist: 'Checklist',
  nextSteps: 'Next Steps',
  step1VeganCert: 'Apply for vegan certification',
  step2LocalLabel: 'Request local label translation',
  step3SampleShipment: 'Prepare buyer sample shipment',
  
  // Deal Sheet
  dealSheetTitle: 'Deal Sheet - Trade Terms Summary',
  product: 'Product',
  unitPrice: 'Unit Price',
  incoterms: 'Incoterms',
  paymentTerms: 'Payment Terms',
  paymentTermsValue: 'T/T 30% deposit, 70% before shipment',
  leadTimeValue: '20 days (after order confirmation)',
  validity: 'Validity',
  samplePolicy: 'Sample Policy',
  samplePolicyValue: 'Samples free, shipping at buyer\'s cost',
  volumeDiscount: 'Volume Pricing',
  quantity: 'Quantity',
  discount: 'Discount',
  
  // 이메일 템플릿
  emailTemplatesTitle: 'Email Templates',
  firstProposal: 'First Proposal Email',
  sampleProposal: 'Sample Proposal Email',
  orderConfirmation: 'Order Confirmation Email',
  emailSubjectFirst: 'K-Beauty Vegan Sunscreen SPF50+ - Partnership Inquiry',
  emailSubjectSample: 'Sample Arrangement - GLOWSKIN Vegan Sun Serum',
  emailSubjectOrder: 'Order Confirmation - PO#[NUMBER]',
  emailGreeting: 'Dear',
  emailIntro: 'I am [Your Name] from GLOWSKIN Cosmetics, a leading K-Beauty brand specializing in vegan and clean beauty products.',
  emailPartnership: 'We are reaching out to explore potential partnership opportunities for our flagship product, the Vegan Sun Serum SPF50+.',
  keyHighlights: 'Key highlights:',
  highlight1: '• 100% Vegan formula with Centella Asiatica',
  highlight2: '• SPF50+ PA++++ protection',
  highlight3: '• Lightweight, non-greasy finish',
  emailClosing: 'Best regards,',
  emailSampleIntro: 'Thank you for your interest in GLOWSKIN products. We would be happy to send product samples for your evaluation.',
  samplePackageIncludes: 'Sample package includes:',
  emailOrderIntro: 'Thank you for your order. Please find attached the Proforma Invoice (PI) for your review.',
  orderSummary: 'Order Summary:',
  productionNotice: 'Upon deposit confirmation, production will commence with an estimated lead time of 20 days.',
  
  // 체크리스트
  referenceNote: 'Reference Note',
  checklistNote: 'The above checklist contains items generally required for this channel entry. Actual requirements may vary by buyer/platform, so please confirm accordingly.',
};

// 중국어 번역
const zh: DocumentTranslations = {
  // 공통
  draftBadge: '⚠️ 草稿 - 提交前请确认',
  contact: '联系方式',
  generatedBy: '由K-Beauty AI贸易助手生成',
  validFor: '有效期',
  
  // One-Pager
  brandIntroTitle: '品牌介绍',
  brandIntroContent: 'GLOWSKIN化妆品成立于2018年，是一家K-Beauty专业公司，通过纯素和清洁美容配方在全球市场快速增长。',
  coreProducts: '核心产品',
  productName: '产品名称',
  category: '类别',
  keyIngredients: '主要成分',
  target: '目标人群',
  certAndQuality: '认证与质量',
  cgmpCert: '✓ CGMP认证生产设施',
  veganFormula: '✓ 纯素配方（0%动物成分）',
  spfTestComplete: '✓ ISO 24444:2019 SPF测试完成',
  
  // 채널별 라벨
  channelLabels: {
    distributor: '经销/批发',
    retail: '零售（线下）',
    online_market: '在线市场',
    d2c: 'D2C',
  },
  
  // 도매 조건
  wholesaleConditions: '批发/分销条款',
  moq: '最小起订量',
  wholesalePriceRange: '批发价格范围',
  leadTime: '交货期',
  exclusiveOption: '独家选项',
  regionalNegotiable: '可协商区域独家代理',
  
  // 리테일 입점
  retailInfo: '零售入驻信息',
  recommendedRetailPrice: '建议零售价',
  expectedMargin: '预期利润',
  displayPoint: '陈列要点',
  promotion: '促销',
  launchPromoSupport: '可提供上市促销支持',
  
  // 온라인 리스팅
  onlineListingGuide: '在线上架指南',
  heroClaim: '主打卖点',
  mainKeywords: '主要关键词',
  imageRecommend: '图片建议',
  prohibitedExpressions: '禁用表达',
  
  // 수출 준비 요약
  exportReadinessTitle: '出口准备摘要',
  readinessStatus: '准备状态',
  item: '项目',
  status: '状态',
  note: '备注',
  productLabeling: '产品标签',
  caution: '注意',
  localTranslationNeeded: '需要本地翻译',
  ingredientCompliance: '成分合规性',
  ok: '正常',
  inciConfirmed: 'INCI名称已确认',
  certDocuments: '认证文件',
  spfReportAttached: 'SPF测试报告已附',
  veganCert: '纯素认证',
  certInProgress: '认证准备中',
  channelChecklist: '检查清单',
  nextSteps: '下一步',
  step1VeganCert: '申请纯素认证',
  step2LocalLabel: '委托本地标签翻译',
  step3SampleShipment: '准备买家样品发货',
  
  // Deal Sheet
  dealSheetTitle: '交易条款摘要表',
  product: '产品',
  unitPrice: '单价',
  incoterms: '贸易条款',
  paymentTerms: '付款条件',
  paymentTermsValue: 'T/T 30%定金，70%发货前付款',
  leadTimeValue: '20天（订单确认后）',
  validity: '有效期',
  samplePolicy: '样品政策',
  samplePolicyValue: '样品免费，运费买方承担',
  volumeDiscount: '数量折扣',
  quantity: '数量',
  discount: '折扣',
  
  // 이메일 템플릿
  emailTemplatesTitle: '邮件模板',
  firstProposal: '首次提案邮件',
  sampleProposal: '样品提案邮件',
  orderConfirmation: '订单确认邮件',
  emailSubjectFirst: 'K-Beauty纯素防晒霜SPF50+ - 合作咨询',
  emailSubjectSample: '样品安排 - GLOWSKIN纯素防晒精华',
  emailSubjectOrder: '订单确认 - PO#[NUMBER]',
  emailGreeting: '您好',
  emailIntro: '我是GLOWSKIN化妆品的[姓名]，我们是专注于纯素和清洁美容产品的K-Beauty品牌。',
  emailPartnership: '我们联系您是为了探讨我们主打产品纯素防晒精华SPF50+的潜在合作机会。',
  keyHighlights: '主要亮点：',
  highlight1: '• 含积雪草提取物的100%纯素配方',
  highlight2: '• SPF50+ PA++++防晒保护',
  highlight3: '• 轻盈不油腻的质地',
  emailClosing: '此致敬礼',
  emailSampleIntro: '感谢您对GLOWSKIN产品的关注。我们很乐意寄送产品样品供您评估。',
  samplePackageIncludes: '样品包含：',
  emailOrderIntro: '感谢您的订单。请查阅附件中的形式发票(PI)。',
  orderSummary: '订单摘要：',
  productionNotice: '确认定金后，将开始生产，预计交货期为20天。',
  
  // 체크리스트
  referenceNote: '参考说明',
  checklistNote: '以上清单包含该渠道入驻通常需要的项目。实际要求可能因买家/平台而异，请务必确认。',
};

// 일본어 번역
const ja: DocumentTranslations = {
  // 공통
  draftBadge: '⚠️ ドラフト - 最終提出前に確認が必要',
  contact: 'お問い合わせ',
  generatedBy: 'K-Beauty AI貿易アシスタントで生成',
  validFor: '有効期限',
  
  // One-Pager
  brandIntroTitle: 'ブランド紹介',
  brandIntroContent: 'GLOWSKIN Cosmeticsは2018年に設立されたK-Beauty専門企業で、ビーガン＆クリーンビューティー処方を通じてグローバル市場で急成長しています。',
  coreProducts: 'コア製品',
  productName: '製品名',
  category: 'カテゴリー',
  keyIngredients: '主要成分',
  target: 'ターゲット',
  certAndQuality: '認証・品質',
  cgmpCert: '✓ CGMP認証製造施設',
  veganFormula: '✓ ビーガン処方（動物由来成分0%）',
  spfTestComplete: '✓ ISO 24444:2019 SPFテスト完了',
  
  // 채널별 라벨
  channelLabels: {
    distributor: '卸売/流通',
    retail: 'リテール（オフライン）',
    online_market: 'オンラインマーケット',
    d2c: 'D2C',
  },
  
  // 도매 조건
  wholesaleConditions: '卸売/流通条件',
  moq: 'MOQ',
  wholesalePriceRange: '卸売価格帯',
  leadTime: 'リードタイム',
  exclusiveOption: '独占オプション',
  regionalNegotiable: '地域別協議可能',
  
  // 리테일 입점
  retailInfo: 'リテール入店情報',
  recommendedRetailPrice: '推奨小売価格',
  expectedMargin: '予想マージン',
  displayPoint: '陳列ポイント',
  promotion: 'プロモーション',
  launchPromoSupport: 'ローンチプロモーション対応可能',
  
  // 온라인 리스팅
  onlineListingGuide: 'オンラインリスティングガイド',
  heroClaim: 'ヒーロークレーム',
  mainKeywords: '主要キーワード',
  imageRecommend: '画像推奨',
  prohibitedExpressions: '禁止表現',
  
  // 수출 준비 요약
  exportReadinessTitle: '輸出準備サマリー',
  readinessStatus: '準備状況',
  item: '項目',
  status: 'ステータス',
  note: '備考',
  productLabeling: '製品ラベリング',
  caution: '注意',
  localTranslationNeeded: '現地語翻訳が必要',
  ingredientCompliance: '成分適合性',
  ok: 'OK',
  inciConfirmed: 'INCI名称確認済み',
  certDocuments: '認証書類',
  spfReportAttached: 'SPFテストレポート添付',
  veganCert: 'ビーガン認証',
  certInProgress: '認証準備中',
  channelChecklist: 'チェックリスト',
  nextSteps: '次のステップ',
  step1VeganCert: 'ビーガン認証申請',
  step2LocalLabel: '現地語ラベル翻訳依頼',
  step3SampleShipment: 'バイヤーサンプル発送準備',
  
  // Deal Sheet
  dealSheetTitle: '取引条件サマリーシート',
  product: '製品',
  unitPrice: '単価',
  incoterms: 'インコタームズ',
  paymentTerms: '支払条件',
  paymentTermsValue: 'T/T 30%前金、70%出荷前',
  leadTimeValue: '20日（注文確定後）',
  validity: '有効期限',
  samplePolicy: 'サンプルポリシー',
  samplePolicyValue: 'サンプル無料、送料はバイヤー負担',
  volumeDiscount: '数量別価格',
  quantity: '数量',
  discount: '割引率',
  
  // 이메일 템플릿
  emailTemplatesTitle: 'メールテンプレート',
  firstProposal: '初回提案メール',
  sampleProposal: 'サンプル提案メール',
  orderConfirmation: '注文確認メール',
  emailSubjectFirst: 'K-Beautyビーガンサンスクリーン SPF50+ - パートナーシップのお問い合わせ',
  emailSubjectSample: 'サンプル手配 - GLOWSKIN ビーガンサンセラム',
  emailSubjectOrder: '注文確認 - PO#[NUMBER]',
  emailGreeting: 'ご担当者様',
  emailIntro: 'GLOWSKIN Cosmeticsの[担当者名]です。ビーガン・クリーンビューティー製品を専門とするK-Beautyブランドです。',
  emailPartnership: '当社の主力製品であるビーガンサンセラムSPF50+について、パートナーシップの可能性を探るためご連絡いたしました。',
  keyHighlights: '主な特徴：',
  highlight1: '• ツボクサエキス配合の100%ビーガン処方',
  highlight2: '• SPF50+ PA++++のUV防御',
  highlight3: '• 軽くベタつかない仕上がり',
  emailClosing: 'よろしくお願いいたします。',
  emailSampleIntro: 'GLOWSKIN製品にご興味をお持ちいただきありがとうございます。評価用サンプルを喜んでお送りいたします。',
  samplePackageIncludes: 'サンプルパッケージ内容：',
  emailOrderIntro: 'ご注文ありがとうございます。ご確認用のProforma Invoice（PI）を添付いたします。',
  orderSummary: '注文概要：',
  productionNotice: '前金確認後、生産を開始し、予定リードタイムは20日です。',
  
  // 체크리스트
  referenceNote: '参考事項',
  checklistNote: '上記チェックリストは、当該チャネル進出時に一般的に必要な項目です。実際の要件はバイヤー/プラットフォームによって異なる場合がありますので、必ずご確認ください。',
};

// 번역 사전
const translations: Record<LanguageCode, DocumentTranslations> = {
  ko,
  en,
  zh,
  ja,
};

// 언어로 번역 가져오기
export function getTranslations(language: Language): DocumentTranslations {
  const langCode = LANGUAGE_MAP[language] || 'en';
  return translations[langCode];
}

// 채널별 체크리스트 번역
export const TRANSLATED_CHANNEL_CHECKLISTS: Record<LanguageCode, Record<SalesChannel, string[]>> = {
  ko: {
    online_market: [
      '핵심 문구/금지 표현 주의',
      '리스팅 이미지 컷 가이드 확인',
      '상품 FAQ 준비',
      '배송/반품 정책 확인',
      '플랫폼별 클레임 가이드라인',
    ],
    retail: [
      '마진 구조 확인',
      '프로모션 가능 여부',
      '진열 포인트 안내',
      '매대용 POP 자료',
      '입점 필수 서류 확인',
    ],
    distributor: [
      '도매단가표 준비',
      'MOQ/리드타임 명시',
      '독점 옵션 여부',
      '재고 보유 정책',
      '리오더 조건',
    ],
    d2c: [
      '브랜드 스토리 강조',
      '온라인 마케팅 자산',
      '고객 서비스 가이드',
      '결제/배송 설정',
    ],
  },
  en: {
    online_market: [
      'Key claims / prohibited expressions',
      'Listing image cut guide',
      'Product FAQ preparation',
      'Shipping/return policy check',
      'Platform-specific claim guidelines',
    ],
    retail: [
      'Margin structure confirmation',
      'Promotion availability',
      'Display point guidance',
      'POP materials for shelving',
      'Required entry documents',
    ],
    distributor: [
      'Wholesale price list preparation',
      'MOQ/lead time specification',
      'Exclusivity options',
      'Inventory holding policy',
      'Reorder conditions',
    ],
    d2c: [
      'Emphasize brand story',
      'Online marketing assets',
      'Customer service guide',
      'Payment/shipping setup',
    ],
  },
  zh: {
    online_market: [
      '关键声明/禁用表达注意',
      '产品图片规格指南',
      '产品FAQ准备',
      '配送/退货政策确认',
      '平台索赔指南',
    ],
    retail: [
      '利润结构确认',
      '促销可行性',
      '陈列要点指导',
      '货架POP材料',
      '入驻必需文件',
    ],
    distributor: [
      '批发价格表准备',
      'MOQ/交货期说明',
      '独家选项',
      '库存持有政策',
      '再订购条件',
    ],
    d2c: [
      '强调品牌故事',
      '在线营销资产',
      '客户服务指南',
      '支付/配送设置',
    ],
  },
  ja: {
    online_market: [
      'キークレーム/禁止表現注意',
      'リスティング画像カットガイド',
      '商品FAQ準備',
      '配送/返品ポリシー確認',
      'プラットフォーム別クレームガイドライン',
    ],
    retail: [
      'マージン構造確認',
      'プロモーション可否',
      '陳列ポイント案内',
      '棚用POPマテリアル',
      '入店必須書類確認',
    ],
    distributor: [
      '卸売価格表準備',
      'MOQ/リードタイム明記',
      '独占オプション有無',
      '在庫保有ポリシー',
      'リオーダー条件',
    ],
    d2c: [
      'ブランドストーリー強調',
      'オンラインマーケティング資産',
      'カスタマーサービスガイド',
      '決済/配送設定',
    ],
  },
};

// 채널 체크리스트 가져오기
export function getChannelChecklist(language: Language, channel: SalesChannel): string[] {
  const langCode = LANGUAGE_MAP[language] || 'en';
  return TRANSLATED_CHANNEL_CHECKLISTS[langCode][channel] || [];
}

// 제품 정보 번역
export interface ProductInfo {
  veganSunSerum: string;
  aloeSoothingGel: string;
  suncare: string;
  skincare: string;
  sensitiveAcneSkin: string;
  allSkinTypes: string;
}

export const TRANSLATED_PRODUCTS: Record<LanguageCode, ProductInfo> = {
  ko: {
    veganSunSerum: '비건 선세럼 SPF50+',
    aloeSoothingGel: '알로에 수딩젤 300ml',
    suncare: '선케어',
    skincare: '스킨케어',
    sensitiveAcneSkin: '민감성/트러블 피부',
    allSkinTypes: '전 피부타입',
  },
  en: {
    veganSunSerum: 'Vegan Sun Serum SPF50+',
    aloeSoothingGel: 'Aloe Soothing Gel 300ml',
    suncare: 'Sun Care',
    skincare: 'Skin Care',
    sensitiveAcneSkin: 'Sensitive/Acne-prone Skin',
    allSkinTypes: 'All Skin Types',
  },
  zh: {
    veganSunSerum: '纯素防晒精华 SPF50+',
    aloeSoothingGel: '芦荟舒缓凝胶 300ml',
    suncare: '防晒护理',
    skincare: '护肤',
    sensitiveAcneSkin: '敏感/痘痘肌',
    allSkinTypes: '所有肤质',
  },
  ja: {
    veganSunSerum: 'ビーガンサンセラム SPF50+',
    aloeSoothingGel: 'アロエスージングジェル 300ml',
    suncare: 'サンケア',
    skincare: 'スキンケア',
    sensitiveAcneSkin: '敏感肌・トラブル肌',
    allSkinTypes: '全肌タイプ',
  },
};

export function getProductInfo(language: Language): ProductInfo {
  const langCode = LANGUAGE_MAP[language] || 'en';
  return TRANSLATED_PRODUCTS[langCode];
}
