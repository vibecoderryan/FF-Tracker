export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const quarter=date=>Math.floor((Number(date.slice(5,7))-1)/3)+1;
export const money=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
export const dateDE=s=>s?`${s.slice(8,10)}.${s.slice(5,7)}.${s.slice(0,4)}`:'';
export const duration=(start,end)=>{const [a,b]=[start,end].map(x=>{const [h,m]=x.split(':').map(Number);return h*60+m});return (b-a+1440)%1440};
export const hours=m=>`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')} min`;
export const incidentStats=(items,year)=>{const y=items.filter(x=>x.date.startsWith(String(year)));return {year:y.length,quarters:[1,2,3,4].map(q=>y.filter(x=>quarter(x.date)===q).length)}};
export const avgPerWeek=(items,year)=>{const start=new Date(year,0,1),end=new Date(Math.min(new Date().getTime(),new Date(year+1,0,1).getTime()));const weeks=Math.max(1,(end-start)/(7*86400000));return (items.filter(x=>x.date.startsWith(String(year))).length/weeks).toLocaleString('de-DE',{maximumFractionDigits:1})};
export const csv=(rows,columns)=>'\ufeff'+[columns.map(x=>x[1]),...rows.map(r=>columns.map(([key])=>String(r[key]??'').replaceAll('"','""')))].map(row=>row.map(v=>'"'+v+'"').join(';')).join('\r\n');
