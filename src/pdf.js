// Lokale echte PDF-Generierung (PDF 1.4, A4). Keine Browser-Druckfunktion,
// Onlinebibliothek oder Netzwerkzugriff nötig. Zeichensatz: WinAnsi.
const encoder=new TextEncoder();
const cpMap={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
function toWinAnsi(str){const out=[];for(const c of String(str??'')){const n=c.codePointAt(0);out.push(n<128||(n>=160&&n<=255)?n:(cpMap[c]??63))}return out}
function hex(str){return toWinAnsi(str).map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase()}
function clean(str){return String(str??'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim()}
function wrap(str,width,font=9){const max=Math.max(9,Math.floor(width/(font*.52)));const chunks=[];for(const para of String(str??'').split('\n')){let line='';for(const w of para.split(/\s+/)){if(!w)continue;if(w.length>max){if(line)chunks.push(line),line='';for(let i=0;i<w.length;i+=max)chunks.push(w.slice(i,i+max));continue}if((line+' '+w).trim().length>max){chunks.push(line);line=w}else line=(line+' '+w).trim()}if(line)chunks.push(line)}return chunks.length?chunks:['']}
const PAGE_W=595.28,PAGE_H=841.89;
function makeReport({title='BERICHT',subtitle='',metrics=[],sections=[]}={}){
 const pages=[],margin=41,usable=PAGE_W-2*margin;let ops=[],y=0,pageNo=0;
 const rect=(x,yy,w,h,fill)=>{ops.push(`${fill} rg ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)};
 const line=(x1,y1,x2,y2)=>ops.push(`0.62 0.72 0.20 RG 0.5 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
 const txt=(text,x,yy,{size=9,bold=false,color='0.12 0.16 0.09'}={})=>{ops.push(`${color} rg BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${yy.toFixed(2)} Tm <${hex(clean(text))}> Tj ET`)};
 const newPage=()=>{if(ops.length)pages.push(ops.join('\n'));ops=[];pageNo++;y=PAGE_H-52;rect(0,PAGE_H-9,PAGE_W,9,'0.89 1 0.21');txt('EINSATZ.LOG   /   '+clean(title).slice(0,70),margin,y,{size:12,bold:true});y-=14;line(margin,y,PAGE_W-margin,y);y-=24};
 const need=h=>{if(y-h<57)newPage()};
 const heading=s=>{need(38);txt(s,margin,y,{size:12,bold:true});y-=10;line(margin,y,PAGE_W-margin,y);y-=20};
 const label=(key,value)=>{const parts=wrap(key+'  '+value,usable,9);need(parts.length*12+8);for(const x of parts){txt(x,margin+3,y,{size:9});y-=12}y-=6};
 newPage();label('Erstellt am:',new Date().toLocaleDateString('de-DE'));if(subtitle)label('Berichtszeitraum / Hinweis:',subtitle);
 for(const [k,v] of metrics)label(k+':',v);
 y-=8;
 for(const sect of sections){heading(sect.title||'DATEN');
  if(sect.text)for(const para of wrap(sect.text,usable,9)){need(14);txt(para,margin,y);y-=14}
  if(sect.chart){
   const data=sect.chart,labels=data.labels||[],values=data.values||[];const colorSet=['0.50 0.63 0.14','0.21 0.32 0.12','0.76 0.83 0.51','0.35 0.48 0.26','0.55 0.65 0.42'];
   if(data.type==='pie'){
    const size=120;need(size+20);const cx=margin+73,cy=y-size/2-8,sum=Math.max(1,values.reduce((a,b)=>a+Math.max(0,Number(b)||0),0));let angle=-Math.PI/2;
    for(let i=0;i<values.length;i++){const next=angle+Math.PI*2*Math.max(0,Number(values[i])||0)/sum;const n=Math.max(2,Math.ceil((next-angle)*25));let path=`${colorSet[i%colorSet.length]} rg ${cx.toFixed(1)} ${cy.toFixed(1)} m`;for(let j=0;j<=n;j++){const a=angle+(next-angle)*j/n;path+=` ${(cx+size/2*Math.cos(a)).toFixed(2)} ${(cy+size/2*Math.sin(a)).toFixed(2)} l`;}ops.push(path+' h f');angle=next;}
    for(let i=0;i<labels.length;i++){need(13);txt(`${String(labels[i]).slice(0,28)}: ${values[i]}`,margin+155,y-12-i*14,{size:9});}y-=size+20;
   }else{
    const subset=labels.slice(0,16),max=Math.max(1,...values.map(x=>Math.abs(Number(x)||0))),signed=values.some(x=>Number(x)<0);
    for(let i=0;i<subset.length;i++){need(25);const title=String(subset[i]||'').slice(0,34),n=Number(values[i])||0;txt(title,margin+2,y-1,{size:8});const chartLeft=margin+196,chartWidth=usable-255;
      if(signed){const half=chartWidth/2;line(chartLeft+half,y-8,chartLeft+half,y+4);const len=Math.min(half,half*Math.abs(n)/max);if(n<0)rect(chartLeft+half-len,y-3,len,9,'0.81 0.42 0.35');else rect(chartLeft+half,y-3,len,9,colorSet[i%colorSet.length]);}
      else rect(chartLeft,y-3,Math.max(0,Math.min(chartWidth,chartWidth*n/max)),9,colorSet[i%colorSet.length]);
      txt(String(n)+(data.unit?' '+data.unit:''),PAGE_W-margin-42,y,{size:8,bold:true});y-=24;}
    if(labels.length>16){need(16);txt(`Weitere ${labels.length-16} Werte in den Datenlisten.`,margin,y,{size:8});y-=16;}y-=9;
   }
  }
  const headers=sect.headers||[];const rows=sect.rows||[];
  if(!headers.length)continue;
  const cols=headers.length,colWidth=usable/cols,fontsize=cols>=7?7:cols>=5?8:9,leading=fontsize+4;
  const row=(cells,isHead)=>{
   const lines=headers.map((_,i)=>wrap(cells[i]??'',colWidth-13,fontsize));const count=Math.max(1,...lines.map(x=>x.length));const h=8+count*leading;
   if(h>PAGE_H-130){for(let i=0;i<headers.length;i++){for(const tx of wrap((isHead?'':'')+headers[i]+': '+(cells[i]??''),usable,9)){need(15);txt(tx,margin+4,y,{size:9,bold:isHead});y-=15}}y-=9;return}
   if(y-h-8<57){newPage();if(!isHead){heading((sect.title||'DATEN')+' / FORTSETZUNG');row(headers,true)}}
   need(h+3);if(isHead)rect(margin,y-h+leading-3,usable,h,'0.89 0.97 0.69');
   for(let i=0;i<cols;i++)for(let j=0;j<lines[i].length;j++)txt(lines[i][j],margin+i*colWidth+6,y-4-j*leading,{size:fontsize,bold:isHead});
   y-=h;line(margin,y,PAGE_W-margin,y);y-=4;
  };
  row(headers,true);
  if(!rows.length)row(['Keine Einträge'],false);
  for(const cells of rows)row(cells,false);
  y-=13;
 }
 if(ops.length)pages.push(ops.join('\n'));
 // Objects: 1 catalog, 2 pages, 3 regular font, 4 bold font; for each page: page, contents.
 const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const kids=[];
 pages.forEach((page,i)=>{
  const pageId=5+i*2,streamId=pageId+1; kids.push(`${pageId} 0 R`);
  objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
  let str=page;const yy=34;str+=`\n0.48 0.55 0.43 rg BT /F1 8 Tf 1 0 0 1 ${margin} ${yy} Tm <${hex('EINSATZ.LOG / lokal erstellt')}> Tj ET`;
  str+=`\n0.48 0.55 0.43 rg BT /F1 8 Tf 1 0 0 1 ${PAGE_W-margin-68} ${yy} Tm <${hex(`Seite ${i+1}/${pages.length}`)}> Tj ET`;
  objects[streamId]=`<< /Length ${encoder.encode(str).length} >>\nstream\n${str}\nendstream`;
 });
 objects[2]=`<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;
 let body='%PDF-1.4\n% EINSATZ.LOG\n';const offsets=[0];
 for(let i=1;i<objects.length;i++){offsets[i]=encoder.encode(body).length;body+=`${i} 0 obj\n${objects[i]}\nendobj\n`}
 const start=encoder.encode(body).length;body+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objects.length;i++)body+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
 body+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
 return new Blob([encoder.encode(body)],{type:'application/pdf'});
}
export {makeReport};
