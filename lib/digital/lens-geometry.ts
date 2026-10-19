import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { DigitalPart } from './catalogue.ts';
import {
  doubleGaussSurfaces,
  glassIndex,
  lensElements,
  opticalCentre,
  opticalVertices,
  sphericalSag,
  paraxialPrescription,
  lensMountY,
} from './lens-prescription.ts';

/** Source optical solids + independently authored serviceable mechanics.
 * The 90-degree housing section is a deliberate inspection cut, not a claim
 * that a manufactured lens has an open barrel. Native millimetres, +Y front. */
export function buildLensPart(part: DigitalPart, tools: ModelTools) {
  const g = new T.Group(),
    id = part.id;
  const finishes = new Map<string, T.MeshStandardMaterial>();
  const metal = (color = '#7d888c', rough = 0.44) => {
    const key = color + rough;
    if (finishes.has(key)) return finishes.get(key)!;
    const material = tools.material(color, 0.78, rough).clone();
    material.roughnessMap = null;
    material.roughness = rough;
    material.envMapIntensity = 0.9;
    finishes.set(key, material);
    return material;
  };
  const plastic = () => tools.material('#151c22', 0.05, 0.72);
  const put = (object: T.Object3D, x = 0, y = 0, z = 0) => {
    object.position.set(x, y, z);
    g.add(object);
    return object;
  };
  const ring = (
    outer: number,
    inner: number,
    h: number,
    material: T.Material = metal(),
    section = false,
  ) => {
    const b = Math.min(0.5, h * 0.2, (outer - inner) * 0.2);
    const profile = [
      [inner, -h / 2],
      [outer - b, -h / 2],
      [outer, -h / 2 + b],
      [outer, h / 2 - b],
      [outer - b, h / 2],
      [inner, h / 2],
      [inner, -h / 2],
    ].map(([x, y]) => new T.Vector2(x, y));
    const geo = new T.LatheGeometry(
      profile,
      96,
      section ? Math.PI / 2 : 0,
      section ? Math.PI * 1.5 : Math.PI * 2,
    );
    const group = new T.Group();
    group.add(new T.Mesh(geo, material));
    if (section) {
      const closure = new T.Mesh(
        new T.LatheGeometry(profile, 32, 0, Math.PI / 2),
        material.clone(),
      );
      closure.userData.closedSection = true;
      closure.visible = false;
      group.add(closure);
    }
    if (section)
      for (const angle of [Math.PI / 2, Math.PI * 2]) {
        const cap = new T.ShapeGeometry(new T.Shape(profile));
        const p = cap.getAttribute('position');
        for (let i = 0; i < p.count; i++)
          p.setXYZ(
            i,
            p.getX(i) * Math.sin(angle),
            p.getY(i),
            p.getX(i) * Math.cos(angle),
          );
        cap.computeVertexNormals();
        const m = metal('#a9b0af').clone();
        m.side = T.DoubleSide;
        const face = new T.Mesh(cap, m);
        face.userData.cutFace = true;
        group.add(face);
      }
    return group;
  };
  const screw = (x: number, y: number, z: number) => {
    put(
      new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.65, 16), metal()),
      x,
      y,
      z,
    );
    put(tools.box([0.95, 0.04, 0.15], '#242c30', 0.1, 0.02), x, y + 0.35, z);
  };
  if (lensElements.some((e) => e.group === id)) {
    for (const element of lensElements.filter((e) => e.group === id)) {
      const front = doubleGaussSurfaces[element.front],
        back = doubleGaussSurfaces[element.back];
      const profile: T.Vector2[] = [];
      // Start on the rear axis, walk outwards and return along the front face:
      // this gives the lathed solid outward-facing normals on every surface.
      for (let i = 0; i <= 48; i++) {
        const r = (element.clearRadius * i) / 48;
        profile.push(
          new T.Vector2(
            r,
            opticalCentre -
              opticalVertices[element.back] -
              sphericalSag(back.radius, r) -
              part.pos[1],
          ),
        );
      }
      for (let i = 48; i >= 0; i--) {
        const r = (element.clearRadius * i) / 48;
        profile.push(
          new T.Vector2(
            r,
            opticalCentre -
              opticalVertices[element.front] -
              sphericalSag(front.radius, r) -
              part.pos[1],
          ),
        );
      }
      profile.push(profile[0].clone());
      const glass = new T.MeshPhysicalMaterial({
        color: element.id % 2 ? '#deede6' : '#e6e0f0',
        metalness: 0,
        roughness: 0.025,
        transmission: 0.65,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        ior: glassIndex(front.glass),
        thickness:
          opticalVertices[element.back] - opticalVertices[element.front],
        attenuationColor: new T.Color('#e1eee6'),
        attenuationDistance: 120,
        clearcoat: 1,
      });
      const mesh = new T.Mesh(new T.LatheGeometry(profile, 128), glass);
      mesh.userData.opticalElement = element.id;
      g.add(mesh);
    }
  } else if (id === 'barrel') {
    put(ring(33.5, 29, 88, plastic(), true));
    for (const y of [-42, 42])
      put(ring(33.7, 29, 0.9, metal('#a8b0b0'), true), 0, y, 0);
    for (const y of [-30, 20]) put(ring(34, 32.8, 8, plastic(), true), 0, y, 0);
    for (let i = 0; i < 96; i++) {
      const a = Math.PI / 2 + (i / 95) * Math.PI * 1.5;
      for (const y of [-30, 20]) {
        const ridge = tools.box([0.45, 7.4, 0.7], '#373e42', 0.1, 0.12);
        ridge.rotation.y = a;
        put(ridge, Math.sin(a) * 33.9, y, Math.cos(a) * 33.9);
      }
    }
    // Scale marks live on the housing, leaving the optical aperture clear.
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 0.68 + i * 0.105;
      const tick = tools.box(
        [0.28, i % 3 ? 1.8 : 3.5, 0.15],
        '#c6d0ca',
        0.1,
        0.03,
      );
      tick.rotation.y = a;
      put(tick, Math.sin(a) * 33.65, 3, Math.cos(a) * 33.65);
    }
  } else if (['frontcell', 'midcell', 'rearcell', 'endcell'].includes(id)) {
    const radius = {
      frontcell: 25.7,
      midcell: 23.2,
      rearcell: 21.2,
      endcell: 22.2,
    }[id]!;
    put(ring(radius + 2.1, radius, part.size[1], metal('#3d484b')));
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      screw(
        Math.sin(a) * (radius + 1.1),
        part.size[1] / 2 + 0.35,
        Math.cos(a) * (radius + 1.1),
      );
    }
    put(
      ring(radius + 2.5, radius + 0.15, 0.75, metal('#b2a178')),
      0,
      part.size[1] / 2 + 0.45,
      0,
    );
  } else if (id === 'spacers') {
    put(ring(27.2, 24.5, part.size[1], metal('#272f34')));
    for (const y of [-part.size[1] / 2, part.size[1] / 2])
      put(ring(27.4, 24.5, 0.5, metal('#b8b09b')), 0, y, 0);
  } else if (id === 'helicoid') {
    put(ring(29, 27.6, 25, metal('#827f68'), true));
    for (let start = 0; start < 3; start++) {
      // Each turn is a separate open helix arc; do not bridge the section cut.
      for (let turn = 0; turn < 9; turn++) {
        const arc: T.Vector3[] = [];
        for (let i = 0; i <= 56; i++) {
          const a = Math.PI / 2 + (i / 56) * Math.PI * 1.5;
          arc.push(
            new T.Vector3(
              Math.sin(a) * 29.1,
              -11 +
                ((turn + (a - (start * Math.PI * 2) / 3) / (Math.PI * 2)) *
                  22) /
                  9,
              Math.cos(a) * 29.1,
            ),
          );
        }
        g.add(
          new T.Mesh(
            new T.TubeGeometry(new T.CatmullRomCurve3(arc), 56, 0.2, 5, false),
            metal('#c2b689'),
          ),
        );
      }
    }
  } else if (id === 'iris') {
    const r = paraxialPrescription().stopRadius;
    put(ring(26, 22, 2, metal('#3c4749')));
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9,
        shape = new T.Shape();
      shape.moveTo(r, 0);
      shape.bezierCurveTo(r + 4, -9, 20, -13, 23, -3);
      shape.lineTo(22, 5);
      shape.quadraticCurveTo(r + 4, 4, r, 0);
      const geo = new T.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: false,
        curveSegments: 20,
      });
      geo.rotateX(Math.PI / 2);
      const blade = new T.Mesh(geo, metal(i % 2 ? '#657174' : '#4b565b'));
      blade.rotation.y = a;
      put(blade, 0, (i - 4) * 0.11, 0);
      screw(Math.sin(a) * 23.8, 1.2, Math.cos(a) * 23.8);
    }
  } else if (id === 'irisdrive') {
    put(ring(27.9, 25.5, 1.4, metal('#b9b6a2')));
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9;
      put(
        new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 1.5, 12), metal('#b99455')),
        Math.sin(a) * 26.4,
        0.9,
        Math.cos(a) * 26.4,
      );
    }
    for (let i = 0; i < 32; i++) {
      const a = Math.PI * 0.6 + i * 0.038;
      const tooth = tools.box([0.6, 1.2, 0.85], '#c7c2a4', 0.7, 0.1);
      tooth.rotation.y = a;
      put(tooth, Math.sin(a) * 28, 0, Math.cos(a) * 28);
    }
  } else if (id === 'adapter') {
    put(ring(30, 22.8, part.size[1], metal('#202a30'), true));
    for (const y of [-part.size[1] / 2 + 0.6, part.size[1] / 2 - 0.6])
      put(ring(30.5, 22.8, 1.2, metal('#899291'), true), 0, y, 0);
  } else if (id === 'mount') {
    put(ring(30.5, 22.8, 3, metal('#b6bfbd')), 0, 1.5, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const tab = tools.box([8, 2, 3.5], '#a5afae', 0.8, 0.5);
      tab.rotation.y = a;
      put(tab, Math.sin(a) * 28, -2, Math.cos(a) * 28);
      screw(Math.sin(a + 0.4) * 27.5, 3.4, Math.cos(a + 0.4) * 27.5);
    }
    for (let i = 0; i < 10; i++) {
      const a = 2.1 + i * 0.075;
      put(
        new T.Mesh(
          new T.CylinderGeometry(0.65, 0.65, 1.0, 12),
          metal('#c9a360'),
        ),
        Math.sin(a) * 24.2,
        -2,
        Math.cos(a) * 24.2,
      );
    }
  } else if (id === 'focusmotor') {
    put(tools.box([6, 20, 13], '#606a6a', 0.65, 1));
    put(
      new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 26, 20), metal('#b5aa8a')),
      0,
      0,
      0,
    );
    for (let i = 0; i < 12; i++)
      put(ring(1.65, 1.15, 0.55, metal('#b5aa8a')), 0, -9 + i * 1.6, 0);
    put(tools.box([5, 3, 7], '#203128', 0.1, 0.5), 0, 11, 0);
  } else if (id === 'flex') {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(0, -25, 0),
      new T.Vector3(0, -10, 1),
      new T.Vector3(2, 0, 2),
      new T.Vector3(0, 20, 2),
    ]);
    for (let i = 0; i < 7; i++)
      put(
        new T.Mesh(
          new T.TubeGeometry(path, 32, 0.12, 5, false),
          metal('#c6964e'),
        ),
        i * 0.38 - 1.1,
        0,
        0,
      );
  } else if (id === 'seal') {
    const seal = new T.Mesh(
      new T.TorusGeometry(29, 0.6, 12, 128),
      tools.material('#222b2b', 0, 0.9),
    );
    seal.rotation.x = Math.PI / 2;
    g.add(seal);
  } else if (id === 'filterring') {
    put(ring(33.5, 29.3, 5, metal('#1a2228')));
    for (let i = 0; i < 5; i++)
      put(ring(29.8, 29.25, 0.22, metal('#b4bab7')), 0, -1.6 + i * 0.7, 0);
  } else if (id === 'fasteners') {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      screw(Math.sin(a) * 28.1, 0, Math.cos(a) * 28.1);
    }
  } else throw new Error(`Unknown precision lens part ${id}`);
  g.userData.source = 'Optiland DoubleGauss / MIT';
  g.userData.flangePlane = lensMountY;
  return g;
}
