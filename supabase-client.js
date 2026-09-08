/* BRICE — data layer: Supabase + local demo fallback */
(function(){
  const cfg=window.BRICE_CONFIG||{};
  const configured=!!(cfg.supabaseUrl && cfg.supabaseKey && !cfg.supabaseUrl.includes('YOUR-PROJECT') && !cfg.supabaseKey.includes('YOUR_'));
  window.BRICE_DB={configured,client:null,experienceId:null};
  const STORAGE='brice_demo_state_v3';
  const LEGACY_STORAGES=['brice_demo_state_v2'];
  const REMOTE_TIMEOUT=1800;
  const withTimeout=(promise,ms=REMOTE_TIMEOUT)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);
  function parseState(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):{experiences:[],bookings:[]}}catch{return {experiences:[],bookings:[]}}}
  function readLocal(){
    const sources=[...LEGACY_STORAGES.map(parseState),parseState(STORAGE)];
    const experiences=new Map(), bookings=new Map();
    sources.forEach(state=>{(state.experiences||[]).forEach(x=>experiences.set(String(x.id),x));(state.bookings||[]).forEach(x=>bookings.set(String(x.id),x))});
    return {experiences:[...experiences.values()],bookings:[...bookings.values()]};
  }
  function writeLocal(state){localStorage.setItem(STORAGE,JSON.stringify(state));window.dispatchEvent(new CustomEvent('brice-local-change'))}
  function localExperience(payload,status,id){const now=new Date().toISOString();return {id:id||crypto.randomUUID(),status,source:'demo_public',payload:{...payload,activity:Array.isArray(payload.activity)?payload.activity:[briceActivity(status,payload)]},created_at:now,updated_at:now}}
  function localBooking(experienceId,payload,status='confirmed',id){const now=new Date().toISOString();return {id:id||crypto.randomUUID(),experience_id:experienceId||null,status,payload,created_at:now,updated_at:now}}
  const boot=()=>{if(window.supabase){try{window.BRICE_DB.client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey)}catch(e){console.warn('[BRICE] Supabase unavailable',e)}}};
  if(configured){if(window.supabase)boot();else window.addEventListener('supabase-ready',boot,{once:true})}

  function briceActivity(status,payload){
    const p=payload||{},c=p.customer||{},v=p.vehicle||{};const vehicle=[v.make,v.model].filter(Boolean).join(' ')||'Vehículo por definir';
    const labels={quoted:'Cotización pendiente por confirmar',accepted:'Cotización aceptada',booked:'Reserva creada',reviewing:'Cliente está revisando el servicio',in_progress:'Recorrido iniciado'};
    const titles={quoted:`${c.name||'Cliente nuevo'} · Cotización pendiente por confirmar`,accepted:`${c.name||'Cliente nuevo'} aceptó la cotización`,booked:`${c.name||'Cliente nuevo'} · Reserva confirmada`,reviewing:`${c.name||'Cliente nuevo'} está revisando su servicio`,in_progress:`${c.name||'Cliente nuevo'} inició el recorrido`};
    return {status,label:labels[status]||status,title:titles[status]||`${c.name||'Cliente nuevo'} · ${vehicle}`,at:new Date().toISOString(),total:Number(p.total||0)};
  }
  window.briceDB={
    async createExperience(payload={}){
      const db=window.BRICE_DB;
      // LOCAL FIRST: the prototype must work even when Supabase is unavailable.
      const rec=localExperience(payload,'in_progress');
      const s=readLocal();s.experiences=s.experiences.filter(x=>x.id!==rec.id);s.experiences.unshift(rec);writeLocal(s);db.experienceId=rec.id;
      // Best effort remote mirror; never block the experience on the network.
      if(db?.client){
        void withTimeout(db.client.from('experiences').insert({id:rec.id,status:rec.status,source:rec.source,payload:rec.payload,created_at:rec.created_at,updated_at:rec.updated_at}).select('*').single()).catch(e=>console.warn('[BRICE] remote create skipped:',e.message));
      }
      return rec.id;
    },
    async updateExperience(patch={}){
      const db=window.BRICE_DB;const id=db?.experienceId;if(!id)return null;
      const local=readLocal();let current=local.experiences.find(x=>x.id===id)||null;
      if(!current && db?.client){
        try{const r=await withTimeout(db.client.from('experiences').select('*').eq('id',id).single());if(!r.error)current=r.data}catch(e){console.warn('[BRICE] remote experience lookup skipped:',e.message)}
      }
      if(!current)return null;
      const nextPayload={...(current.payload||{}),...(patch.payload||{})};
      const nextStatus=patch.status||current.status||'in_progress';
      const history=Array.isArray(nextPayload.activity)?[...nextPayload.activity]:[];
      if(nextStatus!==current.status)history.push(briceActivity(nextStatus,nextPayload));
      if(patch.activityLabel){const a=briceActivity(nextStatus,nextPayload);a.label=patch.activityLabel;a.title=`${nextPayload.customer?.name||'Cliente nuevo'} · ${patch.activityLabel}`;history.push(a)}
      nextPayload.activity=history.slice(-30);
      const updated={...current,status:nextStatus,payload:nextPayload,updated_at:new Date().toISOString()};
      // Persist locally BEFORE any remote request.
      const ls=readLocal();ls.experiences=ls.experiences.filter(x=>x.id!==id);ls.experiences.unshift(updated);writeLocal(ls);
      if(db?.client){
        void withTimeout(db.client.from('experiences').update({payload:nextPayload,status:nextStatus,updated_at:updated.updated_at}).eq('id',id).select('*').single()).catch(e=>console.warn('[BRICE] remote update skipped:',e.message));
      }
      return updated;
    },
    async createBooking(payload={},experienceId=null){
      const db=window.BRICE_DB;const eid=experienceId||db?.experienceId||null;
      const rec=localBooking(eid,payload,'confirmed');
      const s=readLocal();s.bookings=s.bookings.filter(x=>x.id!==rec.id);s.bookings.unshift(rec);writeLocal(s);
      if(db?.client && eid){
        void withTimeout(db.client.from('bookings').insert({id:rec.id,experience_id:eid,status:'confirmed',payload,created_at:rec.created_at,updated_at:rec.updated_at}).select('*').single()).catch(e=>console.warn('[BRICE] remote booking skipped:',e.message));
      }
      return rec;
    },
    async confirmExperience(experienceId,schedule={}){
      const db=window.BRICE_DB;let e=readLocal().experiences.find(x=>String(x.id)===String(experienceId))||null;
      if(!e)return {error:'experience_not_found'};
      if(e.status==='booked'){
        const existing=readLocal().bookings.find(b=>String(b.experience_id)===String(experienceId))||null;
        return {data:existing,experience:e,already:true};
      }
      const p={...(e.payload||{})};if(schedule.date)p.date=schedule.date;if(schedule.time)p.time=schedule.time;p.step='admin_confirmed';p.confirmed_by='Brice Admin';p.confirmed_at=new Date().toISOString();
      const history=Array.isArray(p.activity)?[...p.activity]:[];history.push(briceActivity('booked',p));p.activity=history.slice(-30);
      const now=new Date().toISOString();const updated={...e,status:'booked',payload:p,updated_at:now};
      const booking=localBooking(experienceId,p,'confirmed');
      // Atomic local state update: both reservation and experience appear together.
      const s=readLocal();s.experiences=s.experiences.filter(x=>x.id!==experienceId);s.experiences.unshift(updated);s.bookings=s.bookings.filter(x=>String(x.experience_id)!==String(experienceId));s.bookings.unshift(booking);writeLocal(s);
      // Mirror to Supabase after local success. Never block navigation.
      if(db?.client && !String(experienceId).startsWith('local-')){
        void Promise.all([
          withTimeout(db.client.from('bookings').insert({id:booking.id,experience_id:experienceId,status:'confirmed',payload:p,created_at:booking.created_at,updated_at:booking.updated_at}).select('*').single()),
          withTimeout(db.client.from('experiences').update({status:'booked',payload:p,updated_at:now}).eq('id',experienceId).select('*').single())
        ]).catch(err=>console.warn('[BRICE] remote confirmation mirror skipped:',err.message));
      }
      return {data:booking,experience:updated};
    },
    async getLocalExperiences(limit=50){
      return (readLocal().experiences||[]).sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at)).slice(0,limit);
    },
    async getLocalBookings(limit=50){
      return (readLocal().bookings||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,limit);
    },
    async getRecentExperiences(limit=50){
      return this.getLocalExperiences(limit);
    },
    async getRecentBookings(limit=50){
      return this.getLocalBookings(limit);
    },
    async syncRemote(limit=50){
      const db=window.BRICE_DB;if(!db?.client)return false;
      try{
        const [er,br]=await Promise.all([
          withTimeout(db.client.from('experiences').select('*').order('updated_at',{ascending:false}).limit(limit)),
          withTimeout(db.client.from('bookings').select('*').order('created_at',{ascending:false}).limit(limit))
        ]);
        const remoteE=!er.error?(er.data||[]):[], remoteB=!br.error?(br.data||[]):[];
        if(!remoteE.length&&!remoteB.length)return false;
        const current=readLocal(), em=new Map((current.experiences||[]).map(x=>[String(x.id),x])), bm=new Map((current.bookings||[]).map(x=>[String(x.id),x]));
        let changed=false;
        for(const x of remoteE){const k=String(x.id),old=em.get(k);if(!old||new Date(x.updated_at||x.created_at)>new Date(old.updated_at||old.created_at)){em.set(k,x);changed=true}}
        for(const x of remoteB){const k=String(x.id),old=bm.get(k);if(!old||new Date(x.updated_at||x.created_at)>new Date(old.updated_at||old.created_at)){bm.set(k,x);changed=true}}
        if(changed){localStorage.setItem(STORAGE,JSON.stringify({experiences:[...em.values()],bookings:[...bm.values()]}));window.dispatchEvent(new CustomEvent('brice-local-change'))}
        return changed;
      }catch(e){console.warn('[BRICE] remote sync skipped:',e.message);return false}
    },
    subscribeExperience(callback){
      const handler=()=>callback();window.addEventListener('brice-local-change',handler);window.addEventListener('storage',e=>{if(e.key===STORAGE)callback()});
      if(window.BRICE_DB?.client)return window.BRICE_DB.client.channel('brice-experiences-live-v30').on('postgres_changes',{event:'*',schema:'public',table:'experiences'},callback).subscribe();return null;
    },
    subscribeBooking(callback){
      const handler=()=>callback();window.addEventListener('brice-local-change',handler);window.addEventListener('storage',e=>{if(e.key===STORAGE)callback()});
      if(window.BRICE_DB?.client)return window.BRICE_DB.client.channel('brice-bookings-live-v30').on('postgres_changes',{event:'*',schema:'public',table:'bookings'},callback).subscribe();return null;
    }
  };
})();