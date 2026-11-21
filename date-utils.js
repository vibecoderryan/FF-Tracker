// Reine Funktionen: keine Änderungen an vorhandenen Daten.
const PATTERN=/^\d{4}-\d{2}-\d{2}$/;
export function parseDateUTC(value){
 if(!PATTERN.test(String(value||'')))return null;
 const [y,m,d]=value.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
}
export function dayOffset(date,offset){const d=parseDateUTC(date);if(!d)return '';d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
export function weekdayIndex(date){const d=parseDateUTC(date);return d?(d.getUTCDay()+6)%7:-1}
export function isoWeek(date){const d=parseDateUTC(date);if(!d)return null;
 // ISO-8601: Die Woche beginnt montags, KW 1 enthält den ersten Donnerstag.
 const w=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()+3-w);
 const isoYear=d.getUTCFullYear(),jan4=new Date(Date.UTC(isoYear,0,4));
 const monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-(jan4.getUTCDay()+6)%7);
 return {year:isoYear,week:Math.floor((d-monday)/604800000)+1};
}
export function inferredDutyEndDate(duty){if(parseDateUTC(duty?.endDate))return duty.endDate;
 return dayOffset(duty?.date,duty?.end<=duty?.start?1:0);
}
const validTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||''));
export function dutyMinutes(duty){if(!validTime(duty?.start)||!validTime(duty?.end))return 0;
 const a=parseDateUTC(duty?.date),b=parseDateUTC(inferredDutyEndDate(duty));if(!a||!b)return 0;
 const [ah,am]=duty.start.split(':').map(Number),[bh,bm]=duty.end.split(':').map(Number);
 return Math.round((b-a)/60000)+(bh*60+bm)-(ah*60+am);
}
export function dutyOverlapsDate(duty,date){const a=parseDateUTC(duty?.date),b=parseDateUTC(inferredDutyEndDate(duty)),c=parseDateUTC(date);return !!(a&&b&&c&&a<=c&&c<=b)}
export function weekdayCounts(rows){const counts=Array(7).fill(0);for(const row of rows){const i=weekdayIndex(row.date);if(i>=0)counts[i]++}return counts}
export function weeklyCounts(rows){const map=new Map();for(const r of rows){const w=isoWeek(r.date);if(!w)continue;const k=`${w.year}-KW${String(w.week).padStart(2,'0')}`;map.set(k,(map.get(k)||0)+1)}return [...map].sort(([a],[b])=>a.localeCompare(b))}
