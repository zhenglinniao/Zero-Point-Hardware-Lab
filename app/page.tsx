'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, EyeOff, Info, Layers3, Search } from 'lucide-react';
import { lessons, readProgress, resumeStep, saveProgress, type LearningProgress } from '@/lib/learning';
import { levelPath } from '@/lib/levels';
import { useExplorer } from './use-explorer';
import { useFirstVisitHint } from './use-first-visit-hint';
import Viewer from './viewer';
import PerformanceTip from './performance-tip';
import LearningHome from './learning-home';
import LessonCoach from './lesson-coach';
import './learning.css';
import ScaleNav from './scale-nav';
import SystemsList from './systems-list';
import StageHeading from './stage-heading';
import StageTools from './stage-tools';
import Disassembly from './disassembly';
import SearchDialog from './search-dialog';
import DetailPanel from './detail-panel';
import AboutDialog from './about-dialog';
import ComparisonWorkbench from './comparison-workbench';

export default function Home() {
  const [entered, setEntered] = useState(() => new URLSearchParams(location.search).has('scale'));
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LearningProgress>(readProgress);
  const [saved, setSaved] = useState(true);
  const home = () => {
    history.replaceState(null, '', location.pathname);
    setEntered(false);
  };
  useEffect(() => {
    if (!entered) document.title = '零点硬件实验室 · 拆开，才能看懂';
  }, [entered]);
  const persist = (next: LearningProgress) => { setProgress(next); setSaved(saveProgress(next)); };
  if (!entered) return <LearningHome progress={progress} onStart={(id) => { setLessonId(id); setEntered(true); }} onReset={() => persist([])} />;
  return <Lab key={lessonId ?? 'free'} lessonId={lessonId} progress={progress} saved={saved} onComplete={(id) => { if (!progress.includes(id)) persist([...progress, id]); }} onHome={home} onFree={() => setLessonId(null)} />;
}

type LabProps = { lessonId: string | null; progress: LearningProgress; saved: boolean; onComplete: (id: string) => void; onHome: () => void; onFree: () => void };

function Lab({ lessonId, progress, saved, onComplete, onHome, onFree }: LabProps) {
  const explorer = useExplorer();
  const lesson = lessons.find((item) => item.id === lessonId);
  const [stepIndex, setStepIndex] = useState(() => lesson ? resumeStep(lesson, progress) : 0);
  const { state, selected, logical, layers, selectConcept, choose, navigate } =
    explorer;
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [mode, setMode] = useState<'explorer' | 'comparison'>('explorer'),
    // `null` until the viewer has reported for the first time. Zero means the
    // viewer is running and nothing is switched on, which is a different thing
    // to say to the reader, and saying the wrong one was what put "No
    // structures visible" on screen for the whole of a cold load.
    [count, setCount] = useState<number | null>(null);

  const step = lesson?.steps[stepIndex];
  const { goTo } = explorer;
  useEffect(() => {
    if (step) {
      setCount(null);
      goTo({ level: step.level, selection: null, explode: 0 });
    }
  }, [step, goTo]);

  const { hint, dismissHint } = useFirstVisitHint(
    state,
    count !== null && count > 0,
  );

  /** Jump to a component, closing the palette if that is where it came from. */
  const selectResult = useCallback(
    (id: string) => {
      selectConcept(id);
      setSearch(false);
      setQuery('');
    },
    [selectConcept],
  );

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      // A key pressed while nothing is focused reports the document, not an
      // element, and on some soft keyboards the target is the window itself.
      // Reaching for closest() on either throws out of the handler.
      const el = event.target;
      if (
        el instanceof Element &&
        el.closest('input,textarea,[contenteditable=true]')
      )
        return;
      if (search || about) return;
      if (event.key === '/') {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === 'Escape') choose(null);
      if (event.key === 'Backspace') {
        const currentPath = levelPath(state.level);
        if (currentPath.length > 1) {
          event.preventDefault();
          navigate(currentPath[currentPath.length - 2]);
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [about, choose, navigate, search, state.level]);

  if (mode === 'comparison')
    return (
      <ComparisonWorkbench
        onExit={() => {
          setMode('explorer');
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>('.compare-button')
              ?.focus(),
          );
        }}
      />
    );

  return (
    <main
      className={
        'workbench zln-lab' +
        (lesson ? ' lesson-mode' : '') +
        (selected ? ' has-selection' : '') +
        (logical ? ' logical' : '')
      }
    >
      <header className="lab-header">
        <button className="lab-home" onClick={onHome} aria-label="返回学习台"><span className="lab-mark">z·</span><strong>零点硬件实验室<small>ZERO POINT / HARDWARE LAB</small></strong></button>
        <span className="lab-breadcrumb">学习台 <span>/</span> {lesson?.title ?? '自由拆解'}</span>
        <div className="lab-header-actions"><button className="lab-task-toggle" onClick={() => explorer.setLayers(!layers)} aria-expanded={layers} aria-label="展开实验面板"><Layers3 size={18} /><span>{lesson ? '任务' : '层级'}</span></button>{lesson && <button onClick={onFree} className="lab-free">自由探索<ArrowLeft size={13} /></button>}<button onClick={() => setSearch(true)} aria-label="Find a component"><Search size={17} /><span>检索部件</span><kbd>/</kbd></button><button onClick={() => setAbout(true)} aria-label="About and sources"><Info size={18} /></button></div>
      </header>
      <PerformanceTip ready={count !== null && count > 0} />
      {layers && (
        // Without this the drawer floats over a live 3-D view: a tap meant to
        // dismiss it lands in the scene and selects whatever was behind it.
        <button
          className="drawer-scrim"
          aria-label="Close systems"
          onClick={() => explorer.setLayers(false)}
        />
      )}
      <aside
        className={'explorer' + (layers ? ' mobile-open' : '')}
        aria-label="System visibility"
      >
        {lesson ? <LessonCoach key={step?.id} lesson={lesson} index={stepIndex} progress={progress} state={state} ready={count !== null && count > 0} saved={saved} onComplete={onComplete} onStep={(index) => { setStepIndex(index); explorer.setLayers(false); }} onRestore={() => step && goTo({ level: step.level, selection: null, explode: 0 })} onHome={onHome} /> : <><ScaleNav
          level={state.level}
          shownMenu={explorer.shownMenu}
          shownSubmenu={explorer.shownSubmenu}
          onOpenMenu={explorer.showMenu}
          onOpenSubmenu={explorer.showSubmenu}
          onNavigate={navigate}
          onCompare={() => setMode('comparison')}
          onClose={() => explorer.setLayers(false)}
        />
        <SystemsList
          level={state.level}
          visible={state.visible}
          hidden={state.hidden}
          onToggleCategory={explorer.toggleCategory}
          onToggleAll={explorer.toggleAllCategories}
          onSetConceptVisible={explorer.setConceptVisible}
          onSelectConcept={selectResult}
        />
        </>}
      </aside>
      {lesson && step ? <section className="stage-heading lab-stage-heading"><div><span className="tiny-label"><BookOpen size={12} />实验 {lesson.number} / 步骤 {stepIndex + 1}</span><h1>{step.title}</h1></div><span className="stage-model-note">拖动旋转 · 滚轮缩放 · 右键查看资料</span></section> : <StageHeading
        level={state.level}
        explode={state.explode}
        logical={logical}
        selected={selected}
        count={count}
        hint={hint}
        onDismissHint={dismissHint}
        onNavigate={navigate}
      />}
      <Viewer
        state={state}
        loading={count === null}
        onSelect={choose}
        onCount={setCount}
        onDived={explorer.arrive}
      />
      {count === 0 && (
        <div className="empty-scene">
          <EyeOff size={27} />
          <h3>No structures visible</h3>
          <button onClick={explorer.showEverything}>Show all systems</button>
        </div>
      )}
      <StageTools
        view={state.view}
        level={state.level}
        explode={state.explode}
        logical={logical}
        airflow={state.airflow}
        hidden={state.hidden}
        hiddenMenuOpen={explorer.hiddenMenuOpen}
        onToggleHiddenMenu={() => explorer.setHiddenMenuOpen((open) => !open)}
        onSetView={explorer.setView}
        onToggleAirflow={explorer.toggleAirflow}
        onUnhide={explorer.unhide}
        onClearHidden={explorer.clearHidden}
      />
      <Disassembly
        level={state.level}
        explode={state.explode}
        logical={logical}
        playing={explorer.playing}
        onToggleAuto={explorer.toggleAuto}
        onSetExplode={explorer.setExplode}
        onReset={explorer.reset}
        title="拆解进度"
        sectionLabel="拆解控制"
        sliderLabel="Disassemble the specimen"
      />
      <SearchDialog
        open={search}
        onOpenChange={setSearch}
        query={query}
        onQueryChange={setQuery}
        onSelect={selectResult}
      />
      <DetailPanel
        selected={selected}
        selection={state.selection}
        level={state.level}
        isolated={state.isolated}
        onClose={() => choose(null)}
        onSelectConcept={selectResult}
        onDive={explorer.dive}
        onIsolate={explorer.toggleIsolate}
        onFocus={explorer.refocus}
        onHide={explorer.hide}
      />
      <AboutDialog open={about} onOpenChange={setAbout} />
    </main>
  );
}
