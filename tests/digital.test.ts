import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { digitalDefinitions, digitalLevels, digitalRoots, type DigitalLevel } from '../lib/digital/catalogue.ts';
import { buildModel } from '../lib/models.ts';
import { byId, manifest, searchConcepts } from '../lib/manifest.ts';
import { levelPath, systemRoot, systemRoots } from '../lib/levels.ts';
import { chineseIntro } from '../lib/zh.ts';
import { devices } from '../lib/devices.ts';
import { applyPiecePose, disposeModelResources, ModelStageScratch, posedModelBounds, prepareModelInventory } from '../lib/model-stage.ts';

const oldDocument = globalThis.document;
globalThis.document = { createElement: () => ({ width:0, height:0, getContext: () => new Proxy({}, { get: (_,key) => key==='createImageData' ? (w:number,h:number)=>({ data:new Uint8ClampedArray(w*h*4) }) : ()=>{} }) }) } as unknown as Document;
const models = new Map(digitalDefinitions.map((definition)=>[definition.id,buildModel(definition.id)]));
after(()=>{ models.forEach(disposeModelResources); globalThis.document=oldDocument; });

await test('the device library exposes every independent system exactly once',()=>{
  assert.deepEqual(new Set(devices.map((device)=>device.level)),new Set(systemRoots));
  assert.equal(devices.length,new Set(devices.map((device)=>device.level)).size);
  assert.equal(digitalRoots.length,5);
  assert.equal(Object.keys(digitalLevels).length,14);
});
await test('every digital scale has native selectable geometry, Chinese descriptions and a reversible owner',()=>{
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
await test('nested digital assemblies retain native millimetre proportions under uniform scaling',()=>{
  for(const parent of digitalDefinitions) for(const part of parent.parts.filter((item)=>item.open)) {
    const piece=models.get(parent.id)!.pieces.find((item)=>item.concept===part.open)!;
    const child=digitalDefinitions.find((item)=>item.id===part.open)!;
    const scale=child.unit/parent.unit;
    const assembly=piece.object.children[0];
    assert.equal(piece.object.scale.x,1,'stage-owned root must stay at native unit scale');
    assert.ok(Math.abs(assembly.scale.x-scale)<1e-9);
    assert.equal(assembly.scale.x,assembly.scale.y);
    assert.equal(assembly.scale.x,assembly.scale.z);
    const original=new T.Box3().setFromObject(models.get(part.open as DigitalLevel)!.root);
    const expected=original.applyMatrix4(new T.Matrix4().compose(piece.object.position,assembly.quaternion,assembly.scale)).getSize(new T.Vector3());
    const actual=new T.Box3().setFromObject(piece.object).getSize(new T.Vector3());
    assert.ok(expected.distanceTo(actual)<1e-6,part.open);
  }
});
await test('runtime posing cannot erase native conversion or installed rotation',()=>{
  for(const definition of digitalDefinitions) {
    const model=models.get(definition.id)!;
    prepareModelInventory(model,definition.id,1.5);
    for(const part of definition.parts.filter((item)=>item.open)) {
      const piece=model.pieces.find((item)=>item.concept===part.open)!;
      const sizeBefore=new T.Box3().setFromObject(piece.object).getSize(new T.Vector3());
      const nested=piece.object.children[0];
      const nativeScale=nested.scale.clone(), nativeRotation=nested.quaternion.clone();
      for(const amount of [0,.5,1,0]) {
        applyPiecePose(piece,definition.id,amount,new ModelStageScratch());
        assert.ok(nested.scale.equals(nativeScale));
        assert.ok(nested.quaternion.equals(nativeRotation));
      }
      const sizeAfter=new T.Box3().setFromObject(piece.object).getSize(new T.Vector3());
      assert.ok(sizeBefore.distanceTo(sizeAfter)<1e-6,part.open);
    }
  }
});
await test('all digital assembly, dissection and inventory bounds remain finite and populated',()=>{
  for(const [id,model] of models) {
    prepareModelInventory(model,id,1.5);
    for(const explode of [0,.5,1]) {
      const bounds=posedModelBounds(model,id,explode);
      assert.ok(!bounds.isEmpty(),`${id} at ${explode}`);
      for(const value of [...bounds.min.toArray(),...bounds.max.toArray()]) assert.ok(Number.isFinite(value));
    }
  }
});
await test('PS5 installed modules clear one another including the two-sided board components',()=>{
  const model=models.get('ps5')!;
  const boxes=['ps5cooling','ps5-fan','ps5-power','ps5-drive'].map((id)=>({id,box:new T.Box3().setFromObject(model.pieces.find((piece)=>piece.concept===id)!.object)}));
  for(let a=0;a<boxes.length;a++) for(let b=a+1;b<boxes.length;b++) {
    assert.ok(!boxes[a].box.intersectsBox(boxes[b].box),`${boxes[a].id} intersects ${boxes[b].id}`);
  }
  // A single box for the entire board fills empty space between the low APU
  // and upper fan notch. Check each actual subassembly in installed coordinates.
  model.root.updateMatrixWorld(true);
  const installed=model.pieces.find(p=>p.concept==='ps5board')!.object.children[0];
  for(const piece of models.get('ps5board')!.pieces) {
    const bound=new T.Box3().setFromObject(piece.object).applyMatrix4(installed.matrixWorld);
    for(const other of boxes) assert.ok(!bound.intersectsBox(other.box),`${piece.concept} intersects ${other.id}`);
  }
});

await test('original PS5 has eight GDDR6 packages, six NAND packages on two faces and an enclosed fan',()=>{
  const board=digitalDefinitions.find(d=>d.id==='ps5board')!;
  assert.equal(board.parts.filter(p=>p.id.startsWith('memory')).length,8);
  const nand=board.parts.filter(p=>p.id.startsWith('nand'));
  assert.equal(nand.length,6);
  assert.equal(nand.filter(p=>p.pos[1]>0).length,3);
  assert.equal(nand.filter(p=>p.pos[1]<0).length,3);
  const ps5=models.get('ps5')!;
  const fan=new T.Box3().setFromObject(ps5.pieces.find(p=>p.concept==='ps5-fan')!.object);
  const cover=new T.Box3().setFromObject(ps5.pieces.find(p=>p.concept==='ps5-left-cover')!.object);
  assert.ok(fan.max.y<=cover.max.y,'fan must stay below the exterior top');
});

await test('iPhone rear-view landmarks match Apple and internal flex stays beneath the glass',()=>{
  const phone=digitalDefinitions.find(d=>d.id==='phone')!;
  const part=(id:string)=>phone.parts.find(p=>p.id===id)!;
  assert.ok(part('speaker').pos[0]<0 && part('haptic').pos[0]>0,'speaker left, Taptic Engine right');
  assert.ok(part('truedepth').pos[2]<-55,'front camera is separate at the top');
  const model=models.get('phone')!;
  const glass=new T.Box3().setFromObject(model.pieces.find(p=>p.concept==='phone-back')!.object);
  for(const id of ['phone-camera-flex','phone-battery-flex','phone-fasteners']) {
    const box=new T.Box3().setFromObject(model.pieces.find(p=>p.concept===id)!.object);
    assert.ok(box.max.y<glass.min.y,`${id} pokes through back glass`);
  }
});
await test('earbuds fit below the closed case lid and phone battery clears its logic board',()=>{
  const model=models.get('earbuds')!;
  const lid=new T.Box3().setFromObject(model.pieces.find((piece)=>piece.concept==='earbuds-lid')!.object);
  for(const id of ['earbuds-left','earbudunit']) {
    const box=new T.Box3().setFromObject(model.pieces.find((piece)=>piece.concept===id)!.object);
    assert.ok(box.max.y<lid.min.y,id);
    assert.ok(box.min.y>-19/10,'buds must clear the case floor');
  }
  const phone=models.get('phone')!;
  const battery=new T.Box3().setFromObject(phone.pieces.find((piece)=>piece.concept==='phone-battery')!.object);
  const board=new T.Box3().setFromObject(phone.pieces.find((piece)=>piece.concept==='phoneboard')!.object);
  assert.ok(!battery.intersectsBox(board));
});
await test('Chinese reading summaries cover every inherited and new component without replacing source data',()=>{
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

await test('switching models releases both board traces and mesh resources without double disposal',()=>{
  const root=new T.Group();
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
  const meshMaterial=new T.MeshBasicMaterial();
  const traceMaterial=new T.LineBasicMaterial();
  root.add(new T.Mesh(geometry,meshMaterial),new T.LineSegments(geometry,traceMaterial));
  const disposed=[0,0,0];
  [geometry,meshMaterial,traceMaterial].forEach((resource,index)=>resource.addEventListener('dispose',()=>{disposed[index]++;}));
  disposeModelResources({root,pieces:[]});
  assert.deepEqual(disposed,[1,1,1]);
});
