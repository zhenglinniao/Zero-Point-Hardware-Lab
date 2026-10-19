# 116 个层级的审查覆盖与待优化项

对应 [主报告](../MODEL-REVIEW-2026-10-19.md)。以下每个层级均已实际打开并查看截图；物理层查看 0% 与 50%，逻辑层查看 0%。物理／逻辑分类沿用项目元数据，某些物理入口内部仍含原理化结构。

“已查看”不表示已与厂家 CAD 完成尺寸验收；表内的优化要求有确认问题，也有尚需补证的项目，证据等级见主报告。S 编号对应主报告的公开资料。每台设备仍需建立指定版本的逐零件测绘表。

## 台式电脑 · 38 层

主要依据：S12、S13、S15。相关问题：R09–R12、R35。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`pc`](https://zero-point-hardware-lab.vercel.app/?scale=pc) · Desktop PC | 物理 · 0% / 50% | 检查底盘支承、模块安装位和线缆对接；固定可兼容的参考配置 |
| [`motherboard`](https://zero-point-hardware-lab.vercel.app/?scale=motherboard) · Motherboard | 物理 · 0% / 50% | 按固定 PCB 修订核对板形、AM5 插座、插槽、孔位和供电区，区分示意布线 |
| [`dimm`](https://zero-point-hardware-lab.vercel.app/?scale=dimm) · DDR5 · FURY Beast | 物理 · 0% / 50% | 核对标准包络、金手指、键位与颗粒组织；DDR4/DDR5 保持平台区分 |
| [`dram`](https://zero-point-hardware-lab.vercel.app/?scale=dram) · DRAM package | 物理 · 0% / 50% | 封装层与逻辑存储组织分开；没有解封测绘时不声明裸片摆放精确 |
| [`banks`](https://zero-point-hardware-lab.vercel.app/?scale=banks) · DRAM die | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`bank`](https://zero-point-hardware-lab.vercel.app/?scale=bank) · Bank | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`cell`](https://zero-point-hardware-lab.vercel.app/?scale=cell) · Cells | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`ddr4`](https://zero-point-hardware-lab.vercel.app/?scale=ddr4) · DDR4 · FURY Beast | 物理 · 0% / 50% | 核对标准包络、金手指、键位与颗粒组织；DDR4/DDR5 保持平台区分 |
| [`ddr4dram`](https://zero-point-hardware-lab.vercel.app/?scale=ddr4dram) · DRAM package | 物理 · 0% / 50% | 封装层与逻辑存储组织分开；没有解封测绘时不声明裸片摆放精确 |
| [`ddr4banks`](https://zero-point-hardware-lab.vercel.app/?scale=ddr4banks) · DRAM die | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`ddr4array`](https://zero-point-hardware-lab.vercel.app/?scale=ddr4array) · Bank | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`ddr4cell`](https://zero-point-hardware-lab.vercel.app/?scale=ddr4cell) · Cells | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`ryzen`](https://zero-point-hardware-lab.vercel.app/?scale=ryzen) · Ryzen 9 9950X | 逻辑 · 0% | 固定处理器代次与封装；核对裸片角色、平台和已公开拓扑，微观尺寸保持未证标记 |
| [`ryzenio`](https://zero-point-hardware-lab.vercel.app/?scale=ryzenio) · Ryzen I/O die | 逻辑 · 0% | 固定处理器代次与封装；核对裸片角色、平台和已公开拓扑，微观尺寸保持未证标记 |
| [`corei9`](https://zero-point-hardware-lab.vercel.app/?scale=corei9) · Core Ultra 9 285K | 逻辑 · 0% | 固定处理器代次与封装；核对裸片角色、平台和已公开拓扑，微观尺寸保持未证标记 |
| [`coreio`](https://zero-point-hardware-lab.vercel.app/?scale=coreio) · Core Ultra I/O tile | 逻辑 · 0% | 固定处理器代次与封装；核对裸片角色、平台和已公开拓扑，微观尺寸保持未证标记 |
| [`psu`](https://zero-point-hardware-lab.vercel.app/?scale=psu) · Modular · TUF Gaming 850W Gold | 物理 · 0% / 50% | 核对端口、线缆、板件支承与容量说明；内部变压器／滤波布局属于参考拓扑 |
| [`psubronze`](https://zero-point-hardware-lab.vercel.app/?scale=psubronze) · Non-modular · TUF Gaming 750W Bronze | 物理 · 0% / 50% | 核对端口、线缆、板件支承与容量说明；内部变压器／滤波布局属于参考拓扑 |
| [`fan`](https://zero-point-hardware-lab.vercel.app/?scale=fan) · Case fan | 物理 · 0% / 50% | 核对扇叶、框体、轴承和气流方向；保证转轴与框体净空 |
| [`cooler`](https://zero-point-hardware-lab.vercel.app/?scale=cooler) · CPU cooler | 物理 · 0% / 50% | 保留通用塔式散热器定位；补基座、热管、扣具与内存／主板净空 |
| [`liquid`](https://zero-point-hardware-lab.vercel.app/?scale=liquid) · Liquid cooling | 物理 · 0% / 50% | 核对泵体、冷板、密封、软管、冷排接口与连续水路；不把切面当可卸结构 |
| [`ssd`](https://zero-point-hardware-lab.vercel.app/?scale=ssd) · SATA SSD | 物理 · 0% / 50% | 固定容量／封装；核对接口、支架和安装高度，内部 NAND 层保持原理表示 |
| [`nvme`](https://zero-point-hardware-lab.vercel.app/?scale=nvme) · M.2 NVMe SSD | 物理 · 0% / 50% | 固定容量／封装；核对接口、支架和安装高度，内部 NAND 层保持原理表示 |
| [`card`](https://zero-point-hardware-lab.vercel.app/?scale=card) · RTX 5090 | 物理 · 0% / 50% | 核对具体板卡外包络、PCB、插座、背板与散热器，不用 GPU 架构资料证明整张显卡布局 |
| [`die`](https://zero-point-hardware-lab.vercel.app/?scale=die) · GB202 | 逻辑 · 0% | 区分完整 GB202 与零售 SKU 启用配置；架构方块不是实际芯片 floorplan |
| [`gpc`](https://zero-point-hardware-lab.vercel.app/?scale=gpc) · GPC | 逻辑 · 0% | 区分完整 GB202 与零售 SKU 启用配置；架构方块不是实际芯片 floorplan |
| [`tpc`](https://zero-point-hardware-lab.vercel.app/?scale=tpc) · TPC | 逻辑 · 0% | 区分完整 GB202 与零售 SKU 启用配置；架构方块不是实际芯片 floorplan |
| [`sm`](https://zero-point-hardware-lab.vercel.app/?scale=sm) · SM | 逻辑 · 0% | 区分完整 GB202 与零售 SKU 启用配置；架构方块不是实际芯片 floorplan |
| [`rx9070`](https://zero-point-hardware-lab.vercel.app/?scale=rx9070) · RX 9070 XT | 物理 · 0% / 50% | 核对具体板卡外包络、PCB、插座、背板与散热器，不用 GPU 架构资料证明整张显卡布局 |
| [`navi48`](https://zero-point-hardware-lab.vercel.app/?scale=navi48) · Navi 48 | 逻辑 · 0% | 依据 AMD 公开架构核对 SE／WGP／CU 层级与数量；未公开的内部布局标原理 |
| [`rxse`](https://zero-point-hardware-lab.vercel.app/?scale=rxse) · Shader engine | 逻辑 · 0% | 依据 AMD 公开架构核对 SE／WGP／CU 层级与数量；未公开的内部布局标原理 |
| [`rxwgp`](https://zero-point-hardware-lab.vercel.app/?scale=rxwgp) · Workgroup processor | 逻辑 · 0% | 依据 AMD 公开架构核对 SE／WGP／CU 层级与数量；未公开的内部布局标原理 |
| [`rxcu`](https://zero-point-hardware-lab.vercel.app/?scale=rxcu) · Compute unit | 逻辑 · 0% | 依据 AMD 公开架构核对 SE／WGP／CU 层级与数量；未公开的内部布局标原理 |
| [`arcb580`](https://zero-point-hardware-lab.vercel.app/?scale=arcb580) · Arc B580 | 物理 · 0% / 50% | 核对具体板卡外包络、PCB、插座、背板与散热器，不用 GPU 架构资料证明整张显卡布局 |
| [`bmg`](https://zero-point-hardware-lab.vercel.app/?scale=bmg) · BMG-G21 | 逻辑 · 0% | 依据 Intel Xe2 公开层级核对 slice／Xe core／执行单元关系，不推断物理版图 |
| [`xeslice`](https://zero-point-hardware-lab.vercel.app/?scale=xeslice) · Render slice | 逻辑 · 0% | 依据 Intel Xe2 公开层级核对 slice／Xe core／执行单元关系，不推断物理版图 |
| [`xecore`](https://zero-point-hardware-lab.vercel.app/?scale=xecore) · Xe-core | 逻辑 · 0% | 依据 Intel Xe2 公开层级核对 slice／Xe core／执行单元关系，不推断物理版图 |
| [`xve`](https://zero-point-hardware-lab.vercel.app/?scale=xve) · Vector engine | 逻辑 · 0% | 依据 Intel Xe2 公开层级核对 slice／Xe core／执行单元关系，不推断物理版图 |

## Legion 5 15ACH6H · 15 层

主要依据：S6、S12。相关问题：R13–R14、R35。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`legion`](https://zero-point-hardware-lab.vercel.app/?scale=legion) · Lenovo Legion 5 | 物理 · 0% / 50% | 固定 15ACH6H 配置，核对上／下壳、转轴、散热口和主板固定基准 |
| [`legionboard`](https://zero-point-hardware-lab.vercel.app/?scale=legionboard) · Legion system board | 物理 · 0% / 50% | 重新绑定实机 PCB／FRU；核对接口、螺钉、排线与隔热压片 |
| [`legioncpu`](https://zero-point-hardware-lab.vercel.app/?scale=legioncpu) · Ryzen 7 5800H | 逻辑 · 0% | 固定 Ryzen 型号；区分封装外观、核心架构和未公开的微观版图 |
| [`legioncore`](https://zero-point-hardware-lab.vercel.app/?scale=legioncore) · Zen 3 core | 逻辑 · 0% | 固定 Ryzen 型号；区分封装外观、核心架构和未公开的微观版图 |
| [`legiongpu`](https://zero-point-hardware-lab.vercel.app/?scale=legiongpu) · RTX 3060 Laptop GPU | 逻辑 · 0% | 固定移动版 GPU 与启用配置；架构示意不等于移动 GPU 真实 floorplan |
| [`legionsm`](https://zero-point-hardware-lab.vercel.app/?scale=legionsm) · Ampere SM | 逻辑 · 0% | 固定移动版 GPU 与启用配置；架构示意不等于移动 GPU 真实 floorplan |
| [`legionmemory`](https://zero-point-hardware-lab.vercel.app/?scale=legionmemory) · DDR4 SO-DIMM | 物理 · 0% / 50% | 核对 SO-DIMM 锁扣、两面颗粒和安装高度；数据手册图不能证明实际实板摆放 |
| [`legionpackage`](https://zero-point-hardware-lab.vercel.app/?scale=legionpackage) · DDR4 FBGA package | 物理 · 0% / 50% | 核对 SO-DIMM 锁扣、两面颗粒和安装高度；数据手册图不能证明实际实板摆放 |
| [`legiondram`](https://zero-point-hardware-lab.vercel.app/?scale=legiondram) · DDR4 DRAM die | 逻辑 · 0% | 封装层与逻辑存储组织分开；没有解封测绘时不声明裸片摆放精确 |
| [`legionbank`](https://zero-point-hardware-lab.vercel.app/?scale=legionbank) · DDR4 memory bank | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`legioncell`](https://zero-point-hardware-lab.vercel.app/?scale=legioncell) · DDR4 memory cell | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`legionstorage`](https://zero-point-hardware-lab.vercel.app/?scale=legionstorage) · Legion M.2 SSD | 物理 · 0% / 50% | 固定容量／封装；核对接口、支架和安装高度，内部 NAND 层保持原理表示 |
| [`legioncooling`](https://zero-point-hardware-lab.vercel.app/?scale=legioncooling) · Legion cooling | 物理 · 0% / 50% | 对照具体配置热管路线、扁管截面、蜗壳、风道密封和压紧点 |
| [`legionbattery`](https://zero-point-hardware-lab.vercel.app/?scale=legionbattery) · Legion battery | 物理 · 0% / 50% | 固定 60Wh 或 80Wh 版本，补线缆、固定片和底壳净空 |
| [`legiondisplay`](https://zero-point-hardware-lab.vercel.app/?scale=legiondisplay) · Legion display | 物理 · 0% / 50% | 核对转轴、屏线弯折、上壳支架与屏幕叠层边界 |

## MacBook Pro 14 2021 · 15 层

主要依据：S5、S15。相关问题：R15–R16、R35。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`macbook`](https://zero-point-hardware-lab.vercel.app/?scale=macbook) · MacBook Pro 14-inch | 物理 · 0% / 50% | 按官方分解图复核底壳、天线、转轴与总装次序 |
| [`macboard`](https://zero-point-hardware-lab.vercel.app/?scale=macboard) · MacBook logic board | 物理 · 0% / 50% | 补接口小板、压片、BMU、MagSafe 和 Touch ID 连接关系 |
| [`m1pro`](https://zero-point-hardware-lab.vercel.app/?scale=m1pro) · Apple M1 Pro | 逻辑 · 0% | 绑定 M1 Pro 配置；架构组织与封装照片分开，不能宣称晶体管／floorplan 复原 |
| [`maccpu`](https://zero-point-hardware-lab.vercel.app/?scale=maccpu) · M1 Pro CPU | 逻辑 · 0% | 绑定 M1 Pro 配置；架构组织与封装照片分开，不能宣称晶体管／floorplan 复原 |
| [`maccore`](https://zero-point-hardware-lab.vercel.app/?scale=maccore) · CPU core principles | 逻辑 · 0% | 绑定 M1 Pro 配置；架构组织与封装照片分开，不能宣称晶体管／floorplan 复原 |
| [`macgpu`](https://zero-point-hardware-lab.vercel.app/?scale=macgpu) · M1 Pro GPU | 逻辑 · 0% | 绑定 M1 Pro 配置；架构组织与封装照片分开，不能宣称晶体管／floorplan 复原 |
| [`macgpucore`](https://zero-point-hardware-lab.vercel.app/?scale=macgpucore) · GPU core principles | 逻辑 · 0% | 绑定 M1 Pro 配置；架构组织与封装照片分开，不能宣称晶体管／floorplan 复原 |
| [`macmemory`](https://zero-point-hardware-lab.vercel.app/?scale=macmemory) · Unified memory | 逻辑 · 0% | 核对统一内存封装位置、数量与容量；逻辑组织标为原理 |
| [`macdram`](https://zero-point-hardware-lab.vercel.app/?scale=macdram) · DRAM organization | 逻辑 · 0% | 封装层与逻辑存储组织分开；没有解封测绘时不声明裸片摆放精确 |
| [`macbank`](https://zero-point-hardware-lab.vercel.app/?scale=macbank) · DRAM bank principles | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`maccell`](https://zero-point-hardware-lab.vercel.app/?scale=maccell) · DRAM memory cell | 逻辑 · 0% | 核对 bank／阵列／单元的逻辑关系和中文含义；不当作真实物理版图或晶体管测绘 |
| [`macstorage`](https://zero-point-hardware-lab.vercel.app/?scale=macstorage) · MacBook flash storage | 物理 · 0% / 50% | 固定容量／封装；核对接口、支架和安装高度，内部 NAND 层保持原理表示 |
| [`maccooling`](https://zero-point-hardware-lab.vercel.app/?scale=maccooling) · MacBook cooling | 物理 · 0% / 50% | 核对左右风扇、风道、散热管和主板压紧关系 |
| [`macbattery`](https://zero-point-hardware-lab.vercel.app/?scale=macbattery) · MacBook battery | 物理 · 0% / 50% | 核对分区电芯、粘接、BMU 与排线连接，不把粘接件演示为自由滑出 |
| [`macdisplay`](https://zero-point-hardware-lab.vercel.app/?scale=macdisplay) · Liquid Retina XDR display | 物理 · 0% / 50% | 补屏线、转轴、天线、支架和连接器，核对合盖空间 |

## 原版 PS5 · 6 层

主要依据：S7。相关问题：R17–R19。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`ps5`](https://zero-point-hardware-lab.vercel.app/?scale=ps5) · PlayStation 5 | 物理 · 0% / 50% | 固定原版 CFI 修订；核对壳体、天线、风道、支撑和整体次序 |
| [`ps5board`](https://zero-point-hardware-lab.vercel.app/?scale=ps5board) · PS5 主板 | 物理 · 0% / 50% | 核对两面 NAND／GDDR6、屏蔽罩、压板和真实 PCB 轮廓 |
| [`ps5cooling`](https://zero-point-hardware-lab.vercel.app/?scale=ps5cooling) · PS5 散热系统 | 物理 · 0% / 50% | 按原始拆解重做异形鳍片、热管、基座、液金围护与压紧结构 |
| [`ps5-power`](https://zero-point-hardware-lab.vercel.app/?scale=ps5-power) · PS5 内置电源总成 | 物理 · 0% / 50% | 优先重做异形电源外壳、板形、接触端与支撑；当前规则长方体不够还原 |
| [`ps5-drive`](https://zero-point-hardware-lab.vercel.app/?scale=ps5-drive) · PS5 蓝光驱动器 | 物理 · 0% / 50% | 核对光驱主轴、拾取导轨、排线与壳体界面；固定光驱版本 |
| [`ps5-fan`](https://zero-point-hardware-lab.vercel.app/?scale=ps5-fan) · PS5 双面进气风扇 | 物理 · 0% / 50% | 固定风扇版本，核对叶片／蜗壳／支架／线缆及风道间隙 |

## iPhone 15 · 6 层

主要依据：S8。相关问题：R20–R21。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`phone`](https://zero-point-hardware-lab.vercel.app/?scale=phone) · iPhone 15 | 物理 · 0% / 50% | 保持正确对角双摄；精修边框、镜头台阶、按键、USB-C 与玻璃接缝 |
| [`phoneboard`](https://zero-point-hardware-lab.vercel.app/?scale=phoneboard) · 手机逻辑板 | 物理 · 0% / 50% | 按官方连接图补压片、板间连接、接地触点与螺钉；核对正反面空间 |
| [`phonecamera`](https://zero-point-hardware-lab.vercel.app/?scale=phonecamera) · 手机双摄模组 | 物理 · 0% / 50% | 区分实体主摄／超广角与主摄裁切的 2×；核对模组外形与排线 |
| [`phone-display`](https://zero-point-hardware-lab.vercel.app/?scale=phone-display) · iPhone 15 显示总成 | 物理 · 0% / 50% | 补前置传感器、屏幕排线和固定／粘接；明确玻璃与显示叠层 |
| [`phone-haptic`](https://zero-point-hardware-lab.vercel.app/?scale=phone-haptic) · Taptic Engine 线性触觉机构 | 物理 · 0% / 50% | 核对线性执行器安装、接口和外壳；内部运动质量未测绘处标近似 |
| [`phone-speaker`](https://zero-point-hardware-lab.vercel.app/?scale=phone-speaker) · 手机底部扬声器 | 物理 · 0% / 50% | 补实际声道、密封、触点和声孔连接，不仅展示通用腔块 |

## Sony α7 IV · 7 层

主要依据：S9。相关问题：R22–R24。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`camera`](https://zero-point-hardware-lab.vercel.app/?scale=camera) · Sony α7 IV 相机 | 物理 · 0% / 50% | 精修握柄、肩部、取景器、蒙皮、舱门和后背控制，按各面官方图验收 |
| [`camerasensor`](https://zero-point-hardware-lab.vercel.app/?scale=camerasensor) · 传感器与防抖 | 物理 · 0% / 50% | 区分感光区与封装；补 IBIS 悬架／柔性连接，未公开机构不得标精确 |
| [`cameralens`](https://zero-point-hardware-lab.vercel.app/?scale=cameralens) · 100 mm 双高斯教学镜头 | 物理 · 0% / 50% | 保留 100mm F/5 双高斯教学定位；如需 Sony 型号镜头应另建有证据的光学／机械模型 |
| [`camera-board`](https://zero-point-hardware-lab.vercel.app/?scale=camera-board) · α7 IV 图像处理主板 | 物理 · 0% / 50% | 核对主板板形、屏蔽、双卡槽、接口和排线，先固定硬件修订 |
| [`camera-shutter`](https://zero-point-hardware-lab.vercel.app/?scale=camera-shutter) · α7 IV 焦平面快门 | 物理 · 0% / 50% | 补帘片、驱动、限位与安装面，检查行程；分清示意帘与实际机构 |
| [`camera-finder`](https://zero-point-hardware-lab.vercel.app/?scale=camera-finder) · 电子取景器与热靴 | 物理 · 0% / 50% | 核对 EVF 微屏、目镜光路、外罩和屈光调节的连接 |
| [`camera-display`](https://zero-point-hardware-lab.vercel.app/?scale=camera-display) · 翻转屏总成 | 物理 · 0% / 50% | 核对翻转转轴、线缆走向、按钮和后盖密封，闭合不露板 |

## DualSense · 8 层

主要依据：S10。相关问题：R25–R27。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`gamepad`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad) · DualSense 无线控制器 | 物理 · 0% / 50% | 固定 CFI／BDM 版本；核对三轴尺度、内骨架、按钮穿壳与扳机间隙 |
| [`gamepadboard`](https://zero-point-hardware-lab.vercel.app/?scale=gamepadboard) · 手柄控制电路 | 物理 · 0% / 50% | 匹配同一 BDM 的 PCB、触点膜、排线、接口、支架和螺钉 |
| [`gamepad-haptics`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-haptics) · 左侧线性触觉反馈机构 | 物理 · 0% / 50% | 核对左右执行器安装与音圈／运动质量；不能用通用圆筒证明触觉机构还原 |
| [`gamepad-right-haptic`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-right-haptic) · 右侧线性触觉反馈机构 | 物理 · 0% / 50% | 核对左右执行器安装与音圈／运动质量；不能用通用圆筒证明触觉机构还原 |
| [`gamepad-triggers`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-triggers) · 左侧自适应扳机 | 物理 · 0% / 50% | 核对齿轮中心距、齿形、连杆／弹簧和行程；检查与壳体及按钮膜配合 |
| [`gamepad-right-trigger`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-right-trigger) · 右侧自适应扳机 | 物理 · 0% / 50% | 核对齿轮中心距、齿形、连杆／弹簧和行程；检查与壳体及按钮膜配合 |
| [`gamepad-leftstick`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-leftstick) · 左摇杆机构 | 物理 · 0% / 50% | 核对两轴电位器、复位／限位、按压开关和 PCB 安装基准 |
| [`gamepad-rightstick`](https://zero-point-hardware-lab.vercel.app/?scale=gamepad-rightstick) · 右摇杆机构 | 物理 · 0% / 50% | 核对两轴电位器、复位／限位、按压开关和 PCB 安装基准 |

## AirPods Pro 2 · 5 层

主要依据：S11。相关问题：R08、R28–R29。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`earbuds`](https://zero-point-hardware-lab.vercel.app/?scale=earbuds) · AirPods Pro 2 参考结构 | 物理 · 0% / 50% | 先修 USB-C 版本引用，再核对盒体开孔、铰链、耳机腔、触点和接口 |
| [`earbudunit`](https://zero-point-hardware-lab.vercel.app/?scale=earbudunit) · 耳机内部结构 | 物理 · 0% / 50% | 分别绑定左右耳照片，补非对称传感开口、声道、泄压孔和内部连接 |
| [`earbuddriver`](https://zero-point-hardware-lab.vercel.app/?scale=earbuddriver) · 动圈发声原理 | 物理 · 0% / 50% | 当前通用动圈原理；取得可靠拆测后再还原定制振膜／磁路／声腔 |
| [`earbuds-board`](https://zero-point-hardware-lab.vercel.app/?scale=earbuds-board) · AirPods Pro 2 充电盒管理板 | 物理 · 0% / 50% | 核对 USB-C 盒主板、天线、电池、扬声器与排线，避免 Lightning 串版 |
| [`earbudunit-processor`](https://zero-point-hardware-lab.vercel.app/?scale=earbudunit-processor) · 耳柄柔性电路与音频处理 | 物理 · 0% / 50% | H2 封装与芯片内部逻辑分开；没有解封数据时不声明内部版图还原 |

## Honda GX160 UT2 · 10 层

主要依据：S1、S2。相关问题：R01、R03–R05、R30。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`engine`](https://zero-point-hardware-lab.vercel.app/?scale=engine) · Honda GX160 内燃机 | 物理 · 0% / 50% | 优先修铸件拆分与高度尺寸链；重新约束整机拆解方式 |
| [`engine-block`](https://zero-point-hardware-lab.vercel.app/?scale=engine-block) · 缸体、曲轴箱与密封 | 物理 · 0% / 50% | 曲轴箱／散热缸体真实铸件合并，剖切另行显示，核对轴承与侧盖定位 |
| [`engine-cylinder`](https://zero-point-hardware-lab.vercel.app/?scale=engine-cylinder) · 气缸、缸套与散热 | 物理 · 0% / 50% | 缸套与主体铸件关系需校正；散热鳍片、气道、缸口与上止点尺寸链闭合 |
| [`engine-cover`](https://zero-point-hardware-lab.vercel.app/?scale=engine-cover) · 曲轴箱侧盖与密封 | 物理 · 0% / 50% | 核对侧盖止口、油封、垫片、定位销、轴承和拆卸方向 |
| [`engine-crank`](https://zero-point-hardware-lab.vercel.app/?scale=engine-crank) · 曲柄连杆与活塞 | 物理 · 0% / 50% | 联立曲柄、连杆、销与冠顶高度；核对油勺、连杆盖及正时方向 |
| [`engine-piston`](https://zero-point-hardware-lab.vercel.app/?scale=engine-piston) · 活塞、活塞环与销 | 物理 · 0% / 50% | 上下油环刮片开口错开；复核环槽、销挡圈和活塞压缩高度 |
| [`engine-head`](https://zero-point-hardware-lab.vercel.app/?scale=engine-head) · 气缸盖与 OHV 配气 | 物理 · 0% / 50% | 确认阀盘／缸盖相交；优先建燃烧室与阀座，补气门油封／旋转件／定位销 |
| [`engine-timing`](https://zero-point-hardware-lab.vercel.app/?scale=engine-timing) · 正时、推杆与调速 | 物理 · 0% / 50% | 固定重建齿数说明，核对正时标记、调速联杆、凸轮与挺柱关系 |
| [`engine-induction`](https://zero-point-hardware-lab.vercel.app/?scale=engine-induction) · 供油、进气与排气 | 物理 · 0% / 50% | 细化化油器、进排气垫片、歧管、油箱与消声器连接，核对实际铸件轮廓 |
| [`engine-starter`](https://zero-point-hardware-lab.vercel.app/?scale=engine-starter) · 飞轮、冷却风扇与手拉启动 | 物理 · 0% / 50% | 核对飞轮、风罩、棘爪、卷簧与绳路，避免用分离圆盘替代整个机构 |

## 2012 LEAF / EM61 · 6 层

主要依据：S3、S4、S14。相关问题：R02、R06–R07、R31–R32。

| 层级 | 类型／查看状态 | 对照结论与下一步 |
| --- | --- | --- |
| [`evmotor`](https://zero-point-hardware-lab.vercel.app/?scale=evmotor) · LEAF 电动车驱动电机 | 物理 · 0% / 50% | 保留实测包络，修定子子层问题；外壳安装耳／水口／端盖按照片重建 |
| [`ev-stator`](https://zero-point-hardware-lab.vercel.app/?scale=ev-stator) · 定子铁芯、绕组与绝缘 | 物理 · 0% / 50% | 确认导体／衬纸／端部拆解穿铁芯；重做退出方式和线圈连接拓扑 |
| [`ev-rotor`](https://zero-point-hardware-lab.vercel.app/?scale=ev-rotor) · IPM 转子、磁钢与输出轴 | 物理 · 0% / 50% | 区分教程拓扑与 OEM 测绘；复核磁钢证据、磁化、分段和轴向定位 |
| [`ev-housing`](https://zero-point-hardware-lab.vercel.app/?scale=ev-housing) · 机壳与水冷夹套 | 物理 · 0% / 50% | 开出真实连通水路与接口孔；核对壳体筋位、安装耳、端盖与密封 |
| [`ev-bearing`](https://zero-point-hardware-lab.vercel.app/?scale=ev-bearing) · 支承轴承内部 | 物理 · 0% / 50% | 轴承型号／滚珠／保持架为重建；需补真实型号与支承／锁紧界面依据 |
| [`ev-terminal`](https://zero-point-hardware-lab.vercel.app/?scale=ev-terminal) · 三相接线盒 | 物理 · 0% / 50% | 建立三相端子到绕组的可追踪连接，核对绝缘／密封／紧固与版本 |

## 截图覆盖索引

缩略图按目录原始顺序，每页 12 层；标题为层级 ID。根层和逻辑层展示装配状态，其余物理子层展示 50% 状态。原始 194 张大图保留在本地 `output/model-review/`（忽略提交），下面保存的是本次自有渲染缩略图，没有打包厂商参考图片。

- [第 1 页：pc, motherboard, dimm, dram, banks, bank, cell, ddr4, ddr4dram, ddr4banks, ddr4array, ddr4cell](sheet-01.jpg)
- [第 2 页：ryzen, ryzenio, corei9, coreio, psu, psubronze, fan, cooler, liquid, ssd, nvme, card](sheet-02.jpg)
- [第 3 页：die, gpc, tpc, sm, rx9070, navi48, rxse, rxwgp, rxcu, arcb580, bmg, xeslice](sheet-03.jpg)
- [第 4 页：xecore, xve, legion, legionboard, legioncpu, legioncore, legiongpu, legionsm, legionmemory, legionpackage, legiondram, legionbank](sheet-04.jpg)
- [第 5 页：legioncell, legionstorage, legioncooling, legionbattery, legiondisplay, macbook, macboard, m1pro, maccpu, maccore, macgpu, macgpucore](sheet-05.jpg)
- [第 6 页：macmemory, macdram, macbank, maccell, macstorage, maccooling, macbattery, macdisplay, ps5, ps5board, ps5cooling, phone](sheet-06.jpg)
- [第 7 页：phoneboard, phonecamera, camera, camerasensor, cameralens, gamepad, gamepadboard, earbuds, earbudunit, earbuddriver, phone-display, ps5-power](sheet-07.jpg)
- [第 8 页：ps5-drive, camera-board, camera-shutter, gamepad-haptics, gamepad-right-haptic, earbuds-board, earbudunit-processor, ps5-fan, phone-haptic, phone-speaker, camera-finder, camera-display](sheet-08.jpg)
- [第 9 页：gamepad-triggers, gamepad-right-trigger, gamepad-leftstick, gamepad-rightstick, engine, engine-block, engine-cylinder, engine-cover, engine-crank, engine-piston, engine-head, engine-timing](sheet-09.jpg)
- [第 10 页：engine-induction, engine-starter, evmotor, ev-stator, ev-rotor, ev-housing, ev-bearing, ev-terminal](sheet-10.jpg)

## 复现重点网格探测

在仓库根目录执行：

```powershell
node --experimental-strip-types docs/model-review-2026-10-19/geometry-probe.ts
```

脚本只构建模型、施加采样姿态并检测相交，不保存或修改模型。输出的零测试计数来自复用的资源清理工具，不是“测试通过”；应查看 JSON 中的相交进度。已固定的结果另存为 [findings.json](findings.json)。
