'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import { GUIDE, GUIDE_ACCELERATION, GUIDE_ZH, REPOSITORY } from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>零点硬件实验室 · 来源与创作</DialogTitle>
        <DialogDescription>
          中文学习界面、数码设备扩展、八条课程、二十四个互动实验与学习记录由 zln
          设计实现。 电脑模型、渲染器及原始部件资料基于 PC
          Anatomy（Yoseph），遵循 MIT 许可。
        </DialogDescription>
        <p>
          从电脑、游戏主机、手机、相机、手柄或耳机开始，逐层拆开部件，结合中文功能导读与引用来源理解它们的分工。
          电脑的原始英文资料可在部件面板中展开核对；中文导读是功能概述，不是逐句翻译。
        </p>
        <h3>模型与精度范围</h3>
        <p>
          <strong>实体结构</strong>
          依据公开外形、技术规格、内部视图与构造原理制作。 PS5 对应 2020
          原版光驱版，手机参考 iPhone 15 标准版，相机参考 α7 IV
          机身功能；镜头、手柄内部与无线耳机属于明确标注的通用教学结构。
          内部位置、组件数量和紧固细节经过简化，不是精确维修模型。
        </p>
        <p>
          <strong>逻辑架构</strong>用于解释计算资源和数据路径。
          方块面积与位置不表示真实的晶体管制造布局；模型没有模拟电路、磁场、光学或声学性能。
        </p>
        <h3>资料、来源与署名</h3>
        <p>
          手柄外观使用 Taohid Animation 的「PS5 Controller」，遵循 CC BY
          4.0；本项目调整比例、材质并映射为可拆解部件，内部件另行设计。镜头采用
          Kramer Harrison 的 Optiland DoubleGauss
          光学处方（MIT），镜筒与驱动机构为原创教学设计。
        </p>
        <a
          className="about-source"
          href={sources.dualsenseasset.url}
          target="_blank"
          rel="noreferrer"
        >
          Taohid Animation · PS5 Controller · CC BY 4.0{' '}
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href="/licenses/CC-BY-4.0.txt"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0 许可全文 <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={sources.optilandprescription.url}
          target="_blank"
          rel="noreferrer"
        >
          Optiland 光学数据 · MIT <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE_ZH}>
          中文操作指南 <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          浏览器图形加速设置（英文参考） <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          原项目英文硬件指南
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
          原项目交互灵感 · Human Atlas
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          PC Anatomy 原始源码与 MIT 许可
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">
          与所提及的设备厂商无隶属或背书关系。开源网格与数据保留各自许可证，其余教学几何由项目编写；资料参考日期为
          2026 年 10 月。
        </p>
      </DialogContent>
    </Dialog>
  );
}
