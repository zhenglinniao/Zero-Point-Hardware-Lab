import './model-assets.ts';
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
import { gamepadExterior } from '../lib/digital/gamepad-asset.ts';
import {doubleGaussSurfaces,lensElements,opticalCentre,opticalVertices,sphericalSag,paraxialPrescription,imagePlaneY} from '../lib/digital/lens-prescription.ts';

const oldDocument = globalThis.document;
globalThis.document = { createElement: () => ({ width:0, height:0, getContext: () => new Proxy({}, { get: (_,key) => key==='createImageData' ? (w:number,h:number)=>({ data:new Uint8ClampedArray(w*h*4) }) : ()=>{} }) }) } as unknown as Document;
const models = new Map(digitalDefinitions.map((definition)=>[definition.id,buildModel(definition.id)]));
after(()=>{ models.forEach(disposeModelResources); globalThis.document=oldDocument; });

await test('the device library exposes every independent system exactly once',()=>{
  assert.deepEqual(new Set(devices.map((device)=>device.level)),new Set(systemRoots));
  assert.equal(devices.length,new Set(devices.map((device)=>device.level)).size);
  assert.equal(digitalRoots.length,5);
  assert.equal(Object.keys(digitalLevels).length,23);
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

await test('PS5 packages move away from their own PCB face throughout dissection',()=>{
  const model=models.get('ps5board')!;
  const definition=digitalDefinitions.find(d=>d.id==='ps5board')!;
  try {
    const scratch=new ModelStageScratch();
    for(const amount of [0,.1,.25,.5]) {
      for(const piece of model.pieces) applyPiecePose(piece,'ps5board',amount,scratch);
      const pcb=new T.Box3().setFromObject(model.pieces.find(p=>p.concept==='ps5board-pcb')!.object);
      for(const part of definition.parts.filter(p=>p.id==='apu'||p.id.startsWith('memory')||p.id.startsWith('nand'))) {
        const box=new T.Box3().setFromObject(model.pieces.find(p=>p.concept===`ps5board-${part.id}`)!.object);
        assert.ok(part.pos[1]>0 ? box.min.y>pcb.max.y : box.max.y<pcb.min.y,`${part.id} crosses PCB at ${amount}`);
      }
    }
  } finally {for(const piece of model.pieces) applyPiecePose(piece,'ps5board',0,new ModelStageScratch());}
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

await test('board details remain attached to their selectable PCB and batches have finite transforms',()=>{
  for(const level of ['ps5board','phoneboard','gamepadboard'] as DigitalLevel[]) {
    const model=models.get(level)!;
    const pcb=model.pieces.find(piece=>piece.concept===`${level}-pcb`)!;
    let bodies=0;
    pcb.object.traverse(object=>{
      if(!(object instanceof T.InstancedMesh) || object.userData.detailKind!=='passive-bodies')return;
      bodies+=object.count;
      const matrix=new T.Matrix4();
      for(let i=0;i<object.count;i++){
        object.getMatrixAt(i,matrix);
        assert.ok(matrix.elements.every(Number.isFinite));
        assert.ok(Math.abs(matrix.elements[13])>0,'devices belong on a board face');
      }
    });
    assert.ok(bodies>40,`${level} must contain actual support geometry`);
  }
});

await test('the wide PS5 stand stays below its side covers instead of piercing the outer skin',()=>{
  const model=models.get('ps5')!;
  const frame=model.pieces.find(piece=>piece.concept==='ps5-frame')!;
  model.root.updateMatrixWorld(true);
  const point=new T.Vector3();let standVertices=0;
  frame.object.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const positions=object.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);
      if(Math.abs(point.x)<=55/40)continue;
      standVertices++;
      assert.ok(point.y < -195/40,'wide foot must clear the full cover height');
    }
  });
  assert.ok(standVertices>0);
});

await test('licensed controller surfaces map once to named assemblies at one uniform scale',()=>{
  const model=models.get('gamepad')!,bounds=new T.Box3();let count=0;
  const names=new Set<string>();
  for(const piece of model.pieces)piece.object.traverse(object=>{
    if(!(object instanceof T.Mesh) || object.userData.assetAuthor!=='Taohid Animation')return;
    count++;assert.ok(!names.has(object.name),`duplicated artist mesh ${object.name}`);names.add(object.name);
    bounds.union(new T.Box3().setFromObject(object));
    if(object.name.startsWith('back-shell'))assert.equal(piece.concept,'gamepad-back');
    if(object.name.startsWith('touchpad'))assert.equal(piece.concept,'gamepad-touch');
  });
  assert.equal(count,81);assert.ok(Math.abs(bounds.getSize(new T.Vector3()).x-160/18)<1e-5);
});

await test('independent controller instances own their geometry, material and texture handles',()=>{
  const part=digitalDefinitions.find(d=>d.id==='gamepad')!.parts.find(p=>p.id==='back')!;
  const a=gamepadExterior(part)!,b=gamepadExterior(part)!;
  const meshA=a.children[0] as T.Mesh,meshB=b.children[0] as T.Mesh;
  assert.notEqual(meshA.geometry,meshB.geometry);assert.notEqual(meshA.material,meshB.material);
  assert.notEqual((meshA.material as T.MeshStandardMaterial).normalMap,(meshB.material as T.MeshStandardMaterial).normalMap);
  disposeModelResources({root:a,pieces:[]});
  assert.ok(new T.Box3().setFromObject(b).getSize(new T.Vector3()).x>150);
  disposeModelResources({root:b,pieces:[]});
});

await test('prescription glass has positive edge thickness and shares both cemented interfaces',()=>{
  for(const element of lensElements)for(let i=0;i<=64;i++){
    const r=element.clearRadius*i/64;
    const front=opticalVertices[element.front]+sphericalSag(doubleGaussSurfaces[element.front].radius,r);
    const back=opticalVertices[element.back]+sphericalSag(doubleGaussSurfaces[element.back].radius,r);
    assert.ok(back-front>0,`inverted optical solid ${element.id} at ${r}`);
  }
  assert.equal(lensElements[1].back,lensElements[2].front);
  assert.equal(lensElements[3].back,lensElements[4].front);
  const optics=paraxialPrescription();
  assert.ok(Math.abs(optics.focalLength-100.003748)<.00001);
  assert.ok(Math.abs(optics.backFocus-61.487536)<.0001);
  assert.ok(Math.abs(optics.imageHeight)<.00001);
  assert.ok(optics.stopRadius>6 && optics.stopRadius<7);
});

await test('all six curved glass solids render and the source image plane meets the full-frame sensor',()=>{
  const lens=models.get('cameralens')!,ids:number[]=[];
  lens.root.traverse(object=>{if(object instanceof T.Mesh && object.userData.opticalElement)ids.push(object.userData.opticalElement);});
  assert.deepEqual(ids.sort((a,b)=>a-b),[1,2,3,4,5,6]);
  const camera=models.get('camera')!;camera.root.updateMatrixWorld(true);
  const assembly=camera.pieces.find(p=>p.concept==='cameralens')!.object.children[0];
  const image=assembly.localToWorld(new T.Vector3(0,imagePlaneY/10,0));
  const sensitive=new T.Box3();
  camera.root.traverse(object=>{if(object instanceof T.Mesh && object.userData.activeSensor)sensitive.union(new T.Box3().setFromObject(object));});
  const size=sensitive.getSize(new T.Vector3());
  assert.ok(Math.abs(size.x-35.9/15)<1e-5);assert.ok(Math.abs(size.y-23.9/15)<1e-5);
  assert.ok(Math.abs(image.z-sensitive.max.z)<1e-5,'optical image must land on the active face');
  assert.ok(Math.abs(27.5/15-sensitive.max.z-18/15)<1e-5,'E-mount mating face is 18 mm ahead of sensor');
  assert.ok(opticalCentre>38 && opticalCentre<40);
});

await test('controller battery and haptic bodies stay inside the licensed shell at representative sections',()=>{
  const definition=digitalDefinitions.find(d=>d.id==='gamepad')!;
  const shell=new T.Group();
  for(const part of definition.parts){const exterior=gamepadExterior(part);if(exterior){exterior.position.set(...part.pos);shell.add(exterior);}}
  shell.updateMatrixWorld(true);
  const sections:[number,number,number,number][]=[];
  for(const id of ['battery','haptics','right-haptic']){
    const part=definition.parts.find(p=>p.id===id)!;
    const [x,y,z]=part.pos,half=part.size[1]/2;
    for(const offset of id==='battery'?[0]:[-part.size[2]/2,part.size[2]/2])sections.push([x,z+offset,y-half,y+half]);
  }
  for(const [x,z,bottom,top] of sections){
    const ray=new T.Raycaster(new T.Vector3(x,100,z),new T.Vector3(0,-1,0));
    const hits=ray.intersectObject(shell,true).filter(hit=>/^(back-shell|black-front-shell|white-shell)/.test(hit.object.name));
    assert.ok(hits.length>=2,`closed shell section ${x},${z}`);
    const heights=hits.map(hit=>hit.point.y);
    assert.ok(top<Math.max(...heights),`body pierces upper skin at ${x},${z}`);
    assert.ok(bottom>Math.min(...heights),`body pierces lower skin at ${x},${z}`);
  }
  disposeModelResources({root:shell,pieces:[]});
});


await test('major solid modules stay separate throughout extraction before inventory packing',()=>{
  const pairs={phone:[['phone-display','phone-battery'],['phoneboard','phone-battery']],camera:[['camera-board','camera-heatplate'],['camerasensor','camera-shutter'],['camera-board','camera-battery'],['camera-slots','camera-battery']],earbudunit:[['earbudunit-battery','earbuddriver'],['earbudunit-processor','earbudunit-mic']],ps5:[['ps5-power','ps5cooling'],['ps5-drive','ps5board'],['ps5-fan','ps5-power']]};
  for(const [level,checks] of Object.entries(pairs)){
    const model=models.get(level as DigitalLevel)!;
    try{for(let step=0;step<=35;step++){
      for(const piece of model.pieces)applyPiecePose(piece,level as DigitalLevel,step/50,new ModelStageScratch());
      model.root.updateMatrixWorld(true);
      for(const [left,right] of checks){
        const a=new T.Box3().setFromObject(model.pieces.find(p=>p.concept===left)!.object);
        const b=new T.Box3().setFromObject(model.pieces.find(p=>p.concept===right)!.object);
        assert.ok(!a.intersectsBox(b),`${level}: ${left} crosses ${right} at ${step*2}%`);
      }
    }}finally{for(const piece of model.pieces)applyPiecePose(piece,level as DigitalLevel,0,new ModelStageScratch());}
  }
});

await test('phone support frame waits until the display and internal modules have withdrawn',()=>{
  const model=models.get('phone')!,frame=model.pieces.find(p=>p.concept==='phone-frame')!,board=model.pieces.find(p=>p.concept==='phoneboard')!;
  applyPiecePose(frame,'phone',.35,new ModelStageScratch());applyPiecePose(board,'phone',.35,new ModelStageScratch());
  assert.ok(frame.object.position.equals(frame.base));assert.ok(board.object.position.y>board.base.y);
  applyPiecePose(frame,'phone',0,new ModelStageScratch());applyPiecePose(board,'phone',0,new ModelStageScratch());
});

await test('phone display stack fits the enclosure thickness and shield clears its actual packages',()=>{
  const phone=models.get('phone')!,display=new T.Box3().setFromObject(phone.pieces.find(p=>p.concept==='phone-display')!.object);
  assert.ok(display.min.y>=-3.9/12-1e-6);assert.ok(display.max.y<=-2.8/12);
  const board=models.get('phoneboard')!,shield=new T.Box3().setFromObject(board.pieces.find(p=>p.concept==='phoneboard-shield')!.object);
  for(const id of ['soc','nand','radio','pmic']){
    const chip=new T.Box3().setFromObject(board.pieces.find(p=>p.concept===`phoneboard-${id}`)!.object);
    assert.ok(chip.max.y<shield.min.y,`${id} penetrates shield`);
  }
});

await test('both earphones use the same native assembly and turn their nozzle along the case width',()=>{
  const model=models.get('earbuds')!;model.root.updateMatrixWorld(true);
  const bounds=[];
  for(const id of ['earbuds-left','earbudunit']){
    const piece=model.pieces.find(p=>p.concept===id)!;
    const box=new T.Box3().setFromObject(piece.object);bounds.push(box);
    assert.ok(box.min.z>-9/10 && box.max.z<9/10,'heads must clear front and rear case walls');
    assert.ok(box.max.y<16.5/10,'heads must clear the closed lid');
    assert.ok(box.min.y>-12.85/10,'stems must clear the battery envelope');
  }
  assert.ok(bounds[0].getSize(new T.Vector3()).distanceTo(bounds[1].getSize(new T.Vector3()))<1e-6);
});

await test('NP-FZ100 body follows the official dimensions and clears the actual grip mesh',()=>{
  const model=models.get('camera')!;model.root.updateMatrixWorld(true);
  let shell:T.Mesh|undefined,cell:T.Mesh|undefined;
  model.root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.cameraBodyShell)shell=o;if(o instanceof T.Mesh&&o.userData.batteryEnvelope)cell=o;});
  assert.ok(shell&&cell);const bounds=new T.Box3().setFromObject(cell),size=bounds.getSize(new T.Vector3()).multiplyScalar(15);
  assert.ok(size.distanceTo(new T.Vector3(22.7,51.7,38.7))<.0001);
  const probe=new T.Mesh(shell.geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));
  probe.updateMatrixWorld(true);
  const direction=new T.Vector3(1,.137,.091).normalize();
  for(const sample of [bounds,new T.Box3().setFromObject(model.pieces.find(p=>p.concept==='camera-slots')!.object)])
  for(const x of [sample.min.x,(sample.min.x+sample.max.x)/2,sample.max.x])for(const y of [sample.min.y,(sample.min.y+sample.max.y)/2,sample.max.y])for(const z of [sample.min.z,(sample.min.z+sample.max.z)/2,sample.max.z]){
    const point=shell.worldToLocal(new T.Vector3(x,y,z));
    const hits=new T.Raycaster(point,direction,.0001,200).intersectObject(probe);
    const unique=hits.filter((hit,i)=>i===0||Math.abs(hit.distance-hits[i-1].distance)>.0001);
    assert.equal(unique.length%2,0,'battery or card slot sample is inside rendered shell material');
    if(unique.length)assert.ok(unique[0].distance>.15,'battery and slots must retain actual mesh clearance');
  }
  (probe.material as T.Material).dispose();
});

await test('installed camera lens is closed while the standalone lens keeps its inspection cut',()=>{
  for(const [level,closed] of [['camera',true],['cameralens',false]] as const){
    let closures=0,cuts=0;
    models.get(level)!.root.traverse(o=>{if(o.userData.closedSection){closures++;assert.equal(o.visible,closed);}if(o.userData.cutFace){cuts++;assert.equal(o.visible,!closed);}});
    assert.ok(closures>0&&cuts>0);
  }
});

await test('phone magnetic ring clears the logic-board shield and stays beneath the back glass',()=>{
  const model=models.get('phone')!;model.root.updateMatrixWorld(true);let ring:T.Object3D|undefined;
  model.root.traverse(o=>{if(o.name==='phone-magnetic-ring')ring=o;});assert.ok(ring);
  const b=new T.Box3().setFromObject(ring),board=new T.Box3().setFromObject(model.pieces.find(p=>p.concept==='phoneboard')!.object);
  const back=new T.Box3().setFromObject(model.pieces.find(p=>p.concept==='phone-back')!.object);
  assert.ok(b.min.y>board.max.y);assert.ok(b.max.y<back.min.y);
});

await test('case lower shell opens upward and lid opens downward rather than trapping solid ceilings',async()=>{
  const {chargingCase}=await import('../lib/digital/molded-shells.ts');
  for(const lid of [false,true]){
    const material=new T.MeshBasicMaterial({side:T.DoubleSide}),geometry=chargingCase(lid,60.6,lid?7:38,21.7),mesh=new T.Mesh(geometry,material);
    mesh.updateMatrixWorld(true);
    const ray=new T.Raycaster(new T.Vector3(0,lid?-20:30,0),new T.Vector3(0,lid?1:-1,0));
    const hits=ray.intersectObject(mesh);assert.ok(hits.length>0);
    assert.ok(lid?hits[0].point.y>1:hits[0].point.y< -16,'opening must face the earphone tray');
    geometry.dispose();material.dispose();
  }
});

await test('PS5 cover snap seats follow the actual inner skin instead of floating on a straight line',()=>{
  const model=models.get('ps5')!;model.root.updateMatrixWorld(true);
  for(const [id,sign] of [['ps5-left-cover',-1],['ps5-right-cover',1]] as const){
    const piece=model.pieces.find(p=>p.concept===id)!;let skin:T.Mesh|undefined,owner:T.Object3D|undefined;
    piece.object.traverse(o=>{if(o instanceof T.Mesh&&o.name==='ps5-cover-inner-skin')skin=o;if(o.userData.coverAnchors)owner=o;});assert.ok(skin&&owner);
    for(const anchor of owner.userData.coverAnchors){
      const origin=owner.localToWorld(new T.Vector3(...anchor as [number,number,number]));
      const hits=new T.Raycaster(origin,new T.Vector3(sign,0,0),.00001,2/40).intersectObject(skin);
      assert.ok(hits.length>0&&hits[0].distance<1.2/40,'snap base must sit on the deformed inner skin');
    }
  }
});
