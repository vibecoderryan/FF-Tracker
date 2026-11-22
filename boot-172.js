const app=document.querySelector('#app');
const showError=message=>{app.replaceChildren();const p=document.createElement('p');p.textContent=message;const b=document.createElement('button');b.textContent='Erneut laden';b.onclick=()=>location.reload();app.append(p,b)};
const timer=setTimeout(()=>showError('Start dauert zu lange. Bitte andere EINSATZ.LOG-Fenster schließen. Deine Daten werden nicht gelöscht.'),18000);
import('./main-172.js').catch(e=>{clearTimeout(timer);showError('Startfehler: '+e.message)}).finally(()=>clearTimeout(timer));
