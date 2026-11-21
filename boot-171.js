const app=document.querySelector('#app');
const showError=(message)=>{app.replaceChildren();const text=document.createElement('p');text.textContent=message;const button=document.createElement('button');button.textContent='Erneut laden';button.onclick=()=>location.reload();app.append(text,button);};
const timer=setTimeout(()=>showError('Start dauert ungewöhnlich lange. Bitte andere App-Fenster schließen und erneut laden. Deine Daten werden nicht gelöscht.'),15000);
import('./main-171.js').catch(err=>showError('Startfehler: '+err.message)).finally(()=>clearTimeout(timer));
