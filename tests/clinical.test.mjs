import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnose,postpartum,postpartumWindow,assessLog} from '../clinical.mjs';
const dx=(values,rest={})=>diagnose({protocol:'ada75',week:26,unit:'mg',values,...rest});
for(const [name,values,expected] of [
 ['below all',[91,179,152],0],['fasting equality',[92,179,152],1],['1h equality',[91,180,152],1],['2h equality',[91,179,153],1],['all equal',[92,180,153],3]
])test('75 g '+name,()=>assert.equal(dx(values).n,expected));
for(const [name,values,expected] of [
 ['mmol fasting equality',[5.1,9.9,8.4],1],['mmol 1h equality',[5,10,8.4],1],['mmol 2h equality',[5,9.9,8.5],1],['mmol below all',[5,9.9,8.4],0]
])test(name,()=>assert.equal(dx(values,{unit:'mmol'}).n,expected));
test('overt fasting overrides GDM',()=>assert.equal(dx([126,180,153]).kind,'danger'));
test('overt 75g 2h overrides GDM',()=>assert.equal(dx([90,180,200]).kind,'danger'));
test('100g 2h 200 alone is not overt 75g criterion',()=>assert.notEqual(dx([90,170,200,120],{protocol:'cc100'}).kind,'danger'));
test('early OGTT blocked for diagnosis',()=>assert.match(dx([92,180,153],{week:10}).title,/不適用/));
test('late pregnancy flagged',()=>assert.match(dx([92,180,153],{week:30}).text,/超過/));
test('missing OGTT rejected',()=>assert.throws(()=>dx([92,'',150]),/請填寫/));
test('zero rejected',()=>assert.throws(()=>dx([0,180,153]),/介於/));
test('wrong unit plausible limits rejected',()=>assert.throws(()=>dx([92,180,153],{unit:'mmol'}),/介於/));
test('acute override works without inputs',()=>assert.equal(dx([],{week:'',acute:true}).kind,'danger'));
test('low OGTT still flagged',()=>assert.ok(dx([60,180,153]).lowWarning));
test('100g one high',()=>assert.match(dx([95,179,154,139],{protocol:'cc100'}).title,/單項/));
test('100g two equal',()=>assert.equal(dx([95,180,154,139],{protocol:'cc100'}).kind,'success'));
test('NICE mmol fasting exact',()=>assert.equal(dx([5.6,7],{protocol:'nice75',unit:'mmol'}).n,1));
test('NICE mmol 2h exact',()=>assert.equal(dx([5,7.8],{protocol:'nice75',unit:'mmol'}).n,1));
test('NICE mg uses unrounded conversion',()=>assert.equal(dx([100.8,140.3],{protocol:'nice75'}).n,1));
test('50 g 140 positive is screening only',()=>assert.match(dx([140],{protocol:'screen50'}).title,/初篩陽性/));
test('50 g selected 130 cutoff',()=>assert.equal(dx([130],{protocol:'screen50',screenCut:130}).n,1));
test('50 g high flags evaluation not random diagnosis',()=>assert.match(dx([210],{protocol:'screen50'}).text,/不可單用/));
test('early 110 risk',()=>assert.match(dx([110,'',''],{protocol:'early',week:10}).title,/高風險/));
test('early 5.9 A1c risk',()=>assert.match(dx(['',5.9,''],{protocol:'early',week:10}).title,/高風險/));
test('early no false low from A1c',()=>assert.equal(dx(['',6.1,''],{protocol:'early',week:10}).lowWarning,undefined));
test('early A1c 6.5 diabetes range',()=>assert.equal(dx(['',6.5,''],{protocol:'early',week:10}).kind,'danger'));
test('early negative retains screening',()=>assert.match(dx([90,5.1,''],{protocol:'early',week:10}).text,/24–28/));
test('empty early invalid',()=>assert.throws(()=>dx(['','',''],{protocol:'early',week:10}),/至少/));
test('random 200 symptoms supports clear diagnosis',()=>assert.match(dx(['','',200],{protocol:'early',week:10,symptoms:true}).text,/典型症狀/));
test('late A1c warning',()=>assert.match(dx(['',5.1,''],{protocol:'early',week:25}).text,/HbA1c 可能/));
test('postpartum 100 prediabetes',()=>assert.equal(postpartum({fasting:100,two:139}).kind,'warning'));
test('postpartum 140 prediabetes',()=>assert.equal(postpartum({fasting:99,two:140}).kind,'warning'));
test('postpartum 126 diabetes',()=>assert.equal(postpartum({fasting:126,two:139}).kind,'danger'));
test('postpartum 200 diabetes',()=>assert.equal(postpartum({fasting:99,two:200}).kind,'danger'));
test('postpartum normal',()=>assert.equal(postpartum({fasting:99,two:139}).kind,'success'));
test('postpartum mmol 7 diabetes',()=>assert.equal(postpartum({unit:'mmol',fasting:7,two:7}).kind,'danger'));
test('postpartum mmol 7.8 prediabetes',()=>assert.equal(postpartum({unit:'mmol',fasting:5,two:7.8}).kind,'warning'));
test('postpartum date year rollover',()=>assert.deepEqual(postpartumWindow('2026-12-20'),{start:'2027-01-17',end:'2027-03-14',niceStart:'2027-01-31',niceEnd:'2027-03-21'}));
test('invalid date rejected',()=>assert.throws(()=>postpartumWindow('2026-02-30'),/無效/));
test('log missing values excluded',()=>{const r=assessLog({text:'90,140,-,130'});assert.equal(r.total,3);assert.equal(r.high,1);assert.equal(r.percent,33)});
test('log severe low detected',()=>{const r=assessLog({text:'50,130,130,130'});assert.equal(r.low,1);assert.equal(r.severe,1)});
test('log mmol boundary',()=>assert.equal(assessLog({text:'5.3,7.8,7.7,-',unit:'mmol'}).high,2));
test('log NICE 2h separate',()=>assert.equal(assessLog({text:'5,6.4,6.3,-',unit:'mmol',meal:'2',guideline:'nice'}).high,1));
test('log malformed data rejected',()=>assert.throws(()=>assessLog({text:'90,130,oops,130'}),/介於/));
test('all missing rejected',()=>assert.throws(()=>assessLog({text:'-,-,-,-'}),/全部/));
test('trailing missing preserved',()=>assert.equal(assessLog({text:'90,130,130,'}).total,3));

test('postpartum low warning',()=>assert.ok(postpartum({fasting:60,two:100}).lowWarning));

test('blank lines between log rows are skipped',()=>{const r=assessLog({text:'90,130,130,130\n\n95,140,-,-\n'});assert.equal(r.total,6);assert.equal(r.rows.length,2)});
test('log error keeps original line number',()=>assert.throws(()=>assessLog({text:'90,130,130,130\n\n90,130'}),/第 3 列/));
test('index.html inline engine matches clinical.mjs',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const inline=html.split('<script>(()=>{\n')[1].split('\nconst $=id=>')[0].trim();
 const mod=(await readFile(new URL('../clinical.mjs',import.meta.url),'utf8')).replaceAll('export ','').trim();
 assert.equal(inline,mod,'index.html 內嵌臨床規則與 clinical.mjs 不一致');
});
