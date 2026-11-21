// JF Wertungsrichter: ausschließlich bestätigte tatsächliche Teilnahmen werden gutgeschrieben.
export function validDay(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const d=new Date(value+'T12:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function cleanJudging(values){
 const title=String(values.title||'').trim();
 const format=String(values.format||'').trim();
 const location=String(values.location||'').trim();
 const note=String(values.note||'').trim();
 const date=String(values.date||'');
 if(!title||title.length>160)throw Error('Bitte eine JF-Veranstaltung mit maximal 160 Zeichen eingeben.');
 if(!validDay(date))throw Error('Bitte ein gültiges Veranstaltungsdatum eingeben.');
 if(!format||format.length>100)throw Error('Bitte die Art der Austragung (maximal 100 Zeichen) angeben.');
 if(location.length>160||note.length>500)throw Error('Ort oder Notiz ist zu lang.');
 if(!['planned','attended','cancelled'].includes(values.status))throw Error('Unbekannter Teilnahmestatus.');
 if(values.status==='attended'&&date>[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-'))throw Error('Zukünftige Termine können noch nicht gutgeschrieben werden.');
 return {title,format,location,note,date,division:'JF',status:values.status};
}
export function judgingTotals(records,year='all'){
 const list=(records||[]).filter(x=>x.division==='JF'&&(year==='all'||String(x.date).startsWith(String(year))));
 const attended=list.filter(x=>x.status==='attended');
 const formats={};
 for(const x of attended)formats[x.format||'Sonstige']=(formats[x.format||'Sonstige']||0)+1;
 return {total:list.length,credited:attended.length,planned:list.filter(x=>x.status==='planned').length,cancelled:list.filter(x=>x.status==='cancelled').length,formats};
}
