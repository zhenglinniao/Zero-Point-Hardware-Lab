import { readFile } from 'node:fs/promises';
import { installGamepadAsset } from '../lib/digital/gamepad-asset.ts';
import { preparePowertrainSolids } from '../lib/powertrain/cast-solids.ts';
await preparePowertrainSolids();
const bytes = await readFile(
  new URL('../public/models/dualsense/dualsense.glb', import.meta.url),
);
await installGamepadAsset(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  true,
);
