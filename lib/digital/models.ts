import * as T from 'three';
import type { ModelTools } from '../hardware.ts';
import type { Vec3 } from '../layout.ts';
import { digitalDefinitions, type DigitalLevel, type DigitalPart } from './catalogue.ts';

/** Native physical dimensions use one conversion per device family; nested assemblies scale uniformly. */
export function buildDigital(level: DigitalLevel, tools: ModelTools) {
  const definition = digitalDefinitions.find((entry) => entry.id === level)!;
  const mm = (value: number) => value / definition.unit;
  const vec = (value: Vec3): Vec3 => [mm(value[0]), mm(value[1]), mm(value[2])];
  const place = (group: T.Group, mesh: T.Object3D, pos: Vec3 = [0,0,0]) => { mesh.position.set(...vec(pos)); group.add(mesh); return mesh; };
  const block = (size: Vec3, color: string, metal = .2) => tools.box(vec(size), color, metal, mm(Math.min(...size) * .16));
  const cylinder = (radius: number, height: number, color: string, metal = .3, inner = 0) => {
    if (inner > 0) {
      const shape = new T.Shape(); shape.absarc(0,0,mm(radius),0,Math.PI * 2,false);
      const hole = new T.Path(); hole.absarc(0,0,mm(inner),0,Math.PI * 2,true); shape.holes.push(hole);
      const geometry = new T.ExtrudeGeometry(shape, { depth: mm(height), bevelEnabled: false, curveSegments: 32 });
      geometry.rotateX(-Math.PI / 2); geometry.translate(0,-mm(height)/2,0);
      return new T.Mesh(geometry, tools.material(color, metal, .5));
    }
    return new T.Mesh(new T.CylinderGeometry(mm(radius), mm(radius), mm(height), 40), tools.material(color, metal, .46));
  };
  const roundedShape = (width: number, height: number, radius: number) => {
    const w = mm(width), h = mm(height), r = mm(radius), x = -w/2, y = -h/2;
    const shape = new T.Shape(); shape.moveTo(x+r,y); shape.lineTo(x+w-r,y); shape.quadraticCurveTo(x+w,y,x+w,y+r); shape.lineTo(x+w,y+h-r); shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h); shape.lineTo(x+r,y+h); shape.quadraticCurveTo(x,y+h,x,y+h-r); shape.lineTo(x,y+r); shape.quadraticCurveTo(x,y,x+r,y);
    return shape;
  };
  const plate = (size: Vec3,color:string,radius:number) => {
    const geometry=new T.ExtrudeGeometry(roundedShape(size[0],size[2],radius),{depth:mm(size[1]),bevelEnabled:false,curveSegments:24});
    geometry.rotateX(-Math.PI/2); geometry.translate(0,-mm(size[1])/2,0);
    return new T.Mesh(geometry,tools.material(color,.2,.45));
  };
  function buildPart(part: DigitalPart): T.Object3D {
    const [w,h,d] = part.size;
    const color = part.color;
    const group = new T.Group();
    switch (part.shape) {
      case 'board': {
        place(group, tools.pcb(vec(part.size)));
        // Visible support parts are context within the named board, not anonymous pickable components.
        for (let i=0; i<7; i++) place(group, block([Math.max(1,w*.06),Math.max(.6,Math.min(w,h,d)*.3),Math.max(1,d*.035)], '#b6ac8c', .5), [(i%3-1)*w*.25,h/2+.4, (Math.floor(i/3)-1)*d*.24]);
        return group;
      }
      case 'chip': {
        place(group, block(part.size, color, .25));
        const labelColor = tools.material('#a6aaa0', .6, .6);
        const mark = new T.Mesh(new T.BoxGeometry(mm(w*.5),mm(.12),mm(d*.08)), labelColor); place(group, mark, [0,h/2+.08,0]);
        return group;
      }
      case 'battery': {
        place(group, block(part.size,color,.16));
        place(group, block([w*.6,.15,d*.55], '#676f65', .15), [0,h/2+.12,0]);
        place(group, block([w*.17,Math.max(.3,h*.18),Math.max(.6,d*.07)], '#c9a56b', .7), [w*.28,0,-d*.53]);
        return group;
      }
      case 'screen': {
        const body = level==='phone' ? plate(part.size,'#10181d',8) : block(part.size, '#10181d', .25); place(group,body);
        const face = new T.Mesh(new T.PlaneGeometry(mm(w*.94),mm(d*.95)), new T.MeshBasicMaterial({ color, side: T.DoubleSide })); face.rotation.x=-Math.PI/2; place(group,face,[0,h/2+.08,0]);
        for(let i=0;i<4;i++) place(group,block([w*(.55+i*.07),.05,d*.035], ['#4a6e7a','#67959b','#7eaaa4','#a2bdab'][i],0),[0,h/2+.12,d*(.1+i*.09)]);
        if(level === 'phone') place(group,block([w*.27,.12,d*.035], '#070b10', .1), [0,h/2+.18,-d*.42]);
        return group;
      }
      case 'wing': {
        const shape = new T.Shape();
        shape.moveTo(-mm(d*.5),-mm(h*.49)); shape.quadraticCurveTo(-mm(d*.58),mm(h*.07),-mm(d*.46),mm(h*.54)); shape.lineTo(mm(d*.5),mm(h*.47)); shape.quadraticCurveTo(mm(d*.42),0,mm(d*.48),-mm(h*.46)); shape.closePath();
        const geometry = new T.ExtrudeGeometry(shape,{depth:mm(w),bevelEnabled:true,bevelThickness:mm(1),bevelSize:mm(1),bevelSegments:2,curveSegments:24}); geometry.rotateY(Math.PI/2); geometry.translate(-mm(w/2),0,0);
        return new T.Mesh(geometry,tools.material(color,.1,.68));
      }
      case 'frame': {
        const thickness = Math.min(w,d) * .055;
        const shape = roundedShape(w,d,Math.min(w,d)*.12);
        const hole = new T.Path(roundedShape(w-thickness*2,d-thickness*2,Math.min(w,d)*.08).getPoints());
        shape.holes.push(hole);
        const geometry = new T.ExtrudeGeometry(shape,{depth:mm(h),bevelEnabled:false,curveSegments:16}); geometry.rotateX(-Math.PI/2); geometry.translate(0,-mm(h/2),0);
        const frame=new T.Mesh(geometry,tools.material(color,.6,.52));
        if(level==='earbuds' && part.id==='case') {
          group.add(frame);
          place(group,plate([w-1,2,d-1],color,Math.min(w,d)*.1),[0,-h/2+1,0]);
          return group;
        }
        return frame;
      }
      case 'ring': return cylinder(Math.min(w,d)/2,h,color,.55,Math.min(w,d)*.37);
      case 'lens': {
        const diameter = Math.min(w,d);
        place(group,cylinder(diameter/2,h,color,.45,diameter*.37));
        const glass = new T.Mesh(new T.CylinderGeometry(mm(diameter*.36),mm(diameter*.36),mm(Math.max(.25,h*.12)),40),new T.MeshPhysicalMaterial({color:'#345f7f',metalness:.25,roughness:.12,transparent:true,opacity:.87,clearcoat:1}));
        place(group,glass,[0,h*.25,0]);
        for(let i=0;i<16;i++) { const angle=i*Math.PI/8; place(group,block([diameter*.035,h*.6,diameter*.035], '#50595b', .4),[Math.sin(angle)*diameter*.47,0,Math.cos(angle)*diameter*.47]); }
        return group;
      }
      case 'coil': {
        const diameter = Math.min(w,d);
        for(let i=0;i<7;i++) place(group,cylinder(diameter*(.25+i*.035),Math.max(.12,h*.35),color,.7,diameter*(.24+i*.035)));
        return group;
      }
      case 'sensor': {
        place(group,block(part.size,'#455653',.5));
        place(group,block([w*.86,.2,d*.86],color,.65),[0,h/2+.15,0]);
        for(let i=0;i<6;i++) place(group,block([w*.8,.03,d*.008],'#a199b7',.4),[0,h/2+.27,(i-2.5)*d*.12]);
        return group;
      }
      case 'diaphragm': {
        const mesh = new T.Mesh(new T.SphereGeometry(mm(w*.48),40,16,0,Math.PI*2,0,Math.PI/2),tools.material(color,.55,.3)); mesh.scale.y=.12; group.add(mesh); return group;
      }
      case 'fins': {
        for(let i=0;i<28;i++) place(group,block([Math.max(.4,w/70),h,d],color,.85),[(i/27-.5)*w,0,0]);
        place(group,block([w,Math.max(.5,h*.07),d], '#767e7c', .75),[0,-h*.48,0]); return group;
      }
      case 'pipes': {
        for(let i=0;i<4;i++) {
          const x=(i-1.5)*w/4;
          const curve=new T.CatmullRomCurve3([new T.Vector3(...vec([x,0,-d*.45])),new T.Vector3(...vec([x+w*.1,0,-d*.1])),new T.Vector3(...vec([x-w*.1,0,d*.1])),new T.Vector3(...vec([x,0,d*.45]))]);
          group.add(new T.Mesh(new T.TubeGeometry(curve,24,mm(Math.min(h/2,w*.025)),8,false),tools.material(color,.8,.4)));
        }
        return group;
      }
      case 'fan': {
        const diameter=Math.min(h,d); const rotor = new T.Group();
        place(rotor,cylinder(diameter*.48,w,color,.3,diameter*.42));
        place(rotor,cylinder(diameter*.14,w*.8,'#343a40',.3));
        for(let i=0;i<12;i++) { const angle=i*Math.PI/6; const blade=block([diameter*.3,w*.16,diameter*.16],'#5a6268',.3); blade.rotation.y=angle+.4; place(rotor,blade,[Math.sin(angle)*diameter*.28,0,Math.cos(angle)*diameter*.28]); }
        rotor.rotation.z=Math.PI/2; group.add(rotor); return group;
      }
      case 'shutter': {
        place(group,block(part.size,'#1d2529',.5));
        for(let i=0;i<7;i++) { const slat=block([w*.88,Math.max(.08,h*.15),d*.11], i%2 ? '#495456' : '#667071', .5); place(group,slat,[0,h/2+.12,(i-3)*d*.12]); }
        return group;
      }
      case 'grip-shell': {
        if(level === 'camera') {
          const shape=roundedShape(w*.82,h*.8,5); const hole=new T.Path(); hole.absarc(mm(-8),0,mm(25),0,Math.PI*2,true); shape.holes.push(hole);
          const geometry=new T.ExtrudeGeometry(shape,{depth:mm(d*.65),bevelEnabled:true,bevelSize:mm(2),bevelThickness:mm(2),bevelSegments:2,curveSegments:24}); geometry.translate(0,0,-mm(d*.3)); group.add(new T.Mesh(geometry,tools.material(color,.15,.85)));
          place(group,block([w*.23,h*.86,d], '#222a2b', .1),[w*.39,-h*.06,0]);
        } else {
          place(group,block([w*.72,h*.5,d*.65],color,.1));
          for(const sign of [-1,1]) { const grip=block([w*.23,h*.78,d*.8],color,.1); grip.rotation.y=sign*.3; place(group,grip,[sign*w*.36,-h*.1,d*.22]); }
        }
        return group;
      }
      case 'stick': {
        place(group,block([w*.85,h*.35,d*.85],'#6b7772',.45),[0,-h*.25,0]);
        place(group,cylinder(w*.14,h*.55,'#414a4a',.45));
        place(group,cylinder(w*.42,h*.18,color,.1),[0,h*.35,0]); return group;
      }
      case 'buttons': {
        for(const side of [-1,1]) for(let i=0;i<4;i++) { const a=i*Math.PI/2; place(group,cylinder(d*.13,h,color,.1),[side*w*.37+Math.sin(a)*d*.27,0,Math.cos(a)*d*.27]); } return group;
      }
      case 'earbud': {
        const body=new T.Mesh(new T.SphereGeometry(mm(w*.52),32,20),tools.material(color,.08,.48)); body.scale.set(1,.85,d/w); place(group,body,[0,h*.17,-d*.08]);
        place(group,block([w*.33,h*.7,w*.36],color,.12),[w*.16,-h*.22,d*.13]);
        place(group,cylinder(w*.18,1,'#36454b',.25),[0,h*.61,-d*.07]); return group;
      }
      default: return level==='phone' && part.id==='back' ? plate(part.size,color,8) : block(part.size,color,.35);
    }
  }
  for(const part of definition.parts) {
    let object: T.Object3D;
    if(part.open) {
      const assembly=tools.assembly(part.open);
      const child=digitalDefinitions.find((entry)=>entry.id===part.open)!;
      assembly.scale.setScalar(child.unit/definition.unit);
      if(level === 'ps5' && (part.open === 'ps5board' || part.open === 'ps5cooling')) assembly.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,0,1),new T.Vector3(1,0,0),new T.Vector3(0,1,0)));
      if(level === 'camera' && (part.open==='camerasensor' || part.open==='cameralens')) assembly.rotation.x=Math.PI/2;
      if(level==='phone' && part.open==='phonecamera') assembly.rotation.x=Math.PI;
      // The stage owns the selectable root's scale and quaternion during posing.
      // Keep physical conversion inside an identity wrapper, so runtime animation
      // cannot reset the native assembly size or installed orientation.
      const wrapper=new T.Group(); wrapper.add(assembly); object=wrapper;
    } else {
      object=buildPart(part);
      if(level==='camera' && (part.shape==='screen' || part.shape==='shutter')) object.rotation.x=Math.PI/2;
    }
    tools.add(part.open ?? `${level}-${part.id}`,object,vec(part.pos),vec(part.delta),0);
  }
}
