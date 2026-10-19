import { useState } from 'react';
import { ArrowDownRight, ArrowRight, BookOpen, Box, Camera, Check, Cpu, Gamepad2, Headphones, Laptop, Layers3, Maximize2, RotateCcw, Smartphone } from 'lucide-react';
import { lessons, type LearningProgress } from '@/lib/learning';
import { devices, deviceFamilies, type DeviceFamily } from '@/lib/devices';
import type { LevelId } from '@/lib/levels';
const lessonIcons: Record<string, typeof Box> = { inside:Box, graphics:Cpu, memory:Layers3, console:Gamepad2, mobile:Smartphone, imaging:Camera, interaction:Gamepad2, audio:Headphones };

type Props = {
  progress: LearningProgress;
  onStart: (id: string | null) => void;
  onReset: () => void;
  onExplore: (level: LevelId) => void;
};

/** An authored vector diagram, separate from the upstream 3D geometry. */
function ExplodedBoard({ open }: { open: boolean }) {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Inline SVG keeps its editable geometry and accessible title/description.
    <svg viewBox="0 0 620 450" role="img" aria-labelledby="board-title board-description" className={open ? 'learning-diagram is-open' : 'learning-diagram'}>
      <title id="board-title">处理器与主板的分层结构示意</title>
      <desc id="board-description">原创矢量示意图：橙色处理器、封装基板与下方的主板，可切换装配与分层视图。</desc>
      <defs>
        <pattern id="lab-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#d9d5cb" strokeWidth=".7" /></pattern>
      </defs>
      <rect width="620" height="450" fill="url(#lab-grid)" />
      <ellipse cx="320" cy="375" rx="190" ry="28" fill="#d7d3c9" opacity=".6" />
      <g className="diagram-board">
        <path d="M90 282L302 175L535 292L323 405Z" fill="#202f2b" stroke="#172822" strokeWidth="2" />
        <path d="M90 282v12l233 124v-13ZM323 405l212-113v12L323 418Z" fill="#15241f" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${133+i*12} ${284+i*6}l60-31 45 23 85-43`} stroke="#789784" strokeWidth="1.4" fill="none" opacity=".6" />)}
        <path d="M338 211l141 71-15 8-141-71Z" fill="#ecd6a0" />
        <path d="M321 224l141 71-15 8-141-71Z" fill="#ecd6a0" />
        <path d="M146 296l33-17 76 39-33 17Z" fill="#415b4e" stroke="#94b69d" />
        <path d="M242 348l35-19 41 21-35 19Z" fill="#acb9b1" />
        <circle cx="316" cy="391" r="4" fill="#edddbd" /><circle cx="113" cy="283" r="4" fill="#edddbd" />
        <circle cx="302" cy="190" r="4" fill="#edddbd" /><circle cx="513" cy="292" r="4" fill="#edddbd" />
      </g>
      <g className="diagram-connections" stroke="#a6a194" strokeDasharray="4 5" fill="none"><path d="M229 235V113M310 278V156M398 232V111" /></g>
      <g className="diagram-package">
        <path d="M217 218l92-47 104 52-94 49Z" fill="#415b4e" stroke="#74927f" strokeWidth="2" />
        <path d="M217 218v9l102 53v-8ZM319 272l94-49v8l-94 49Z" fill="#253b2f" />
        {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${233+i*10} ${232+i*5}v12M${335+i*10} ${262-i*5}v10`} stroke="#e6c27c" strokeWidth="3" />)}
      </g>
      <g className="diagram-chip">
        <path d="M235 198l73-38 84 42-74 40Z" fill="#f06a3c" stroke="#a33f21" strokeWidth="2" />
        <path d="M235 198v12l83 44v-12ZM318 242l74-40v12l-74 40Z" fill="#b84623" />
        <path d="M258 196l51-26 59 30-51 28Z" fill="#ff936b" stroke="#ffc5aa" />
        <text x="311" y="203" textAnchor="middle" fill="#6f2d17" fontSize="11" fontFamily="monospace" transform="rotate(27 311 203)">ZLN / CORE</text>
      </g>
      <g fontFamily="monospace" fontSize="10" fill="#69685f"><text x="27" y="36">FIG. 001 / EXPLODED STRUCTURE</text><text x="27" y="424">ILLUSTRATIVE • NOT TO SCALE</text></g>
    </svg>
  );
}

export default function LearningHome({ progress, onStart, onReset, onExplore }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [family, setFamily] = useState<DeviceFamily>('全部');
  const total = lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0);
  const last = lessons.find((lesson) => lesson.steps.some((step) => step.id === progress[progress.length - 1]));
  const next = last?.steps.some((step) => !progress.includes(step.id)) ? last : lessons.find((lesson) => lesson.steps.some((step) => !progress.includes(step.id))) ?? lessons[0];
  return (
    <main className="learning-home">
      <aside className="academy-rail">
        <a href="/" className="academy-logo" aria-label="零点硬件实验室首页"><span>z<span>·</span></span><strong>零点<br />硬件实验室</strong></a>
        <div className="rail-section">WORKSPACE / 工作空间</div>
        <a className="rail-item active" href="#devices"><Box size={18} />数码设备<span>{String(devices.length).padStart(2,'0')}</span></a>
        <a className="rail-item" href="#courses"><BookOpen size={18} />实验课程<span>{String(lessons.length).padStart(2,'0')}</span></a>
        <button className="rail-item" onClick={() => onStart(null)}><Box size={18} />自由拆解<ArrowRight size={15} /></button>
        <a className="rail-item" href="/guide/zh-CN.html"><Layers3 size={18} />操作手册<ArrowRight size={15} /></a>
        <div className="rail-note"><span className="tiny-label">LEARN BY TAKING APART</span><p>不只看见零件。<br />更看懂它们如何协作。</p><span className="rail-dots">● ○ ○</span></div>
        <footer className="rail-credit">学习体验与数码模型 · zln<br /><a href="https://github.com/Yoosseph/pc-anatomy" target="_blank" rel="noreferrer">电脑模型基于 PC Anatomy ↗</a></footer>
      </aside>
      <div className="academy-content">
        <header className="academy-top"><span>探索 / <strong>硬件学习台</strong></span><span className="local-badge"><i />进度保存在此浏览器</span></header>
        <section className="academy-hero" aria-labelledby="academy-title">
          <div className="hero-copy"><div className="tiny-label"><span className="orange-square" />从电脑到掌心数码</div><h1 id="academy-title">拆开数码产品，<br />看懂背后的<span>原理。</span></h1><p>电脑、游戏主机、手机、相机与音频设备。<br />带着问题拆解，让结构变得可以理解。</p><button className="academy-primary" onClick={() => onStart(next.id)}>{progress.length ? '继续我的实验' : '开始第一个实验'}<ArrowRight size={19} /></button><span className="hero-caption">{devices.length} 台参考设备 · {lessons.length} 条学习路径 · {total} 个互动实验</span></div>
          <div className="hero-illustration"><ExplodedBoard open={expanded} /><button className="diagram-toggle" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}><Layers3 size={15} />{expanded ? '收起结构' : '展开结构'}</button><span className="diagram-label">01 — 从连接开始理解</span></div>
        </section>
        <section className="device-section" id="devices" aria-labelledby="devices-title"><div className="section-line"><div><span className="tiny-label">数码设备库 / 选择一台开始拆解</span><h2 id="devices-title">不止电脑，还能拆什么？</h2></div><span className="device-scope">公开资料参考 · 教学示意结构</span></div><div className="device-filters" role="tablist" aria-label="设备分类">{deviceFamilies.map((item)=><button role="tab" aria-selected={family===item} key={item} onClick={()=>setFamily(item)}>{item}</button>)}</div><div className="device-grid">{devices.filter((device)=>family==='全部'||device.family===family).map((device)=>{ const Icon = device.level==='phone'?Smartphone:device.level==='camera'?Camera:device.level==='earbuds'?Headphones:device.family==='游戏'?Gamepad2:device.level==='pc'?Cpu:Laptop; return <button className="device-card" key={device.level} onClick={()=>onExplore(device.level)} data-device={device.level}><span className={`device-art device-art-${device.family}`}><Icon size={41} strokeWidth={1.1}/><span>{device.family}</span></span><strong>{device.name}</strong><span className="device-model">{device.model}</span><span className="device-note">{device.note}</span><span className="device-launch">打开三维拆解<ArrowRight size={14}/></span></button>; })}</div></section>
        <section className="course-section" id="courses" aria-labelledby="courses-title">
          <div className="section-line"><div><span className="tiny-label">CHOOSE YOUR EXPERIMENT</span><h2 id="courses-title">今天，想拆懂什么？</h2></div><button className="text-action" onClick={() => onStart(null)}>直接进入自由拆解<ArrowDownRight size={17} /></button></div>
          <div className="course-grid">{lessons.map((lesson, index) => {
            const done = lesson.steps.filter((step) => progress.includes(step.id)).length;
            const Icon = lessonIcons[lesson.id] ?? [Box, Cpu, Layers3][index%3];
            return <button className={`course-card ${lesson.color}`} key={lesson.id} onClick={() => onStart(lesson.id)}><div className="course-card-top"><span className="course-number">实验 / {lesson.number}</span><span className="course-icon"><Icon size={27} strokeWidth={1.3} /></span></div><span className="course-tag">{lesson.tag}</span><h3>{lesson.title}</h3><p>{lesson.subtitle}</p><div className="course-footer"><span>{done === lesson.steps.length ? <><Check size={14} />已完成 · 可复习</> : `${done} / ${lesson.steps.length} 个实验`}</span><ArrowRight size={19} /></div><span className="course-progress" style={{ width: `${done / lesson.steps.length * 100}%` }} /></button>;
          })}</div>
        </section>
        <section className="learning-journal" aria-label="学习进度"><div className="journal-symbol"><BookOpen size={22} /></div><div><h2>每拆懂一点，都算数。</h2><p>完成观察与知识检查后，实验记录会留在这里。</p></div><div className="journal-total"><strong>{String(progress.length).padStart(2, '0')}</strong><span>/ {String(total).padStart(2, '0')} 实验完成</span></div><progress className="journal-track" aria-label="总学习进度" max={total} value={progress.length} /></section>
        <footer className="academy-footer"><span>零点硬件实验室 / 通过探索理解技术</span>{resetConfirm ? <span className="reset-confirm">清除这台浏览器的学习进度？<button onClick={() => { onReset(); setResetConfirm(false); }}>确认清除</button><button onClick={() => setResetConfirm(false)}>取消</button></span> : <button onClick={() => setResetConfirm(true)} disabled={!progress.length}><RotateCcw size={12} />重置学习记录</button>}<a href="https://github.com/Yoosseph/pc-anatomy" target="_blank" rel="noreferrer">模型来源与 MIT 许可<Maximize2 size={12} /></a></footer>
      </div>
    </main>
  );
}
