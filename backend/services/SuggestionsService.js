/**** Backendless JS Service: SuggestionsService ****/

// --- CONSTANTES Y FUNCIONES AUXILIARES ---
const ConfigTable = 'Config'
const BooksTable = 'Books'
const HiddenTable = 'HiddenItems'
const UserAggTable = 'UserAggregates'
const FeedbackTable = 'Feedback'

function nowIso() { return new Date().toISOString() }
function parseList(s){ if(!s) return []; if(Array.isArray(s)) return s; return String(s).split(';').map(x=>x.trim()).filter(Boolean) }
function jaccard(aSet,bSet){ const a=new Set(aSet),b=new Set(bSet); const inter=[...a].filter(x=>b.has(x)).length; const uni=new Set([...a,...b]).size; return uni? inter/uni:0 }
function normalize(values){ const min=Math.min(...values),max=Math.max(...values); return values.map(v=> (max===min?0: (v-min)/(max-min))) }

async function getUser(){ const u = await Backendless.Users.getCurrentUser(); if(!u) throw new Error('Invalid user-token'); return u }
async function getConfig(){
  const cfg = await Backendless.Data.of(ConfigTable).findFirst()
  return cfg || { weights: { genre:0.45, tag:0.25, author:0.2, rating:0.1 }, ema_alpha:0.7, coldstart_sort:'rating_avg;rating_count;year', suggestions_limit:20 }
}
// CORREGIDO: pageSize: 100
async function loadHidden(userId){ const res = await Backendless.Data.of(HiddenTable).find({ where:`user_id='${userId}' OR ownerId='${userId}'`, pageSize: 100 }); return new Set(res.map(x=>x.book_id)) }
async function loadAgg(userId){ const res = await Backendless.Data.of(UserAggTable).find({ where:`user_id='${userId}' OR ownerId='${userId}'` }); return res[0] || { genre_affinity:'{}', tag_affinity:'{}', author_affinity:'{}' } }

async function coldStart(user, cfg){
  const prefGenres = parseList(user.preferred_genres), prefFormats=parseList(user.preferred_formats), lang=user.language_pref
  const clauses=[]
  if(lang) clauses.push(`language='${lang}'`)
  if(prefFormats.length) clauses.push(`format IN ('${prefFormats.join("','")}')`)
  if(prefGenres.length){ clauses.push('(' + prefGenres.map(g=>`genres LIKE '%25${g}%25'`).join(' OR ') + ')') }
  const where = clauses.join(' AND ')
  // CORREGIDO: pageSize: 100
  const res = await Backendless.Data.of(BooksTable).find({ where, pageSize:100 })
  const order=(cfg.coldstart_sort||'rating_avg;rating_count;year').split(';')
  res.sort((a,b)=>{ for(const k of order){ const d=(b[k]||0)-(a[k]||0); if(d!==0) return d } return 0 })
  const rationale = prefGenres.length? `Based on your selected genres ${prefGenres.slice(0,2).join(', ')} and preferred formats.` : `Getting you started with popular picks.`
  return { items: res.slice(0, cfg.suggestions_limit||20), rationale }
}

async function personalized(user, cfg, agg, hiddenSet){
  const weights = typeof cfg.weights==='string'? JSON.parse(cfg.weights): (cfg.weights || { genre:0.45, tag:0.25, author:0.2, rating:0.1 })
  const prefFormats=parseList(user.preferred_formats), lang=user.language_pref
  const clauses=[]; if(lang) clauses.push(`language='${lang}'`); if(prefFormats.length) clauses.push(`format IN ('${prefFormats.join("','")}')`)
  const where=clauses.join(' AND ')
  // CORREGIDO: pageSize: 100
  const cand = await Backendless.Data.of(BooksTable).find({ where, pageSize:100 })
  const ga=JSON.parse(agg.genre_affinity||'{}'), ta=JSON.parse(agg.tag_affinity||'{}'), aa=JSON.parse(agg.author_affinity||'{}')
  const ratingSignals = cand.map(c => (c.rating_avg||0) * Math.log(1 + (c.rating_count||0)))
  const normRS = normalize(ratingSignals)

  const scored = []
  cand.forEach((c,i)=>{
    const bookId=c.id || c.objectId; if(hiddenSet.has(bookId)) return
    const genres=parseList(c.genres), tags=parseList(c.tags), authors=parseList(c.authors)
    const topGenres=Object.keys(ga).filter(k=>ga[k]>0.1), topTags=Object.keys(ta).filter(k=>ta[k]>0.1)
    const genreOverlap=jaccard(topGenres,genres), tagOverlap=jaccard(topTags,tags)
    let authorAffinity=0; authors.forEach(a=>{ if(aa[a]) authorAffinity=Math.max(authorAffinity, aa[a]) })
    const score=(weights.genre||0.45)*genreOverlap + (weights.tag||0.25)*tagOverlap + (weights.author||0.2)*authorAffinity + (weights.rating||0.1)*normRS[i]
    scored.push({ item:c, score, genreOverlap, tagOverlap, authorAffinity })
  })
  scored.sort((a,b)=> b.score - a.score || (b.item.rating_avg||0)-(a.item.rating_avg||0) || (b.item.rating_count||0)-(a.item.rating_count||0) || (b.item.year||0)-(a.item.year||0))
  const items = scored.slice(0, cfg.suggestions_limit||20).map(x=>x.item)
  let rationale='Personalized suggestions.'
  if(scored.length){
    const best=scored[0]
    if(best.authorAffinity>0.5 && Array.isArray(best.item.authors) && best.item.authors.length) rationale=`Because you’ve enjoyed books by ${best.item.authors[0]}.`
    else if(best.genreOverlap>=best.tagOverlap && best.genreOverlap>0) rationale=`Because you like ${parseList(best.item.genres)[0]}.`
    else if(best.tagOverlap>0) rationale=`Matches your interest in ${parseList(best.item.tags)[0]}.`
  }
  return { items, rationale }
}

// --- CLASE DEL SERVICIO (Estructura correcta) ---
class SuggestionsService {

  async getSuggestions(limit){
    const cfg=await getConfig()
    if(limit) cfg.suggestions_limit = limit
    const user=await getUser()
    const userId=user.objectId || user.id
    const fb = await Backendless.Data.of(FeedbackTable).find({ where:`user_id='${userId}' OR ownerId='${userId}'`, pageSize: 1 })
    const hidden=await loadHidden(userId)
    let payload
    if(!user.onboarding_done || fb.length===0) payload=await coldStart(user,cfg)
    else {
      const agg=await loadAgg(userId)
      payload=await personalized(user,cfg,agg,hidden)
    }
    return { model_version:'rules:v1', as_of: nowIso(), rationale: payload.rationale, items: payload.items }
  }
}

Backendless.ServerCode.addService(SuggestionsService);