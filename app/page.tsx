'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { lessonFromSearch, readProgress, saveProgress, type LearningProgress } from '@/lib/learning';
import LearningHome from './learning-home';
import './learning.css';

const Lab = lazy(() => import('./lab'));

export default function Home() {
  const [entered, setEntered] = useState(() => new URLSearchParams(location.search).has('scale') || !!lessonFromSearch(location.search));
  const [lessonId, setLessonId] = useState<string | null>(() => lessonFromSearch(location.search)?.id ?? null);
  const [progress, setProgress] = useState<LearningProgress>(readProgress);
  const [saved, setSaved] = useState(true);
  const home = () => { history.replaceState(null, '', location.pathname); setEntered(false); };
  useEffect(() => { if (!entered) document.title = '零点硬件实验室 · 拆开，才能看懂'; }, [entered]);
  useEffect(() => {
    const followHistory = () => {
      const lesson = lessonFromSearch(location.search);
      setEntered(new URLSearchParams(location.search).has('scale') || !!lesson);
      setLessonId(lesson?.id ?? null);
    };
    window.addEventListener('popstate', followHistory);
    return () => window.removeEventListener('popstate', followHistory);
  }, []);
  const persist = (next: LearningProgress) => { setProgress(next); setSaved(saveProgress(next)); };
  if (!entered) return <LearningHome progress={progress}
    onStart={(id) => { history.replaceState(null, '', location.pathname + (id ? `?lesson=${id}` : '?scale=pc')); setLessonId(id); setEntered(true); }}
    onExplore={(level) => { history.replaceState(null,'',location.pathname+`?scale=${level}`); setLessonId(null); setEntered(true); }}
    onReset={() => persist([])} />;
  return <Suspense fallback={<div className="lab-route-loading">正在打开三维实验台…</div>}><Lab
    key={lessonId ?? 'free'} lessonId={lessonId} progress={progress} saved={saved}
    onComplete={(id) => { if (!progress.includes(id)) persist([...progress, id]); }} onHome={home}
    onFree={() => { const params = new URLSearchParams(location.search); params.delete('lesson'); history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : '?scale=pc')); setLessonId(null); }}
  /></Suspense>;
}
