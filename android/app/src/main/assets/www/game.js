// 篮球人生 前端 — 适配本地引擎 engine.js
(function(){
var engine=null,gd=false,gn=false,pc='medium';
var $=function(id){return document.getElementById(id)};
var nr=$('nr'),ia=$('ia'),ar=$('ar'),ov=$('ov'),pl=$('pl');
var ps=['PG','SG','SF','PF','C'];
var pn={PG:'控卫',SG:'分卫',SF:'小前',PF:'大前',C:'中锋'};
var ty=['全能型','得分机器','组织大师','防守悍将','三分射手','攻防一体'];
var sl='SG',tp='全能型';
document.body.classList.add('has-overlay');
var pgEl=$('pg');
for(var i=0;i<ps.length;i++){var p=ps[i];pgEl.innerHTML+='<button class="'+(p===sl?'selected':'')+'" data-p="'+p+'">'+p+' - '+pn[p]+'</button>'}
pgEl.onclick=function(e){var b=e.target;if(b.tagName!=='BUTTON')return;sl=b.getAttribute('data-p');var all=pgEl.querySelectorAll('button');for(var i=0;i<all.length;i++)all[i].classList.remove('selected');b.classList.add('selected')}
var tgEl=$('tg');
for(var i=0;i<ty.length;i++){var t=ty[i];tgEl.innerHTML+='<button class="'+(t===tp?'selected':'')+'" data-t="'+t+'">'+t+'</button>'}
tgEl.onclick=function(e){var b=e.target;if(b.tagName!=='BUTTON')return;tp=b.getAttribute('data-t');var all=tgEl.querySelectorAll('button');for(var i=0;i<all.length;i++)all[i].classList.remove('selected');b.classList.add('selected')}
var pbs=document.querySelectorAll('.pace-btns button');
for(var i=0;i<pbs.length;i++){pbs[i].onclick=function(){pc=this.getAttribute('data-pace');var all=document.querySelectorAll('.pace-btns button');for(var j=0;j<all.length;j++)all[j].classList.remove('active');this.classList.add('active');toast('节奏切换为: '+pc,'var(--accent)')}}
$('tgl').onclick=function(){var s=$('sidebar');s.classList.toggle('collapsed');$('tgl').textContent=s.classList.contains('collapsed')?'>':'X'};
$('dedup_btn').onclick=function(){
  if(!engine||!engine.state)return;var b=$('dedup_btn');b.disabled=true;b.textContent='整理中...';
  try{var n=engine.dedupLorebook();toast(n?'合并了 '+n+' 组重复':'无重复','var(--green)');rp()}catch(e){toast('失败: '+e.message,'var(--red)')}
  b.disabled=false;b.textContent='整理'
};
function toast(msg,color){var t=document.createElement('div');t.className='toast';t.textContent=msg;if(color)t.style.background=color;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}

function _makeEngine(){
  var ak=$('ak').value.trim()||localStorage.getItem('bbl_apikey')||'';
  var ab=$('ab').value.trim()||localStorage.getItem('bbl_apibase')||'https://api.deepseek.com/v1';
  var am=$('am').value.trim()||localStorage.getItem('bbl_model')||'deepseek-v4-pro';
  var mt=parseInt($('amt').value)||parseInt(localStorage.getItem('bbl_maxtokens'))||4096;
  localStorage.setItem('bbl_apikey',ak);localStorage.setItem('bbl_apibase',ab);localStorage.setItem('bbl_model',am);
  localStorage.setItem('bbl_maxtokens',mt);
  return new GameEngine({apiKey:ak,apiBase:ab,model:am,maxTokens:mt});
}

$('sbn').onclick=async function(){
  var b=$('sbn');b.disabled=true;b.textContent='开局中...';
  try{
    engine=_makeEngine();
    var c={name:$('cn').value.trim(),position:sl,height:parseInt($('ch').value)||198,background:$('cb').value.trim(),player_type:tp};
    var r=await engine.startGame(c);
    ov.style.display='none';document.body.classList.remove('has-overlay');gd=true;ar.style.display='flex';ia.style.display='flex';
    ab(r);var s=document.getElementById("sidebar");if(s)s.classList.remove("open");nr.scrollTop=nr.scrollHeight;po(r);rf();rp();
    if($('ap').classList.contains('hidden'))$('ap').classList.remove('hidden');
    b.disabled=false;b.textContent='开始游戏（已连接）';
  }catch(e){alert(e.message);b.disabled=false;b.textContent='开始游戏'}
};

// 加载 API key 记忆
(function(){
  var sak=localStorage.getItem('bbl_apikey');if(sak){$('ak').value=sak}
  var sab=localStorage.getItem('bbl_apibase');if(sab)$('ab').value=sab;
  var sam=localStorage.getItem('bbl_model');if(sam)$('am').value=sam;
  var smt=localStorage.getItem('bbl_maxtokens');if(smt)$('amt').value=smt;
  showSaves();
})();

$('sb').onclick=sd;$('ci').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sd()}};

async function _streamGen(genFn){
  $('stb').classList.add('visible');  var bb=document.createElement('div');bb.className='narrative-block';bb.id='cb';bb.innerHTML='<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>';nr.appendChild(bb);sc();
  var ft='',lastLen=0;
  try{
    for await(var ck of genFn){ft+=ck;bb.innerHTML=md(ft);sc();if(ft.length-lastLen>40){lastLen=ft.length;await new Promise(function(r){requestAnimationFrame(r)})}}
  }catch(err){bb.innerHTML=md(ft)+(err.name==='AbortError'?'<br><em>[stopped]</em>':'<span style="color:var(--red)">err: '+es(err.message)+'</span>')}
  finally{gn=false;$('sb').disabled=false;$('stb').classList.remove('visible');bb.removeAttribute('id');po(ft);rf();rp()}
}

async function sd(){
  if(gn)return;var i=$('ci').value.trim();if(!i)return;if(pc!=='medium')i='##'+pc+'## '+i;gn=true;$('sb').disabled=true;$('ci').value='';co();
  var ub=document.createElement('div');ub.className='narrative-block';ub.style.background='#1a1d24';ub.innerHTML='<strong>你：</strong> '+es(i);nr.appendChild(ub);sc();
  await _streamGen(engine.doAction(i));
}

$('rrb').onclick=function(){if(gn||!gd)return;if(!confirm('确定要重新生成吗？'))return;gn=true;$('sb').disabled=true;co();
  var blocks=nr.querySelectorAll('.narrative-block');if(blocks.length&&!(blocks[blocks.length-1].style.background==='rgb(26, 29, 36)')){blocks[blocks.length-1].querySelector('.options-grid')?.remove();blocks[blocks.length-1].remove()}
  _streamGen(engine.regenerate());}

$('mdb').onclick=function(){if(gn||!gd)return;var i=prompt('new action:');if(!i)return;gn=true;$('sb').disabled=true;co();
  var blocks=nr.querySelectorAll('.narrative-block');if(blocks.length){var last=blocks[blocks.length-1];if(last.style.background!=='rgb(26, 29, 36)'){last.querySelector('.options-grid')?.remove();last.remove()}else{blocks[blocks.length-2]?.querySelector('.options-grid')?.remove();blocks[blocks.length-2]?.remove()}}
  var ub=document.createElement('div');ub.className='narrative-block';ub.style.background='#1a1d24';ub.innerHTML='<strong>修改：</strong> '+es(i);nr.appendChild(ub);sc();
  _streamGen(engine.modify(i));}

$('svb').onclick=function(){var s=prompt('存档名称（留空=自动）')||'auto';engine.save(s);toast('已保存: '+s,'var(--blue)')}

$('exb').onclick=function(){
  var slot=prompt('导出哪个存档？（auto / 存档名）','auto');if(!slot)return;
  var key='bbl_save_'+slot;var raw=localStorage.getItem(key);if(!raw){toast('存档不存在','var(--red)');return}
  var data={};data[key]=raw;if(slot==='auto'){data['bbl_apikey']=localStorage.getItem('bbl_apikey')||''}
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bbl_'+slot+'_'+new Date().toISOString().slice(0,10)+'.json';a.click();
  toast('已导出: '+slot,'var(--green)')
}

$('simb').onclick=function(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;
    var reader=new FileReader();
    reader.onload=function(){
      try{var data=JSON.parse(reader.result);
        var count=0;for(var k in data){localStorage.setItem(k,data[k]);count++}
        toast('导入 '+count+' 条，刷新后生效','var(--green)')
      }catch(e){toast('导入失败: '+e.message,'var(--red)')}
    };
    reader.readAsText(f)
  };
  inp.click()
}

$('newb').onclick=function(){if(confirm('开始新游戏?')){engine.endSession();location.reload()}}

$('stb_set').onclick=function(){
  $('sak').value=localStorage.getItem('bbl_apikey')||'';
  $('sab').value=localStorage.getItem('bbl_apibase')||'https://api.deepseek.com/v1';
  $('sam').value=localStorage.getItem('bbl_model')||'deepseek-v4-pro';
  $('smt').value=localStorage.getItem('bbl_maxtokens')||'4096';
  $('sov').style.display='flex'
};
$('sbs').onclick=function(){
  var ak=$('sak').value.trim(),ab=$('sab').value.trim(),am=$('sam').value.trim(),mt=$('smt').value.trim();
  localStorage.setItem('bbl_apikey',ak);localStorage.setItem('bbl_apibase',ab);localStorage.setItem('bbl_model',am);localStorage.setItem('bbl_maxtokens',mt);
  if(engine){engine.apiCfg.apiKey=ak;engine.apiCfg.apiBase=ab;engine.apiCfg.model=am;engine.apiCfg.maxTokens=parseInt(mt)||4096}
  $('ak').value=ak;$('ab').value=ab;$('am').value=am;$('amt').value=mt;
  $('sov').style.display='none';toast('设置已保存','var(--green)')
};
$('sbc').onclick=function(){$('sov').style.display='none'}

function po(t){
  var ls=t.split('\n'),o=[];
  for(var i=0;i<ls.length;i++){var s=ls[i].trim();if(!s)continue;var m=s.match(/^([A-D])[.\)\u3001\uff0e\uff09]\s*(.+)/);if(!m)m=s.match(/^\*\*([A-D])[.\)\u3001\uff0e\uff09]?\*\*\s*(.+)/);if(!m)m=s.match(/^[-\*]\s*\*\*([A-D])\*\*[：:\s]+(.+)/);if(m)o.push({l:m[1],t:m[2].trim()})}
  if(o.length===0)return;
  var blocks=nr.querySelectorAll('.narrative-block');
  if(!blocks.length)return;
  var last=blocks[blocks.length-1];
  var old=last.querySelector('.options-grid');if(old)old.remove();
  var h='<div class="options-grid">';
  for(var i=0;i<o.length;i++)h+='<button class="option-btn" data-o="'+o[i].l+'"><span class="letter">'+o[i].l+'.</span> '+es(o[i].t)+'</button>';
  h+='</div>';last.insertAdjacentHTML('beforeend',h);
  last.addEventListener('click',function(e){var b=e.target.closest('.option-btn');if(!b)return;var l=b.getAttribute('data-o'),t='';for(var i=0;i<o.length;i++){if(o[i].l===l){t=o[i].t;break}}$('ci').value=l+': '+t;sd()});
}function co(){var g=nr.querySelectorAll('.options-grid');for(var i=0;i<g.length;i++)g[i].remove()}function ab(h,role){var d=document.createElement('div');d.className='narrative-block';if(role==='user')d.style.background='#1a1d24';d.innerHTML=md(h);nr.appendChild(d)}

function rf(){if(!gd||!engine)return;var d=engine.getState();if(d){ub_(d);_renderAttrPanel(d)}}
function ub_(d){if(!d)return;$('sn').textContent=(d.player_name||'-')+' - '+(d.stage||'-');$('sa').textContent=d.season_avg||'-';$('sf').textContent=d.fatigue||0;$('sr').textContent=d.reputation||0;$('sp').textContent=d.physical||0}

function rp(){if(!gd||!engine)return;var d=engine.getState();rp_(engine.getLorebook(),(d||{}).talents)}
function rp_(d,tal){
  var entries=Object.entries(d||{}).filter(function(e){return !e[1].deprecated});
  if(tal&&tal.length){entries=entries.filter(function(e){var t=e[0];return !tal.some(function(tl){return t.includes(tl)||tl.includes(t.split('/')[0])})})}
  if(!entries.length){pl.innerHTML='<div class="empty-people">no people yet</div>';return}
  pl.innerHTML='';for(var i=0;i<entries.length;i++){
    var k=entries[i][0],v=entries[i][1];
    pl.innerHTML+='<div class="person-card"><div class="name">'+es(k.split('/')[0])+'<button class="lb-del" onclick="event.stopPropagation();_deleteLb(\''+k.replace(/'/g,"\\'")+'\')" title="删除">✕</button></div><div class="summary" onclick="_editLb(\''+k.replace(/'/g,"\\'")+'\')" title="点击修改">'+es(v.content||'')+'</div></div>';
  }
}
function up_(d){if(!d||!d.lorebook)return;rp_(d.lorebook)}

var _prevAttr={};
function _renderAttrPanel(d){
  if(!d)return;
  var rows=[['士气','morale',d.morale],['声望','reputation',d.reputation],['身体','physical',d.physical],['魅力','charm',d.charm],['更衣室','team_chemistry',d.team_chemistry],['关键球','clutch',d.clutch],['疲劳','fatigue',d.fatigue,1]];
  var h='',summary='';
  for(var i=0;i<rows.length;i++){var r=rows[i],v=r[2],w=r[3]?(100-v):v,c=r[3]?'#ef4444':'#f97316',ch=_prevAttr[r[1]]!==v&&_prevAttr[r[1]]!==undefined;
    h+='<div class="attr-row'+(ch?' pulse':'')+'"><div class="alabel"><span>'+r[0]+'</span><span data-key="'+r[1]+'" onclick="_editAttr(\''+r[1]+'\',this)" style="cursor:pointer" title="点击修改">'+v+'</span></div><div class="abar"><div class="afill" style="width:'+w+'%;background:'+c+'"></div></div></div>';
    _prevAttr[r[1]]=v;summary+=(summary?', ':'')+r[0]+' '+v;
  }
  $('al').innerHTML=h;
  var extras='';if(d.talents&&d.talents.length)extras+='<div class="ae-section"><div class="ae-title">天赋</div><div class="ae-tags">'+d.talents.map(function(t){return'<span class="ae-tag">'+t+'</span>'}).join('')+'</div></div>';
  if(d.honors&&d.honors.length)extras+='<div class="ae-item">🏆 '+d.honors.join(', ')+'</div>';
  if(d.milestones&&d.milestones.length)extras+='<div class="ae-item">⭐ '+d.milestones.join(', ')+'</div>';
  $('ae').innerHTML=extras;
  $('as').textContent=summary;$('as').style.display=$('ap').classList.contains('hidden')?'block':'none';
}

function es(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function sc(){var d=nr.scrollHeight-nr.scrollTop-nr.clientHeight;if(d<120)nr.scrollTop=nr.scrollHeight}
function md(t){
  if(!t)return'';var h=es(t);
  h=h.replace(/───.*?STATE.*?───/g,'');h=h.replace(/##STATE##[\s\S]*?##ENDSTATE##/g,'');h=h.replace(/```[\s\S]*?```/g,'');
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/\*(.+?)\*/g,'<em>$1</em>');
  h=h.replace(/^([A-D])[.\)\u3001\uff0e\uff09]\s*(.+)$/gm,'<strong style="color:var(--accent)">$1.</strong> $2');
  h=h.replace(/\n/g,'<br>');return'<p>'+h+'</p>';
}

function showSaves(){
  try{
    var e=_makeEngine();var saves=e.listSaves();
    if(saves.length>0){
      var sd=document.querySelector('.start-dialog');
      if(!sd)return;
      var h='<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)" id="save-slots"><div style="font-size:12px;color:var(--text2);margin-bottom:8px">已有存档：</div>';
      for(var i=0;i<saves.length;i++){
        var slot=saves[i];
        h+='<div style="display:flex;gap:4px;margin-bottom:4px"><button onclick="event.stopPropagation();window._loadSlot(\''+slot+'\')" style="flex:1;background:#1a1d24;border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:6px;cursor:pointer;font-size:14px;text-align:left">'+slot+'</button>';
        if(slot!=='auto')h+='<button onclick="event.stopPropagation();window._deleteSlot(\''+slot+'\')" style="background:#ef444422;border:1px solid #ef444444;color:var(--red);padding:10px 12px;border-radius:6px;cursor:pointer;font-size:14px" title="删除">✕</button>';
        h+='</div>';
      }
      h+='</div>';
      sd.querySelector('.btn-primary').insertAdjacentHTML('beforebegin',h);
      toast(saves.length+' 个存档已就绪','var(--blue)')
    }else{toast('暂无存档','var(--text2)')}
  }catch(e){console.error('showSaves:',e)}
}

window._loadSlot=async function(slot){
  var b=$('sbn');b.disabled=true;b.textContent='加载中...';
  try{
    engine=_makeEngine();
    var s=engine.load(slot);
    if(!s){alert('加载失败：存档不存在');b.disabled=false;b.textContent='开始游戏';return}
    gd=true;
    ov.style.display='none';document.body.classList.remove('has-overlay');
    ar.style.display='flex';ia.style.display='flex';var sb=document.getElementById('sidebar');if(sb)sb.classList.remove('open');
    var d=engine.getState();ub_(d);_renderAttrPanel(d);rp();
    if(d.display_messages){for(var i=0;i<d.display_messages.length;i++)ab(d.display_messages[i].content,d.display_messages[i].role)}
    else if(d.recent_messages){for(var i=0;i<d.recent_messages.length;i++)ab(d.recent_messages[i])}
    if(d.recent_messages&&d.recent_messages.length)po(d.recent_messages[d.recent_messages.length-1]);
    nr.scrollTop=nr.scrollHeight;
    b.disabled=false;b.textContent='开始游戏（已连接）';
  }catch(e){alert('加载失败: '+e.message);b.disabled=false;b.textContent='开始游戏'}
};

window._deleteSlot=async function(slot){
  if(!confirm('确定删除存档「'+slot+'」？不可恢复！'))return;
  try{engine=_makeEngine();if(engine.deleteSave(slot)){location.reload()}else{alert('删除失败')}}catch(e){alert('删除失败: '+e.message)}
};
$('atb').onclick=function(){var p=$('ap');p.classList.toggle('hidden');localStorage.setItem('bbl_attrpanel',p.classList.contains('hidden')?'0':'1');$('as').style.display=p.classList.contains('hidden')?'block':'none'};
(function(){if(localStorage.getItem('bbl_attrpanel')==='1'){var p=$('ap');if(p)p.classList.remove('hidden')}})();
window._editAttr=function(key,el){
  var v=parseInt(prompt('修改 (0-100):',el.textContent));if(isNaN(v)||!engine||!engine.state)return;v=Math.max(0,Math.min(100,v));
  var map={morale:'mo',reputation:'rp',physical:'ph',fatigue:'ft',charm:'ch',team_chemistry:'tc',clutch:'cl'};
  engine.state[map[key]]=v;rf();toast(key+' = '+v,'var(--accent)')
};
window._editLb=function(trigger){
  if(!engine||!engine.state||!engine.state.lb[trigger])return;
  var ct=prompt('修改描述:',engine.state.lb[trigger].ct||'');if(ct===null)return;
  engine.state.lb[trigger].ct=ct;rp();toast('已更新','var(--green)')
};
window._deleteLb=function(trigger){
  if(!engine||!engine.state||!engine.state.lb[trigger])return;
  if(!confirm('删除「'+trigger.split('/')[0]+'」？'))return;
  engine.state.lb[trigger].dp=true;rp();toast('已删除','var(--red)')
};
})();
