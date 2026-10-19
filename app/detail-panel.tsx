'use client';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { byId, colors, openLevel, sources, type Concept } from '@/lib/manifest';
import type { Selection } from '@/lib/explorer-state';
import { levels, type LevelId } from '@/lib/levels';
import { accuracyZh, categoryZh, chineseIntro, conceptNameZh, quantityZh, scaleNameZh, specLabelZh } from '@/lib/zh';

type Props = {
  selected: Concept | null;
  selection: Selection | null;
  level: LevelId;
  isolated: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

export default function DetailPanel({
  selected,
  selection,
  level,
  isolated,
  onClose,
  onSelectConcept,
  onDive,
  onIsolate,
  onFocus,
  onHide,
}: Props) {
  const opens = selected && openLevel(selected.id);
  const intro = selected && chineseIntro(selected);
  return (
    <Sheet
      open={!!selected}
      modal={false}
      onOpenChange={(open, details) => {
        if (!open && details.reason !== 'outside-press') onClose();
      }}
    >
      <SheetContent
        className="detail-panel"
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        {selected && (
          <>
            <div className="detail-top">
              <span style={{ color: colors[selected.category] }}>
                {categoryZh[selected.category]} /{' '}
                {selected.representationType === 'logical'
                  ? '逻辑架构'
                  : '硬件结构'}
              </span>
              <button aria-label="Close component details" onClick={onClose}>
                <X size={17} />
              </button>
            </div>
            <SheetTitle>{conceptNameZh(selected)}</SheetTitle>
            <div className="instance-label">
              {selection?.instance !== undefined
                ? '实例 ' + String(selection.instance + 1).padStart(2, '0')
                : '组件导读'}
            </div>
            <SheetDescription>{intro?.description}</SheetDescription>
            <div className="purpose">
              <h3>它的作用</h3>
              <p>{intro?.purpose}</p>
            </div>
            <div className="quantity">{quantityZh(selected.quantity)}</div>
            <dl>
              {Object.entries(selected.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt>{specLabelZh(k)}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {selected.parent && (
              <div className="parent-link">
                所属组件{' '}
                <button onClick={() => onSelectConcept(selected.parent!)}>
                  {conceptNameZh(byId[selected.parent])}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {opens && opens !== level && (
              <button
                className="open-component"
                onClick={() => onDive(selected.id)}
              >
                继续拆解 {scaleNameZh(opens,levels[opens].name)}
                <ChevronRight size={17} />
              </button>
            )}
            <div className="detail-actions">
              <button onClick={onIsolate}>
                <Focus size={14} />
                {isolated ? '显示周围部件' : '单独查看'}
              </button>
              <button onClick={onFocus}>
                <Maximize size={14} />
                聚焦
              </button>
              <button onClick={() => onHide(selected.id)}>
                <EyeOff size={14} />
                隐藏
              </button>
            </div>
            <p className="accuracy">{accuracyZh(selected)}</p>
            {!/[\u3400-\u9fff]/.test(selected.description) && <details className="original-description"><summary>查看英文原文与精度说明</summary><p>上方为中文功能导读；以下保留原文，规格值未经改写。</p><h4>{selected.name}</h4><p>{selected.description}</p><p>{selected.purpose}</p><p>{selected.physicalAccuracy}</p></details>}
            {selected.sources.length > 0 && (
              <div className="source-links">
                <h3>参考资料与架构依据</h3>
                <p>
                  来源支持公开参数、功能原理或构造参考；教学几何不等于厂商的精确维修图。
                </p>
                {selected.sources.map((s) => (
                  <a
                    key={s}
                    href={sources[s].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sources[s].name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
