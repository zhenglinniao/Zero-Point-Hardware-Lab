import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { Vec3 } from '../layout.ts';
import { digitalDefinitions, type DigitalLevel } from './catalogue.ts';
import { detailedGeometry } from './geometry.ts';

/** Build every scale from its canonical parts; child geometry keeps native units. */
export function buildDigital(level: DigitalLevel, tools: ModelTools) {
  const definition = digitalDefinitions.find((entry) => entry.id === level)!;
  const vec = (value: Vec3): Vec3 =>
    value.map((v) => v / definition.unit) as Vec3;
  for (const part of definition.parts) {
    const object = new T.Group();
    if (part.motion) object.userData.disassemblyWindow = part.motion;
    const nested = part.open ?? part.assembly;
    if (nested) {
      const assembly = tools.assembly(nested);
      const child = digitalDefinitions.find((entry) => entry.id === nested)!;
      assembly.scale.setScalar(child.unit / definition.unit);
      if (
        level === 'ps5' &&
        (part.open === 'ps5board' || part.open === 'ps5cooling')
      )
        assembly.quaternion.setFromRotationMatrix(
          new T.Matrix4().makeBasis(
            new T.Vector3(0, 0, 1),
            new T.Vector3(1, 0, 0),
            new T.Vector3(0, 1, 0),
          ),
        );
      if (
        level === 'camera' &&
        (part.open === 'camerasensor' || part.open === 'cameralens')
      )
        assembly.rotation.x = Math.PI / 2;
      if (part.rotation) assembly.rotation.set(...part.rotation);
      object.add(assembly);
    } else {
      const geometry = detailedGeometry(level, part, definition.unit, tools);
      if (part.rotation) geometry.rotation.set(...part.rotation);
      else if (level === 'camera' && part.shape === 'screen')
        geometry.rotation.x = -Math.PI / 2;
      object.add(geometry);
    }
    tools.add(
      part.open ?? `${level}-${part.id}`,
      object,
      vec(part.pos),
      vec(part.delta),
      0,
    );
  }
}
