// ASÜ is stored directly on the associated incident, so an existing incident
// keeps its original ID, date, keyword and compensation on every edit.
export const crewTypes=['AT','WT','ST'];
export function isStandby(position){return String(position||'').trim().toLocaleLowerCase('de-DE')==='bereitschaft';}
export function incidentVehicleLabel(incident,vehicles=[]){
 const actual=String(incident?.vehicleName||vehicles.find(v=>v.id===incident?.vehicleId)?.name||'').trim();
 if(actual)return actual;
 return !incident?.vehicleId&&isStandby(incident?.position)?'Bereitschaft (ohne Fahrzeug)':'Nicht erfasst';
}
export function cleanAsue(input){
 if(!input)return null;
 const location=String(input.location||'').trim(),leader=String(input.leader||'').trim();
 const crews=Array.isArray(input.crews)?input.crews:[];
 if(location.length>180||leader.length>180)throw Error('ASÜ: Ort und Einsatzleitung dürfen höchstens 180 Zeichen enthalten.');
 if(!location||!leader)throw Error('ASÜ: Bitte Ort und Einsatzleiter/Abschnittsleiter angeben.');
 if(!crews.length)throw Error('ASÜ: Mindestens einen betreuten Trupp erfassen.');
 if(crews.length>30)throw Error('ASÜ: Maximal 30 Trupps pro Einsatz erfassen.');
 return {location,leader,crews:crews.map((crew,i)=>{
  const name=String(crew?.name||'').trim(),type=String(crew?.type||'').trim();
  if(!crewTypes.includes(type))throw Error(`ASÜ: Ungültiger Trupptyp in Zeile ${i+1}.`);
  if(!name||name.length>160)throw Error(`ASÜ: Trupp ${i+1} benötigt eine Bezeichnung mit maximal 160 Zeichen.`);
  return {type,name,safety:crew?.safety===true};
 })};
}
export function asueDescription(report){
 if(!report||!Array.isArray(report.crews))return '';
 return report.crews.map(c=>`${c.type}: ${c.name}${c.safety?' (Sicherheitstrupp)':''}`).join('; ');
}
export function asueTotals(incidents){
 const reports=incidents.filter(i=>i.asue&&Array.isArray(i.asue.crews));
 const types={AT:0,WT:0,ST:0};let safety=0;
 for(const incident of reports)for(const crew of incident.asue.crews){if(Object.hasOwn(types,crew.type))types[crew.type]++;if(crew.safety)safety++;}
 return {reports:reports.length,crews:Object.values(types).reduce((a,b)=>a+b,0),safety,types};
}
