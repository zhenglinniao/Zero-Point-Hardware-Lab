'use client';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { levels, type LevelId } from '@/lib/levels';
import { phaseZh } from '@/lib/zh';
import {
  deviceDisassembly,
  activeDisassemblyStep,
} from '@/lib/disassembly-steps';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  playing: boolean;
  onToggleAuto: () => void;
  onSetExplode: (value: number) => void;
  onReset: () => void;
  sectionLabel?: string;
  title?: string;
  sliderLabel?: string;
  valueText?: string;
};

export default function Disassembly({
  level,
  explode,
  logical,
  playing,
  onToggleAuto,
  onSetExplode,
  onReset,
  sectionLabel = 'Explosion control',
  title,
  sliderLabel = 'Disassemble the specimen',
  valueText,
}: Props) {
  const steps = deviceDisassembly[level];
  const currentStep = activeDisassemblyStep(level, explode);
  const phases =
      steps?.map((s) => [s.name, s.at] as const) ?? levels[level].phases,
    explodePercent = Math.round(explode);
  return (
    <section className="disassembly" aria-label={sectionLabel}>
      <div className="disassembly-intro">
        <button
          className={
            'play' +
            (playing ? ' running' : '') +
            (!playing && explode < 1 ? ' idle' : '')
          }
          onClick={onToggleAuto}
          aria-label={
            playing
              ? 'Pause automatic disassembly'
              : 'Take it apart automatically'
          }
        >
          {playing ? <Pause size={23} /> : <Play size={23} />}
          <span>{playing ? '暂停' : '自动'}</span>
        </button>
        <div className="disassembly-label">
          <div>
            <strong>{title ?? (logical ? 'Expand' : 'Disassemble')}</strong>
            <span title={currentStep?.instruction}>
              {currentStep?.instruction ?? '拖动或自动播放'}
            </span>
          </div>
        </div>
      </div>
      <div className="timeline">
        <div className="phase-labels">
          {phases.map(([name, value]) => (
            <button
              key={name}
              data-phase={name}
              title={steps?.find((s) => s.name === name)?.instruction}
              aria-label={
                steps
                  ? `${phaseZh[name] ?? name}：${steps.find((s) => s.name === name)?.instruction}`
                  : undefined
              }
              className={
                (
                  steps
                    ? currentStep?.name === name
                    : Math.abs(explode - Number(value)) < 13
                )
                  ? 'active'
                  : ''
              }
              onClick={() => onSetExplode(Number(value))}
            >
              {phaseZh[name] ?? name}
            </button>
          ))}
        </div>
        <Slider
          value={[explode]}
          onValueChange={(value) =>
            onSetExplode(Array.isArray(value) ? value[0] : value)
          }
          aria-label={sliderLabel}
          aria-valuetext={valueText ?? `${explodePercent} percent`}
        />
        <div className="ruler" aria-hidden="true">
          {Array.from({ length: 41 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="disassembly-readout">
        <output>{explodePercent}%</output>
        <button
          className="reset"
          aria-label="Reset camera and assembly"
          onClick={onReset}
        >
          <RotateCcw size={18} />
          <span>重置</span>
        </button>
      </div>
    </section>
  );
}
