import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { DigitalPart } from './catalogue.ts';
import type { LevelId } from '../levels.ts';

// PS5 Controller by Taohid Animation, CC BY 4.0. See the vendored notice.
export const gamepadAssetURL = '/models/dualsense/dualsense.glb';
let template: T.Group | null = null;
let pending: Promise<void> | null = null;
const exteriorParts = new Set([
  'top',
  'back',
  'touch',
  'buttons',
  'leftstick',
  'rightstick',
  'triggers',
  'right-trigger',
]);

export async function installGamepadAsset(data: ArrayBuffer, headless = false) {
  const loader = new GLTFLoader();
  if (headless)
    loader.register(() => ({
      name: 'test-textures',
      loadTexture: async () => new T.Texture(),
    }));
  const gltf = await loader.parseAsync(data, '');
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root);
  const factor = 160 / bounds.getSize(new T.Vector3()).x;
  const transform = new T.Matrix4()
    .makeRotationX(-Math.PI / 2)
    .premultiply(new T.Matrix4().makeScale(factor, factor, factor));
  const prepared = new T.Group();
  root.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    const mesh = object.clone();
    mesh.geometry = object.geometry
      .clone()
      .applyMatrix4(
        new T.Matrix4().multiplyMatrices(transform, object.matrixWorld),
      );
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(1);
    mesh.name = object.name;
    mesh.userData.assetAuthor = 'Taohid Animation';
    prepared.add(mesh);
  });
  template = prepared;
  // Prepared meshes own their geometry; parser geometry is never rendered.
  const retired = new Set<T.BufferGeometry>();
  root.traverse((o) => {
    if (o instanceof T.Mesh) retired.add(o.geometry);
  });
  retired.forEach((g) => g.dispose());
}

export async function prepareModelAssets(level: LevelId) {
  if (level !== 'gamepad' || template) return;
  if (!pending)
    pending = (async () => {
      const response = await fetch(gamepadAssetURL, {
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok)
        throw new Error(`手柄模型资源加载失败（${response.status}）`);
      await installGamepadAsset(await response.arrayBuffer());
    })().catch((error) => {
      pending = null;
      throw new Error(
        `手柄模型资源加载失败，请刷新后重试。${error instanceof Error ? error.message : ''}`,
      );
    });
  await pending;
}

function owner(name: string) {
  if (name.startsWith('back-shell')) return 'back';
  if (name.startsWith('touchpad') || name.startsWith('lights__touchpad'))
    return 'touch';
  if (name.startsWith('left-stick')) return 'leftstick';
  if (name.startsWith('right-stick')) return 'rightstick';
  if (name.startsWith('l1__') || name.startsWith('l2__')) return 'triggers';
  if (name.startsWith('r1__') || name.startsWith('r2__'))
    return 'right-trigger';
  if (
    /^(triangle|square|cross|circle|up|down|left__|right__|ps__|mute__|options__|create__)/.test(
      name,
    )
  )
    return 'buttons';
  return 'top';
}

/** Independent geometry/material/texture ownership allows model disposal and
 * repeated visits without destroying an asset template or another viewport. */
export function gamepadExterior(part: DigitalPart): T.Group | null {
  if (!exteriorParts.has(part.id)) return null;
  if (!template) throw new Error('精细手柄模型尚未加载');
  const group = new T.Group();
  const textures = new Map<T.Texture, T.Texture>();
  for (const object of template.children) {
    if (!(object instanceof T.Mesh) || owner(object.name) !== part.id) continue;
    const mesh = object.clone();
    mesh.geometry = object.geometry.clone();
    mesh.geometry.translate(-part.pos[0], -part.pos[1], -part.pos[2]);
    const cloneMaterial = (original: T.Material) => {
      const material = original.clone() as T.MeshStandardMaterial;
      for (const key of [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'emissiveMap',
        'alphaMap',
      ] as const) {
        const source = material[key];
        if (!source) continue;
        if (!textures.has(source)) textures.set(source, source.clone());
        material[key] = textures.get(source)!;
      }
      material.roughness = Math.max(material.roughness, 0.38);
      material.metalness = Math.min(material.metalness, 0.22);
      return material;
    };
    mesh.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
    group.add(mesh);
  }
  if (!group.children.length) throw new Error(`缺少精细模型部件：${part.id}`);
  return group;
}
