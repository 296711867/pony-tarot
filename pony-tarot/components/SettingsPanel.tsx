import type { Settings, Theme } from '../data/types';
import { getDeck } from '../data/decks';
import { DeckSelector } from './DeckSelector';
import { Icon } from './Icon';
import { AISettings } from './AISettings';
export function ThemeSwitch({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return <div className="theme-switch" role="group" aria-label="外观主题">{(['light', 'dark'] as const).map(value => <button type="button" key={value} aria-label={`${value === 'light' ? '明亮' : '暗色'}主题`} aria-pressed={theme === value} onClick={() => onChange(value)}><Icon name={value === 'light' ? 'sun' : 'sparkle'}/><span>{value === 'light' ? '明亮' : '暗色'}</span></button>)}</div>;
}
export function SettingsPanel({ settings, onChange }: { settings: Settings; onChange: (value: Settings) => void }) {
  const deck = getDeck(settings.deckId);
  return <div><div className="settings-list"><div className="setting-row"><DeckSelector value={deck.id} onChange={deckId => onChange({ ...settings, deckId })}/></div><p className="fine-print">{deck.description} · {deck.supportsReversed ? '支持正逆位' : '本卡组没有逆位'}</p><div className="setting-row"><span><strong>外观主题</strong><small>明亮日景或神秘夜景，按你的喜好选择</small></span><ThemeSwitch theme={settings.theme} onChange={theme => onChange({ ...settings, theme })}/></div><label className="setting-row"><span><strong>轻柔动效</strong><small>云朵、星光与翻牌；系统减少动态效果时自动简化</small></span><input type="checkbox" role="switch" checked={settings.motion} onChange={e => onChange({ ...settings, motion: e.target.checked })}/></label><label className="setting-row"><span><strong>三牌占卜包含逆位</strong><small>默认开启；关闭后只看正位牌义</small></span><input type="checkbox" role="switch" disabled={!deck.supportsReversed} checked={deck.supportsReversed && settings.reversed} onChange={e => onChange({ ...settings, reversed: e.target.checked })}/></label></div><AISettings/><details className="intro-guide"><summary>关于本站</summary><div><p>免费使用，无需登录。抽牌与基础牌义在本地完成；仅主动使用三牌 AI 解读时连接模型。当前不播放背景音乐。</p><p>当前卡组：{deck.name} · {deck.cards.length} 张。不同卡组拥有各自的卡面、牌义和卡背。</p><p className="fine-print">非官方粉丝作品 · 塔罗供娱乐与自我整理参考</p></div></details></div>;
}
