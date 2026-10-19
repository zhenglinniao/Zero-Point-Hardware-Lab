import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Eye, RotateCcw } from 'lucide-react';
import type { Lesson, LearningProgress } from '@/lib/learning';
import type { ExplorerState } from '@/lib/explorer-state';

type Props = {
  lesson: Lesson;
  index: number;
  progress: LearningProgress;
  state: ExplorerState;
  ready: boolean;
  saved: boolean;
  onComplete: (id: string) => void;
  onStep: (index: number) => void;
  onRestore: () => void;
  onHome: () => void;
};

export default function LessonCoach({ lesson, index, progress, state, ready, saved, onComplete, onStep, onRestore, onHome }: Props) {
  const step = lesson.steps[index];
  const [answer, setAnswer] = useState<number | null>(null);
  const observed = ready && state.level === step.level && Math.round(state.explode) >= step.minimumOpen;
  const completed = progress.includes(step.id);
  const correct = answer === step.answer;
  const allDone = lesson.steps.every((item) => progress.includes(item.id));
  return <div className="lesson-coach">
    <button className="coach-back" onClick={onHome}><ArrowLeft size={14} />所有实验</button>
    <div className="tiny-label">EXPERIMENT {lesson.number}</div><h2>{lesson.title}</h2>
    <nav className="lesson-steps" aria-label="实验步骤">{lesson.steps.map((item, i) => <button key={item.id} aria-label={`第 ${i + 1} 步：${item.title}`} aria-current={i === index ? 'step' : undefined} onClick={() => onStep(i)}><span>{progress.includes(item.id) ? <Check size={13} /> : i + 1}</span><span>{item.title}</span></button>)}</nav>
    <div className="coach-content"><span className="tiny-label">当前任务 / {String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.intro}</p>
      <div className={`observe-task ${observed ? 'is-done' : ''}`}><div>{observed ? <CheckCircle2 size={17} /> : <Eye size={17} />}<strong>{observed ? '观察条件已达成' : '动手观察'}</strong></div><p>{step.observe}</p>{state.level !== step.level && <button onClick={onRestore}><RotateCcw size={13} />回到本实验模型</button>}</div>
      <fieldset className="knowledge-check"><legend>想一想 · {step.question}</legend>{step.options.map((option, i) => <button key={option} className={answer === i ? (correct ? 'answer-correct' : 'answer-wrong') : ''} aria-pressed={answer === i} disabled={!observed} onClick={() => { setAnswer(i); if (i === step.answer) onComplete(step.id); }}><span>{answer === i && correct ? <Check size={13} /> : String.fromCharCode(65 + i)}</span>{option}</button>)}</fieldset>
      {!observed && <p className="coach-hint">先完成上方观察，知识检查就会解锁。</p>}
      {answer !== null && <div className={`answer-feedback ${correct ? 'correct' : ''}`} aria-live="polite" aria-atomic="true"><strong>{correct ? '理解到位！' : '再观察一下。'}</strong><p>{correct ? step.explanation : '可以继续旋转或点选模型，读一读部件资料，再试一次。'}</p></div>}
      {completed && answer === null && <p className="completed-note"><CheckCircle2 size={15} />这一步已完成，可以再次答题复习。</p>}
      {allDone && <div className="lesson-finished"><CheckCircle2 size={21} /><strong>这条路径，你已经拆懂了。</strong><p>回到首页，继续探索下一个主题。</p></div>}
    </div>
    <div className="coach-actions"><button onClick={() => index === lesson.steps.length - 1 ? onHome() : onStep(index + 1)} disabled={!completed}>{index === lesson.steps.length - 1 ? '返回学习台' : '下一个实验'}<ArrowRight size={17} /></button><span>{saved ? <><Circle size={7} fill="currentColor" />学习进度自动保存</> : '浏览器存储不可用，本次进度仅暂存在页面中'}</span></div>
  </div>;
}
