const $=(s)=>document.querySelector(s), $$=(s)=>[...document.querySelectorAll(s)];
const journey=$("#journey"), jscreen=$("#journeyScreen"), progress=$("#jProgress");
const state={
  needs:[], included:[], rejected:[], index:0, step:"start",
  vehicle:{make:"Toyota",model:"RAV4"},
  customer:{name:"",phone:""},
  details:[], extras:[], date:"Jue 11",time:"2:00 p.m.",
  prices:{exterior:80,interior:90,rines:50,motor:40,paint:60},
  data:{
    exterior:{name:"Cuidado exterior",desc:"Lavado, limpieza detallada y acabado exterior.",includes:["Lavado detallado","Vidrios y superficies exteriores","Emblemas y zonas de difícil acceso","Secado y acabado"],result:"Un exterior limpio, uniforme y mejor presentado."},
    interior:{name:"Detallado interior",desc:"Limpieza profunda y recuperación de superficies interiores.",includes:["Aspirado profundo","Tablero y consola","Puertas y superficies","Tapicería según condición"],result:"Un interior limpio, fresco y agradable para volver a usarlo."},
    rines:{name:"Rines y llantas",desc:"Presentación y cuidado en cada detalle.",includes:["Limpieza profunda","Residuos de frenado","Zonas de difícil acceso","Secado y acabado"],result:"Rines limpios y visualmente uniformes."},
    motor:{name:"Limpieza de motor",desc:"Una presentación más limpia y cuidada.",includes:["Limpieza exterior","Desengrase controlado","Superficies accesibles","Acabado final"],result:"Un compartimiento más limpio y ordenado."},
    paint:{name:"Corrección de pintura",desc:"Recupera el brillo y mejora la apariencia.",includes:["Preparación","Descontaminación","Trabajo de brillo","Acabado final"],result:"Una pintura con mejor limpieza visual, brillo y presentación."}
  }
};
function money(n){return "$"+Number(n).toLocaleString("en-US")}
function baseTotal(){return state.included.reduce((a,k)=>a+(state.prices[k]||0),0)}
function total(){return baseTotal()+state.extras.reduce((a,x)=>a+x.price,0)}
function openJourney(preselect=null){
  state.needs=[];state.included=[];state.rejected=[];state.index=0;state.details=[];state.extras=[];state.customer={name:"",phone:""};state.address="";
  if(preselect){state.needs=[preselect];state.included=[];state.index=0;state.step="breakdown"; renderJourney()}
  else {state.step="start";renderJourney()}
  journey.classList.add("open");journey.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"
}
function closeJourney(){journey.classList.remove("open");journey.setAttribute("aria-hidden","true");document.body.style.overflow=""}
function setProgress(n){progress.style.width=Math.min(100,Math.max(5,n))+"%"}
function renderJourney(){
  if(state.step==="start") return renderStart();
  if(state.step==="needs") return renderNeeds();
  if(state.step==="details") return renderDetails();
  if(state.step==="breakdown") return renderBreakdown();
  if(state.step==="summary") return renderSummary();
  if(state.step==="quote") return renderQuote();
  if(state.step==="accepted") return renderAccepted();
  if(state.step==="extras") return renderExtras();
  if(state.step==="booking") return renderBooking();
  if(state.step==="request_sent") return renderRequestSent();
  if(state.step==="success") return renderSuccess();
}
function shell(back,eyebrow,title,lead,body,actions=""){
  jscreen.innerHTML=`${back?`<button class="j-back" onclick="${back}">← Volver</button>`:""}<div class="j-eyebrow">${eyebrow}</div><h2 class="j-title">${title}</h2><p class="j-lead">${lead}</p>${body}${actions}`;
}
function renderStart(){
  setProgress(8);
  shell("closeJourney()","BRICE · TU EXPERIENCIA","Aquí comienza<br>tu experiencia.","Cuéntanos en qué momento estás y te acompañamos desde ahí.",`
  <div class="j-options">
    <button class="j-option" onclick="startFirst()"><span class="j-check">👋</span><span><strong>Es mi primera vez</strong><small>Quiero saber qué puede necesitar mi vehículo.</small></span></button>
    <button class="j-option" onclick="toast('El recorrido para clientes que ya tomaron un servicio estará disponible aquí.')"><span class="j-check">↻</span><span><strong>Ya tomé un servicio</strong><small>Quiero volver, hacer algo diferente o revisar qué sigue.</small></span></button>
    <button class="j-option" onclick="toast('El recorrido post-servicio estará disponible aquí.')"><span class="j-check">✦</span><span><strong>Acaban de entregarme mi vehículo</strong><small>Quiero saber cómo conservar el resultado.</small></span></button>
  </div>`);
}
async function startFirst(){
  state.step="needs";renderJourney();
  await syncExperience("in_progress");
}
function renderNeeds(){
  setProgress(20);
  const opts=[["exterior","Exterior","Brillo, limpieza y presentación."],["interior","Interior","Limpieza, tapicería y sensación."],["rines","Rines y llantas","Suciedad y presentación."],["paint","Pintura / brillo","Apariencia y acabado."],["motor","Motor","Presentación del compartimiento."],["complete","Quiero un completo","Varias zonas necesitan atención."]];
  shell("renderStart()","CUÉNTAME","¿Qué te gustaría mejorar<br>de tu vehículo?","Puedes elegir varias. No necesitas saber qué servicio comprar.",`
  <div class="j-options">${opts.map(([k,n,d])=>`<button class="j-option ${state.needs.includes(k)?"selected":""}" onclick="toggleNeed('${k}')"><span class="j-check">${state.needs.includes(k)?"✓":""}</span><span><strong>${n}</strong><small>${d}</small></span></button>`).join("")}</div>
  <div class="j-actions"><button class="j-primary" onclick="needsContinue()">Continuar →</button></div>`);
}
async function toggleNeed(k){
  if(k==="complete"){
    ["exterior","interior","rines"].forEach(x=>{if(!state.needs.includes(x))state.needs.push(x)});
  }else{
    const i=state.needs.indexOf(k);if(i>=0)state.needs.splice(i,1);else state.needs.push(k);
  }
  renderNeeds(); await syncExperience("in_progress")
}
async function needsContinue(){
  if(!state.needs.length){toast("Selecciona al menos una necesidad");return}
  state.needs=state.needs.filter(x=>x!=="complete");state.index=0;state.included=[];state.rejected=[];state.step="details";renderJourney(); await syncExperience("in_progress")
}
function renderDetails(){
  setProgress(30);
  const needs=state.needs;
  shell("renderNeeds()","UN POCO MÁS","Antes de recomendarte algo,<br>quiero entender tu vehículo.","Solo preguntamos lo que puede cambiar lo que te mostramos.",`
  <div class="j-card"><h3>¿Qué vehículo tienes?</h3><div class="j-chips">${["Toyota","BMW","Honda","Chevrolet","Volkswagen","Tesla"].map(x=>`<button class="j-chip ${state.vehicle.make===x?"active":""}" onclick="pickVehicle('make','${x}')">${x}</button>`).join("")}</div><div style="height:12px"></div><div class="j-chips">${["RAV4","CX-5","Civic","Silverado","Otro"].map(x=>`<button class="j-chip ${state.vehicle.model===x?"active":""}" onclick="pickVehicle('model','${x}')">${x}</button>`).join("")}</div></div>
  <div class="j-card"><h3>¿Hay algo específico que debamos tener en cuenta?</h3><div class="j-chips">${["Manchas","Olores","Pelo de mascota","Suciedad acumulada","Pérdida de brillo","Nada específico"].map(x=>`<button class="j-chip ${state.details.includes(x)?"active":""}" onclick="toggleDetail('${x}')">${x}</button>`).join("")}</div></div>
  <div class="j-actions"><button class="j-primary" onclick="startBreakdown()">Continuar →</button></div>`)
}
function pickVehicle(k,v){state.vehicle[k]=v;renderDetails()}
function toggleDetail(v){const i=state.details.indexOf(v);if(i>=0)state.details.splice(i,1);else state.details.push(v);renderDetails()}
function startBreakdown(){state.index=0;state.included=[];state.rejected=[];state.step="breakdown";renderJourney()}
function renderBreakdown(){
  if(state.index>=state.needs.length){state.step="summary";return renderSummary()}
  setProgress(38+Math.round((state.index/state.needs.length)*22));
  const k=state.needs[state.index],d=state.data[k];
  shell("backBreakdown()","PARTE "+(state.index+1)+" DE "+state.needs.length,d.name,"Esto es lo que podemos hacer. Todo lo que ves aquí ya forma parte de esta parte del servicio.",`
  <div class="j-beforeafter"><div class="j-photo before need-${k}"><span>ANTES</span></div><div class="j-photo after need-${k}"><span>DESPUÉS</span></div></div>
  <div class="j-card"><h3>Esto incluye</h3><div class="j-includes">${d.includes.map(x=>`<div>✓ ${x}</div>`).join("")}</div></div>
  <div class="j-card"><h3>Resultado que buscamos</h3><p class="j-lead" style="margin:0">${d.result}</p></div>
  <div class="j-actions"><button class="j-primary" onclick="confirmNeedPart()">Sí, esto es lo que busco →</button><button class="j-secondary" onclick="rejectNeedPart()">No es lo que busco</button></div>`)
}
function backBreakdown(){if(state.index>0){state.index--;renderBreakdown()}else state.step="details",renderJourney()}
async function confirmNeedPart(){const k=state.needs[state.index];if(!state.included.includes(k))state.included.push(k);state.rejected=state.rejected.filter(x=>x!==k);state.index++;renderBreakdown(); await syncExperience("reviewing") }
async function rejectNeedPart(){const k=state.needs[state.index];state.included=state.included.filter(x=>x!==k);if(!state.rejected.includes(k))state.rejected.push(k);state.index++;renderBreakdown(); await syncExperience("reviewing") }
function renderSummary(){
  setProgress(66);
  const rows=state.needs.map(k=>`<label class="j-editable"><input type="checkbox" ${state.included.includes(k)?"checked":""} onchange="toggleIncluded('${k}',this.checked)"><span><strong>${state.data[k].name}</strong><small>${state.data[k].desc}</small></span></label>`).join("");
  shell("backSummary()","TU SERVICIO","Revisa lo que hemos<br>construido para tu vehículo.","Todavía puedes corregirlo. Marca o quita cualquier parte antes de continuar.",`
  <div class="j-card"><h3>Lo que está incluido</h3>${rows}</div>
  <div class="j-total"><div><small>VALOR ACTUAL</small></div><strong id="sumPrice">${money(baseTotal())}</strong></div>
  <p class="j-note">Lo marcado arriba forma parte del servicio. Los adicionales aparecen después de la cotización.</p>
  <div class="j-actions"><button class="j-primary" onclick="toQuote()">Confirmar servicio →</button><button class="j-secondary" onclick="reviewParts()">Volver a revisar cada parte</button></div>`)
}
function backSummary(){state.index=Math.max(0,state.needs.length-1);renderBreakdown()}
async function toggleIncluded(k,checked){if(checked&&!state.included.includes(k))state.included.push(k);if(!checked)state.included=state.included.filter(x=>x!==k);const p=$("#sumPrice");if(p)p.textContent=money(baseTotal());await syncExperience("reviewing")}
function reviewParts(){state.index=0;renderBreakdown()}
async function toQuote(){if(!state.included.length){toast("Selecciona al menos una parte");return}state.step="quote";renderJourney();await syncExperience("quoted")}
function renderQuote(){
  setProgress(75);
  shell("renderSummary()","COTIZACIÓN","Este es el servicio<br>que hemos definido.","Primero definimos lo que necesitas. Ahora sí, te mostramos el valor.",`
  <div class="j-card">${state.included.map(k=>`<div class="j-summary-row"><div><strong>${state.data[k].name}</strong><small>Incluido en tu servicio</small></div><strong>${money(state.prices[k])}</strong></div>`).join("")}</div>
  <div class="j-quote"><small>VALOR DEL SERVICIO</small><strong>${money(baseTotal())}</strong><span>Servicio a domicilio · Greenville, SC</span></div>
  <p class="j-note">Este valor corresponde al servicio que acabamos de construir. Los adicionales todavía no están incluidos.</p>
  <div class="j-actions"><button class="j-primary" onclick="toExtras()">Ver opcionales y continuar →</button><button class="j-secondary" onclick="renderSummary()">Volver a revisar</button></div>`)
}
function buildExtras(){
  const x=[];const has=k=>state.included.includes(k);
  if(has("exterior"))x.push({name:"Protección del acabado",price:70,why:"Para conservar por más tiempo el trabajo exterior."});
  if(has("interior"))x.push({name:"Tratamiento especializado de tapicería",price:50,why:"Una intervención adicional sobre la tapicería."});
  if(has("rines"))x.push({name:"Protección de rines",price:35,why:"Para facilitar su mantenimiento."});
  if(has("paint"))x.push({name:"Protección adicional de pintura",price:90,why:"Para complementar el cuidado del acabado."});
  return x.length?x:[{name:"Protección del acabado",price:70,why:"Un complemento opcional para conservar el resultado."}]
}
function toBookingRequest(){state.step="booking";renderJourney()}
function toExtras(){state.step="extras";state.available=buildExtras();state.extras=[];renderJourney()}
function renderExtras(){
  setProgress(83);
  shell("renderQuote()","OPCIONALES","Ahora sí: ¿quieres agregar<br>algo más?","Tu servicio ya está completo. Estos complementos son opcionales.",`
  <div class="j-card"><h3>SERVICIO BASE</h3><div class="j-total" style="margin-top:0;padding-top:0;border-top:0"><strong>${money(baseTotal())}</strong></div></div>
  <div>${state.available.map((x,i)=>`<button class="j-extra ${state.extras.some(e=>e.name===x.name)?"selected":""}" onclick="toggleExtra(${i})"><span><strong>${x.name}</strong><small>${x.why}</small></span><b>${state.extras.some(e=>e.name===x.name)?"✓ Agregado":"Agregar · "+money(x.price)}</b></button>`).join("")}</div>
  <div class="j-total"><div><small>VALOR ACTUAL</small><span>${state.extras.length?"Con adicionales":"Sin adicionales"}</span></div><strong>${money(total())}</strong></div>
  <div class="j-actions"><button class="j-primary" onclick="toBooking()">Continuar a la agenda →</button></div>`)
}
function toggleExtra(i){const x=state.available[i],j=state.extras.findIndex(e=>e.name===x.name);if(j>=0)state.extras.splice(j,1);else state.extras.push(x);renderExtras()}
function toBooking(){state.step="booking";renderJourney()}
function renderBooking(){
  setProgress(91);
  shell("renderQuote()","SOLICITUD DE RESERVA","¿Cuándo te gustaría<br>que vayamos?","Indica tu horario preferido. Brice lo revisará y confirmará la reserva o te propondrá otro momento.",`
  <div class="j-card"><h3>Fecha</h3><div class="j-chips">${["Mié 10","Jue 11","Vie 12","Sáb 13"].map(x=>`<button class="j-chip ${state.date===x?"active":""}" onclick="pickDate('${x}')">${x}</button>`).join("")}</div><div style="height:13px"></div><h3>Hora</h3><div class="j-chips">${["8:00 a.m.","10:00 a.m.","12:00 p.m.","2:00 p.m.","4:00 p.m."].map(x=>`<button class="j-chip ${state.time===x?"active":""}" onclick="pickTime('${x}')">${x}</button>`).join("")}</div></div>
  <div class="j-card"><h3>¿Cómo te contactamos?</h3><div class="j-fields"><input value="${state.customer.name}" placeholder="Tu nombre" oninput="state.customer.name=this.value" class="j-address"><input value="${state.customer.phone}" placeholder="WhatsApp / teléfono" oninput="state.customer.phone=this.value" class="j-address"></div></div>
  <div class="j-card"><h3>Dirección del servicio</h3><input id="address" value="${state.address||""}" placeholder="Escribe la dirección donde está tu vehículo" class="j-address"></div>
  <div class="j-actions"><button class="j-primary" onclick="confirmBooking()">Enviar solicitud · ${money(total())}</button></div>`)
}
function pickDate(x){state.date=x;renderBooking()}
function pickTime(x){state.time=x;renderBooking()}
async function confirmBooking(){
  const a=$("#address")?.value?.trim();if(!state.customer.name.trim()){toast("Agrega tu nombre");return}if(!state.customer.phone.trim()){toast("Agrega un teléfono o WhatsApp");return}if(!a){toast("Agrega la dirección del servicio");return}
  state.address=a;state.step="request_sent";renderJourney();
  await syncExperience("quoted", "Cotización pendiente por confirmar");
}
function renderRequestSent(){
  setProgress(100);
  shell(null,"RESERVA CONFIRMADA","Tu servicio está<br>confirmado.","Te enviaremos la información necesaria. Brice puede contactarte para confirmar detalles o ajustar el horario si es necesario.",`
  <div class="j-success"><div class="big">✓</div><div class="j-card" style="text-align:left"><div class="j-summary-row"><div><strong>Horario solicitado</strong><small>${state.date} · ${state.time}</small></div></div><div class="j-summary-row"><div><strong>Servicio</strong><small>${state.included.map(k=>state.data[k].name).join(" + ")}</small></div></div><div class="j-summary-row"><div><strong>Total</strong><small>${money(total())}</small></div></div></div></div>
  <div class="j-actions"><button class="j-primary" onclick="closeJourney()">Cerrar experiencia</button></div>`)
}
function renderSuccess(){
  setProgress(100);
  shell(null,"LISTO","Tu servicio está<br>confirmado.","Nos vemos en tu vehículo. Te enviaremos la información necesaria antes de la cita.",`
  <div class="j-success"><div class="big">✓</div><div class="j-card" style="text-align:left"><div class="j-summary-row"><div><strong>Fecha</strong><small>${state.date} · ${state.time}</small></div></div><div class="j-summary-row"><div><strong>Ubicación</strong><small>${state.address}</small></div></div><div class="j-summary-row"><div><strong>Servicio</strong><small>${state.included.map(k=>state.data[k].name).join(" + ")}</small></div></div><div class="j-summary-row"><div><strong>Total</strong><small>${money(total())}</small></div></div></div></div>
  <div class="j-actions"><button class="j-primary" onclick="closeJourney()">Cerrar experiencia</button></div>`)
}
function experiencePayload(){return {customer:state.customer,vehicle:state.vehicle,needs:state.needs,included:state.included,rejected:state.rejected,details:state.details,extras:state.extras,date:state.date,time:state.time,address:state.address||null,total:total(),step:state.step};}
async function syncExperience(status="in_progress", activityLabel=null){
  const payload=experiencePayload();
  if(!window.briceDB) return;
  if(!window.BRICE_DB?.experienceId){await briceDB.createExperience(payload);return;}
  await briceDB.updateExperience({status,payload,activityLabel});
}
function toggleMenu(){$("#mobileMenu").classList.toggle("open")}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>e.classList.remove("show"),1900)}
$$("[data-start]").forEach(b=>b.addEventListener("click",()=>openJourney()));
$$("[data-need]").forEach(card=>{
  const btn=card.querySelector("button");
  if(btn)btn.addEventListener("click",e=>{e.stopPropagation();openJourney(card.dataset.need)});
  else card.addEventListener("click",()=>openJourney(card.dataset.need));
});
$$("a[href^='#']").forEach(a=>a.addEventListener("click",()=>{$("#mobileMenu").classList.remove("open")}));

document.addEventListener("keydown",e=>{if(e.key==="Escape" && journey.classList.contains("open"))closeJourney()});

/* V4 journey viewport behavior */
(function(){
  const obs=new MutationObserver(()=>{
    const el=document.getElementById("journey");
    if(el) document.body.classList.toggle("journey-open",el.classList.contains("open"));
  });
  const el=document.getElementById("journey");
  if(el) obs.observe(el,{attributes:true,attributeFilter:["class"]});
})();
