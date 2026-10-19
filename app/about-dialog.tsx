'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import { GUIDE, GUIDE_ACCELERATION, REPOSITORY } from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>From the case down to a compute core.</DialogTitle>
        <DialogDescription>
          PC Anatomy is a free, interactive 3D computer hardware explorer. Learn
          how a desktop PC works by inspecting and disassembling its components.
        </DialogDescription>
        <p>
          Start with an assembled ATX tower, take it apart, and keep going: into
          the motherboard, into the graphics card, and down through the GB202
          processor to a single streaming multiprocessor. Every scale is a
          branch you can descend or step back out of.
        </p>
        <h3>Two kinds of model.</h3>
        <p>
          <strong>Hardware</strong> is original, approximate mechanical
          geometry. The ATX board outline, the expansion-slot pitch and the rear
          I/O aperture follow the published form factor. The RTX 5090, Ryzen 9
          9950X and Core Ultra 9 285K are named subjects; everything else is a
          representative example of its component family, not a bill of
          materials for a particular build.
        </p>
        <p>
          <strong>Silicon</strong> shows documented logical architecture. Exact
          transistor-level placement is not publicly available. A full GB202 has
          192 SMs; the RTX 5090 enables 170. GPC interiors show a representative
          full cluster, not an invented map of disabled units.
        </p>
        <h3>Research & credits</h3>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          Browser hardware acceleration setup <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          PC components: an illustrated beginner’s guide
          <ArrowUpRight size={15} />
        </a>
        {Object.entries(sources)
          .slice(0, 2)
          .map(([id, s]) => (
            <a
              className="about-source"
              key={id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        <a
          className="about-source"
          href="https://github.com/ashemag/human-atlas"
          target="_blank"
          rel="noreferrer"
        >
          Interaction inspiration · Human Atlas
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          PC Anatomy source code
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">
          No affiliation with NVIDIA, AMD or Intel. No third-party model assets.
          Research reviewed September 2026.
        </p>
      </DialogContent>
    </Dialog>
  );
}
