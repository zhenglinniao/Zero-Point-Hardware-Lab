'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Wind,
} from 'lucide-react';
import { byId, colors } from '@/lib/manifest';
import {
  airflowShown,
  hasAirflow,
  type AirflowMode,
} from '@/lib/airflow-policy';
import type { ExplorerState } from '@/lib/explorer-state';
import type { LevelId } from '@/lib/levels';
import { conceptNameZh } from '@/lib/zh';

const views = ['perspective', 'top', 'front', 'back'] as const;
const viewLabels = ['三维', '俯视', '正面', '背面'];

type Props = {
  view: ExplorerState['view'];
  level: LevelId;
  explode: number;
  logical: boolean;
  airflow: AirflowMode;
  hidden: string[];
  hiddenMenuOpen: boolean;
  onToggleHiddenMenu: () => void;
  onSetView: (view: ExplorerState['view']) => void;
  onToggleAirflow: () => void;
  onUnhide: (id: string) => void;
  onClearHidden: () => void;
};

export default function StageTools({
  view,
  level,
  explode,
  logical,
  airflow,
  hidden,
  hiddenMenuOpen,
  onToggleHiddenMenu,
  onSetView,
  onToggleAirflow,
  onUnhide,
  onClearHidden,
}: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const hiddenComponents = hidden.flatMap((id) => (byId[id] ? [byId[id]] : []));
  // Nothing at this scale moves air, so there is no control to offer.
  const fans = hasAirflow(level);
  const showingAirflow = airflowShown(airflow, level);
  // The claim is about an assembled machine. Once it is open the arrows have
  // already faded, so the control says so rather than appearing to do nothing.
  const assembled = explode < 9;
  // Laid out flat, every camera but the top one looks at the parts edge-on.
  const flattened = logical && explode > 85;

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (document.fullscreenElement) setFullscreenError('');
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    syncFullscreen();
    return () =>
      document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else
        await document.documentElement.requestFullscreen({
          navigationUI: 'hide',
        });
    } catch {
      setFullscreenError(
        'Fullscreen is blocked by this browser. Press F11 instead.',
      );
    }
  }, []);

  return (
    <div className="stage-tools">
      <div className="view-controls" aria-label="Camera controls">
        {views.map((option, i) => {
          const active = flattened ? option === 'top' : view === option;
          const name = option[0].toUpperCase() + option.slice(1) + ' view';
          return (
            <button
              key={option}
              title={name}
              aria-label={name}
              disabled={flattened && option !== 'top'}
              aria-pressed={active}
              className={active ? 'active' : ''}
              onClick={() => onSetView(option)}
            >
              {viewLabels[i]}
            </button>
          );
        })}
        <span />
        <button
          title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={fullscreen}
          className={fullscreen ? 'active' : ''}
          onClick={() => void toggleFullscreen()}
        >
          {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>
      </div>
      {fans && (
        <button
          className={'airflow-toggle' + (showingAirflow ? ' active' : '')}
          title={
            showingAirflow
              ? 'Hide the path the air takes'
              : assembled
                ? 'Show the path the air takes through the machine'
                : 'Show airflow — it draws on the assembled machine'
          }
          aria-label={showingAirflow ? 'Hide airflow' : 'Show airflow'}
          aria-pressed={showingAirflow}
          onClick={onToggleAirflow}
        >
          <Wind size={15} />
          <span>气流</span>
          <small>{showingAirflow ? '开' : '关'}</small>
        </button>
      )}
      {hiddenComponents.length > 0 && (
        <div className="hidden-tracker">
          <button
            className="hidden-tracker-toggle"
            aria-expanded={hiddenMenuOpen}
            aria-controls="hidden-components-menu"
            onClick={onToggleHiddenMenu}
          >
            <EyeOff size={15} />
            <span>
              {hiddenComponents.length} 个部件已隐藏
            </span>
            <ChevronDown size={14} />
          </button>
          {hiddenMenuOpen && (
            <div className="hidden-components-menu" id="hidden-components-menu">
              <div className="hidden-menu-heading">
                <strong>当前层级的隐藏部件</strong>
                <button onClick={onClearHidden}>全部恢复</button>
              </div>
              <ul>
                {hiddenComponents.map((component) => (
                  <li key={component.id}>
                    <i style={{ background: colors[component.category] }} />
                    <span>{conceptNameZh(component)}</span>
                    <button
                      aria-label={`Show ${component.name}`}
                      onClick={() => onUnhide(component.id)}
                    >
                      <Eye size={14} />
                      显示
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {fullscreenError && (
        <output className="fullscreen-error">{fullscreenError}</output>
      )}
    </div>
  );
}
