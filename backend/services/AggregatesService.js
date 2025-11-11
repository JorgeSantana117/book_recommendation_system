/**** Backendless JS Service: AggregatesService ****/

// --- CONSTANTES Y FUNCIONES AUXILIARES ---
const FeedbackTable='Feedback', UserAggTable='UserAggregates', BooksTable='Books', ConfigTable='Config'
function parseList(s){ if(!s) return []; if(Array.isArray(s)) return s; return String(s).split(';').map(x=>x.trim()).filter(Boolean) }
function norm(r){ r=Math.max(1,Math.min(5,r)); return (r-1)/4 }

async function getConfig(){ const cfg=await Backendless.Data.of(ConfigTable).findFirst(); return cfg || { ema_alpha:0.7 } }

// --- CLASE DEL SERVICIO ---
// El nombre de la clase es 'AggregatesService'
class AggregatesService {
  
  async recomputeUserAggregates(){
    const user=await Backendless.Users.getCurrentUser(); if(!user) throw new Error('Invalid user-token')
    const userId=user.objectId || user.id
    const cfg=await getConfig(); const alpha=cfg.ema_alpha || 0.7
    const fb=await Backendless.Data.of(FeedbackTable).find({ where:`user_id='${userId}'`, pageSize:100 })
    const genre={}, tag={}, author={}
    for(const r of fb){
      const b=await Backendless.Data.of(BooksTable).findById(r.book_id)
      const val=norm(r.rating)
      if(b) { //comprobación por si el libro fue borrado
        for(const g of parseList(b.genres)) genre[g]=genre[g]? alpha*genre[g]+(1-alpha)*val : val
        for(const t of parseList(b.tags)) tag[t]=tag[t]? alpha*tag[t]+(1-alpha)*val : val
        for(const a of parseList(b.authors)) author[a]=author[a]? alpha*author[a]+(1-alpha)*val : val
      }
    }
    const row = { user_id:userId, genre_affinity: JSON.stringify(genre), tag_affinity: JSON.stringify(tag), author_affinity: JSON.stringify(author), updated_at: new Date().toISOString() }
    const existing = await Backendless.Data.of(UserAggTable).find({ where:`user_id='${userId}'` })
    if (existing.length) row.objectId = existing[0].objectId
    await Backendless.Data.of(UserAggTable).save(row)
    return { ok:true }
  }
}

Backendless.ServerCode.addService(AggregatesService);