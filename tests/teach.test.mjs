import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as clinical from '../clinical.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=name=>{const m=html.match(new RegExp(`/\\*${name}-START\\*/([\\s\\S]*?)/\\*${name}-END\\*/`));assert.ok(m,name+' block missing');return m[1]};
const ctx={};
vm.runInNewContext(`${block('QUIZ')}\n${block('MAP')}\nthis.QUIZ=QUIZ;this.MAP=MAP;`,ctx);
const {QUIZ,MAP}=ctx;

test('20 questions, 10 basic and 10 advanced',()=>{
 assert.equal(QUIZ.length,20);
 assert.equal(QUIZ.filter(q=>q.lv==='basic').length,10);
 assert.equal(QUIZ.filter(q=>q.lv==='adv').length,10);
});
test('answers spread A–D 5 each',()=>{
 for(const a of [0,1,2,3])assert.equal(QUIZ.filter(q=>q.a===a).length,5,'ABCD'[a]);
});
QUIZ.forEach((q,i)=>test(`Q${i+1} is complete`,()=>{
 assert.equal(q.opts.length,4);
 assert.equal(new Set(q.opts).size,4);
 assert.ok(q.a>=0&&q.a<4);
 assert.ok(q.why.length>30);
 assert.ok(q.src.length>0);
 for(const [k] of q.src)assert.ok(['intl','tw'].includes(k));
}));
for(const [i,q] of QUIZ.entries()){
 if(!q.check)continue;
 for(const c of [].concat(q.check))test(`Q${i+1} agrees with the engine (${c.input.protocol||c.fn})`,()=>{
  const r=clinical[c.fn](c.input);
  assert.equal(r.kind,c.kind);
  if(c.n!==undefined)assert.equal(r.n,c.n);
 });
}
test('map has 3 branches per side, each with leaves, a tab link and a source tag',()=>{
 assert.equal(MAP.left.length,3);
 assert.equal(MAP.right.length,3);
 const views=[...html.matchAll(/<section id="(\w+)" class="view"/g)].map(m=>m[1]);
 for(const b of [...MAP.left,...MAP.right]){
  assert.ok(b.leaves.length>=4,b.title);
  assert.ok(views.includes(b.go[0]),b.go[0]);
  for(const [t,d,tags] of b.leaves){assert.ok(t&&d);assert.ok(tags.length>0,t)}
 }
});
test('map thresholds match the engine protocols',()=>{
 const text=JSON.stringify(MAP);
 assert.ok(text.includes(clinical.protocols.ada75.mg.join('／')));
 assert.ok(text.includes(clinical.protocols.cc100.mg.join('／')));
});
