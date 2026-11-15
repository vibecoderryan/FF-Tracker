// Alte Einsätze ohne Vergütungsfeld behalten ihre bisherige Pauschale von 10 €.
export const DEFAULT_INCIDENT_CENTS=1000;
export const DEFAULT_RATES={incidentCents:1000,dutyFlatCents:0,dutyHourlyCents:0};
export function asCents(v,fallback=0){const n=Number(v);return Number.isSafeInteger(n)&&n>=0&&n<=10000000?n:fallback}
export function getRates(preferences=[]){const rec=preferences.find(x=>x.id==='compensation-rates')||{};return {incidentCents:asCents(rec.incidentCents,1000),dutyFlatCents:asCents(rec.dutyFlatCents,0),dutyHourlyCents:asCents(rec.dutyHourlyCents,0)}}
export const incidentCents=x=>asCents(x.compensationCents,DEFAULT_INCIDENT_CENTS);
export const dutyCents=x=>asCents(x.compensationCents,0);
export function dutyCompensation(mode,rateCents,minutes){if(mode==='flat')return asCents(rateCents);if(mode==='hourly')return Math.round(asCents(rateCents)*minutes/60);return 0}
export function parseEuros(raw){const s=String(raw??'').trim().replace(',','.');if(!/^(?:\d+)(?:\.\d{1,2})?$/.test(s))return null;const n=Math.round(Number(s)*100);return Number.isSafeInteger(n)&&n>=0&&n<=10000000?n:null}
export const eurosText=c=>(asCents(c)/100).toFixed(2).replace('.',',');
export function newDutyPay(values,rates,minutes){const mode=['none','flat','hourly'].includes(values.compensationMode)?values.compensationMode:'none';const raw=String(values.compensationRate||'').trim();const override=raw?parseEuros(raw):null;if(raw&&override===null)throw Error('Ungültiger Vergütungssatz. Bitte einen Eurobetrag mit maximal zwei Nachkommastellen eingeben.');const rateCents=mode==='flat'?(override??rates.dutyFlatCents):mode==='hourly'?(override??rates.dutyHourlyCents):0;return {compensationMode:mode,compensationRateCents:rateCents,compensationCents:dutyCompensation(mode,rateCents,minutes)};}
