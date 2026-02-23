import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { DealStatusStage } from '@/types/onboarding';

interface FinalizeResult {
  success: boolean;
  documentId?: string;
  nextFollowUpDate?: Date;
  error?: string;
}

// 거래 단계별 추천 후속 일자 계산 (영업일 기준)
function calculateRecommendedFollowUpDate(
  tradeStage: string,
  documentType: string
): Date {
  const today = new Date();
  let daysToAdd = 3; // 기본 3일

  // 거래 단계에 따른 후속 일자 추천
  switch (tradeStage) {
    case 'first_proposal':
      daysToAdd = 3; // 첫 제안 후 3일
      break;
    case 'sample':
      daysToAdd = 7; // 샘플 발송 후 7일
      break;
    case 'main_order':
      daysToAdd = 5; // 본오더 제안 후 5일
      break;
    case 'reorder':
      daysToAdd = 14; // 재주문은 2주
      break;
    default:
      daysToAdd = 3;
  }

  // 문서 타입에 따른 조정
  if (documentType === 'pi' || documentType === 'contract') {
    daysToAdd = Math.max(daysToAdd, 5); // PI/계약서는 최소 5일
  } else if (documentType === 'email_pack') {
    daysToAdd = Math.min(daysToAdd, 2); // 이메일은 2일 내 후속
  }

  const followUpDate = new Date(today);
  followUpDate.setDate(followUpDate.getDate() + daysToAdd);
  
  // 주말 건너뛰기
  const dayOfWeek = followUpDate.getDay();
  if (dayOfWeek === 0) followUpDate.setDate(followUpDate.getDate() + 1); // 일요일 → 월요일
  if (dayOfWeek === 6) followUpDate.setDate(followUpDate.getDate() + 2); // 토요일 → 월요일

  return followUpDate;
}

// 거래 단계 업그레이드 추천
function getRecommendedStageUpgrade(
  currentStage: DealStatusStage,
  documentType: string
): DealStatusStage | null {
  // 문서 발송 시 단계 자동 업그레이드 추천
  if (documentType === 'onepager' || documentType === 'catalog' || documentType === 'deal_sheet') {
    if (currentStage === 'lead') return 'contacted';
  }
  
  if (documentType === 'pi') {
    if (currentStage === 'sample' || currentStage === 'replied') return 'negotiation';
  }
  
  if (documentType === 'contract') {
    if (currentStage === 'negotiation') return 'won';
  }

  return null;
}

export function useDocumentFinalize() {
  const { user } = useAuth();

  /**
   * 문서 최종 확정 시 CRM 자동 기록
   * - documents 테이블 상태 업데이트 (draft → final)
   * - deals 테이블의 doc_refs 업데이트
   * - buyer_interactions에 발송 기록 추가
   * - buyers의 next_follow_up_date 업데이트
   */
  const finalizeDocument = useCallback(async (
    documentId: string,
    buyerId?: string,
    dealId?: string,
    options?: {
      autoUpdateFollowUp?: boolean;
      autoUpgradeStage?: boolean;
      interactionType?: 'email' | 'call' | 'meeting' | 'chat';
      subject?: string;
    }
  ): Promise<FinalizeResult> => {
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    try {
      // 1. 문서 정보 조회
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        return { success: false, error: '문서를 찾을 수 없습니다' };
      }

      const documentType = doc.type;
      const documentTitle = doc.title;

      // 2. 문서 상태를 'final'로 업데이트
      const { error: updateDocError } = await supabase
        .from('documents')
        .update({ 
          status: 'final',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateDocError) {
        console.error('문서 상태 업데이트 실패:', updateDocError);
      }

      // 3. 딜이 있으면 doc_refs에 추가
      const targetDealId = dealId || doc.deal_id;
      if (targetDealId) {
        const { data: deal } = await supabase
          .from('deals')
          .select('doc_refs, trade_stage_enum')
          .eq('id', targetDealId)
          .single();

        if (deal) {
          const existingRefs = (deal.doc_refs as string[]) || [];
          if (!existingRefs.includes(documentId)) {
            await supabase
              .from('deals')
              .update({ 
                doc_refs: [...existingRefs, documentId],
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', targetDealId);
          }
        }
      }

      // 4. 바이어가 있으면 인터랙션 기록 + 후속 일자 업데이트
      const targetBuyerId = buyerId || doc.buyer_id;
      let nextFollowUpDate: Date | undefined;

      if (targetBuyerId) {
        // 인터랙션 기록 추가
        await supabase
          .from('buyer_interactions')
          .insert({
            buyer_id: targetBuyerId,
            user_id: user.id,
            interaction_type: options?.interactionType || 'email',
            subject: options?.subject || `[문서 발송] ${documentTitle}`,
            message_snippet: `${documentType} 문서가 최종 확정되어 발송되었습니다.`,
            sent_at: new Date().toISOString(),
          });

        // 후속 일자 추천 및 업데이트
        if (options?.autoUpdateFollowUp !== false) {
          const sourceContext = doc.source_context as Record<string, unknown> | null;
          const tradeStage = (sourceContext?.tradeStage as string) || 'first_proposal';
          nextFollowUpDate = calculateRecommendedFollowUpDate(
            tradeStage as string, 
            documentType
          );

          await supabase
            .from('buyers')
            .update({ 
              next_follow_up_date: nextFollowUpDate.toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', targetBuyerId);
        }

        // 단계 자동 업그레이드
        if (options?.autoUpgradeStage !== false) {
          const { data: buyer } = await supabase
            .from('buyers')
            .select('status_stage')
            .eq('id', targetBuyerId)
            .single();

          if (buyer) {
            const currentStage = buyer.status_stage as DealStatusStage;
            const recommendedStage = getRecommendedStageUpgrade(currentStage, documentType);
            
            if (recommendedStage) {
              await supabase
                .from('buyers')
                .update({ 
                  status_stage: recommendedStage,
                  updated_at: new Date().toISOString()
                })
                .eq('id', targetBuyerId);
            }
          }
        }
      }

      // 5. 활동 로그 기록
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'document_finalized',
          entity_type: 'document',
          entity_id: documentId,
          metadata: {
            document_type: documentType,
            document_title: documentTitle,
            buyer_id: targetBuyerId,
            deal_id: targetDealId,
            next_follow_up_date: nextFollowUpDate?.toISOString(),
          }
        });

      return {
        success: true,
        documentId,
        nextFollowUpDate,
      };
    } catch (error: any) {
      console.error('문서 최종 확정 오류:', error);
      return {
        success: false,
        error: error.message || '알 수 없는 오류가 발생했습니다',
      };
    }
  }, [user]);

  /**
   * 문서 발송 시 후속 일자 추천만 조회
   */
  const getRecommendedFollowUpDate = useCallback((
    tradeStage: string,
    documentType: string
  ): Date => {
    return calculateRecommendedFollowUpDate(tradeStage, documentType);
  }, []);

  return {
    finalizeDocument,
    getRecommendedFollowUpDate,
  };
}
