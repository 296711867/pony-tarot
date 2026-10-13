'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { MagicEffects } from './MagicEffects';

export function PanelDialog({ title, subtitle, icon, onClose, children, motion }: { title: string; subtitle: string; icon: IconName; onClose: () => void; children: React.ReactNode; motion: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (timer.current) return;
    if (!motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    setClosing(true); timer.current = setTimeout(onClose, 320);
  };
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.querySelector<HTMLElement>('h2')?.focus();
    return () => { if (timer.current) clearTimeout(timer.current); if (dialog?.open) dialog.close(); document.body.style.overflow = overflow; if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`panel-dialog immersive-panel${closing ? ' is-leaving' : ''}`} aria-labelledby="panel-title" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="scene-aurora" aria-hidden="true"/><div className="scene-orbit" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
    <MagicEffects enabled={motion && !closing}/>
    <div className="panel-top"><div className="panel-heading"><span className="panel-symbol"><Icon name={icon}/></span><div><p className="eyebrow">{subtitle}</p><h2 id="panel-title" tabIndex={-1}>{title}</h2></div></div><button className="scene-return" onClick={close} aria-label="关闭并回到小马镇"><Icon name="home"/><span>回到小镇</span><span className="return-shortcut" aria-hidden="true">ESC</span></button></div>
    <div className="panel-content">{children}</div>
    <div className="panel-foot"><span>✧ 友谊是魔法</span><button className="text-button" onClick={close}>回到小镇</button></div>
  </dialog>;
}
