import logoIcon from '@/assets/logo-icon.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoIcon} 
        alt="AgroData Nexus" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold text-gradient-gold leading-tight">
            AgroData Nexus
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            Verde Futuro Capital
          </span>
        </div>
      )}
    </div>
  );
}
