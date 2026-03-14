import React from 'react';

interface SectionHeaderProps {
  number: string;
  title: string;
  isLightMode?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ number, title, isLightMode }) => {
  const textColor = isLightMode ? 'text-black' : 'text-white';
  const borderColor = isLightMode ? 'border-black/20' : 'border-white/20';
  const subLabelColor = isLightMode ? 'text-black/40' : 'text-white/40';

  return (
    <div className={`group mb-12 md:mb-24 border-t-2 pt-6 md:pt-10 ${borderColor} relative overflow-hidden`}>
      <div className="flex items-baseline gap-4 md:gap-6">
        <span className={`font-serif-elegant italic text-4xl md:text-8xl text-[var(--brand-primary)] transition-all group-hover:skew-x-[-12deg]`}>{number}</span>
        <div className="flex flex-col">
          <h2 className={`font-serif-display text-2xl md:text-7xl uppercase tracking-tighter font-black ${textColor} leading-none`}>
            {title}
          </h2>
          <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-4">
            <div className={`h-px w-12 md:w-24 bg-current opacity-30 ${textColor}`} />
            <span className={`text-[7px] md:text-[10px] uppercase tracking-[0.5em] md:tracking-[1em] font-black ${subLabelColor}`}>Specification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
