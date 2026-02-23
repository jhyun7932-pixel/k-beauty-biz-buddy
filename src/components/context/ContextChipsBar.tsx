import React, { useState } from 'react';
import { useAppStore, COUNTRY_NAMES, TargetCountry, SalesChannel } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Globe, 
  ShoppingCart, 
  ArrowRightLeft, 
  Languages, 
  DollarSign,
  ChevronDown,
  Check
} from 'lucide-react';

const ALL_COUNTRIES: TargetCountry[] = ['US', 'JP', 'EU', 'HK', 'TW', 'CN', 'VN', 'ID', 'MY', 'TH', 'AU'];
const CHANNELS: { value: SalesChannel; label: string }[] = [
  { value: '도매', label: '도매 (Wholesale)' },
  { value: '리테일', label: '리테일 (Retail)' },
  { value: 'D2C', label: 'D2C (자사몰)' },
  { value: '아마존', label: '아마존' },
  { value: '틱톡샵', label: '틱톡샵' },
  { value: '오프라인', label: '오프라인' },
];

export function ContextChipsBar() {
  const { project, setProjectConfig } = useAppStore();
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<TargetCountry[]>(project.targetCountries);
  
  const handleCountryToggle = (country: TargetCountry) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, country];
    });
  };
  
  const handleCountrySave = () => {
    setProjectConfig({ targetCountries: selectedCountries });
    setShowCountryDialog(false);
  };
  
  const handleChannelChange = (channel: SalesChannel) => {
    setProjectConfig({ channel });
  };

  return (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {/* Country Chip */}
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 gap-1.5"
        onClick={() => {
          setSelectedCountries(project.targetCountries);
          setShowCountryDialog(true);
        }}
      >
        <Globe className="h-3.5 w-3.5" />
        {project.targetCountries.length > 0 
          ? project.targetCountries.map(c => COUNTRY_NAMES[c]).join(', ')
          : '국가 선택'
        }
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>
      
      {/* Channel Chip */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            {project.channel}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>판매 채널</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CHANNELS.map((ch) => (
            <DropdownMenuItem 
              key={ch.value}
              onClick={() => handleChannelChange(ch.value)}
            >
              {project.channel === ch.value && <Check className="h-4 w-4 mr-2" />}
              {ch.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Trade Stage Badge (Read-only, set via preset) */}
      <Badge variant="secondary" className="h-7 px-2.5 gap-1.5">
        <ArrowRightLeft className="h-3.5 w-3.5" />
        {project.stagePreset === 'FIRST_PROPOSAL' ? '첫제안' : project.stagePreset === 'SAMPLE' ? '샘플' : '본오더'}
      </Badge>
      
      {/* Language Badge */}
      <Badge variant="outline" className="h-7 px-2.5 gap-1.5">
        <Languages className="h-3.5 w-3.5" />
        {project.language}
      </Badge>
      
      {/* Currency Badge */}
      <Badge variant="outline" className="h-7 px-2.5 gap-1.5">
        <DollarSign className="h-3.5 w-3.5" />
        {project.currency}
      </Badge>
      
      {/* Country Selection Dialog */}
      <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>타겟 국가 선택 (최대 3개)</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {ALL_COUNTRIES.map((country) => {
              const isSelected = selectedCountries.includes(country);
              const isDisabled = !isSelected && selectedCountries.length >= 3;
              
              return (
                <div
                  key={country}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => !isDisabled && handleCountryToggle(country)}
                >
                  <Checkbox 
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleCountryToggle(country)}
                  />
                  <span className="font-medium">{COUNTRY_NAMES[country]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedCountries.length}/3 선택됨
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCountryDialog(false)}>
                취소
              </Button>
              <Button onClick={handleCountrySave}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
