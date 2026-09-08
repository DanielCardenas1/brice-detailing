const data={
  reservas:[
    {cliente:"Cliente de ejemplo",vehiculo:"Toyota RAV4",servicio:"Detailing completo",fecha:"Hoy · 10:00",estado:"Confirmada"}
  ],
  clientes:[
    {nombre:"Cliente de ejemplo",tel:"300 000 0000",vehiculos:1,ultimo:"Detailing completo",fecha:"Hoy"}
  ],
  vehiculos:[
    {cliente:"Cliente de ejemplo",marca:"Toyota",modelo:"RAV4",año:"2024",placa:"ABC-123",servicios:1}
  ],
  cotizaciones:[
    {id:"#C-1000",cliente:"Cliente de ejemplo",detalle:"RAV4 · Detailing completo",total:"$370.000",fecha:"Hoy",estado:"Por agendar"}
  ],
  referidos:[
    {cliente:"Cliente de ejemplo",codigo:"BRICE-EJEMPLO",referidos:1,conversiones:1,beneficio:"$20.000"}
  ]
};
const services=[
  ["Lavado premium","Limpieza profunda interior y exterior","$120.000"],
  ["Detailing interior","Tapicería, paneles, techo y maletero","$150.000"],
  ["Detailing exterior","Carrocería, rines, cristales y detalles","$180.000"],
  ["Protección cerámica","Brillo y protección de larga duración","$250.000"],
  ["Restauración","Corrección y recuperación de pintura","$300.000"],
  ["Mantenimiento","Cuidado periódico según el estado del vehículo","$90.000"]
];
const titles={dashboard:"Resumen",reservas:"Reservas",clientes:"Clientes",vehiculos:"Vehículos",servicios:"Servicios",cotizaciones:"Cotizaciones",referidos:"Referidos",contenido:"Contenido",configuracion:"Configuración"};
const app=document.getElementById("app"), pageTitle=document.getElementById("pageTitle");
let currentView="dashboard";
let liveBookings=[];
let liveExperiences=[];
let reservationsFilter="all";
let liveRefreshTimer=null;
function formatDate(iso){try{return new Date(iso).toLocaleString("es-CO")}catch{return iso||""}}
function isToday(r){
  if(String(r.fecha||"").toLowerCase().includes("hoy")) return true;
  if(r.created_at){const d=new Date(r.created_at), now=new Date();return d.toDateString()===now.toDateString();}
  return false;
}
function liveCounts(){
  const all=mergedReservations();
  return {all:all.length,today:all.filter(isToday).length,pending:all.filter(r=>String(r.estado||"").toLowerCase().includes("pend")||r.estado==="new").length};
}
function updateNavCounts(){
  const c=liveCounts();
  const res=document.querySelector('[data-view="reservas"] b'); if(res)res.textContent=c.all;
  const quotes=document.querySelector('[data-view="cotizaciones"] b'); if(quotes)quotes.textContent=data.cotizaciones.length+liveExperiences.filter(x=>["quoted","accepted"].includes(x.status)).length;
  const n=document.getElementById('notificationCount');
  if(n){
    const activity=liveActivityItems();
    const pending=liveExperiences.filter(x=>x.status==='quoted').length;
    n.textContent=String(Math.max(pending,activity.length));
  }
}
function bookingInfo(b){
  const p=b.payload||{};
  const c=p.customer||{}; const v=p.vehicle||{};
  const services=(p.included||[]).map(k=>({exterior:"Cuidado exterior",interior:"Detallado interior",rines:"Rines y llantas",paint:"Corrección de pintura",motor:"Limpieza de motor"}[k]||k));
  const extras=(p.extras||[]).map(x=>x.name).filter(Boolean);
  return {id:b.id,cliente:c.name||"Cliente nuevo",tel:c.phone||"",vehiculo:[v.make,v.model].filter(Boolean).join(" ")||"Vehículo por definir",servicio:services.join(" + ")||p.service_name||"Servicio personalizado",servicios:services,extras,total:Number(p.total||0),fecha:p.date&&p.time?`${p.date} · ${p.time}`:formatDate(b.created_at),direccion:p.address||"",estado:b.status||"new",created_at:b.created_at,experience_id:b.experience_id,payload:p};
}
function experienceBookingInfo(e){
  const p=e.payload||{};
  const c=p.customer||{}; const v=p.vehicle||{};
  const services=(p.included||[]).map(k=>({exterior:"Cuidado exterior",interior:"Detallado interior",rines:"Rines y llantas",paint:"Corrección de pintura",motor:"Limpieza de motor"}[k]||k));
  return {id:`experience-${e.id}`,cliente:c.name||"Cliente nuevo",tel:c.phone||"",vehiculo:[v.make,v.model].filter(Boolean).join(" ")||"Vehículo por definir",servicio:services.join(" + ")||p.service_name||"Servicio personalizado",servicios:services,extras:p.extras||[],total:Number(p.total||0),fecha:p.date&&p.time?`${p.date} · ${p.time}`:formatDate(e.updated_at||e.created_at),direccion:p.address||"",estado:"confirmed",created_at:e.created_at,experience_id:e.id,payload:p};
}
function readLocalAdminState(){
  const keys=['brice_demo_state_v2','brice_demo_state_v3'];
  const experiences=new Map(), bookings=new Map();
  for(const key of keys){
    try{
      const raw=localStorage.getItem(key);
      if(!raw) continue;
      const state=JSON.parse(raw)||{};
      (state.experiences||[]).forEach(x=>experiences.set(String(x.id),x));
      (state.bookings||[]).forEach(x=>bookings.set(String(x.id),x));
    }catch(e){console.warn('[BRICE] local state read skipped',key,e)}
  }
  return {experiences:[...experiences.values()],bookings:[...bookings.values()]};
}
function mergedReservations(){
  // Fuente de verdad de Reservas: cualquier experiencia que ya esté CONFIRMADA
  // se muestra aquí, aunque por alguna razón el registro espejo de bookings
  // no exista. Así la pestaña nunca queda atada a una sola tabla.
  const local=readLocalAdminState();
  const bookings=[...liveBookings,...local.bookings].reduce((m,b)=>m.set(String(b.id),b),new Map());
  const experiences=[...liveExperiences,...local.experiences].reduce((m,e)=>m.set(String(e.id),e),new Map());
  const bookingRows=[...bookings.values()].map(bookingInfo);
  const seenExp=new Set(bookingRows.map(x=>String(x.experience_id||'')).filter(Boolean));
  const experienceRows=[...experiences.values()]
    .filter(e=>e && e.status==='booked' && !seenExp.has(String(e.id)))
    .map(experienceBookingInfo);
  const live=[...bookingRows,...experienceRows];
  const ids=new Set(live.map(x=>String(x.id)));
  const liveWithMark=live.map(r=>({...r,_live:true}));
  const demoWithoutDupes=data.reservas.map((r,i)=>({...r,_live:false,_index:i,id:`demo-${i}`}))
    .filter(r=>!ids.has(String(r.id)));
  return [...liveWithMark,...demoWithoutDupes];
}
function refreshCurrentView(){
  clearTimeout(liveRefreshTimer); liveRefreshTimer=setTimeout(()=>{
    if(currentView==="dashboard") dashboard();
    else if(currentView==="reservas") reservas();
    else if(currentView==="clientes") clientes();
    else if(currentView==="vehiculos") vehiculos();
    else if(currentView==="cotizaciones") cotizaciones();
  },30);
}
window.addEventListener('brice-local-change',()=>{
  // El mismo navegador puede tener la experiencia pública y el Admin en pestañas distintas.
  // Recargamos primero el estado local y después la vista actual.
  loadLiveData().then(refreshCurrentView).catch(()=>refreshCurrentView());
});
window.addEventListener('storage',e=>{
  if(e.key==='brice_demo_state_v2'||e.key==='brice_demo_state_v3'){
    loadLiveData().then(refreshCurrentView).catch(()=>refreshCurrentView());
  }
});

function initials(n){return n.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function badge(s){let c=s.includes("Confirm")||s==="Aceptada"? "green":s.includes("Pend")||s.includes("Por")?"yellow":"";return `<span class="badge ${c}">${s}</span>`}
function table(headers,rows){return `<div class="panel"><div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`}
function layout(title,desc,action){return `<div class="hero"><div><p class="eyebrow">BRICE · ADMINISTRACIÓN</p><h2>${title}</h2><p>${desc}</p></div>${action||""}</div>`}
function dashboard(){
 app.innerHTML=layout("Buenos días, Brice.","Todo lo que está pasando con tus clientes, vehículos y servicios en un solo lugar.",`<button class="btn primary" onclick="openNewReservation()">+ Nueva reserva</button>`)
 +`<div class="cards">
   <button class="stat stat-click" onclick="navigate('clientes')"><div class="stat-top">Clientes <span>↗</span></div><div class="stat-value" id="statClients">${data.clientes.length}</div><div class="trend">Ver clientes</div></button>
   <button class="stat stat-click" onclick="navigate('vehiculos')"><div class="stat-top">Vehículos <span>↗</span></div><div class="stat-value" id="statVehicles">${data.vehiculos.length}</div><div class="trend">Ver vehículos</div></button>
   <button class="stat stat-click" onclick="navigate('cotizaciones')"><div class="stat-top">Cotizaciones <span>↗</span></div><div class="stat-value" id="statQuotes">${data.cotizaciones.length}</div><div class="trend">Ver cotizaciones</div></button>
   <button class="stat stat-click" onclick="navigate('reservas')"><div class="stat-top">Reservas próximas <span>↗</span></div><div class="stat-value" id="statBookings">${data.reservas.length}</div><div class="trend">Ver reservas</div></button>
 </div>
 <div class="grid2">
   <div class="panel"><div class="panel-head"><h3>Próximas reservas</h3><button class="btn ghost" onclick="navigate('reservas')">Ver todas</button></div>
   <div id="dashboardReservations">${table(["Cliente","Vehículo","Servicio","Fecha","Estado"],data.reservas.slice(0,4).map(r=>`<tr><td><div class="person"><div class="mini-avatar">${initials(r.cliente)}</div>${r.cliente}</div></td><td>${r.vehiculo}</td><td>${r.servicio}</td><td>${r.fecha}</td><td>${badge(r.estado)}</td></tr>`))}</div></div>
   <div class="panel"><div class="panel-head"><h3>Actividad reciente</h3><span>Últimos movimientos</span></div><div class="timeline" id="recentActivity">
    <div class="event"><div class="dot"></div><div><strong>Ejemplo: reserva creada</strong><span>Los movimientos reales de tus clientes aparecerán aquí.</span></div></div>
   </div></div>
 </div>
 <div id="liveConnection" class="panel" style="margin-top:18px"><div class="panel-head"><h3>Experiencia en vivo</h3><span id="liveStatus">Conectando…</span></div><div id="liveExperiences" class="list"><div class="list-item"><div class="list-main"><strong>Esperando actividad del cliente</strong><span>Abre la experiencia pública en otra pestaña y prueba el recorrido.</span></div></div></div></div>`;
 setTimeout(loadLiveData,0);
}
async function loadLiveData(){
  if(!window.briceDB){return;}
  const status0=document.getElementById('liveStatus'),box0=document.getElementById('liveExperiences');
  if(status0){status0.textContent='● Local activo';status0.className='badge green';}
  if(box0 && !liveExperiences.length)box0.innerHTML='<div class="list-item"><div class="list-main"><strong>Esperando actividad del cliente</strong><span>La experiencia se actualizará automáticamente.</span></div></div>';
  // Leer directamente el estado local como respaldo absoluto.
  // Esto evita que una promesa, Supabase o una pestaña vieja bloquee Reservas.
  const local=readLocalAdminState();
  liveExperiences=local.experiences.sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at)).slice(0,100);
  liveBookings=local.bookings.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,100);
  const status=document.getElementById('liveStatus'),box=document.getElementById('liveExperiences');
  if(status){status.textContent=window.BRICE_DB?.client?'● En vivo':'● Local activo';status.className='badge green';}
  if(box)box.innerHTML=liveExperiences.length?liveExperiences.map(r=>{const p=r.payload||{};const vehicle=[p.vehicle?.make,p.vehicle?.model].filter(Boolean).join(' ');const needs=(p.included||p.needs||[]).map(k=>({exterior:'Exterior',interior:'Interior',rines:'Rines',paint:'Pintura',motor:'Motor'}[k]||k)).join(' · ')||'Recorrido iniciado';const statusText=r.status==='booked'?'Reserva confirmada':r.status==='accepted'?'Cotización aceptada':r.status==='quoted'?'Cotización pendiente por confirmar':r.status==='reviewing'?'Revisando':'Recorrido iniciado';const statusLabel=r.status==='booked'?'Reservada':r.status==='accepted'?'Aceptada':r.status==='quoted'?'Pendiente por confirmar':r.status==='reviewing'?'Revisando':'En recorrido';return `<div class="list-item"><div class="list-main"><strong>${vehicle||'Vehículo por definir'} · ${needs}</strong><span>${statusText} · ${new Date(r.updated_at||r.created_at).toLocaleString('es-CO')}</span></div><span class="badge ${r.status==='booked'?'green':r.status==='accepted'||r.status==='quoted'?'yellow':''}">${statusLabel}</span></div>`}).join(''):'<div class="list-item"><div class="list-main"><strong>Sin recorridos todavía</strong><span>Haz una prueba desde la experiencia pública.</span></div></div>';
  updateNavCounts();
  if(currentView==='dashboard') updateDashboardLive();
  // Sync Supabase in the background; never block the panel on the network.
  if(window.BRICE_DB?.client && !loadLiveData._syncing){
    loadLiveData._syncing=true;
    briceDB.syncRemote(50).then(changed=>{if(changed)loadLiveData()}).finally(()=>{loadLiveData._syncing=false});
  }
}
function liveActivityItems(){
  const items=[];
  liveExperiences.forEach(e=>{
    const p=e.payload||{};
    (p.activity||[]).forEach(a=>items.push({...a,experienceId:e.id}));
  });
  return items.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0)).slice(0,6);
}
function activityMoney(n){return Number(n)>0?` · ${moneyCOP(n)}`:''}
function renderRecentActivity(){
  const act=document.getElementById('recentActivity'); if(!act)return;
  const items=liveActivityItems();
  if(!items.length){
    act.innerHTML=`<div class="event"><div class="dot"></div><div><strong>Sin movimientos nuevos</strong><span>Los cambios del recorrido aparecerán aquí.</span></div></div>`;
    return;
  }
  act.innerHTML=items.map(a=>`<div class="event"><div class="dot"></div><div><strong>${a.title||a.label}</strong><span>${a.label||a.status}${activityMoney(a.total)} · ${formatDate(a.at)}</span></div></div>`).join('');
}
function updateDashboardLive(){
  const all=mergedReservations();
  const live=all.filter(r=>r._live);
  const dr=document.getElementById('dashboardReservations');
  if(dr){ const rows=[...live.slice(0,4),...data.reservas.slice(0,Math.max(0,4-live.length))]; dr.innerHTML=table(["Cliente","Vehículo","Servicio","Fecha","Estado"],rows.map(r=>`<tr><td><div class="person"><div class="mini-avatar">${initials(r.cliente)}</div>${r.cliente}</div></td><td>${r.vehiculo}</td><td>${r.servicio}</td><td>${r.fecha}</td><td>${badge(r._live?'Confirmada':r.estado)}</td></tr>`)); }
  const sc=document.getElementById('statBookings'); if(sc) sc.textContent=all.length;
  const sq=document.getElementById('statQuotes'); if(sq) sq.textContent=data.cotizaciones.length+liveExperiences.filter(x=>["quoted","accepted"].includes(x.status)).length;
  const sl=document.getElementById('statClients'); if(sl) sl.textContent=data.clientes.length+new Set(liveBookings.map(b=>bookingInfo(b).cliente)).size;
  const sv=document.getElementById('statVehicles'); if(sv) sv.textContent=data.vehiculos.length+new Set(liveBookings.map(b=>bookingInfo(b).vehiculo)).size;
  renderRecentActivity();
}
let liveExperienceChannel=null,liveBookingChannel=null;
function initRealtime(){
  if(!window.briceDB) return;
  if(liveExperienceChannel) return;
  liveExperienceChannel=briceDB.subscribeExperience(()=>{loadLiveData().then(()=>refreshCurrentView())});
  liveBookingChannel=briceDB.subscribeBooking(()=>{loadLiveData().then(()=>refreshCurrentView())});
  loadLiveData();
}
function reservas(){
 // Render inmediato con el estado conocido y vuelve a consultar el almacenamiento local.
 // Esto evita que la pestaña se quede mostrando solamente las reservas de demostración.
 const render=()=>{
   const all=mergedReservations();
   const filtered=reservationsFilter==='today'?all.filter(isToday):reservationsFilter==='pending'?all.filter(r=>String(r.estado||'').toLowerCase().includes('pend')||r.estado==='new'):all;
   const counts=liveCounts();
   app.innerHTML=layout("Reservas","Organiza los servicios a domicilio y conoce qué necesita cada cliente.",`<button class="btn primary" onclick="openNewReservation()">+ Nueva reserva</button>`)
   +`<div class="tabs"><button class="tab ${reservationsFilter==='all'?'active':''}" onclick="setReservationFilter('all')">Todas · ${counts.all}</button><button class="tab ${reservationsFilter==='today'?'active':''}" onclick="setReservationFilter('today')">Hoy · ${counts.today}</button><button class="tab ${reservationsFilter==='pending'?'active':''}" onclick="setReservationFilter('pending')">Pendientes · ${counts.pending}</button></div>`
   +table(["Cliente","Vehículo","Servicio","Fecha","Estado",""],filtered.map(r=>`<tr><td><div class="person"><div class="mini-avatar">${initials(r.cliente)}</div><strong>${r.cliente}</strong></div></td><td>${r.vehiculo}</td><td>${r.servicio}</td><td>${r.fecha}</td><td>${badge(r._live?'Confirmada':r.estado)}</td><td><button class="btn ghost" onclick="viewReservationById('${String(r.id).replace(/'/g,"\\'")}')">Ver</button></td></tr>`));
 };
 render();
 if(window.briceDB) loadLiveData().then(render).catch(()=>{});
}
function setReservationFilter(f){reservationsFilter=f;reservas()}
function viewReservationById(id){const r=mergedReservations().find(x=>String(x.id)===String(id)); if(!r){return} if(r._live){showLiveBooking(r)} else viewReservation(r._index)}
async function confirmLiveReservation(id){
  const booking=liveBookings.find(b=>String(b.id)===String(id));
  if(!booking){alert('Reserva no encontrada.');return;}
  // Actualizar el estado en localStorage
  const local=readLocalAdminState();
  const idx=local.bookings.findIndex(b=>String(b.id)===String(id));
  if(idx>=0){local.bookings[idx].status='confirmed';localStorage.setItem('brice_demo_state_v3',JSON.stringify(local));}
  document.getElementById('modal').classList.add('hidden');
  await loadLiveData();
  reservas();
  alert('Reserva confirmada');
}
function showLiveBooking(r){const isPending=String(r.estado||'').toLowerCase().includes('pend');showModal(`<h2>${r.cliente}</h2><p style="font-size:11px;color:#777">Reserva recibida desde la experiencia · ${formatDate(r.created_at)}</p><div class="kpi-row"><div class="kpi"><small>Vehículo</small><strong>${r.vehiculo}</strong></div><div class="kpi"><small>Servicio</small><strong>${r.servicio}</strong></div><div class="kpi"><small>Total</small><strong>${moneyCOP(r.total)}</strong></div></div><div class="live-detail"><p><strong>Fecha</strong><br>${r.fecha}</p><p><strong>WhatsApp</strong><br>${r.tel||'No indicado'}</p><p><strong>Dirección</strong><br>${r.direccion||'No indicada'}</p><p><strong>Necesidades</strong><br>${(r.payload.needs||[]).map(x=>({exterior:'Exterior',interior:'Interior',rines:'Rines',paint:'Pintura',motor:'Motor'}[x]||x)).join(' · ')||'—'}</p><p><strong>No seleccionó</strong><br>${(r.payload.rejected||[]).map(x=>({exterior:'Exterior',interior:'Interior',rines:'Rines',paint:'Pintura',motor:'Motor'}[x]||x)).join(' · ')||'Ninguna'}</p></div>${isPending?`<button class="btn primary" onclick="confirmLiveReservation('${String(r.id).replace(/'/g,"\\'")}')">Confirmar reserva</button>`:''}<button class="btn ghost" onclick="document.getElementById('modal').classList.add('hidden')">Cerrar</button>`)}
function moneyCOP(n){return '$'+Number(n||0).toLocaleString('es-CO')}
function clientes(){
 const live=liveBookings.map(bookingInfo); const map=new Map(data.clientes.map(c=>[c.nombre.toLowerCase(),c]));
 live.forEach(r=>{const key=r.cliente.toLowerCase();if(!map.has(key))map.set(key,{nombre:r.cliente,tel:r.tel||"—",vehiculos:1,ultimo:r.servicio,fecha:formatDate(r.created_at).split(',')[0]})});
 const rows=[...map.values()];
 app.innerHTML=layout("Clientes","La relación con cada cliente, su historial y sus vehículos.",`<button class="btn primary" onclick="openClient()">+ Nuevo cliente</button>`)
 +`<div class="searchbar"><input id="clientSearch" placeholder="Buscar por nombre o teléfono..." oninput="filterClients()"></div>`
 +`<div id="clientTable">${clientTable(rows)}</div>`;
}
function clientTable(rows){return table(["Cliente","Teléfono","Vehículos","Último servicio","Fecha",""],rows.map((c,i)=>`<tr><td><div class="person"><div class="mini-avatar">${initials(c.nombre)}</div><strong>${c.nombre}</strong></div></td><td>${c.tel}</td><td>${c.vehiculos}</td><td>${c.ultimo}</td><td>${c.fecha}</td><td><button class="btn ghost" onclick="viewClientByName('${encodeURIComponent(c.nombre)}')">Ver historial</button></td></tr>`))}
function filterClients(){const q=(document.getElementById("clientSearch")?.value||"").toLowerCase();const live=liveBookings.map(bookingInfo);const map=new Map(data.clientes.map(c=>[c.nombre.toLowerCase(),c]));live.forEach(r=>{const key=r.cliente.toLowerCase();if(!map.has(key))map.set(key,{nombre:r.cliente,tel:r.tel||"—",vehiculos:1,ultimo:r.servicio,fecha:formatDate(r.created_at).split(',')[0]})});const rows=[...map.values()].filter(c=>(c.nombre+c.tel).toLowerCase().includes(q));document.getElementById("clientTable").innerHTML=clientTable(rows)}
function viewClientByName(name){const decoded=decodeURIComponent(name);const i=data.clientes.findIndex(c=>c.nombre===decoded);if(i>=0)return viewClient(i);const r=liveBookings.map(bookingInfo).find(x=>x.cliente===decoded);if(r)showLiveBooking(r)}
function liveVehicleRows(){
 const sources=[...liveBookings.map(bookingInfo),...liveExperiences.filter(e=>e&&e.status==='booked').map(experienceBookingInfo)];
 const map=new Map();
 sources.forEach(r=>{
   if(!r.vehiculo||r.vehiculo==='Vehículo por definir') return;
   const key=`${r.cliente.toLowerCase()}|${r.vehiculo.toLowerCase()}`;
   if(!map.has(key)) map.set(key,{cliente:r.cliente,vehiculo:r.vehiculo,servicios:0,payload:r.payload,experienceId:r.experience_id||r.id});
   const row=map.get(key);
   row.servicios=Math.max(row.servicios,Number(r.servicios?.length||0),1);
   row.payload=r.payload||row.payload;
   row.experienceId=r.experience_id||r.experienceId||row.experienceId;
 });
 return [...map.values()].map(r=>{const parts=r.vehiculo.split(' ');return {...r,marca:parts.shift()||'',modelo:parts.join(' '),año:'—',placa:'—',_live:true}});
}
function vehiculos(){
 const render=()=>{
   const live=liveVehicleRows();
   const rows=[...live,...data.vehiculos];
   app.innerHTML=layout("Vehículos","Cada vehículo queda asociado a su cliente y a su historial de servicios.",`<button class="btn primary" onclick="openVehicle()">+ Registrar vehículo</button>`)
   +table(["Cliente","Vehículo","Año","Placa","Servicios",""],rows.map((v,i)=>{
     const action=v._live?`viewLiveVehicle('${String(v.experienceId||'').replace(/'/g,"\\'")}')`:`viewVehicle(${i-live.length})`;
     return `<tr><td>${v.cliente}</td><td><div class="vehicle"><div class="vehicle-icon">🚘</div><strong>${v.marca} ${v.modelo}</strong></div></td><td>${v.año}</td><td>${v.placa}</td><td>${v.servicios}</td><td><button class="btn ghost" onclick="${action}">Ver</button></td></tr>`;
   }));
 };
 render();
 if(window.briceDB) loadLiveData().then(render).catch(()=>{});
}
function viewLiveVehicle(id){
 const row=liveVehicleRows().find(v=>String(v.experienceId)===String(id));
 if(!row){ const any=liveVehicleRows()[0]; if(any) return showModal(liveVehicleModal(any)); return; }
 showModal(liveVehicleModal(row));
}
function liveVehicleModal(v){return `<h2>${v.marca} ${v.modelo}</h2><p style="font-size:11px;color:#777">${v.cliente}</p><div class="kpi-row"><div class="kpi"><small>Servicios</small><strong>${v.servicios}</strong></div><div class="kpi"><small>Estado</small><strong>Registrado desde experiencia</strong></div></div><p style="font-size:12px;color:#666;margin-top:20px">Este vehículo llegó asociado a una reserva real del recorrido.</p><button class="btn primary" onclick="document.getElementById('modal').classList.add('hidden')">Cerrar</button>`}
function servicios(){
 app.innerHTML=layout("Servicios","Administra lo que el cliente puede descubrir, seleccionar y agregar a su cotización.",`<button class="btn primary" onclick="openService()">+ Nuevo servicio</button>`)
 +`<div class="service-grid">${services.map((s,i)=>`<div class="service-card"><div class="service-image">🚘</div><h3>${s[0]}</h3><p>${s[1]}</p><div class="price">${s[2]}</div><div class="row-actions"><button class="btn ghost" onclick="openService(${i})">Editar</button><button class="btn" onclick="alert('Este servicio está activo en el recorrido del cliente.')">Activo ✓</button></div></div>`).join("")}</div>`;
}
function experienceQuoteInfo(e){
 const p=e.payload||{}, c=p.customer||{}, v=p.vehicle||{};
 const labels={exterior:"Cuidado exterior",interior:"Detallado interior",rines:"Rines y llantas",paint:"Corrección de pintura",motor:"Limpieza de motor"};
 const included=(p.included||[]).map(k=>labels[k]||k);
 const rejected=(p.rejected||[]).map(k=>labels[k]||k);
 return {id:`#LIVE-${String(e.id||"").slice(0,6).toUpperCase()}`,cliente:c.name||"Cliente nuevo",tel:c.phone||"",vehiculo:[v.make,v.model].filter(Boolean).join(" ")||"Vehículo por definir",detalle:included.join(" + ")||"Servicio personalizado",total:Number(p.total||0),fecha:formatDate(e.updated_at||e.created_at).split(",")[0],estado:e.status,experience:e,included,rejected,extras:p.extras||[],payload:p};
}
function liveQuoteRows(){return liveExperiences.filter(e=>["quoted","accepted"].includes(e.status)).map(e=>({...experienceQuoteInfo(e),_live:true}))}
function cotizaciones(){
 const render=()=>{
   const liveQuotes=liveQuoteRows();
   const rows=[...liveQuotes,...data.cotizaciones];
   app.innerHTML=layout("Cotizaciones","Consulta lo que cada cliente armó antes de convertirlo en una reserva.",`<button class="btn primary" onclick="openQuote()">+ Nueva cotización</button>`)
   +table(["ID","Cliente","Detalle","Total","Fecha","Estado",""],rows.map((q,i)=>`<tr><td><strong>${q.id}</strong></td><td>${q.cliente}</td><td>${q.vehiculo} · ${q.detalle}</td><td><strong>${q._live?moneyCOP(q.total):q.total}</strong></td><td>${q.fecha}</td><td>${q._live?badge(q.estado==="quoted"?"Pendiente por confirmar":q.estado==="accepted"?"Aceptada":q.estado==="booked"?"Convertida en reserva":q.estado):badge(q.estado)}</td><td><button class="btn ghost" onclick="${q._live?`showLiveQuote('${String(q.experience.id).replace(/'/g,"\\'")}')`:`viewQuote(${i-liveQuotes.length})`}">Abrir</button></td></tr>`));
 };
 render();
 if(window.briceDB) loadLiveData().then(render).catch(()=>{});
}
function referidos(){
 app.innerHTML=layout("Referidos","Haz visible el valor que generan los clientes cuando recomiendan Brice.",`<button class="btn primary" onclick="openReferral()">+ Crear código</button>`)
 +`<div class="cards"><div class="stat"><div class="stat-top">Links activos</div><div class="stat-value">18</div><div class="trend">+4 este mes</div></div><div class="stat"><div class="stat-top">Personas referidas</div><div class="stat-value">31</div><div class="trend">12 convertidas</div></div><div class="stat"><div class="stat-top">Servicios generados</div><div class="stat-value">12</div><div class="trend">Desde referidos</div></div><div class="stat"><div class="stat-top">Beneficios</div><div class="stat-value">$240k</div><div class="trend">Entregados</div></div></div>`
 +table(["Cliente","Código","Referidos","Conversiones","Beneficio",""],data.referidos.map((r,i)=>`<tr><td>${r.cliente}</td><td><strong>${r.codigo}</strong></td><td>${r.referidos}</td><td>${r.conversiones}</td><td>${r.beneficio}</td><td><button class="btn ghost" onclick="copyCode('${r.codigo}')">Copiar link</button></td></tr>`));
}
function contenido(){
 app.innerHTML=layout("Contenido","Actualiza la información que verá el cliente sin tocar el recorrido.",`<button class="btn primary" onclick="openContent()">+ Nueva sección</button>`)
 +`<div class="grid2"><div class="panel"><div class="panel-head"><h3>Elementos visibles</h3><span>Última actualización · hoy</span></div><div class="list">
 ${["Mensaje de bienvenida","Preguntas sobre el vehículo","Cuidados post-servicio","Recomendaciones de próximos servicios","Programa de referidos"].map((x,i)=>`<div class="list-item"><div class="list-main"><strong>${x}</strong><span>${i===0?"Pantalla de entrada":i===2?"Después del servicio":"Experiencia del cliente"}</span></div><button class="btn ghost" onclick="openContent('${x}')">Editar</button></div>`).join("")}
 </div></div><div class="panel"><div class="panel-head"><h3>Canales de entrada</h3><span>Configurados</span></div><div class="list">
 ${["Instagram","QR entregado después del servicio","Google","WhatsApp","Link directo"].map(x=>`<div class="list-item"><div class="list-main"><strong>${x}</strong><span>Activo</span></div><span class="badge green">Activo</span></div>`).join("")}
 </div></div></div>`;
}
function configuracion(){
 app.innerHTML=layout("Configuración","Controla la identidad, datos, accesos e infraestructura de la experiencia.",`<button class="btn primary" onclick="alert('Cambios guardados en el prototipo.')">Guardar cambios</button>`)
 +`<div class="grid2"><div class="panel"><div class="panel-head"><h3>Negocio</h3></div><div style="padding:20px"><div class="form-grid"><div class="field"><label>Nombre</label><input value="Brice Auto Detailing"></div><div class="field"><label>WhatsApp</label><input value="+57 300 000 0000"></div></div><div class="field"><label>Descripción</label><textarea rows="4">Detailing profesional a domicilio.</textarea></div></div></div>
 <div class="panel"><div class="panel-head"><h3>Datos e infraestructura</h3></div><div class="list">
 <div class="list-item"><div class="list-main"><strong>Base de datos</strong><span>Clientes, vehículos, reservas, cotizaciones</span></div><span class="badge green">Conectada</span></div>
 <div class="list-item"><div class="list-main"><strong>Almacenamiento</strong><span>Fotos y archivos</span></div><span class="badge green">Conectado</span></div>
 <div class="list-item"><div class="list-main"><strong>Experiencia web</strong><span>Producción</span></div><span class="badge green">Activa</span></div>
 <div class="list-item"><div class="list-main"><strong>Copias de seguridad</strong><span>Automáticas</span></div><span class="badge green">Activas</span></div>
 </div></div></div>`;
}
function openNewReservation(){showModal(`<h2>Nueva reserva</h2><div class="form-grid"><div class="field"><label>Cliente</label><input id="nrName" placeholder="Nombre"></div><div class="field"><label>Teléfono</label><input id="nrPhone" placeholder="WhatsApp"></div><div class="field"><label>Vehículo</label><input id="nrVehicle" placeholder="Marca y modelo"></div><div class="field"><label>Servicio</label><select id="nrService"><option value="Detailing completo">Detailing completo</option><option value="Interior premium">Interior premium</option><option value="Protección cerámica">Protección cerámica</option><option value="Detailing exterior">Detailing exterior</option></select></div><div class="field"><label>Fecha</label><input id="nrDate" type="date"></div><div class="field"><label>Hora</label><input id="nrTime" type="time"></div></div><div class="field"><label>Dirección</label><input id="nrAddress" placeholder="Lugar del servicio a domicilio"></div><button class="btn primary" onclick="saveNewReservation()">Crear reserva</button>`)}
async function saveNewReservation(){
 const dateVal=document.getElementById('nrDate')?.value||'';
 const timeVal=document.getElementById('nrTime')?.value||'';
 if(dateVal && timeVal && window.briceDB?.hasConflict?.(dateVal,timeVal)){
   alert('Ya existe una reserva a menos de 2 horas de este horario. Elige otro horario con al menos 2 horas de diferencia.');
   return;
 }
 const payload={customer:{name:document.getElementById('nrName')?.value?.trim()||'Cliente creado desde panel',phone:document.getElementById('nrPhone')?.value?.trim()||''},vehicle:{make:(document.getElementById('nrVehicle')?.value||'Vehículo').split(' ')[0],model:(document.getElementById('nrVehicle')?.value||'').split(' ').slice(1).join(' ')},included:[],needs:[],extras:[],date:dateVal||'Por definir',time:timeVal||'Por definir',address:document.getElementById('nrAddress')?.value?.trim()||'',total:0,step:'admin'};
 const service=document.getElementById('nrService')?.value||'Detailing completo'; payload.service_name=service;
 if(window.briceDB){await briceDB.createBooking(payload); liveBookings=await briceDB.getRecentBookings(50);}
 document.getElementById('modal').classList.add('hidden'); reservationsFilter='all'; reservas(); updateNavCounts(); alert('Reserva creada y disponible en tiempo real.');
}
function openClient(){showModal(`<h2>Nuevo cliente</h2><div class="form-grid"><div class="field"><label>Nombre</label><input id="ncName"></div><div class="field"><label>WhatsApp</label><input id="ncPhone"></div><div class="field"><label>Email</label><input id="ncEmail"></div><div class="field"><label>Notas</label><input id="ncNotes"></div></div><button class="btn primary" onclick="saveNewClient()">Guardar cliente</button>`)}
function saveNewClient(){const nombre=document.getElementById('ncName')?.value?.trim()||'Nuevo cliente';data.clientes.unshift({nombre,tel:document.getElementById('ncPhone')?.value?.trim()||'—',vehiculos:0,ultimo:'—',fecha:'Hoy'});document.getElementById('modal').classList.add('hidden');clientes();alert('Cliente guardado.');}
function openVehicle(){showModal(`<h2>Registrar vehículo</h2><div class="form-grid"><div class="field"><label>Cliente</label><input id="nvClient"></div><div class="field"><label>Marca</label><input id="nvMake"></div><div class="field"><label>Modelo</label><input id="nvModel"></div><div class="field"><label>Año</label><input id="nvYear"></div><div class="field"><label>Placa</label><input id="nvPlate"></div><div class="field"><label>Color</label><input id="nvColor"></div></div><button class="btn primary" onclick="saveNewVehicle()">Guardar vehículo</button>`)}
function saveNewVehicle(){data.vehiculos.unshift({cliente:document.getElementById('nvClient')?.value||'Nuevo cliente',marca:document.getElementById('nvMake')?.value||'Marca',modelo:document.getElementById('nvModel')?.value||'Modelo',año:document.getElementById('nvYear')?.value||'—',placa:document.getElementById('nvPlate')?.value||'—',servicios:0});document.getElementById('modal').classList.add('hidden');vehiculos();alert('Vehículo registrado.');}
function openService(i){let s=services[i]||["Nuevo servicio","","$0"];showModal(`<h2>${i===undefined?"Nuevo servicio":"Editar servicio"}</h2><div class="field"><label>Nombre</label><input value="${s[0]}"></div><div class="field"><label>Descripción</label><textarea rows="3">${s[1]}</textarea></div><div class="field"><label>Precio</label><input value="${s[2]}"></div><button class="btn primary" onclick="saveModal('Servicio actualizado')">Guardar</button>`)}
function openQuote(){showModal(`<h2>Nueva cotización</h2><div class="form-grid"><div class="field"><label>Cliente</label><input></div><div class="field"><label>Vehículo</label><input></div></div><div class="field"><label>Servicios</label><textarea rows="4" placeholder="Servicios seleccionados"></textarea></div><button class="btn primary" onclick="saveModal('Cotización creada')">Crear cotización</button>`)}
function openReferral(){showModal(`<h2>Crear código de referido</h2><div class="field"><label>Cliente</label><input placeholder="Nombre del cliente"></div><div class="field"><label>Beneficio</label><input value="10% para el referido / 10% para el cliente"></div><button class="btn primary" onclick="saveModal('Código creado')">Crear enlace</button>`)}
function openContent(name){showModal(`<h2>${name&&name!=="undefined"?name:"Nueva sección"}</h2><div class="field"><label>Título</label><input value="${name||""}"></div><div class="field"><label>Contenido</label><textarea rows="6" placeholder="Escribe la información que verá el cliente..."></textarea></div><button class="btn primary" onclick="saveModal('Contenido actualizado')">Guardar cambios</button>`)}
function viewReservation(i){const r=data.reservas[i];const isPending=String(r.estado||'').toLowerCase().includes('pend');showModal(`<h2>${r.cliente}</h2><div class="kpi-row"><div class="kpi"><small>Vehículo</small><strong>${r.vehiculo}</strong></div><div class="kpi"><small>Servicio</small><strong>${r.servicio}</strong></div><div class="kpi"><small>Estado</small><strong>${r.estado}</strong></div></div><br><p style="font-size:12px;color:#666">Servicio a domicilio · ${r.fecha}</p>${isPending?`<button class="btn primary" onclick="confirmDemoReservation(${i})">Confirmar reserva</button>`:''}<button class="btn ghost" onclick="document.getElementById('modal').classList.add('hidden')">Cerrar</button>`)}
function confirmDemoReservation(i){if(data.reservas[i]){data.reservas[i].estado='Confirmada';document.getElementById('modal').classList.add('hidden');reservas();alert('Reserva confirmada');}}
function viewClient(i){const c=data.clientes[i];showModal(`<h2>${c.nombre}</h2><p style="font-size:11px;color:#777">${c.tel}</p><div class="kpi-row"><div class="kpi"><small>Vehículos</small><strong>${c.vehiculos}</strong></div><div class="kpi"><small>Último servicio</small><strong>${c.ultimo}</strong></div></div><h3 style="font-size:13px;margin-top:24px">Historial</h3><div class="timeline"><div class="event"><div class="dot"></div><div><strong>${c.ultimo}</strong><span>${c.fecha}</span></div></div><div class="event"><div class="dot"></div><div><strong>Cotización enviada</strong><span>Antes del último servicio</span></div></div></div>`)}
function viewVehicle(i){const v=data.vehiculos[i];showModal(`<h2>${v.marca} ${v.modelo}</h2><p style="font-size:11px;color:#777">${v.cliente} · ${v.placa}</p><div class="kpi-row"><div class="kpi"><small>Año</small><strong>${v.año}</strong></div><div class="kpi"><small>Servicios</small><strong>${v.servicios}</strong></div></div><h3 style="font-size:13px;margin-top:24px">Historial del vehículo</h3><div class="timeline"><div class="event"><div class="dot"></div><div><strong>Detailing completo</strong><span>Última visita</span></div></div><div class="event"><div class="dot"></div><div><strong>Lavado premium</strong><span>Servicio anterior</span></div></div></div>`)}
function showLiveQuote(experienceId, editing=false){
 const e=liveExperiences.find(x=>x.id===experienceId); if(!e)return;
 const q=experienceQuoteInfo(e); const p=q.payload;
 const status=e.status==='quoted'?'Pendiente por confirmar':e.status==='accepted'?'Aceptada · pendiente de agenda':e.status==='booked'?'Convertida en reserva':e.status;
 const included=q.included.map(x=>`✓ ${x}`).join('<br>')||'—';
 const rejected=q.rejected.map(x=>`× ${x}`).join('<br>')||'Ninguna';
 const extras=q.extras.map(x=>x.name).filter(Boolean).join(' + ')||'Ninguno';
 const requestedDate=p.date||'Por definir', requestedTime=p.time||'Por definir';
 let actions='';
 if(e.status==='quoted' && !editing){
   actions=`<button class="btn primary" onclick="confirmLiveQuote('${experienceId}')">Confirmar y crear reserva</button><button class="btn ghost" onclick="showLiveQuote('${experienceId}',true)">Cambiar horario</button>`;
 } else if(e.status==='quoted' && editing){
   actions=`<div class="form-grid" style="width:100%"><div class="field"><label>Fecha confirmada</label><input id="liveConfirmDate" value="${requestedDate}"></div><div class="field"><label>Hora confirmada</label><input id="liveConfirmTime" value="${requestedTime}"></div></div><button class="btn primary" onclick="confirmLiveQuote('${experienceId}',true)">Guardar horario y crear reserva</button><button class="btn ghost" onclick="showLiveQuote('${experienceId}')">Cancelar</button>`;
 } else if(e.status==='booked'){
   actions=`<button class="btn primary" onclick="document.getElementById('modal').classList.add('hidden');navigate('reservas')">Ver reserva</button>`;
 } else {
   actions=`<span class="badge yellow">${status}</span>`;
 }
 showModal(`<h2>${q.id} · ${q.cliente}</h2><p style="font-size:12px;color:#666">Cotización generada desde la experiencia · ${formatDate(e.created_at)}</p><div class="kpi-row"><div class="kpi"><small>Vehículo</small><strong>${q.vehiculo}</strong></div><div class="kpi"><small>Total</small><strong>${moneyCOP(q.total)}</strong></div><div class="kpi"><small>Estado</small><strong>${status}</strong></div></div><div class="live-detail"><p><strong>Incluido</strong><br>${included}</p><p><strong>No seleccionó</strong><br>${rejected}</p><p><strong>Opcionales</strong><br>${extras}</p><p><strong>WhatsApp</strong><br>${q.tel||'No indicado'}</p><p><strong>Dirección</strong><br>${p.address||'Aún no indicada'}</p><p><strong>Horario solicitado</strong><br>${requestedDate} · ${requestedTime}</p></div><div class="j-actions" style="display:flex;gap:10px;flex-wrap:wrap">${actions}<button class="btn ghost" onclick="document.getElementById('modal').classList.add('hidden')">Cerrar</button></div>`);
}
async function confirmLiveQuote(experienceId, changedSchedule=false){
 const e=liveExperiences.find(x=>x.id===experienceId); if(!e)return;
 let date=e.payload?.date||'Por definir', time=e.payload?.time||'Por definir';
 if(changedSchedule){date=document.getElementById('liveConfirmDate')?.value?.trim()||date;time=document.getElementById('liveConfirmTime')?.value?.trim()||time;}
 if(!date||!time){alert('Indica fecha y hora para confirmar la reserva.');return;}
 if(window.briceDB?.hasConflict?.(date,time,{excludeExperienceId:experienceId})){
   alert('Ya existe otra reserva a menos de 2 horas de este horario. Elige un horario con al menos 2 horas de diferencia.');
   return;
 }
 const result=await briceDB.confirmExperience(experienceId,{date,time});
 if(result?.error){console.error(result.error);alert('No se pudo crear la reserva. Revisa la conexión con Supabase.');return;}
 if(result?.already){
   await loadLiveData();
   document.getElementById('modal').classList.add('hidden');
   reservationsFilter='all';
   if(currentView==='reservas') reservas(); else if(currentView==='dashboard') dashboard(); else if(currentView==='cotizaciones') cotizaciones();
   updateNavCounts();
   alert('Esta cotización ya estaba confirmada. Actualicé el panel con la reserva existente.');
   return;
 }
 if(!result?.data || !result?.experience){
   console.error('[BRICE] confirmExperience returned incomplete result',result);
   alert('La confirmación no quedó registrada. No se actualizará la reserva hasta comprobar el guardado.');
   return;
 }
 await loadLiveData();
 const verifiedBooking=liveBookings.find(b=>String(b.experience_id)===String(experienceId));
 const verifiedExperience=liveExperiences.find(x=>String(x.id)===String(experienceId) && x.status==='booked');
 if(!verifiedBooking && !verifiedExperience){
   console.error('[BRICE] confirmation verification failed',{experienceId,verifiedBooking,verifiedExperience});
   alert('La confirmación no quedó registrada. No se mostrará como reserva hasta verificar el guardado.');
   return;
 }
 document.getElementById('modal').classList.add('hidden');
 reservationsFilter='all';
 // Volvemos a leer el estado LOCAL y reconstruimos Reservas de forma síncrona.
 // No esperamos a Supabase para pintar la reserva recién confirmada.
 const local=readLocalAdminState();
 liveExperiences=local.experiences;
 liveBookings=local.bookings;
 updateNavCounts();
 currentView='reservas';
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view==='reservas'));
 pageTitle.textContent=titles.reservas;
 reservas();
 setTimeout(()=>{
   loadLiveData().then(()=>{
     reservationsFilter='all';
     reservas();
     updateNavCounts();
   }).catch(()=>{});
 },50);
 showModal(`<h2>Reserva confirmada</h2><p style="font-size:13px;color:#666">La cotización fue confirmada y la reserva ya está disponible en Reservas y en el Resumen.</p><button class="btn primary" onclick="document.getElementById('modal').classList.add('hidden')">Aceptar</button>`);
}
function viewQuote(i){const q=data.cotizaciones[i];showModal(`<h2>${q.id} · ${q.cliente}</h2><p style="font-size:12px;color:#666">${q.detalle}</p><div class="kpi-row"><div class="kpi"><small>Total</small><strong>${q.total}</strong></div><div class="kpi"><small>Estado</small><strong>${q.estado}</strong></div></div><br><button class="btn primary" onclick="saveModal('Cotización enviada por WhatsApp')">Enviar por WhatsApp</button>`)}
function copyCode(c){navigator.clipboard?.writeText("https://brice.co/ref/"+c);alert("Link copiado: https://brice.co/ref/"+c)}
function showModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function saveModal(msg){document.getElementById("modal").classList.add("hidden");alert(msg)}
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")e.currentTarget.classList.add("hidden")}

function openNotifications(){
 const items=liveActivityItems().slice(0,8);
 const pending=liveExperiences.filter(e=>e.status==='quoted');
 const body=items.length?items.map(a=>`<div class="list-item" style="cursor:pointer" onclick="document.getElementById('modal').classList.add('hidden');navigate('cotizaciones')"><div class="list-main"><strong>${a.title||a.label}</strong><span>${a.label||a.status}${activityMoney(a.total)} · ${formatDate(a.at)}</span></div><span class="badge ${a.status==='booked'?'green':a.status==='quoted'?'yellow':''}">${a.status==='booked'?'Reservada':a.status==='quoted'?'Pendiente':'Movimiento'}</span></div>`).join(''):'<div class="list-item"><div class="list-main"><strong>Sin movimientos nuevos</strong><span>Los cambios del recorrido aparecerán aquí.</span></div></div>';
 showModal(`<h2>Notificaciones</h2>${pending.length?`<div class="panel" style="margin-bottom:12px;padding:14px"><strong>${pending.length} cotización${pending.length>1?'es':''} pendiente${pending.length>1?'s':''} por confirmar.</strong><span style="display:block;color:#666;font-size:12px;margin-top:4px">Puedes abrirla desde Cotizaciones y confirmar el horario.</span></div>`:''}<div class="list">${body}</div>`);
}
function openProfile(){showModal(`<h2>Brice Admin</h2><p style="font-size:12px;color:#666">Administrador · Panel de negocio</p><button class="btn ghost" onclick="navigate('configuracion');document.getElementById('modal').classList.add('hidden')">Ir a configuración</button>`)}
function navigate(view){currentView=view;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));pageTitle.textContent=titles[view];({dashboard, reservas, clientes, vehiculos, servicios, cotizaciones, referidos, contenido, configuracion}[view]||dashboard)(); if(window.briceDB) loadLiveData().then(()=>refreshCurrentView());}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{navigate(b.dataset.view);document.querySelector(".sidebar").classList.remove("open")}));
document.getElementById("mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
document.querySelector(".notification")?.addEventListener("click",openNotifications);
document.querySelector(".profile")?.addEventListener("click",openProfile);
document.getElementById("globalSearch").onclick=()=>showModal(`<h2>Búsqueda global</h2><div class="field"><label>Buscar cliente, vehículo, reserva o cotización</label><input autofocus placeholder="Ej. Juan Pérez, CX-5, C-1048"></div><button class="btn primary" onclick="saveModal('Búsqueda ejecutada')">Buscar</button>`);
initRealtime();
loadLiveData().then(()=>dashboard()).catch(()=>dashboard());
