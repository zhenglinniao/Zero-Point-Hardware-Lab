'use client';
import { ArrowLeft, ChevronRight, MousePointerClick, X } from 'lucide-react';
import type { Concept } from '@/lib/manifest';
import { levelPath, levels, type LevelId } from '@/lib/levels';
import { conceptNameZh, scaleNameZh } from '@/lib/zh';
import { explorationMode } from '@/lib/exploration-mode';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  selected: Concept | null;
  /** `null` until the viewer has reported for the first time. */
  count: number | null;
  /** Show the first-visit line about what clicking does. */
  hint?: boolean;
  onDismissHint?: () => void;
  onNavigate: (level: LevelId) => void;
};

/** A tap cannot right-click, so a phone is told the two-tap version. */
function hintCopy() {
  return typeof matchMedia !== 'undefined' &&
    matchMedia('(pointer: coarse)').matches
    ? '点按部件查看资料，再选择继续拆解；也可点击自动播放。'
    : '左键进入部件，右键查看中文导读；也可点击自动播放。';
}

export default function StageHeading({
  level,
  explode,
  logical,
  selected,
  count,
  hint = false,
  onDismissHint,
  onNavigate,
}: Props) {
  const scale = levels[level],
    path = levelPath(level),
    mode = explorationMode(level, explode);
  return (
    <section className="stage-heading">
      <div>
        <h1>
          {explode === 100
            ? '零件清单'
            : explode > 0
              ? logical
                ? '逻辑资源分解'
                : '分层拆解'
              : scaleNameZh(level, scale.name)}
        </h1>
        <div className="stage-meta">
          <details className="exploration-mode" data-mode={mode.kind}>
            <summary title={mode.description}>
              {mode.label}
              <span>查看说明</span>
            </summary>
            <p>{mode.description}</p>
          </details>
          <nav className="breadcrumbs" aria-label="Component hierarchy">
            {path.length > 1 && (
              <button
                aria-label="Back one level"
                onClick={() => onNavigate(path[path.length - 2])}
              >
                <ArrowLeft size={14} />
              </button>
            )}
            {path.map((id, i) => (
              <span key={id}>
                {i > 0 && <ChevronRight size={12} />}
                <button
                  aria-current={id === level ? 'page' : undefined}
                  onClick={() => onNavigate(id)}
                >
                  {scaleNameZh(id, levels[id].name)}
                </button>
              </span>
            ))}
            {selected && selected.shortName !== scale.name && (
              <span>
                <ChevronRight size={12} />
                <span className="crumb-selected">
                  {conceptNameZh(selected)}
                </span>
              </span>
            )}
          </nav>
        </div>
        {hint && (
          <p className="first-visit-hint">
            <MousePointerClick size={15} aria-hidden="true" />
            <span>{hintCopy()}</span>
            <button aria-label="Dismiss hint" onClick={onDismissHint}>
              <X size={14} />
            </button>
          </p>
        )}
      </div>
      {count !== null && (
        <output
          className="stage-counter"
          aria-live="polite"
          aria-label={`${count} visible parts`}
        >
          <strong>{count}</strong>
          <span>个可见部件</span>
        </output>
      )}
    </section>
  );
}
