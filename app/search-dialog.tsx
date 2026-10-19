'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { byId, colors, searchConcepts } from '@/lib/manifest';
import { levels } from '@/lib/levels';
import { categoryZh, conceptNameZh, scaleNameZh } from '@/lib/zh';

/** What the palette offers before anything has been typed. */
const suggested = [
  'package',
  'gddr7',
  'gpc',
  'sm',
  'tensor',
  'rt',
  'l2',
  'vrm',
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="search-dialog">
        <DialogTitle>检索设备与部件</DialogTitle>
        <DialogDescription>
          输入中文名称、英文型号或架构缩写，跨设备寻找目标。
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder="试试：手机、相机、散热、PS5、DDR5…"
          />
          <CommandList>
            <CommandEmpty>
              没有找到匹配部件，请尝试其他名称或型号。
            </CommandEmpty>
            <CommandGroup
              heading={query ? '匹配部件' : '推荐探索'}
            >
              {(query
                ? searchConcepts(query)
                : suggested.map((id) => byId[id])
              ).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => onSelect(c.id)}
                >
                  <i style={{ background: colors[c.category] }} />
                  <div>
                    {conceptNameZh(c)}
                    <small>
                      <span>{scaleNameZh(c.level,levels[c.level].name)}</span>
                      {categoryZh[c.category]} ·{' '}
                      {c.representationType === 'logical'
                        ? '逻辑架构'
                        : '实体结构'}
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="search-hint">
          ↑ ↓ 浏览 <span>回车查看</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
