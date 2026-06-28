(function(){
var SID='default',gd=false,gn=false,ac=null,pc='medium';
var $=function(id){return document.getElementById(id)};
var nr=$('nr'),oa=$('oa'),ia=$('ia'),ar=$('ar'),ov=$('ov'),pl=$('pl');
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
function toast(msg,color){var t=document.createElement('div');t.className='toast';t.textContent=msg;if(color)t.style.background=color;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
async function ap(u,o){var r=await fetch(u,Object.assign({headers:{'Content-Type':'application/json'}},o||{}));return r.json()}
$('sbn').onclick=async function(){
  var b=$('sbn');b.disabled=true;b.textContent='开局中...';
  try{var c={name:$('cn').value.trim(),position:sl,height:parseInt($('ch').value)||198,background:$('cb').value.trim(),player_type:tp,enable_r18:true};var r=await ap('/api/game/start',{method:'POST',body:JSON.stringify({session_id:SID,player_config:c})});if(!r.ok){alert('失败: '+r.error);b.disabled=false;b.textContent='开始游戏';return}
    SID=r.session_id;ov.style.display='none';document.body.classList.remove('has-overlay');gd=true;ar.style.display='flex';ia.style.display='flex';ab(r.narrative);var s=document.getElementById("sidebar");if(s)s.classList.remove("open");po(r.narrative);await rf();await rp()}catch(e){alert(e.message);b.disabled=false;b.textContent='开始游戏'}};
$('sb').onclick=sd;$('ci').onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sd()}};
async function _streamAction(url,bodyExtra){
  $('stb').classList.add('visible');var bb=document.createElement('div');bb.className='narrative-block';bb.id='cb';bb.innerHTML='<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>';nr.appendChild(bb);sc();
  ac=new AbortController();var ft='';
  try{var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({session_id:SID},bodyExtra||{})),signal:ac.signal});var rd=r.body.getReader();var dc=new TextDecoder();var bf='';
    while(true){var vd=await rd.read();if(vd.done)break;bf+=dc.decode(vd.value,{stream:true});var ls=bf.split('\n');bf=ls.pop()||'';
      for(var li=0;li<ls.length;li++){var l=ls[li];if(!l.startsWith('data: '))continue;var d=l.slice(6).trim();if(d==='[DONE]')break;
        try{var p=JSON.parse(d);if(p.t==='c'){ft+=p.d;bb.innerHTML=md(ft);sc()}else if(p.t==='s'){ub_(p.d);up_(p.d)}}catch(e){}}}}
  catch(err){bb.innerHTML=md(ft)+(err.name==='AbortError'?'<br><em>[stopped]</em>':'<span style="color:var(--red)">err: '+es(err.message)+'</span>')}
  finally{gn=false;ac=null;$('sb').disabled=false;$('stb').classList.remove('visible');bb.removeAttribute('id');po(ft);await rf();await rp()}}
async function sd(){
  if(gn)return;var i=$('ci').value.trim();if(!i)return;if(pc!=='medium')i='##'+pc+'## '+i;gn=true;$('sb').disabled=true;$('ci').value='';co();
  var ub=document.createElement('div');ub.className='narrative-block';ub.style.background='#1a1d24';ub.innerHTML='<strong>你：</strong> '+es(i);nr.appendChild(ub);sc();
  await _streamAction('/api/game/action',{input:i})}
async function sa(u,bd){gn=true;$('sb').disabled=true;co();await _streamAction(u,bd||{})}
$('rrb').onclick=function(){if(gn||!gd)return;if(!confirm('确定要重新生成吗？'))return;var blocks=nr.querySelectorAll('.narrative-block');for(var i=blocks.length-1;i>=0;i--){var b=blocks[i];var g=b.querySelector('.options-grid');if(g)g.remove();if(b.style.background==='rgb(26, 29, 36)'){b.remove()}else if(!g&&b.id!=='cb'){b.remove();break}}sa('/api/game/regenerate',{})}
$('mdb').onclick=function(){if(gn||!gd)return;var i=prompt('new action:');if(!i)return;var blocks=nr.querySelectorAll('.narrative-block');for(var j=blocks.length-1;j>=0;j--){var b=blocks[j];var g=b.querySelector('.options-grid');if(g)g.remove();if(b.style.background==='rgb(26, 29, 36)'){b.remove()}else if(!g&&b.id!=='cb'){b.remove();break}}sa('/api/game/modify',{input:i})}
$('svb').onclick=function(){var s=prompt('存档名称（留空=自动）')||'auto';ap('/api/game/save',{method:'POST',body:JSON.stringify({session_id:SID,slot:s})});toast('已保存: '+s,'var(--blue)')}
$('newb').onclick=function(){if(confirm('开始新游戏?')){fetch('/api/game/end',{method:'POST'}).then(function(){location.reload()})}}
$('stb').onclick=function(){if(ac)ac.abort();fetch('/api/game/stop',{method:'POST',body:JSON.stringify({session_id:SID})})};
function po(t){
  var ls=t.split('\n'),o=[];
  for(var i=0;i<ls.length;i++){var s=ls[i].trim();if(!s)continue;var m=s.match(/^([A-D])[.\)\u3001\uff0e\uff09]\s*(.+)/);if(!m)m=s.match(/^\*\*([A-D])\*\*\s*(.+)/);if(m)o.push({l:m[1],t:m[2].trim()})}
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
async function rf(){if(!gd)return;var r=await ap('/api/game/state?session_id='+SID);if(r.ok&&r.data)ub_(r.data)}
function ub_(d){if(!d)return;$('sn').textContent=(d.player_name||'-')+' - '+(d.stage||'-');$('sa').textContent=d.season_avg||'-';$('sf').textContent=d.fatigue||0;$('sr').textContent=d.reputation||0;$('sp').textContent=d.physical||0}
async function rp(){if(!gd)return;var r=await ap('/api/game/lorebook?session_id='+SID);if(r.ok&&r.data)rp_(r.data)}
function rp_(d){var e=Object.entries(d);if(!e.length){pl.innerHTML='<div class="empty-people">no people yet</div>';return}pl.innerHTML='';for(var i=0;i<e.length;i++){pl.innerHTML+='<div class="person-card"><div class="name">'+es(e[i][0].split('/')[0])+'</div><div class="summary">'+es(e[i][1].content||'')+'</div></div>'}}
function up_(d){if(!d||!d.lorebook)return;rp_(d.lorebook)}
function es(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function sc(){var d=nr.scrollHeight-nr.scrollTop-nr.clientHeight;if(d<120)nr.scrollTop=nr.scrollHeight}
function md(t){
  if(!t)return'';var h=es(t);
  h=h.replace(/───.*?STATE.*?───[\s\S]*?───.*?STATE.*?───/g,'');h=h.replace(/##STATE##[\s\S]*?(##ENDSTATE##|$)/g,'');h=h.replace(/```[\s\S]*?```/g,'');
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/\*(.+?)\*/g,'<em>$1</em>');
  h=h.replace(/^([A-D])[.\)\u3001\uff0e\uff09]\s*(.+)$/gm,'<strong style="color:var(--accent)">$1.</strong> $2');
  h=h.replace(/\n/g,'<br>');return'<p>'+h+'</p>';
}
function showSaves(){
  fetch('/api/game/list_saves',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:'default'})}).then(function(r){return r.json()}).then(function(rr){
    if(rr.ok&&rr.data&&rr.data.length>0){
      var sd=document.querySelector('.start-dialog');
      if(!sd)return;
      var h='<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)" id="save-slots"><div style="font-size:12px;color:var(--text2);margin-bottom:8px">已有存档：</div>';
      for(var i=0;i<rr.data.length;i++){
        var slot=rr.data[i];
        h+='<div style="display:flex;gap:4px;margin-bottom:4px"><button onclick="event.stopPropagation();window._loadSlot(\''+slot+'\')" style="flex:1;background:#1a1d24;border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;text-align:left">'+slot+'</button>';
        if(slot!=='auto')h+='<button onclick="event.stopPropagation();window._deleteSlot(\''+slot+'\')" style="background:#ef444422;border:1px solid #ef444444;color:var(--red);padding:6px 8px;border-radius:4px;cursor:pointer;font-size:11px" title="删除">✕</button>';
        h+='</div>';
      }
      h+='</div>';
      sd.querySelector('.btn-primary').insertAdjacentHTML('beforebegin',h);
    }
  }).catch(function(e){console.error('showSaves:',e)});
}
showSaves();
window._loadSlot=async function(slot){
  var b=$('sbn');b.disabled=true;b.textContent='加载中...';
  var r=await ap('/api/game/load',{method:'POST',body:JSON.stringify({session_id:SID,slot:slot})});
  if(r.ok&&r.data){
    SID='default';gd=true;
    ov.style.display='none';document.body.classList.remove('has-overlay');
    ar.style.display='flex';ia.style.display='flex';var s=document.getElementById('sidebar');if(s)s.classList.remove('open');
    ub_(r.data);await rp();
    if(r.data.display_messages){for(var i=0;i<r.data.display_messages.length;i++)ab(r.data.display_messages[i].content,r.data.display_messages[i].role)}
    else if(r.data.recent_messages){for(var i=0;i<r.data.recent_messages.length;i++)ab(r.data.recent_messages[i])}
    var ms=r.data.recent_messages;if(ms&&ms.length>0)po(ms[ms.length-1])
  }else{alert('加载失败');b.disabled=false;b.textContent='开始游戏'}
};
window._deleteSlot=async function(slot){
  if(!confirm('确定删除存档「'+slot+'」？不可恢复！'))return;
  try{
    var r=await ap('/api/game/delete_save',{method:'POST',body:JSON.stringify({session_id:SID,slot:slot})});
    if(r.ok){location.reload()}else{alert('删除失败: '+(r.error||'unknown'))}
  }catch(e){alert('删除失败: 网络错误 - '+e.message)}
};
})();