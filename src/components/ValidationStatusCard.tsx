import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { ValidationState } from '@/types/validation';

interface ValidationStatusCardProps {
  validationState: ValidationState;
  message: string;
}

const ValidationStatusCard: React.FC<ValidationStatusCardProps> = ({
  validationState,
  message
}) => {
  const getStateClasses = () => {
    switch (validationState) {
      case 'approved':
        return 'bg-gradient-success shadow-success border-success';
      case 'rejected':
        return 'bg-gradient-error shadow-error border-error';
      case 'error':
        return 'bg-warning/10 shadow-lg border-warning';
      case 'blocked':
        return 'bg-red-500/20 shadow-lg border-red-500 animate-pulse';
      default:
        return 'bg-gradient-subtle shadow-industrial border-primary/20';
    }
  };

  const getIcon = () => {
    const iconClass = "w-full h-full";
    switch (validationState) {
      case 'approved':
        return <CheckCircle className={`${iconClass} text-success-foreground`} />;
      case 'rejected':
        return <XCircle className={`${iconClass} text-error-foreground`} />;
      case 'error':
        return <ScanLine className={`${iconClass} text-warning-foreground`} />;
      case 'blocked':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <ScanLine className={`${iconClass} text-primary animate-pulse`} />;
    }
  };

  const getTextColor = () => {
    switch (validationState) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      case 'blocked':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <Card className={`p-4 md:p-6 transition-all duration-500 shadow-colormaq bg-primary/80 border-white/10 ${getStateClasses()}`}>
      <div className="flex flex-col items-center space-y-3 md:space-y-4">
        <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
          {getIcon()}
        </div>
        <h2 className={`text-xl md:text-2xl font-bold text-center px-2 ${getTextColor()}`}>
          {message}
        </h2>
      </div>
    </Card>
  );
};

export default ValidationStatusCard;