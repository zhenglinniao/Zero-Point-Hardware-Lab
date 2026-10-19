import type { LevelId } from './levels.ts';
export const deviceFamilies = [
  '全部',
  '电脑',
  '游戏',
  '移动',
  '影像',
  '音频',
  '动力',
] as const;
export type DeviceFamily = (typeof deviceFamilies)[number];
export const devices: {
  level: LevelId;
  name: string;
  model: string;
  family: DeviceFamily;
  note: string;
}[] = [
  {
    level: 'pc',
    name: '台式电脑',
    model: 'ATX 参考整机',
    family: '电脑',
    note: '主板、处理器、显卡、内存与散热',
  },
  {
    level: 'legion',
    name: '游戏笔记本',
    model: '联想 Legion 5',
    family: '电脑',
    note: '移动平台、独立显卡与双风扇',
  },
  {
    level: 'macbook',
    name: 'MacBook Pro',
    model: '14 英寸 · M1 Pro',
    family: '电脑',
    note: '统一内存与紧凑逻辑板',
  },
  {
    level: 'ps5',
    name: 'PlayStation 5',
    model: '2020 原版光驱版',
    family: '游戏',
    note: '定制计算、固态存储与散热路径',
  },
  {
    level: 'phone',
    name: '手机',
    model: 'iPhone 15 参考结构',
    family: '移动',
    note: '屏幕、电池、逻辑板与双摄',
  },
  {
    level: 'camera',
    name: '无反相机',
    model: 'Sony α7 IV 参考结构',
    family: '影像',
    note: '镜头、快门、传感器与防抖',
  },
  {
    level: 'gamepad',
    name: '游戏手柄',
    model: '初代 DualSense 拆解参考',
    family: '游戏',
    note: '输入采集、无线连接与触觉反馈',
  },
  {
    level: 'earbuds',
    name: '无线耳机',
    model: 'AirPods Pro 2 · USB-C 参考',
    family: '音频',
    note: '充电盒、耳机电路与发声单元',
  },
  {
    level: 'engine',
    name: '内燃机',
    model: 'Honda GX160 UT2 · 单缸四冲程',
    family: '动力',
    note: '缸体、曲柄连杆、配气、供油与启动',
  },
  {
    level: 'evmotor',
    name: '电动车驱动电机',
    model: '2012 LEAF · IPM 永磁同步',
    family: '动力',
    note: '48 槽定子、8 极转子、绕组与水冷',
  },
];
