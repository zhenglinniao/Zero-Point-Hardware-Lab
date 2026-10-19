import { concept, type Category, type Concept } from '../concept.ts';
import type { SourceId } from '../sources.ts';

const accuracy =
  'Representative M.2 2280 SSD. Manufacturer documentation supports the form factor and component roles; package counts, contact detail and placement are illustrative, not a Samsung PCB reproduction.';

const parts: {
  id: string;
  name: string;
  category: Category;
  description: string;
  purpose: string;
  quantity: string;
  specifications: Record<string, string>;
  sources: SourceId[];
}[] = [
  {
    id: 'nvmeboard',
    name: 'M.2 circuit board',
    category: 'Board',
    description:
      'A slim circuit board that plugs directly into a motherboard M.2 socket.',
    purpose:
      'Connects the controller, flash and memory without a drive bay or SATA cables.',
    quantity: '1 modeled board',
    specifications: { Format: 'M.2 2280 · nominal 22 × 80 mm' },
    sources: ['samsungnvme'],
  },
  {
    id: 'nvmecontroller',
    name: 'NVMe flash controller',
    category: 'Compute',
    description:
      'The processor between the PCIe host link and the NAND flash channels.',
    purpose:
      'Handles NVMe commands, logical-to-physical mapping, error correction and wear levelling.',
    quantity: '1 modeled controller',
    specifications: { Host: 'NVMe over PCIe', Flash: 'Parallel NAND channels' },
    sources: ['samsungnvme', 'ssdarchitecture', 'nvme'],
  },
  {
    id: 'nvmenand',
    name: '3D NAND flash packages',
    category: 'Storage',
    description:
      'Non-volatile flash packages containing vertically stacked memory cells.',
    purpose:
      'Stores files even with the power disconnected. The package count varies by drive and capacity.',
    quantity: '2 illustrative packages',
    specifications: { Memory: '3D NAND · non-volatile' },
    sources: ['samsungnvme', 'ssdarchitecture'],
  },
  {
    id: 'nvmedram',
    name: 'NVMe DRAM cache',
    category: 'Memory',
    description:
      'Volatile memory beside the controller in this representative SSD design.',
    purpose:
      'Caches mapping information for the controller. Some other SSDs use host memory or omit dedicated DRAM.',
    quantity: '1 modeled package',
    specifications: { Role: 'Controller mapping cache' },
    sources: ['samsungnvme', 'ssdarchitecture'],
  },
  {
    id: 'nvmecontacts',
    name: 'M-key edge contacts',
    category: 'Storage',
    description:
      'Gold-plated fingers with a key gap at the motherboard end of the module.',
    purpose:
      'Carries PCIe signals and power through the M.2 socket; the key controls mechanical compatibility.',
    quantity: '1 illustrative contact field',
    specifications: {
      Connection: 'M.2 M-key',
      Link: 'PCIe ×4',
      Power: '3.3 V',
    },
    sources: ['samsungnvme', 'mainboardmanual'],
  },
  {
    id: 'nvmefastener',
    name: 'M.2 retaining screw',
    category: 'Board',
    description:
      'A small fastener at the semicircular notch opposite the connector.',
    purpose:
      'Keeps the module seated against its motherboard standoff. Some boards use a tool-free latch instead.',
    quantity: '1 modeled screw',
    specifications: { Position: '2280 mounting point' },
    sources: ['mainboardmanual'],
  },
];

export const nvmeConcepts: Concept[] = parts.map((part) =>
  concept({
    ...part,
    parent: 'nvme',
    level: 'nvme',
    representationType: 'physical',
    physicalAccuracy: accuracy,
    searchTerms: ['nvme', 'ssd', 'm.2', part.name],
  }),
);
