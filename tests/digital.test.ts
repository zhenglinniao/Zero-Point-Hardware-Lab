import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { digitalDefinitions, digitalLevels, digitalRoots, type DigitalLevel } from '../lib/digital/catalogue.ts';
import { buildModel } from '../lib/models.ts';
import { byId, manifest, searchConcepts } from '../lib/manifest.ts';
import { levelPath, systemRoot, systemRoots } from '../lib/levels.ts';
import { chineseIntro } from '../lib/zh.ts';
import { devices } from '../lib/devices.ts';
import { disposeModelResources, posedModelBounds, prepareModelInventory } from '../lib/model-stage.ts';

const oldDocument = globalThis.document;
globalThis.document = { createElement: () => ({ width:0, height:0, getContext: () => new Proxy({}, { get: (_,key) => key==='createImageData' ? (w:number,h:number)=>({ data:new Uint8ClampedArray(w*h*4) }) : ()=>{} }) }) } as unknown as Document;
const models = new Map(digitalDefinitions.map((definition)=>[definition.id,buildModel(definition.id)]));
after(()=>{ models.forEach(disposeModelResources); globalThis.document=oldDocument; });

test('the device library exposes every independent system exactly once',()=>{
  assert.deepEqual(new Set(devices.map((device)=>device.level)),new Set(systemRoots));
  assert.equal(devices.length,new Set(devices.map((device)=>device.level)).size);
  assert.equal(digitalRoots.length,5);
  assert.equal(Object.keys(digitalLevels).length,14);
});
test('every digital scale has native selectable geometry, Chinese descriptions and a reversible owner',()=>{
  for(const definition of digitalDefinitions) {
    const model=models.get(definition.id)!;
    assert.equal(model.pieces.length,definition.parts.length,definition.id);
    assert.equal(levelPath(definition.id)[0],systemRoot(definition.id));
    for(const piece of model.pieces) {
      const c=byId[piece.concept];
      assert.ok(c && c.level===definition.id,piece.concept);
      assert.match(c.description,/[\u3400-\u9fff]/);
      assert.match(c.purpose,/[\u3400-\u9fff]/);
      assert.ok(piece.reveal===0,'existing assembled hardware cannot appear from nowhere');
      let triangles=0;
      piece.object.traverse((object)=>{if(object instanceof T.Mesh) triangles+=(object.geometry.index?.count ?? object.geometry.getAttribute('position').count)/3;});
      assert.ok(triangles>0,piece.concept);
    }
  }
});
test('nested digital assemblies retain native millimetre proportions under uniform scaling',()=>{
  for(const parent of digitalDefinitions) for(const part of parent.parts.filter((item)=>item.open)) {
    const piece=models.get(parent.id)!.pieces.find((item)=>item.concept===part.open)!;
    const child=digitalDefinitions.find((item)=>item.id===part.open)!;
    const scale=child.unit/parent.unit;
    assert.ok(Math.abs(piece.object.scale.x-scale)<1e-9);
    assert.equal(piece.object.scale.x,piece.object.scale.y);
    assert.equal(piece.object.scale.x,piece.object.scale.z);
    const original=new T.Box3().setFromObject(models.get(part.open as DigitalLevel)!.root);
    const expected=original.applyMatrix4(new T.Matrix4().compose(piece.object.position,piece.object.quaternion,piece.object.scale)).getSize(new T.Vector3());
    const actual=new T.Box3().setFromObject(piece.object).getSize(new T.Vector3());
    assert.ok(expected.distanceTo(actual)<1e-6,part.open);
  }
});
test('all digital assembly, dissection and inventory bounds remain finite and populated',()=>{
  for(const [id,model] of models) {
    prepareModelInventory(model,id,1.5);
    for(const explode of [0,50,100]) {
      const bounds=posedModelBounds(model,id,explode);
      assert.ok(!bounds.isEmpty(),`${id} at ${explode}`);
      for(const value of [...bounds.min.toArray(),...bounds.max.toArray()]) assert.ok(Number.isFinite(value));
    }
  }
});
test('Chinese reading summaries cover every inherited and new component without replacing source data',()=>{
  for(const concept of manifest) {
    const original=concept.description;
    const intro=chineseIntro(concept);
    assert.match(intro.description,/[\u3400-\u9fff]/,concept.id);
    assert.match(intro.purpose,/[\u3400-\u9fff]/,concept.id);
    assert.equal(concept.description,original);
  }
  assert.ok(searchConcepts('手机').some((item)=>item.id==='phone'));
  assert.ok(searchConcepts('相机').some((item)=>item.id==='camera'));
  assert.ok(searchConcepts('PS5').some((item)=>item.id==='ps5'));
});
