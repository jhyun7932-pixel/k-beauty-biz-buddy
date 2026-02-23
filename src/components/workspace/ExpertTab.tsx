import React from 'react';
import { UserCheck, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBanner } from '@/components/ui/StatusBanner';

export function ExpertTab() {
  return (
    <div className="flex flex-col h-full">
      <StatusBanner status="draft" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">전문가에게 확인 요청(선택)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            확인 필요 항목만 전문가에게 점검 요청할 수 있어요.
          </p>
        </div>

        {/* Explainer Card */}
        <div className="card-elevated p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent-violet/10">
              <UserCheck className="h-5 w-5 text-accent-violet" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">전문가 검토란?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                AI가 판단하기 어려운 규제/인증 관련 항목을 전문가가 직접 확인해드립니다.
                검토 결과는 참고용이며 공식 승인을 의미하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Request Items */}
        <div className="card-elevated p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">확인 요청 항목 선택</h4>
          <div className="space-y-2">
            {[
              '성분 규제 적합성 확인',
              '라벨링 요건 검토',
              '인증서 유효성 확인',
              '수입 요건 체크리스트',
            ].map((item, index) => (
              <label 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              검토 결과는 참고용이며, 공식 승인이나 보증을 의미하지 않습니다. 
              최종 결정은 해당 국가 규정에 따라 직접 확인해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border bg-card">
        <Button className="w-full gap-2" size="lg">
          <Send className="h-4 w-4" />
          전문가에게 확인 요청(선택)
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          요청 시 선택한 항목에 대한 전문가 코멘트를 받을 수 있어요
        </p>
      </div>
    </div>
  );
}
