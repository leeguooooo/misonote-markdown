'use client';

import { useImmersive } from './ImmersiveReader';
import { useEffect, useRef } from 'react';

interface ImmersiveWrapperProps {
  children: React.ReactNode;
}

export default function ImmersiveWrapper({ children }: ImmersiveWrapperProps) {
  const { settings } = useImmersive();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.isImmersive && contentRef.current) {
      // 克隆内容到沉浸式容器
      const immersiveContainer = document.getElementById('immersive-container');
      if (immersiveContainer) {
        immersiveContainer.innerHTML = '';
        const clonedContent = contentRef.current.cloneNode(true) as HTMLElement;
        clonedContent.className = 'immersive-content';
        immersiveContainer.appendChild(clonedContent);
      }
    }
  }, [settings.isImmersive, children]);

  return (
    <>
      <div ref={contentRef} className={settings.isImmersive ? 'hidden' : ''}>
        {children}
      </div>
      
      {settings.isImmersive && (
        <div className="immersive-reading">
          <div 
            id="immersive-container"
            className="immersive-content"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              maxWidth: `${settings.maxWidth}px`,
            }}
          />
        </div>
      )}
    </>
  );
}
