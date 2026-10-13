'use client';
import { useEffect, useState } from 'react';
import type { Panel, Reading, Settings } from '../data/types';
import { getDeck } from '../data/decks';
import { Icon, type IconName } from '../components/Icon';
import { MagicEffects } from '../components/MagicEffects';
import { PanelDialog } from '../components/PanelDialog';
import { ReadingPanel } from '../components/ReadingPanel';
import { LibraryPanel } from '../components/LibraryPanel';
import { JournalPanel } from '../components/JournalPanel';
import { SettingsPanel, ThemeSwitch } from '../components/SettingsPanel';
import { defaults, readHistory, readSettings, writeHistory, writeSettings } from '../lib/storage';

const destinations: { id: Exclude<Panel, null | 'settings'>; title: string; name: string; hint: string; icon: IconName; className: string }[] = [
  { id: 'library', title: '星辰图鉴', name: '金橡图书馆', hint: '78 张牌，78 道心灵之门', icon: 'book', className: 'library' },
  { id: 'reading', title: '三牌占卜', name: '紫悦城堡', hint: '让魔法陪你整理心事', icon: 'cards', className: 'castle' },
  { id: 'daily', title: '今日一牌', name: '甜点屋', hint: '揭开今日的星光寄语', icon: 'sun', className: 'bakery' },
  { id: 'journal', title: '魔法手札', name: '苹果庄园', hint: '珍藏与你相遇的每一道光', icon: 'leaf', className: 'farm' },
];
const panelInfo: Record<Exclude<Panel, null>, { title: string; subtitle: string; icon: IconName }> = {
  daily: { title: '今日一牌', subtitle: 'SUGAR CUBE CORNER', icon: 'sun' },
  reading: { title: '三牌占卜', subtitle: 'TWILIGHT’S CASTLE', icon: 'cards' },
  library: { title: '魔法牌图鉴', subtitle: 'GOLDEN OAK LIBRARY', icon: 'book' },
  journal: { title: '我的魔法记录', subtitle: 'SWEET APPLE ACRES', icon: 'leaf' },
  settings: { title: '小镇设置', subtitle: 'MAKE YOURSELF AT HOME', icon: 'settings' },
};

export default function Home() {
  const [panel, setPanel] = useState<Panel>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [toast, setToast] = useState('');
  useEffect(() => { setSettings(readSettings()); setHistory(readHistory()); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  const save = (reading: Reading) => {
    const next = [reading, ...history.filter(r => r.id !== reading.id)].slice(0, 50);
    try { writeHistory(next); setHistory(next); return true; } catch { return false; }
  };
  const updateHistory = (items: Reading[]) => { try { writeHistory(items); setHistory(items); } catch { setToast('浏览器未能保存更改，请先导出记录。'); } };
  const updateSettings = (next: Settings) => { setSettings(next); try { writeSettings(next); } catch { setToast('设置已生效，本次未能保存到浏览器。'); } };
  const open = (next: Panel) => setPanel(next);
  const motionClass = settings.motion ? '' : ' reduce-motion';
  const deck = getDeck(settings.deckId);
  const scene = settings.theme === 'light' ? 'village' : 'village-night';

  return <main className={`pony-app theme-${settings.theme}${motionClass}${panel ? ' scene-active' : ''}`}>
    <MagicEffects enabled={settings.motion && !panel}/><a className="skip-link" href="#town-navigation">跳到小镇功能</a>
    <header className="site-header"><button className="wordmark" onClick={() => setPanel(null)} aria-label="小马利亚魔法塔罗，回到首页"><span className="brand-star"><Icon name="sparkle"/></span><span><strong>小马利亚<span className="wordmark-light">魔法塔罗</span></strong><small>EQUESTRIA TAROT</small></span></button><div className="header-right"><span className="free-tag"><span/>免费 · 无需登录</span><ThemeSwitch theme={settings.theme} onChange={theme => updateSettings({ ...settings, theme })}/><button className="icon-button settings-button" onClick={() => open('settings')} aria-label="小镇设置"><Icon name="settings"/></button></div></header>
    <section className="village" aria-label="小马镇家园">
      <div className="village-world"><picture className="scene-picture"><source media="(max-width: 700px)" srcSet={`/art/${scene}-tall.webp`}/><img src={`/art/${scene}-wide.webp`} alt={settings.theme === 'light' ? '柔和日光下，粉金色水晶山谷中的小马镇家园。' : '深紫星空与月光下，金橡图书馆、紫悦城堡、甜点屋与苹果庄园亮着温暖窗灯，水晶与萤火照亮小马镇。'} fetchPriority="high"/></picture><div className="scene-wash"/>
        <div className="mist-veil" aria-hidden="true"/>
        <div className="celestial-frame" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="town-title"><span className="title-kicker"><span/> THE MAGIC OF FRIENDSHIP <span/></span><h1>循着星光<span>听见心的回响</span></h1><p>写下问题，让小马为你解读。</p><div className="title-rule" aria-hidden="true"><span/>✧<span/></div></div>
        <div className="cloud cloud-one" aria-hidden="true"/><div className="cloud cloud-two" aria-hidden="true"/>
        <div className="scene-sparkles" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <span key={i} className={i % 4 === 0 ? 'star-point' : 'dust-point'} style={{ left: `${5 + ((i * 17) % 91)}%`, top: `${9 + ((i * 23) % 78)}%`, animationDelay: `${-i * .7}s` }}>✧</span>)}</div>
        <nav id="town-navigation" className="building-navigation" aria-label="小镇建筑入口">{destinations.map(d => <button key={d.id} className={`building-hotspot ${d.className}`} onClick={() => open(d.id)} aria-label={`${d.name}：${d.title}，${d.id === 'library' ? deck.cards.length + ' 张牌，探索每一道指引' : d.hint}`}><span className="building-glow"/><span className="building-label"><span className="label-icon"><Icon name={d.icon}/></span><span><small>{d.name}</small><strong>{d.title}</strong></span><Icon name="arrow" className="label-arrow"/></span></button>)}</nav>
        <div className="pony-guide"><div className="guide-sigil" aria-hidden="true"><span>✧</span><span>✧</span><span>✧</span></div><div className="guide-bubble"><span>“一起找到方向。”</span><small>紫悦</small></div><img src="/art/twilight-guide.webp" alt="温柔微笑的紫悦" className="guide-pony"/></div>
      </div>
      <div className="quick-start"><span className="quick-ornament" aria-hidden="true">✧</span><div><p>今日一牌</p><button className="quick-button" onClick={() => open('daily')}><Icon name="sparkle"/> 抽取今日牌 <Icon name="arrow"/></button><span className="quick-caption">每天一份指引</span></div><span className="quick-ornament" aria-hidden="true">✧</span></div>
    </section>
    <footer className="site-footer"><span>小马利亚</span><span className="footer-center">✧ 友谊是魔法 ✧</span><span>非官方粉丝作品 · 娱乐与自我探索</span></footer>
    {panel && <PanelDialog motion={settings.motion} key={panel} {...panelInfo[panel]} onClose={() => setPanel(null)}>{panel === 'daily' || panel === 'reading' ? <ReadingPanel key={`${panel}-${deck.id}`} deck={deck} kind={panel} settings={settings} onSave={save}/> : panel === 'library' ? <LibraryPanel key={deck.id} deck={deck}/> : panel === 'journal' ? <JournalPanel history={history} onDelete={id => updateHistory(history.filter(r => r.id !== id))} onClear={() => updateHistory([])}/> : <SettingsPanel settings={settings} onChange={updateSettings}/>}</PanelDialog>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
