import { useRef, useState, useEffect } from 'react';

export interface WheelOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface WheelPickerProps {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function WheelPicker({ options, value, onChange }: WheelPickerProps) {
  const ITEM_HEIGHT = 44; // 每個選項的高度 (px)
  const VISIBLE_ITEMS = 3;
  const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // 無限循環陣列：將原始選項複製 50 次，保證玩家手勢滑不到盡頭
  const REPEAT_COUNT = 50;
  const repeatedOptions = Array(REPEAT_COUNT).fill(options).flat();
  
  useEffect(() => {
     if (scrollRef.current && options.length > 0) {
        // 初始化時，將起始位置對齊到中間段陣列
        const middleIndex = Math.floor(REPEAT_COUNT / 2) * options.length;
        let targetIndex = middleIndex;
        if (value) {
           const valueIndex = options.findIndex(o => o.value === value);
           if (valueIndex !== -1) targetIndex += valueIndex;
        }
        // 靜默滾動到中間
        scrollRef.current.scrollTop = targetIndex * ITEM_HEIGHT;
        setScrollY(targetIndex * ITEM_HEIGHT);
     }
  // 僅在初始化或名單長度改變時重置，避免滾動中途發生跳動
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
     setScrollY(e.currentTarget.scrollTop);
  };

  // 滾動結束判定與觸發狀態更新
  useEffect(() => {
     const timeout = setTimeout(() => {
        if (options.length === 0) return;
        
        const index = Math.round(scrollY / ITEM_HEIGHT);
        const actualOption = repeatedOptions[index];
        
        // 若選中目標改變，回傳給上層視圖
        if (actualOption && actualOption.value !== value) {
           onChange(actualOption.value);
        }
        
        // 無縫重置防觸底（當滑到太上面或太下面時，瞬間切回中間段相同的選項）
        const totalItems = repeatedOptions.length;
        if (index < options.length * 5 || index > totalItems - options.length * 5) {
            if (scrollRef.current) {
                const middleIndex = Math.floor(REPEAT_COUNT / 2) * options.length + (index % options.length);
                scrollRef.current.scrollTop = middleIndex * ITEM_HEIGHT;
            }
        }
     }, 150); // 150ms 判定為滾動停止 (Snapping 結束)
     
     return () => clearTimeout(timeout);
  }, [scrollY, value, options, repeatedOptions, onChange]);

  if (options.length === 0) {
    return (
      <div className="w-[85%] max-w-[280px] mx-auto h-[132px] flex items-center justify-center text-gray-600 text-xs font-bold border border-gray-800 rounded-xl bg-gray-950/50 tracking-widest shadow-inner">
        ［目前無閒置成員］
      </div>
    );
  }

  return (
    <div 
      className="relative w-[85%] max-w-[280px] mx-auto overflow-hidden rounded-xl border border-gray-800 bg-gray-950/90 shadow-[0_0_15px_rgba(0,0,0,0.8)_inset]" 
      style={{ height: CONTAINER_HEIGHT }}
    >
      {/* 中央選取框 (物理高亮區) */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[44px] bg-gray-800/40 border-y border-gray-600/50 pointer-events-none z-0 shadow-inner"></div>
      
      {/* 滾動容器 (純手勢、內建 Snapping) */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none z-10 overscroll-contain"
        style={{ paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT }}
      >
        {repeatedOptions.map((opt, i) => {
          const offset = i * ITEM_HEIGHT - scrollY;
          const absOffset = Math.abs(offset);
          const isCenter = absOffset < ITEM_HEIGHT / 2;
          
          // 3D 演算 (角度、縮放、透明度)
          const rotateX = Math.max(-60, Math.min(60, (offset / ITEM_HEIGHT) * 35));
          const scale = Math.max(0.75, 1 - (absOffset / ITEM_HEIGHT) * 0.15);
          const opacity = Math.max(0.15, 1 - (absOffset / ITEM_HEIGHT) * 0.6);

          let textColor = isCenter ? 'text-gray-100 text-base drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]' : 'text-gray-500 text-sm';
          if (opt.disabled) {
            textColor = isCenter ? 'text-red-500 text-base drop-shadow-[0_0_5px_rgba(239,68,68,0.6)]' : 'text-red-950/80 text-sm';
          }

          return (
            <div 
              key={`${i}-${opt.value}`}
              className="snap-center flex items-center justify-center w-full px-2 select-none cursor-pointer"
              style={{ 
                height: ITEM_HEIGHT,
                transform: `perspective(400px) rotateX(${rotateX}deg) scale(${scale})`,
                opacity: opacity,
                transition: 'opacity 0.1s ease-out' 
              }}
              onClick={() => {
                 // 點擊非中央的選項時，自動滾動到該選項
                 if (scrollRef.current) scrollRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
              }}
            >
              <span className={`truncate font-bold tracking-widest ${textColor}`}>
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* 上下羽化遮罩 */}
      <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-gray-950 to-transparent pointer-events-none z-20"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-gradient-to-t from-gray-950 to-transparent pointer-events-none z-20"></div>
    </div>
  );
}
