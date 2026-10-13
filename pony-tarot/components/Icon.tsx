export type IconName = 'sparkle' | 'sun' | 'cards' | 'book' | 'leaf' | 'settings' | 'close' | 'arrow' | 'home' | 'download' | 'heart';
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href={`/icons/magic.svg#${name}`}/></svg>;
}
