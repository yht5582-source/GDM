// Clinical rules are deliberately independent of presentation. Native-unit thresholds
// avoid rounded unit conversions changing a boundary classification.
export const protocols = {
 ada75: {name:'75 g OGTT · ADA / IADPSG',labels:['空腹','1 小時','2 小時'],mg:[92,180,153],mmol:[5.1,10,8.5],need:1,source:'ADA 2026 §2，表 2.8'},
 nice75: {name:'75 g OGTT · NICE',labels:['空腹','2 小時'],mg:[100.8,140.4],mmol:[5.6,7.8],need:1,source:'NICE NG3 §1.2.8'},
 cc100: {name:'100 g OGTT · Carpenter–Coustan',labels:['空腹','1 小時','2 小時','3 小時'],mg:[95,180,155,140],mmol:[5.3,10,8.6,7.8],need:2,source:'ADA 2026 §2，表 2.8'},
 screen50: {name:'50 g GLT · 兩步法初篩',labels:['1 小時'],mg:[140],mmol:[7.8],need:1,source:'ADA 2026 §2，表 2.8'},
 early: {name:'明顯糖尿病／早孕評估',labels:['空腹（選填）','HbA1c（選填）','隨機血糖（選填）'],mg:[],mmol:[],source:'ADA 2026 §2、NIDDK Tests & Diagnosis'}
};
export function number(value, label, min, max, optional=false) {
 if(value==='' || value==null) { if(optional)return null; throw new Error(`請填寫${label}。`); }
 const n=Number(value); if(!Number.isFinite(n)||n<min||n>max) throw new Error(`${label}須介於 ${min}–${max}，請核對數值與單位。`); return n;
}
const result=(kind,title,text,extra={})=>({kind,title,text,...extra});
function diagnoseCore({protocol='ada75',unit='mg',week,values=[],acute=false,symptoms=false,screenCut=140}){
 if(acute)return result('danger','先處理急症，暫停常規判讀','持續嘔吐、不能進食飲水、呼吸異常、意識改變或疑似酮酸中毒，需立即急診／產科評估。孕期 DKA 可出現在不很高的血糖；勿等候 OGTT，也勿自行停用第 1 型糖尿病的基礎胰島素。');
 const w=number(week,'孕週',0,42); const p=protocols[protocol]; if(!p)throw new Error('請選擇有效方案。');
 const isM=unit==='mmol'; const max=isM?55.6:1000, min=isM?1:18;
 if(protocol==='early'){
  const f=number(values[0],'空腹血糖',min,max,true),a=number(values[1],'HbA1c',3,20,true),r=number(values[2],'隨機血糖',min,max,true);
  if([f,a,r].every(v=>v===null))throw new Error('至少填寫一項實驗室檢驗值。');
  const fHigh=f!==null&&f>=(isM?7:126),aHigh=a!==null&&a>=6.5,rHigh=r!==null&&r>=(isM?11.1:200);
  const caution=w>=15?'目前已非 <15 週早孕篩檢窗口；HbA1c 可能受孕期紅血球變化影響，診斷優先依血漿葡萄糖。 ':'';
  if(fHigh||aHigh||rHigh) return result('danger','達糖尿病範圍，需確認與分型',caution+(rHigh&&symptoms?'隨機血糖達門檻且有典型症狀，可支持明確診斷，應即時安排治療。':'若無明確高血糖症狀／危象，需依標準確認異常（重複檢測或第二項有效檢驗）；不以單次結果自動確診。')+' 優先轉入糖尿病合併懷孕照護，不僅當作一般 GDM。',{source:p.source});
  if(w<15&&((f!==null&&f>=(isM?6.1:110))||(a!==null&&a>=5.9)))return result('warning','早孕期高風險糖代謝異常','尚未達明顯糖尿病門檻。安排營養諮詢與血糖追蹤，由專科共同決定是否提早治療；不可直接套用 24–28 週 OGTT 標準確診 GDM。',{source:p.source});
  return result('info','目前資料未達明顯糖尿病門檻',caution+'不代表已排除 GDM。未診斷糖尿病者，仍需安排／完成 24–28 週篩檢；若已超過時程，請盡速由產科評估。',{source:p.source});
 }
 const vals=p.labels.map((label,i)=>number(values[i],label,min,max));
 let limits=[...(isM?p.mmol:p.mg)];
 if(protocol==='screen50'){
  const cut=Number(screenCut);if(![130,135,140].includes(cut))throw new Error('初篩門檻無效。');limits=[isM?({130:7.2,135:7.5,140:7.8}[cut]):cut];
 }
 const rows=vals.map((v,i)=>({label:p.labels[i],value:v,limit:limits[i],high:v>=limits[i]}));
 const n=rows.filter(r=>r.high).length;
 const extra={rows,n,source:p.source};
 const f=protocol==='screen50'?null:vals[0]; const two=protocol==='ada75'?vals[2]:protocol==='nice75'?vals[1]:null;
 if((f!==null&&f>=(isM?7:126))||(two!==null&&two>=(isM?11.1:200)))return result('danger','達明顯糖尿病評估門檻','空腹 ≥126 mg/dL（7.0 mmol/L）或 75 g OGTT 2 小時 ≥200 mg/dL（11.1 mmol/L）。需確認診斷、評估症狀及糖尿病類型，安排專科共同照護；不僅按一般 GDM 處理。',extra);
 if(w<24)return result('warning','孕週不適用常規 24–28 週判讀','下表僅列出與所選門檻的比較，不作 GDM 確診。請先進行早孕／明顯糖尿病評估；NICE 曾有 GDM 者可依其早期檢測路徑由專科解讀。',extra);
 const late=w>28?'本次超過常規篩檢週數，請由產科確認補篩安排與適用性。 ':'';
 if(protocol==='screen50')return result(n?'warning':'info',n?'50 g 初篩陽性，需確認檢查':'50 g 初篩未達所選門檻',late+(vals[0]>=(isM?11.1:200)?'初篩值明顯偏高，需儘速由醫師評估明顯糖尿病與症狀；不可單用糖水負荷後數值視為隨機血糖確診。 ': '')+(n?'50 g GLT 是篩檢，不能直接等同 GDM 診斷。依兩步法安排空腹 100 g OGTT，或先由醫師依高值情況決定確認方式。':'仍按產檢追蹤；若出現臨床疑慮，重新評估。'),extra);
 if(n>=p.need)return result('success','符合所選 GDM 診斷門檻',late+`${n} 項達門檻；此方案需至少 ${p.need} 項。須確認使用實驗室靜脈血漿、正確糖量、空腹與採血時點，才能完成臨床診斷。`,extra);
 if(protocol==='cc100'&&n===1)return result('warning','100 g OGTT 單項異常','未達本工具採用的「至少 2 項」規則；單項異常仍有風險，部分流程採用 1 項。需依院內／產科標準進一步評估，不視為完全正常。',extra);
 return result('info','未達所選 GDM 診斷門檻',late+'請維持產檢；檢驗條件不正確、胎兒過大或其他臨床疑慮時，仍須重新評估。',extra);
}
export function diagnose(input){
 const r=diagnoseCore(input);
 if(input.acute)return r;
 const values=input.protocol==='early'?[input.values?.[0],input.values?.[2]]:input.values;
 if((values||[]).some(v=>v!==''&&v!=null&&Number(v)<(input.unit==='mmol'?3.9:70)))r.lowWarning='檢驗中有低血糖值（<70 mg/dL／3.9 mmol/L）：需評估採血時症狀與是否已處置；無法吞嚥或意識改變應立即急救。';
 return r;
}
export function assessLog({text,unit='mg',meal='1',guideline='ada'}){
 if(!text.trim())throw new Error('請輸入至少一列血糖紀錄。');
 const isM=unit==='mmol',max=isM?55.6:1000,min=isM?1:18;
 const fasting=isM?5.3:guideline==='nice'?95.4:95;
 const post=meal==='1'?(isM?7.8:guideline==='nice'?140.4:140):(isM?(guideline==='nice'?6.4:6.7):(guideline==='nice'?115.2:120));
 const low=isM?3.9:70,severe=isM?3:54;
 const rows=text.split(/\n/).map((line,index)=>({line:line.trim(),index})).filter(r=>r.line).map(({line,index})=>{
  const parts=line.split(/[,，\t]/); if(parts.length!==4)throw new Error(`第 ${index+1} 列須有 4 欄，以逗號分隔；缺測填「-」。`);
  return parts.map((s,j)=>{
   if(['','-','—'].includes(s.trim()))return null;
   const v=number(s.trim(),`第 ${index+1} 列第 ${j+1} 欄`,min,max);
   return {v,high:v>=(j===0?fasting:post),low:v<low,severe:v<severe};
  });
 });
 const all=rows.flat().filter(Boolean);if(!all.length)throw new Error('全部為缺測，請輸入至少一個數值。');
 return {rows,total:all.length,high:all.filter(v=>v.high).length,low:all.filter(v=>v.low).length,severe:all.filter(v=>v.severe).length,fasting,post,percent:Math.round(all.filter(v=>v.high).length/all.length*100)};
}
function postpartumCore({unit='mg',fasting,two}){
 const m=unit==='mmol',max=m?55.6:1000,min=m?1:18;
 const f=number(fasting,'空腹血糖',min,max),t=number(two,'2 小時血糖',min,max);
 if(f>=(m?7:126)||t>=(m?11.1:200))return result('danger','達非孕期糖尿病範圍','若無明確症狀，依有效檢驗組合／重複檢驗確認；安排糖尿病分型與治療，不只繼續 GDM 追蹤。');
 if(f>=(m?5.6:100)||t>=(m?7.8:140))return result('warning','糖尿病前期範圍','依 ADA 非孕期定義；安排生活型態介入與持續追蹤，有 GDM 病史且過重／肥胖者可由醫師評估 metformin 預防。');
 return result('success','本次未達糖尿病或前期門檻','仍需每 1–3 年終身篩檢；下次懷孕前再評估。此判讀限產後／非孕期的空腹 75 g OGTT。');
}
export function postpartum(input){
 const r=postpartumCore(input);
 if([input.fasting,input.two].some(v=>Number(v)<(input.unit==='mmol'?3.9:70)))r.lowWarning='本次有低血糖值，請確認症狀與是否已處置；未達糖尿病門檻不代表檢驗完全正常。';
 return r;
}
// Taiwan public prenatal-care rules (國健署) are reported separately from the international result.
export const twSource='國健署孕婦產前檢查補助（110.7.1 起）、孕產兒關懷網站';
export function taiwanDx({protocol='ada75',week,acute=false},r){
 if(acute||!r)return null;
 const w=Number(week),items=[];
 if(protocol==='ada75'){
  items.push(r.kind==='danger'?'國健署公費篩檢採同一 IADPSG 標準；本次已達明顯糖尿病範圍，處置同上，不只按 GDM 追蹤。':w<24?'國健署公費 75 g OGTT 時程為妊娠 24–28 週；早於此時程的結果不作台灣公費路徑的 GDM 診斷。':r.kind==='success'?'國健署公費篩檢同採 IADPSG 標準（空腹 ≥92、1 小時 ≥180、2 小時 ≥153 mg/dL，任一項）；本結果在台灣同樣判定為妊娠糖尿病。':'國健署公費篩檢同採 IADPSG 標準（92／180／153 mg/dL，任一項）；本結果在台灣同樣未達妊娠糖尿病診斷。');
 }else if(protocol==='early')items.push('國健署公費妊娠糖尿病篩檢時程為妊娠 24–28 週；早孕期血糖／HbA1c 評估不在該補助項目內，由醫師依風險安排。例行產檢含尿糖檢查。');
 else items.push(`國健署公費篩檢為一步法 75 g OGTT（空腹、1 小時、2 小時三次血漿葡萄糖）；${{nice75:'NICE 門檻',cc100:'100 g OGTT 兩步法',screen50:'50 g 初篩兩步法'}[protocol]||'此方案'}不在公費補助流程內，判讀依院內規範。`);
 if(protocol!=='early'&&Number.isFinite(w)&&w>28)items.push(`公費補助時程為妊娠 24–28 週；目前 ${w} 週已超過，補篩與費用請由產科確認。`);
 return {items,source:twSource};
}
export function postpartumWindow(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('請選擇生產日期。');
 const d=new Date(date+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==date)throw new Error('生產日期無效。');
 const add=days=>new Date(d.valueOf()+days*86400000).toISOString().slice(0,10);
 return {start:add(28),end:add(84),niceStart:add(42),niceEnd:add(91)};
}

