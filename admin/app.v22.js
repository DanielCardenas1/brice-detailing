const data={
  reservas:[
    {cliente:"Juan Pérez",vehiculo:"Mazda CX-5",servicio:"Detailing completo",fecha:"Hoy · 10:00",estado:"Confirmada"},
    {cliente:"Laura Gómez",vehiculo:"Toyota Corolla",servicio:"Interior premium",fecha:"Hoy · 14:00",estado:"Pendiente"},
    {cliente:"Andrés Ruiz",vehiculo:"BMW X3",servicio:"Protección cerámica",fecha:"Mañana · 09:00",estado:"Confirmada"},
    {cliente:"Camila Torres",vehiculo:"Kia Sportage",servicio:"Lavado premium",fecha:"Mañana · 15:30",estado:"Pendiente"}
  ],
  clientes:[
    {nombre:"Juan Pérez",tel:"310 555 0182",vehiculos:1,ultimo:"Detailing completo",fecha:"15/06/2026"},
    {nombre:"Laura Gómez",tel:"315 222 4810",vehiculos:1,ultimo:"Interior premium",fecha:"03/08/2026"},
    {nombre:"Andrés Ruiz",tel:"300 440 9120",vehiculos:2,ultimo:"Protección cerámica",fecha:"22/05/2026"},
    {nombre:"Camila Torres",tel:"318 771 0091",vehiculos:1,ultimo:"Lavado premium",fecha:"18/08/2026"},
    {nombre:"Santiago Díaz",tel:"301 887 1022",vehiculos:1,ultimo:"Detailing exterior",fecha:"11/07/2026"}
  ],
  vehiculos:[
    {cliente:"Juan Pérez",marca:"Mazda",modelo:"CX-5",año:"2024",placa:"ABC-123",servicios:3},
    {cliente:"Laura Gómez",marca:"Toyota",modelo:"Corolla",año:"2022",placa:"DEF-456",servicios:2},
    {cliente:"Andrés Ruiz",marca:"BMW",modelo:"X3",año:"2023",placa:"GHI-789",servicios:4},
    {cliente:"Andrés Ruiz",marca:"Ford",modelo:"Explorer",año:"2021",placa:"JKL-012",servicios:1}
  ],
  cotizaciones:[
    {id:"#C-1048",cliente:"Juan Pérez",detalle:"CX-5 · Detailing + protección",total:"$370.000",fecha:"Hoy",estado:"Por agendar"},
    {id:"#C-1047",cliente:"María López",detalle:"Kia Seltos · Interior",total:"$150.000",fecha:"Hoy",estado:"Enviada"},
    {id:"#C-1046",cliente:"Andrés Ruiz",detalle:"BMW X3 · Cerámica",total:"$250.000",fecha:"Ayer",estado:"Aceptada"}
  ],
  referidos:[
    {cliente:"Juan Pérez",codigo:"BRICE-JUAN",referidos:3,conversiones:2,beneficio:"$40.000"},
    {cliente:"Camila Torres",codigo:"BRICE-CAMI",referidos:2,conversiones:1,beneficio:"$20.000"},
    {cliente:"Andrés Ruiz",codigo:"BRICE-ANDRES",referidos:1,conversiones:1,beneficio:"$20.000"}
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
function initials(n){return n.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function badge(s){let c=s.includes("Confirm")||s==="Aceptada"? "green":s.includes("Pend")||s.includes("Por")?"yellow":"";return `<span class="badge ${c}">${s}</span>`}
function table(headers,rows){return `<div class="panel"><div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`}
function layout(title,desc,action){return `<div class="hero"><div><p class="eyebrow">BRICE · ADMINISTRACIÓN</p><h2>${title}</h2><p>${desc}</p></div>${action||""}</div>`}
function dashboard(){
 app.innerHTML=layout("Buenos días, Brice.","Todo lo que está pasando con tus clientes, vehículos y servicios en un solo lugar.",`<button class="btn primary" onclick="openNewReservation()">+ Nueva reserva</button>`)
 +`<div class="cards">
   <div class="stat"><div class="stat-top">Clientes <span>↗</span></div><div class="stat-value">126</div><div class="trend">+8 este mes</div></div>
   <div class="stat"><div class="stat-top">Vehículos <span>↗</span></div><div class="stat-value">148</div><div class="trend">+11 este mes</div></div>
   <div class="stat"><div class="stat-top">Cotizaciones <span>↗</span></div><div class="stat-value">7</div><div class="trend">3 aceptadas</div></div>
   <div class="stat"><div class="stat-top">Reservas próximas <span>•</span></div><div class="stat-value">4</div><div class="trend">2 hoy</div></div>
 </div>
 <div class="grid2">
   <div class="panel"><div class="panel-head"><h3>Próximas reservas</h3><button class="btn ghost" onclick="navigate('reservas')">Ver todas</button></div>
   ${table(["Cliente","Vehículo","Servicio","Fecha","Estado"],data.reservas.slice(0,4).map(r=>`<tr><td><div class="person"><div class="mini-avatar">${initials(r.cliente)}</div>${r.cliente}</div></td><td>${r.vehiculo}</td><td>${r.servicio}</td><td>${r.fecha}</td><td>${badge(r.estado)}</td></tr>`))}</div>
   <div class="panel"><div class="panel-head"><h3>Actividad reciente</h3><span>Últimos movimientos</span></div><div class="timeline">
    <div class="event"><div class="dot"></div><div><strong>Juan Pérez aceptó una cotización</strong><span>Hace 12 minutos · $370.000</span></div></div>
    <div class="event"><div class="dot"></div><div><strong>Nueva reserva de Laura Gómez</strong><span>Hace 1 hora · Interior premium</span></div></div>
    <div class="event"><div class="dot"></div><div><strong>Nuevo referido convertido</strong><span>Ayer · Código BRICE-JUAN</span></div></div>
    <div class="event"><div class="dot"></div><div><strong>Servicio actualizado</strong><span>Ayer · Lavado premium</span></div></div>
   </div></div>
 </div>
 <div id="liveConnection" class="panel" style="margin-top:18px"><div class="panel-head"><h3>Experiencia en vivo</h3><span id="liveStatus">Conectando…</span></div><div id="liveExperiences" class="list"><div class="list-item"><div class="list-main"><strong>Esperando actividad del cliente</strong><span>Abre la experiencia pública en otra pestaña y prueba el recorrido.</span></div></div></div></div>`;
 setTimeout(loadLiveData,0);
}
async function loadLiveData(){
  const status=document.getElementById('liveStatus'),box=document.getElementById('liveExperiences');
  if(!status||!box) return;
  if(!window.BRICE_DB?.configured){status.textContent='Demo sin conectar';status.className='badge yellow';box.innerHTML='<div class="list-item"><div class="list-main"><strong>Conecta Supabase para activar tiempo real</strong><span>Configura public/config.js con tu URL y publishable key.</span></div></div>';return;}
  status.textContent='● En vivo';status.className='badge green';
  const rows=await briceDB.getRecentExperiences(8);
  box.innerHTML=rows.length?rows.map(r=>{const p=r.payload||{};const vehicle=[p.vehicle?.make,p.vehicle?.model].filter(Boolean).join(' ');const needs=(p.included||p.needs||[]).map(k=>({exterior:'Exterior',interior:'Interior',rines:'Rines',paint:'Pintura',motor:'Motor'}[k]||k)).join(' · ')||'Recorrido iniciado';const statusText=r.status==='booked'?'Reserva creada':r.status==='quoted'?'Cotizando':r.status==='reviewing'?'Revisando':'En recorrido';return `<div class="list-item"><div class="list-main"><strong>${vehicle||'Vehículo por definir'} · ${needs}</strong><span>${statusText} · ${new Date(r.updated_at||r.created_at).toLocaleString('es-CO')}</span></div><span class="badge ${r.status==='booked'?'green':''}">${r.status}</span></div>`}).join(''):'<div class="list-item"><div class="list-main"><strong>Sin recorridos todavía</strong><span>Haz una prueba desde la experiencia pública.</span></div></div>';
}
let liveExperienceChannel=null,liveBookingChannel=null;
function initRealtime(){
  if(!window.BRICE_DB?.configured||!window.briceDB) return;
  liveExperienceChannel=briceDB.subscribeExperience(()=>loadLiveData());
  liveBookingChannel=briceDB.subscribeBooking(()=>loadLiveData());
  loadLiveData();
}
function reservas(){
 app.innerHTML=layout("Reservas","Organiza los servicios a domicilio y conoce qué necesita cada cliente.",`<button class="btn primary" onclick="openNewReservation()">+ Nueva reserva</button>`)
 +`<div class="tabs"><button class="tab active">Todas · 4</button><button class="tab">Hoy · 2</button><button class="tab">Pendientes · 2</button></div>`
 +table(["Cliente","Vehículo","Servicio","Fecha","Estado",""],data.reservas.map((r,i)=>`<tr><td><div class="person"><div class="mini-avatar">${initials(r.cliente)}</div><strong>${r.cliente}</strong></div></td><td>${r.vehiculo}</td><td>${r.servicio}</td><td>${r.fecha}</td><td>${badge(r.estado)}</td><td><button class="btn ghost" onclick="viewReservation(${i})">Ver</button></td></tr>`));
}
function clientes(){
 app.innerHTML=layout("Clientes","La relación con cada cliente, su historial y sus vehículos.",`<button class="btn primary" onclick="openClient()">+ Nuevo cliente</button>`)
 +`<div class="searchbar"><input id="clientSearch" placeholder="Buscar por nombre o teléfono..." oninput="filterClients()"></div>`
 +`<div id="clientTable">${table(["Cliente","Teléfono","Vehículos","Último servicio","Fecha",""],data.clientes.map((c,i)=>`<tr><td><div class="person"><div class="mini-avatar">${initials(c.nombre)}</div><strong>${c.nombre}</strong></div></td><td>${c.tel}</td><td>${c.vehiculos}</td><td>${c.ultimo}</td><td>${c.fecha}</td><td><button class="btn ghost" onclick="viewClient(${i})">Ver historial</button></td></tr>`))}</div>`;
}
function filterClients(){const q=document.getElementById("clientSearch").value.toLowerCase();const rows=data.clientes.filter(c=>(c.nombre+c.tel).toLowerCase().includes(q));document.getElementById("clientTable").innerHTML=table(["Cliente","Teléfono","Vehículos","Último servicio","Fecha",""],rows.map((c,i)=>`<tr><td><div class="person"><div class="mini-avatar">${initials(c.nombre)}</div><strong>${c.nombre}</strong></div></td><td>${c.tel}</td><td>${c.vehiculos}</td><td>${c.ultimo}</td><td>${c.fecha}</td><td><button class="btn ghost" onclick="viewClient(${data.clientes.indexOf(c)})">Ver historial</button></td></tr>`))}
function vehiculos(){
 app.innerHTML=layout("Vehículos","Cada vehículo queda asociado a su cliente y a su historial de servicios.",`<button class="btn primary" onclick="openVehicle()">+ Registrar vehículo</button>`)
 +table(["Cliente","Vehículo","Año","Placa","Servicios",""],data.vehiculos.map((v,i)=>`<tr><td>${v.cliente}</td><td><div class="vehicle"><div class="vehicle-icon">🚘</div><strong>${v.marca} ${v.modelo}</strong></div></td><td>${v.año}</td><td>${v.placa}</td><td>${v.servicios}</td><td><button class="btn ghost" onclick="viewVehicle(${i})">Ver</button></td></tr>`));
}
function servicios(){
 app.innerHTML=layout("Servicios","Administra lo que el cliente puede descubrir, seleccionar y agregar a su cotización.",`<button class="btn primary" onclick="openService()">+ Nuevo servicio</button>`)
 +`<div class="service-grid">${services.map((s,i)=>`<div class="service-card"><div class="service-image">🚘</div><h3>${s[0]}</h3><p>${s[1]}</p><div class="price">${s[2]}</div><div class="row-actions"><button class="btn ghost" onclick="openService(${i})">Editar</button><button class="btn" onclick="alert('Servicio activado en el recorrido del cliente.')">Activo ✓</button></div></div>`).join("")}</div>`;
}
function cotizaciones(){
 app.innerHTML=layout("Cotizaciones","Consulta lo que cada cliente armó antes de convertirlo en una reserva.",`<button class="btn primary" onclick="openQuote()">+ Nueva cotización</button>`)
 +table(["ID","Cliente","Detalle","Total","Fecha","Estado",""],data.cotizaciones.map((q,i)=>`<tr><td><strong>${q.id}</strong></td><td>${q.cliente}</td><td>${q.detalle}</td><td><strong>${q.total}</strong></td><td>${q.fecha}</td><td>${badge(q.estado)}</td><td><button class="btn ghost" onclick="viewQuote(${i})">Abrir</button></td></tr>`));
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
function openNewReservation(){showModal(`<h2>Nueva reserva</h2><div class="form-grid"><div class="field"><label>Cliente</label><input placeholder="Nombre"></div><div class="field"><label>Teléfono</label><input placeholder="WhatsApp"></div><div class="field"><label>Vehículo</label><input placeholder="Marca y modelo"></div><div class="field"><label>Servicio</label><select><option>Detailing completo</option><option>Interior premium</option><option>Protección cerámica</option></select></div><div class="field"><label>Fecha</label><input type="date"></div><div class="field"><label>Hora</label><input type="time"></div></div><div class="field"><label>Dirección</label><input placeholder="Lugar del servicio a domicilio"></div><button class="btn primary" onclick="saveModal('Reserva creada')">Crear reserva</button>`)}
function openClient(){showModal(`<h2>Nuevo cliente</h2><div class="form-grid"><div class="field"><label>Nombre</label><input></div><div class="field"><label>WhatsApp</label><input></div><div class="field"><label>Email</label><input></div><div class="field"><label>Notas</label><input></div></div><button class="btn primary" onclick="saveModal('Cliente guardado')">Guardar cliente</button>`)}
function openVehicle(){showModal(`<h2>Registrar vehículo</h2><div class="form-grid"><div class="field"><label>Cliente</label><input></div><div class="field"><label>Marca</label><input></div><div class="field"><label>Modelo</label><input></div><div class="field"><label>Año</label><input></div><div class="field"><label>Placa</label><input></div><div class="field"><label>Color</label><input></div></div><button class="btn primary" onclick="saveModal('Vehículo registrado')">Guardar vehículo</button>`)}
function openService(i){let s=services[i]||["Nuevo servicio","","$0"];showModal(`<h2>${i===undefined?"Nuevo servicio":"Editar servicio"}</h2><div class="field"><label>Nombre</label><input value="${s[0]}"></div><div class="field"><label>Descripción</label><textarea rows="3">${s[1]}</textarea></div><div class="field"><label>Precio</label><input value="${s[2]}"></div><button class="btn primary" onclick="saveModal('Servicio actualizado')">Guardar</button>`)}
function openQuote(){showModal(`<h2>Nueva cotización</h2><div class="form-grid"><div class="field"><label>Cliente</label><input></div><div class="field"><label>Vehículo</label><input></div></div><div class="field"><label>Servicios</label><textarea rows="4" placeholder="Servicios seleccionados"></textarea></div><button class="btn primary" onclick="saveModal('Cotización creada')">Crear cotización</button>`)}
function openReferral(){showModal(`<h2>Crear código de referido</h2><div class="field"><label>Cliente</label><input placeholder="Nombre del cliente"></div><div class="field"><label>Beneficio</label><input value="10% para el referido / 10% para el cliente"></div><button class="btn primary" onclick="saveModal('Código creado')">Crear enlace</button>`)}
function openContent(name){showModal(`<h2>${name&&name!=="undefined"?name:"Nueva sección"}</h2><div class="field"><label>Título</label><input value="${name||""}"></div><div class="field"><label>Contenido</label><textarea rows="6" placeholder="Escribe la información que verá el cliente..."></textarea></div><button class="btn primary" onclick="saveModal('Contenido actualizado')">Guardar cambios</button>`)}
function viewReservation(i){const r=data.reservas[i];showModal(`<h2>${r.cliente}</h2><div class="kpi-row"><div class="kpi"><small>Vehículo</small><strong>${r.vehiculo}</strong></div><div class="kpi"><small>Servicio</small><strong>${r.servicio}</strong></div><div class="kpi"><small>Estado</small><strong>${r.estado}</strong></div></div><br><p style="font-size:12px;color:#666">Servicio a domicilio · ${r.fecha}</p><button class="btn primary" onclick="saveModal('Reserva actualizada')">Actualizar reserva</button>`)}
function viewClient(i){const c=data.clientes[i];showModal(`<h2>${c.nombre}</h2><p style="font-size:11px;color:#777">${c.tel}</p><div class="kpi-row"><div class="kpi"><small>Vehículos</small><strong>${c.vehiculos}</strong></div><div class="kpi"><small>Último servicio</small><strong>${c.ultimo}</strong></div></div><h3 style="font-size:13px;margin-top:24px">Historial</h3><div class="timeline"><div class="event"><div class="dot"></div><div><strong>${c.ultimo}</strong><span>${c.fecha}</span></div></div><div class="event"><div class="dot"></div><div><strong>Cotización enviada</strong><span>Antes del último servicio</span></div></div></div>`)}
function viewVehicle(i){const v=data.vehiculos[i];showModal(`<h2>${v.marca} ${v.modelo}</h2><p style="font-size:11px;color:#777">${v.cliente} · ${v.placa}</p><div class="kpi-row"><div class="kpi"><small>Año</small><strong>${v.año}</strong></div><div class="kpi"><small>Servicios</small><strong>${v.servicios}</strong></div></div><h3 style="font-size:13px;margin-top:24px">Historial del vehículo</h3><div class="timeline"><div class="event"><div class="dot"></div><div><strong>Detailing completo</strong><span>Última visita</span></div></div><div class="event"><div class="dot"></div><div><strong>Lavado premium</strong><span>Servicio anterior</span></div></div></div>`)}
function viewQuote(i){const q=data.cotizaciones[i];showModal(`<h2>${q.id} · ${q.cliente}</h2><p style="font-size:12px;color:#666">${q.detalle}</p><div class="kpi-row"><div class="kpi"><small>Total</small><strong>${q.total}</strong></div><div class="kpi"><small>Estado</small><strong>${q.estado}</strong></div></div><br><button class="btn primary" onclick="saveModal('Cotización enviada por WhatsApp')">Enviar por WhatsApp</button>`)}
function copyCode(c){navigator.clipboard?.writeText("https://brice.co/ref/"+c);alert("Link copiado: https://brice.co/ref/"+c)}
function showModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function saveModal(msg){document.getElementById("modal").classList.add("hidden");alert(msg)}
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")e.currentTarget.classList.add("hidden")}
function navigate(view){document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));pageTitle.textContent=titles[view];({dashboard, reservas, clientes, vehiculos, servicios, cotizaciones, referidos, contenido, configuracion}[view]||dashboard)()}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{navigate(b.dataset.view);document.querySelector(".sidebar").classList.remove("open")}));
document.getElementById("mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
document.getElementById("globalSearch").onclick=()=>showModal(`<h2>Búsqueda global</h2><div class="field"><label>Buscar cliente, vehículo, reserva o cotización</label><input autofocus placeholder="Ej. Juan Pérez, CX-5, C-1048"></div><button class="btn primary" onclick="saveModal('Búsqueda ejecutada')">Buscar</button>`);
dashboard();
setTimeout(initRealtime,250);
