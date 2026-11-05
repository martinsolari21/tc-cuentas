var CATS={i:["Auspicio","Premio","Aporte","Otro ingreso"],g:["Combustible","Neumáticos","Motor","Repuestos","Personal","Traslado","Inscripción","Otro gasto"]};
var S={teams:[],moves:[],races:[],sel:null,type:"g",view:"res",race:""};
try{var r0=localStorage.getItem("tc-cuentas");if(r0){var o=JSON.parse(r0);if(o&&o.teams)S=Object.assign(S,o)}}catch(e){}
function save(){try{localStorage.setItem("tc-cuentas",JSON.stringify(S))}catch(e){}}
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function m(n){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n)}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function cur(){return S.teams.filter(function(t){return t.id===S.sel})[0]}
function races(){return S.races.filter(function(r){return r.team===S.sel}).sort(function(a,b){return(a.date||"9")>(b.date||"9")?1:-1})}
function race(i){return S.races.filter(function(r){return r.id===i})[0]}
function rname(i){var r=race(i||"");return r?r.name:"Sin carrera"}
function spent(rid){return S.moves.filter(function(x){return x.team===S.sel&&x.type==="g"&&(x.race||"")===rid}).reduce(function(a,x){return a+x.amt},0)}
function save2(){save();draw()}
function addTeam(){var n=$("tn").value.trim();if(!n)return;var t={id:id(),name:n,pilot:$("tp").value.trim()};S.teams.push(t);S.sel=t.id;S.race="";$("tn").value="";$("tp").value="";save2()}
function pick(i){S.sel=i;S.race="";save2()}
function delTeam(){var t=cur();if(!t||!confirm("¿Eliminar "+t.name+" y todos sus datos?"))return;S.moves=S.moves.filter(function(x){return x.team!==t.id});S.races=S.races.filter(function(x){return x.team!==t.id});S.teams=S.teams.filter(function(x){return x.id!==t.id});S.sel=S.teams.length?S.teams[0].id:null;save2()}
function setType(t){S.type=t;draw()}
function setView(v){S.view=v;draw()}
function addRace(){var n=$("rn").value.trim();if(!n)return;var b=parseFloat($("rb").value);S.races.push({id:id(),team:S.sel,name:n,date:$("rd").value,budget:b>0?b:0});save2()}
function setBud(i,v){var r=race(i),b=parseFloat(v);r.budget=b>0?b:0;save2()}
function delRace(i){if(!confirm("¿Eliminar la carrera? Sus movimientos quedan como Sin carrera."))return;S.races=S.races.filter(function(x){return x.id!==i});S.moves.forEach(function(x){if(x.race===i)x.race=""});if(S.race===i)S.race="";save2()}
function useRace(i){S.race=i;S.type="g";S.view="res";draw();window.scrollTo(0,0)}
function hint(){var rid=$("r").value;S.race=rid;var r=race(rid),h=$("hint");
 if(!r||!r.budget||S.type!=="g"){h.innerHTML="";return}
 var rem=r.budget-spent(rid);
 h.innerHTML=rem>=0?'Presupuesto restante de <b>'+esc(r.name)+'</b>: <b>'+m(rem)+'</b> <button onclick="fill('+rem+')">Completar con el restante</button>':'<span class="ko">Presupuesto excedido en '+m(-rem)+'</span>'}
function fill(v){$("a").value=Math.max(v,0)}
function addMove(){var a=parseFloat($("a").value);if(!(a>0))return;S.race=$("r").value;
 S.moves.push({id:id(),team:S.sel,type:S.type,cat:$("c").value,amt:a,race:S.race,date:$("d").value||new Date().toISOString().slice(0,10),note:$("nt").value.trim()});save2()}
function delMove(i){S.moves=S.moves.filter(function(x){return x.id!==i});save2()}
function view1(t,mv,by,cats,max){
 return(cats.length?'<div class="card"><h2>Gastos por categoría</h2>'+cats.map(function(c){return'<div class="br"><span>'+c+'</span><span class="t"><i style="width:'+(by[c]/max*100)+'%"></i></span><span>'+m(by[c])+'</span></div>'}).join("")+'</div>':"")
 +'<div class="card"><h2>Movimientos</h2>'+(mv.length?'<div class="sc"><table><tr><th>Fecha</th><th>Carrera</th><th>Categoría</th><th>Nota</th><th style="text-align:right">Monto</th><th></th></tr>'+mv.map(function(x){return'<tr><td>'+x.date.split("-").reverse().join("/")+'</td><td>'+esc(rname(x.race))+'</td><td>'+x.cat+'</td><td class="mu">'+esc(x.note)+cmp(x)+'</td><td class="n '+(x.type==="i"?"ok":"ko")+'">'+(x.type==="i"?"+":"−")+m(x.amt)+'</td><td><button class="g" onclick="delMove(\''+x.id+'\')" aria-label="Borrar">✕</button><button class="g" onclick="editMove(\''+x.id+'\')" aria-label="Editar">✎</button></td></tr>'}).join("")+'</table></div>':'<span class="mu">Todavía no hay movimientos.</span>')+'</div>'}
function view2(t){
 var rs=races(),G=rs.slice(),orph=S.moves.some(function(x){return x.team===t.id&&x.type==="g"&&!x.race});
 if(orph)G.push({id:"",name:"Sin carrera",budget:0});
 var mx=Math.max.apply(null,G.map(function(g){return Math.max(spent(g.id),g.budget||0)}).concat([1]));
 var h='<div class="card"><h2>Nueva carrera</h2><div class="row"><input id="rn" placeholder="Carrera (ej: Fecha 3 · Rafaela)"><input id="rd" type="date"><input id="rb" type="number" min="0" inputmode="decimal" placeholder="Presupuesto ARS (opcional)"><button class="p" onclick="addRace()">Agregar</button></div></div>';
 h+=rs.map(function(r){var s=spent(r.id),b=r.budget,p=b>0?s/b*100:0;
  return'<div class="card"><div class="row" style="justify-content:space-between"><b>'+esc(r.name)+'</b><span class="mu">'+(r.date?r.date.split("-").reverse().join("/"):"")+'</span></div>'
  +rinfo(r,s)+'<div class="row" style="margin-top:6px"><span>Gastado <b class="ko">'+m(s)+'</b></span><label class="mu">Presupuesto <input type="number" min="0" value="'+(b||"")+'" placeholder="Sin presupuesto" onchange="setBud(\''+r.id+'\',this.value)" style="max-width:150px"></label><button onclick="useRace(\''+r.id+'\')">Cargar gasto</button><button class="g" onclick="delRace(\''+r.id+'\')">Eliminar</button><button class="g" onclick="editRace(\''+r.id+'\')">Editar</button></div>'
  +(b>0?'<div class="pb"><i class="'+(p>100?"x":"")+'" style="width:'+Math.min(p,100)+'%"></i></div><small class="'+(p>100?"ko":"mu")+'">'+(p>100?'Excedido en '+m(s-b):p.toFixed(0)+'% usado · restan '+m(b-s))+'</small>':'<div class="mu" style="margin-top:6px"><small>Sin presupuesto definido</small></div>')+'</div>'}).join("");
 if(G.length>1){
  h+='<div class="card"><h2>Gasto por carrera <span class="mu" style="font-weight:400">(la marca negra es el presupuesto)</span></h2>'+G.map(function(g){var s=spent(g.id);return'<div class="br"><span>'+esc(g.name)+'</span><span class="t"><i style="width:'+(s/mx*100)+'%"></i>'+(g.budget?'<b class="tk" style="left:'+(g.budget/mx*100)+'%"></b>':"")+'</span><span>'+m(s)+'</span></div>'}).join("")+'</div>';
  var cs=CATS.g.filter(function(c){return S.moves.some(function(x){return x.team===t.id&&x.type==="g"&&x.cat===c})});
  h+='<div class="card"><h2>Comparación por categoría</h2><div class="sc"><table><tr><th>Categoría</th>'+G.map(function(g){return'<th class="n">'+esc(g.name)+'</th>'}).join("")+'</tr>'
  +cs.map(function(c){return'<tr><td>'+c+'</td>'+G.map(function(g){var v=S.moves.filter(function(x){return x.team===t.id&&x.type==="g"&&x.cat===c&&(x.race||"")===g.id}).reduce(function(a,x){return a+x.amt},0);return'<td class="n">'+(v?m(v):"–")+'</td>'}).join("")+'</tr>'}).join("")
  +'<tr><th>Total</th>'+G.map(function(g){return'<th class="n">'+m(spent(g.id))+'</th>'}).join("")+'</tr>'
  +'<tr><td class="mu">Presupuesto</td>'+G.map(function(g){return'<td class="n mu">'+(g.budget?m(g.budget):"–")+'</td>'}).join("")+'</tr>'
  +'<tr><td class="mu">Diferencia</td>'+G.map(function(g){if(!g.budget)return'<td class="n mu">–</td>';var d=g.budget-spent(g.id);return'<td class="n '+(d>=0?"ok":"ko")+'">'+(d>=0?"+":"−")+m(Math.abs(d))+'</td>'}).join("")+'</tr></table></div></div>'}
 else h+='<div class="mu">Cargá al menos dos carreras con gastos para ver la comparación.</div>';
 return h}
function draw(){
 $("tb").innerHTML=S.teams.map(function(t){return'<button class="'+(t.id===S.sel?"p":"")+'" onclick="pick(\''+t.id+'\')">'+esc(t.name)+'</button>'}).join("")||'<span class="mu">Creá tu primer equipo para empezar.</span>';
 var t=cur(),M=$("main");
 if(!t){M.innerHTML="";return}
 var mv=S.moves.filter(function(x){return x.team===t.id}).sort(function(a,b){return a.date<b.date?1:-1});
 var inc=0,exp=0,by={};mv.forEach(function(x){if(x.type==="i")inc+=x.amt;else{exp+=x.amt;by[x.cat]=(by[x.cat]||0)+x.amt}});
 var bal=inc-exp,max=Math.max.apply(null,Object.keys(by).map(function(k){return by[k]}).concat([1]));
 var cats=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
 M.innerHTML='<div class="row" style="justify-content:space-between;margin-bottom:8px"><div><b>'+esc(t.name)+'</b>'+(t.pilot?' <span class="mu">· '+esc(t.pilot)+'</span>':'')+'</div><button class="g" onclick="delTeam()">Eliminar equipo</button></div>'
 +'<div class="k"><div><small>Ingresos</small><b class="ok">'+m(inc)+'</b></div><div><small>Gastos</small><b class="ko">'+m(exp)+'</b></div><div><small>Balance</small><b class="'+(bal>=0?"ok":"ko")+'">'+m(bal)+'</b></div></div>'
 +'<div class="card" style="margin-top:12px"><h2>Nuevo movimiento</h2><div class="row seg" style="margin-bottom:8px"><button class="'+(S.type==="g"?"on":"")+'" onclick="setType(\'g\')">Gasto</button><button class="'+(S.type==="i"?"on":"")+'" onclick="setType(\'i\')">Ingreso</button></div>'
 +'<div class="row"><select id="r" onchange="hint()"><option value="">Sin carrera</option>'+races().map(function(r){return'<option value="'+r.id+'"'+(r.id===S.race?" selected":"")+'>'+esc(r.name)+'</option>'}).join("")+'</select><select id="c">'+CATS[S.type].map(function(c){return"<option>"+c+"</option>"}).join("")+'</select><input id="a" type="number" min="0" inputmode="decimal" placeholder="Monto ARS"><input id="d" type="date" value="'+new Date().toISOString().slice(0,10)+'"><input id="nt" placeholder="Nota (opcional)"><button class="p" onclick="addMove()">Guardar</button></div><div id="hint" style="margin-top:8px;font-size:13px"></div></div>'
 +'<div class="tabs"><button class="'+(S.view==="res"?"on":"")+'" onclick="setView(\'res\')">Resumen</button><button class="'+(S.view==="car"?"on":"")+'" onclick="setView(\'car\')">Carreras</button></div>'
 +(S.view==="car"?view2(t):view1(t,mv,by,cats,max));
 hint()}
S.pend=S.pend||[];S.cons=S.cons||[];S.edit=null;
if(CATS.g.indexOf("Multa")<0)CATS.g.push("Multa");
function T(){return new Date().toISOString().slice(0,10)}
function addD(d,n){var x=new Date(d+"T12:00:00");x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
function addM(d,k){var x=new Date(d+"T12:00:00");x.setMonth(x.getMonth()+k);return x.toISOString().slice(0,10)}
function fd(d){return d?d.split("-").reverse().join("/"):""}
function dleft(d){return Math.round((new Date(d+"T12:00:00")-new Date(T()+"T12:00:00"))/864e5)}
function badge(d){if(!d)return"";var n=dleft(d);return n<0?'<b class="ko">vencido hace '+(-n)+' d</b>':n<=7?'<b class="ko">vence en '+n+' d</b>':'<span class="mu">vence '+fd(d)+'</span>'}
function mine(a){return a.filter(function(x){return x.team===S.sel})}
function setView(v){S.edit=null;S.view=v;draw()}
function cancel(){S.edit=null;draw()}
function editMove(i){var x=S.moves.filter(function(y){return y.id===i})[0];S.edit={k:"m",id:i};S.type=x.type;S.race=x.race||"";S.view="res";draw();window.scrollTo(0,0)}
function editRace(i){S.edit={k:"r",id:i};S.view="car";draw()}
function editPend(i){S.edit={k:"p",id:i};S.view="pen";draw();window.scrollTo(0,0)}
function addMove(){var a=parseFloat($("a").value);if(!(a>0))return;var o={type:S.type,cat:$("c").value,amt:a,race:$("r").value,date:$("d").value||T(),note:$("nt").value.trim()};S.race=o.race;
 if(S.edit&&S.edit.k==="m"){Object.assign(S.moves.filter(function(y){return y.id===S.edit.id})[0],o);S.edit=null}else S.moves.push(Object.assign({id:id(),team:S.sel},o));save2()}
function addRace(){var n=$("rn").value.trim();if(!n)return;var b=parseFloat($("rb").value),o={name:n,date:$("rd").value,budget:b>0?b:0};
 if(S.edit&&S.edit.k==="r"){Object.assign(race(S.edit.id),o);S.edit=null}else S.races.push(Object.assign({id:id(),team:S.sel},o));save2()}
function pkch(keep){var k=$("pk").value;$("pcat").innerHTML=(k==="c"?CATS.i:CATS.g).map(function(c){return"<option>"+c+"</option>"}).join("");$("fg").style.display=k==="f"?"flex":"none";$("pcat").style.display=k==="f"?"none":"";if(keep)$("pcat").value=keep}
function addPend(){var a=parseFloat($("pa").value),k=$("pk").value;if(!(a>0))return;
 var o={kind:k,amt:a,cat:k==="f"?"Multa":$("pcat").value,party:$("pp").value.trim(),due:$("pd").value,race:$("pr").value,note:$("pn").value.trim(),fine:k==="f"?{who:$("fw").value,art:$("fa").value.trim(),notif:$("fn").value,st:$("fs").value}:null};
 if(S.edit&&S.edit.k==="p"){Object.assign(S.pend.filter(function(y){return y.id===S.edit.id})[0],o);S.edit=null}else S.pend.push(Object.assign({id:id(),team:S.sel},o));save2()}
function markPaid(i){var p=S.pend.filter(function(y){return y.id===i})[0],f=p.fine;
 S.moves.push({id:id(),team:p.team,type:p.kind==="c"?"i":"g",cat:p.cat,amt:p.amt,race:p.race||"",date:T(),note:[f&&("Multa a "+f.who+(f.art?" (art. "+f.art+")":"")),p.party,p.note].filter(Boolean).join(" · ")});
 S.pend=S.pend.filter(function(y){return y.id!==i});save2()}
function delPend(i){if(!confirm("¿Eliminar este pendiente?"))return;S.pend=S.pend.filter(function(y){return y.id!==i});save2()}
function addCon(){var s=$("cs").value.trim(),tot=parseFloat($("ct").value);if(!s||!(tot>0))return;var n=parseInt($("cq").value)||1,d0=$("c1").value||$("cf").value||T(),b=Math.floor(tot/n),I=[];
 for(var i=0;i<n;i++)I.push({id:id(),date:addM(d0,i),amt:i<n-1?b:tot-b*(n-1),paid:false});
 S.cons.push({id:id(),team:S.sel,sponsor:s,num:$("cn").value.trim(),total:tot,from:$("cf").value,to:$("cu").value,deliv:$("cd").value.trim(),inst:I});save2()}
function cfind(c){return S.cons.filter(function(x){return x.id===c})[0]}
function setInst(c,i,f,v){var k=cfind(c).inst.filter(function(x){return x.id===i})[0];k[f]=f==="amt"?(parseFloat(v)||0):v;save2()}
function payInst(c,i){var C=cfind(c),k=C.inst.filter(function(x){return x.id===i})[0];
 if(!k.paid){k.paid=true;S.moves.push({id:id(),team:C.team,type:"i",cat:"Auspicio",amt:k.amt,race:"",date:T(),note:"Cuota "+(C.inst.indexOf(k)+1)+" · "+C.sponsor,ci:k.id})}
 else{k.paid=false;S.moves=S.moves.filter(function(x){return x.ci!==k.id})}save2()}
function delCon(c){if(!confirm("¿Eliminar el contrato? Los cobros ya registrados se mantienen como ingresos."))return;S.cons=S.cons.filter(function(x){return x.id!==c});save2()}
function alerts(t){var v=0,p=0;function c(d){var n=dleft(d);if(n<0)v++;else if(n<=7)p++}
 mine(S.pend).forEach(function(x){if(x.due)c(x.due)});mine(S.cons).forEach(function(k){k.inst.forEach(function(i){if(!i.paid)c(i.date)})});
 return v||p?'<div class="card" style="border-color:var(--ko)"><b class="ko">⚠ '+(v?v+" vencido"+(v>1?"s":""):"")+(v&&p?" · ":"")+(p?p+" por vencer en 7 días":"")+'</b> <span class="mu">— revisá Pendientes y Contratos</span></div>':""}
function viewP(t){var L=mine(S.pend).sort(function(a,b){return(a.due||"9")>(b.due||"9")?1:-1}),lab={p:"Pago",c:"Cobro",f:"Multa"},pg=0,cb=0;
 L.forEach(function(x){if(x.kind==="c")cb+=x.amt;else pg+=x.amt});
 var h='<div class="card"><h2>'+(S.edit&&S.edit.k==="p"?"Editar pendiente":"Nuevo pago, cobro o multa pendiente")+'</h2><div class="row"><select id="pk" onchange="pkch()"><option value="p">Pago a proveedor</option><option value="c">Cobro pendiente</option><option value="f">Multa</option></select><select id="pcat"></select><input id="pa" type="number" min="0" inputmode="decimal" placeholder="Monto ARS"><input id="pp" placeholder="Proveedor / cliente"><label class="mu">Vence <input id="pd" type="date"></label><select id="pr"><option value="">Sin carrera</option>'+races().map(function(r){return'<option value="'+r.id+'">'+esc(r.name)+'</option>'}).join("")+'</select><input id="pn" placeholder="Nota (opcional)"></div>'
 +'<div class="row" id="fg" style="margin-top:8px;display:none"><select id="fw"><option>Piloto</option><option>Titular de equipo</option><option>Motorista</option></select><input id="fa" placeholder="Artículo infringido (opcional)"><label class="mu">Notificada <input id="fn" type="date" onchange="$(\'pd\').value=addD(this.value,30)"></label><select id="fs"><option value="pend">Pendiente</option><option value="apel">Apelada</option></select></div>'
 +'<div class="row" style="margin-top:8px"><button class="p" onclick="addPend()">Agregar</button></div></div>'
 +'<div class="card"><h2>Pendientes</h2><div class="row mu" style="margin-bottom:8px"><span>Por pagar: <b class="ko">'+m(pg)+'</b></span><span>Por cobrar: <b class="ok">'+m(cb)+'</b></span></div>'
 +(L.length?'<div class="sc"><table><tr><th></th><th>Detalle</th><th>Vencimiento</th><th style="text-align:right">Monto</th><th></th></tr>'+L.map(function(x){var f=x.fine;return'<tr><td>'+lab[x.kind]+'</td><td>'+esc(x.party||x.cat)+(f?'<div class="mu"><small>'+f.who+(f.art?" · art. "+esc(f.art):"")+" · "+(f.st==="apel"?"Apelada":"Pendiente")+(f.notif?" · notif. "+fd(f.notif):"")+'</small></div>':"")+(x.note?'<div class="mu"><small>'+esc(x.note)+'</small></div>':"")+'</td><td>'+badge(x.due)+'</td><td class="n '+(x.kind==="c"?"ok":"ko")+'">'+m(x.amt)+'</td><td class="n"><button data-i="'+x.id+'" onclick="markPaid(this.dataset.i)">'+(x.kind==="c"?"Cobrado":"Pagado")+'</button><button class="g" data-i="'+x.id+'" onclick="editPend(this.dataset.i)">✎</button><button class="g" data-i="'+x.id+'" onclick="delPend(this.dataset.i)">✕</button></td></tr>'}).join("")+'</table></div>':'<span class="mu">No hay pendientes.</span>')
 +'<div class="mu" style="margin-top:8px"><small>Los pendientes no cuentan como gasto ni ingreso hasta que los marcás como pagados o cobrados.</small></div></div>';return h}
function viewC(t){var L=mine(S.cons),pen=0,ven=0;
 L.forEach(function(c){c.inst.forEach(function(i){if(!i.paid){pen+=i.amt;if(dleft(i.date)<0)ven+=i.amt}})});
 var h='<div class="card"><h2>Nuevo contrato de auspicio</h2><div class="row"><input id="cs" placeholder="Sponsor"><input id="cn" placeholder="N° de contrato"><input id="ct" type="number" min="0" inputmode="decimal" placeholder="Monto total ARS"><label class="mu">Desde <input id="cf" type="date"></label><label class="mu">Hasta <input id="cu" type="date"></label><input id="cq" type="number" min="1" placeholder="Cantidad de cuotas"><label class="mu">1ª cuota <input id="c1" type="date"></label><input id="cd" placeholder="Entregables comprometidos"><button class="p" onclick="addCon()">Agregar contrato</button></div><div class="mu" style="margin-top:6px"><small>Genera cuotas mensuales iguales; después podés cambiar fecha y monto de cada una.</small></div></div>'
 +(L.length?'<div class="k" style="margin-bottom:12px"><div><small>Por cobrar (auspicios)</small><b>'+m(pen)+'</b></div><div><small>Vencido</small><b class="'+(ven?"ko":"")+'">'+m(ven)+'</b></div><div><small>Contratos</small><b>'+L.length+'</b></div></div>':"");
 return h+L.map(function(c){var cob=0;c.inst.forEach(function(i){if(i.paid)cob+=i.amt});
  return'<div class="card"><div class="row" style="justify-content:space-between"><b>'+esc(c.sponsor)+(c.num?" · N° "+esc(c.num):"")+'</b><button class="g" data-i="'+c.id+'" onclick="delCon(this.dataset.i)">Eliminar</button></div><div class="mu"><small>'+(c.from||c.to?"Vigencia "+fd(c.from)+" – "+fd(c.to)+" · ":"")+"Total "+m(c.total)+" · Cobrado "+m(cob)+'</small></div>'+(c.deliv?'<div style="margin:6px 0"><small class="mu">Entregables:</small> '+esc(c.deliv)+'</div>':"")
  +'<div class="sc"><table><tr><th>#</th><th>Fecha</th><th>Monto</th><th></th></tr>'+c.inst.map(function(i,k){var a='data-c="'+c.id+'" data-i="'+i.id+'"',d=i.paid?" disabled":"";return'<tr><td>'+(k+1)+'</td><td><input type="date" value="'+i.date+'"'+d+" "+a+' onchange="setInst(this.dataset.c,this.dataset.i,\'date\',this.value)"></td><td><input type="number" value="'+i.amt+'"'+d+" "+a+' onchange="setInst(this.dataset.c,this.dataset.i,\'amt\',this.value)"></td><td class="n">'+(i.paid?'<span class="ok">Cobrada</span> <button class="g" '+a+' onclick="payInst(this.dataset.c,this.dataset.i)">Deshacer</button>':badge(i.date)+" <button "+a+' onclick="payInst(this.dataset.c,this.dataset.i)">Cobrada</button>')+'</td></tr>'}).join("")+'</table></div></div>'}).join("")}
function fillEdit(){var e=S.edit;if(!e)return;var b;
 if(e.k==="m"){var x=S.moves.filter(function(y){return y.id===e.id})[0];if(!x)return;$("c").value=x.cat;$("a").value=x.amt;$("d").value=x.date;$("nt").value=x.note||"";$("r").value=x.race||"";b=document.querySelector('button[onclick="addMove()"]')}
 else if(e.k==="r"&&S.view==="car"){var r=race(e.id);$("rn").value=r.name;$("rd").value=r.date||"";$("rb").value=r.budget||"";b=document.querySelector('button[onclick="addRace()"]')}
 else if(e.k==="p"&&S.view==="pen"){var p=S.pend.filter(function(y){return y.id===e.id})[0],f=p.fine;$("pk").value=p.kind;pkch(p.cat);$("pa").value=p.amt;$("pp").value=p.party||"";$("pd").value=p.due||"";$("pr").value=p.race||"";$("pn").value=p.note||"";
  if(f){$("fw").value=f.who;$("fa").value=f.art||"";$("fn").value=f.notif||"";$("fs").value=f.st}b=document.querySelector('button[onclick="addPend()"]')}
 if(b){b.textContent="Guardar cambios";b.insertAdjacentHTML("afterend",' <button onclick="cancel()">Cancelar</button>')}}
function post(){var t=cur();if(!t)return;var tb=document.querySelector(".tabs");if(!tb)return;var np=mine(S.pend).length;
 tb.insertAdjacentHTML("beforeend",'<button class="'+(S.view==="pen"?"on":"")+'" onclick="setView(\'pen\')">Pendientes'+(np?" ("+np+")":"")+'</button><button class="'+(S.view==="con"?"on":"")+'" onclick="setView(\'con\')">Contratos</button>');
 var al=alerts(t);if(al)$("main").insertAdjacentHTML("afterbegin",al);
 if(S.view==="pen"||S.view==="con"){while(tb.nextSibling)tb.parentNode.removeChild(tb.nextSibling);tb.insertAdjacentHTML("afterend",S.view==="pen"?viewP(t):viewC(t))}
 if(S.view==="pen")pkch();fillEdit()}
S.tires=S.tires||[];S.parts=S.parts||[];
["Alquiler de carpa","Canon de motorista","Canon de chasista","Alquiler de amortiguadores","Hospedaje","Viáticos","Combustible de traslado","Seguro","Gastos administrativos"].forEach(function(c){if(CATS.g.indexOf(c)<0)CATS.g.push(c)});
var FASES=["Etapa Regular","Copa de Oro","Carrera especial","Otra"],LOG=["Combustible de traslado","Hospedaje","Viáticos"],EST=["En uso","En reserva","En reconstrucción","Descartado"];
function lg(rid){return S.moves.filter(function(x){return x.team===S.sel&&x.type==="g"&&(x.race||"")===rid&&LOG.indexOf(x.cat)>=0}).reduce(function(a,x){return a+x.amt},0)}
function rinfo(r,s){var p=[];if(r.sede)p.push(esc(r.sede));if(r.fase)p.push(r.fase);if(r.km)p.push(r.km+" km");if(r.res)p.push("Resultado: "+esc(r.res));
 var h=p.length?'<div class="mu"><small>'+p.join(" · ")+'</small></div>':"";
 if(r.km>0)h+='<div class="mu"><small>Costo por km: '+m(s/r.km)+" · logística por km: "+m(lg(r.id)/r.km)+'</small></div>';return h}
function addRace(){var n=$("rn").value.trim();if(!n)return;var b=parseFloat($("rb").value),o={name:n,date:$("rd").value,budget:b>0?b:0,sede:$("rs").value.trim(),km:parseFloat($("rk").value)||0,fase:$("rf").value,res:$("rr").value.trim()};
 if(S.edit&&S.edit.k==="r"){Object.assign(race(S.edit.id),o);S.edit=null}else S.races.push(Object.assign({id:id(),team:S.sel},o));save2()}
function viewR(){var rs=races();if(!rs.length)return"";return'<div class="card"><h2>Costo por carrera</h2><div class="sc"><table><tr><th>Carrera</th><th>Sede</th><th>Fase</th><th class="n">Km</th><th class="n">Gasto</th><th class="n">$/km</th><th>Resultado</th></tr>'+rs.map(function(r){var s=spent(r.id);return'<tr><td>'+esc(r.name)+'</td><td>'+esc(r.sede||"–")+'</td><td>'+(r.fase||"–")+'</td><td class="n">'+(r.km||"–")+'</td><td class="n">'+m(s)+'</td><td class="n">'+(r.km?m(s/r.km):"–")+'</td><td>'+esc(r.res||"–")+'</td></tr>'}).join("")+'</table></div></div>'}
function find(a,i){return a.filter(function(x){return x.id===i})[0]}
function editTire(i){S.edit={k:"t",id:i};S.view="inv";draw()}
function editPart(i){S.edit={k:"x",id:i};S.view="inv";draw()}
function delTire(i){if(!confirm("¿Eliminar este registro?"))return;S.tires=S.tires.filter(function(x){return x.id!==i});save2()}
function delPart(i){if(!confirm("¿Eliminar este ítem?"))return;S.parts=S.parts.filter(function(x){return x.id!==i});save2()}
function bump(i,n){var p=find(S.parts,i);p.races=Math.max(0,p.races+n);save2()}
function closeRace(){mine(S.parts).forEach(function(p){if(p.state==="En uso")p.races++});save2()}
function addTire(){var nw=parseInt($("inw").value)||0,rs=parseInt($("irs").value)||0,c=parseFloat($("ic").value)||0;if(!nw&&!rs)return;var o={race:$("ir").value,nw:nw,rs:rs,cost:c};
 if(S.edit&&S.edit.k==="t"){Object.assign(find(S.tires,S.edit.id),o);S.edit=null}
 else{S.tires.push(Object.assign({id:id(),team:S.sel},o));if($("ik").checked&&c>0)S.moves.push({id:id(),team:S.sel,type:"g",cat:"Neumáticos",amt:c,race:o.race,date:T(),note:nw+" nuevos, "+rs+" resellados"})}save2()}
function addPart(){var q=$("xi").value.trim();if(!q)return;var o={kind:$("xk").value,ident:q,races:parseInt($("xr").value)||0,state:$("xs").value,cost:parseFloat($("xc").value)||0,rebuild:$("xd").value};
 if(S.edit&&S.edit.k==="x"){Object.assign(find(S.parts,S.edit.id),o);S.edit=null}else S.parts.push(Object.assign({id:id(),team:S.sel},o));save2()}
function viewI(t){var T1=mine(S.tires),P=mine(S.parts),tn=0,tr=0,tc=0;T1.forEach(function(x){tn+=x.nw;tr+=x.rs;tc+=x.cost});
 var ro='<option value="">Sin carrera</option>'+races().map(function(r){return'<option value="'+r.id+'">'+esc(r.name)+'</option>'}).join("");
 var h='<div class="card"><h2>Neumáticos por carrera</h2><div class="row"><select id="ir">'+ro+'</select><input id="inw" type="number" min="0" placeholder="Nuevos comprados"><input id="irs" type="number" min="0" placeholder="Resellados de la anterior"><input id="ic" type="number" min="0" placeholder="Costo ARS"><label class="mu"><input id="ik" type="checkbox" style="flex:0"> Cargar también como gasto</label><button class="p" onclick="addTire()">Agregar</button></div>'
 +'<div class="mu" style="margin:6px 0"><small>Referencia: por fecha se usan 6 neumáticos nuevos sellados por la ACTC y se pueden resellar 6 de la anterior. Verificá el reglamento vigente.</small></div>'
 +(T1.length?'<div class="sc"><table><tr><th>Carrera</th><th class="n">Nuevos</th><th class="n">Resellados</th><th class="n">Costo</th><th class="n">Por nuevo</th><th></th></tr>'+T1.map(function(x){return'<tr><td>'+esc(rname(x.race))+'</td><td class="n">'+x.nw+(x.nw>6?' <small class="ko">&gt;6</small>':"")+'</td><td class="n">'+x.rs+(x.rs>6?' <small class="ko">&gt;6</small>':"")+'</td><td class="n">'+m(x.cost)+'</td><td class="n">'+(x.nw&&x.cost?m(x.cost/x.nw):"–")+'</td><td class="n"><button class="g" data-i="'+x.id+'" onclick="editTire(this.dataset.i)">✎</button><button class="g" data-i="'+x.id+'" onclick="delTire(this.dataset.i)">✕</button></td></tr>'}).join("")+'<tr><th>Total</th><th class="n">'+tn+'</th><th class="n">'+tr+'</th><th class="n">'+m(tc)+'</th><th></th><th></th></tr></table></div>':'<span class="mu">Sin registros todavía.</span>')+'</div>'
 +'<div class="card"><h2>Motores y repuestos</h2><div class="row"><select id="xk"><option>Motor</option><option>Repuesto</option></select><input id="xi" placeholder="Identificación (ej: Motor 3)"><input id="xr" type="number" min="0" placeholder="Carreras de uso"><select id="xs">'+EST.map(function(e){return"<option>"+e+"</option>"}).join("")+'</select><input id="xc" type="number" min="0" placeholder="Costo ARS"><label class="mu">Últ. reconstrucción <input id="xd" type="date"></label><button class="p" onclick="addPart()">Agregar</button></div>'
 +(P.length?'<div class="row" style="margin:8px 0"><button onclick="closeRace()">+1 carrera a los que están En uso</button></div><div class="sc"><table><tr><th>Tipo</th><th>Identificación</th><th class="n">Carreras</th><th>Estado</th><th class="n">Costo</th><th>Últ. reconstr.</th><th></th></tr>'+P.map(function(p){var a='data-i="'+p.id+'"';return'<tr><td>'+p.kind+'</td><td>'+esc(p.ident)+'</td><td class="n">'+p.races+'</td><td>'+p.state+'</td><td class="n">'+m(p.cost)+'</td><td>'+(fd(p.rebuild)||"–")+'</td><td class="n"><button class="g" '+a+' onclick="bump(this.dataset.i,1)">+1</button><button class="g" '+a+' onclick="bump(this.dataset.i,-1)">−1</button><button class="g" '+a+' onclick="editPart(this.dataset.i)">✎</button><button class="g" '+a+' onclick="delPart(this.dataset.i)">✕</button></td></tr>'}).join("")+'</table></div>':'<div class="mu" style="margin-top:8px"><small>Sin ítems todavía.</small></div>')+'</div>';return h}
function fillEdit2(){var e=S.edit;if(!e)return;var b;
 if(e.k==="r"&&S.view==="car"&&$("rs")){var r=race(e.id);$("rs").value=r.sede||"";$("rk").value=r.km||"";$("rf").value=r.fase||FASES[0];$("rr").value=r.res||""}
 else if(e.k==="t"&&S.view==="inv"){var x=find(S.tires,e.id);$("ir").value=x.race||"";$("inw").value=x.nw;$("irs").value=x.rs;$("ic").value=x.cost||"";b=document.querySelector('button[onclick="addTire()"]')}
 else if(e.k==="x"&&S.view==="inv"){var p=find(S.parts,e.id);$("xk").value=p.kind;$("xi").value=p.ident;$("xr").value=p.races;$("xs").value=p.state;$("xc").value=p.cost||"";$("xd").value=p.rebuild||"";b=document.querySelector('button[onclick="addPart()"]')}
 if(b){b.textContent="Guardar cambios";b.insertAdjacentHTML("afterend",' <button onclick="cancel()">Cancelar</button>')}}
function post2(){var t=cur();if(!t)return;var tb=document.querySelector(".tabs");if(!tb)return;
 tb.insertAdjacentHTML("beforeend",'<button class="'+(S.view==="inv"?"on":"")+'" onclick="setView(\'inv\')">Inventario</button>');
 if(S.view==="inv"){while(tb.nextSibling)tb.parentNode.removeChild(tb.nextSibling);tb.insertAdjacentHTML("afterend",viewI(t))}
 if(S.view==="car"){if($("rb")&&!$("rs"))$("rb").insertAdjacentHTML("afterend",'<input id="rs" placeholder="Sede"><input id="rk" type="number" min="0" placeholder="Km de traslado"><select id="rf">'+FASES.map(function(f){return"<option>"+f+"</option>"}).join("")+'</select><input id="rr" placeholder="Resultado final (opcional)">');$("main").insertAdjacentHTML("beforeend",viewR())}
 fillEdit2()}
var _p=post;post=function(){_p();post2()};
S.cfg=S.cfg||{};S.disp=S.disp||"ARS";S.fxref=S.fxref||0;
function cf(){return S.cfg[S.sel]||(S.cfg[S.sel]={bud:{},total:0,owner:"",aport:[],staff:[]})}
function m(n){var u=S.disp==="USD"&&S.fxref>0;return new Intl.NumberFormat("es-AR",{style:"currency",currency:u?"USD":"ARS",maximumFractionDigits:0}).format(u?n/S.fxref:n)}
function sum(a,f){return a.reduce(function(s,x){return s+f(x)},0)}
function real(c){return sum(mine(S.moves).filter(function(x){return x.type==="g"&&x.cat===c}),function(x){return x.amt})}
function totG(){return sum(mine(S.moves).filter(function(x){return x.type==="g"}),function(x){return x.amt})}
function cmp(x){return(x.vt||x.vn?' <small>· '+esc(x.vt||"")+" "+esc(x.vn||"")+'</small>':"")+(x.vp?' <small>· '+esc(x.vp)+(x.vc?" CUIT "+esc(x.vc):"")+'</small>':"")+(x.vi?' <small>· IVA '+m(x.vi)+'</small>':"")+(x.cur==="USD"?' <small>· USD '+x.usd+" @ "+x.fx+'</small>':"")}
function addMove(){var a=parseFloat($("a").value);if(!(a>0))return;var u=$("mc").value==="USD",fx=parseFloat($("mx").value)||0;if(u&&!(fx>0)){alert("Ingresá la cotización para cargar en USD.");return}
 var o={type:S.type,cat:$("c").value,amt:u?a*fx:a,cur:u?"USD":"ARS",usd:u?a:0,fx:u?fx:0,race:$("r").value,date:$("d").value||T(),note:$("nt").value.trim(),vt:$("vt").value,vn:$("vn").value.trim(),vp:$("vp").value.trim(),vc:$("vc").value.trim(),vi:parseFloat($("vi").value)||0};S.race=o.race;
 if(S.edit&&S.edit.k==="m"){Object.assign(find(S.moves,S.edit.id),o);S.edit=null}else S.moves.push(Object.assign({id:id(),team:S.sel},o));save2()}
function setCB(c,v){cf().bud[c]=parseFloat(v)||0;save2()}
function setTot(v){cf().total=parseInt(v)||0;save2()}
function setOwner(v){cf().owner=v;save2()}
function addAp(){var n=$("apn").value.trim(),p=parseFloat($("app").value);if(!n||!(p>0))return;cf().aport.push({id:id(),name:n,pct:p});save2()}
function addSt(){var n=$("stn").value.trim();if(!n)return;cf().staff.push({id:id(),name:n,rol:$("str").value.trim(),pago:parseFloat($("stp").value)||0,viat:parseFloat($("stv").value)||0});save2()}
function delIn(k,i){var c=cf();c[k]=c[k].filter(function(x){return x.id!==i});save2()}
function viewB(t){var c=cf(),G=0,B=0,rs=races(),done=rs.filter(function(r){return spent(r.id)>0}),sp=sum(done,function(r){return spent(r.id)}),avg=done.length?sp/done.length:0,rem=c.total>0?Math.max(0,c.total-done.length):0,gt=totG();
 var rows=CATS.g.map(function(k){var r=real(k),b=c.bud[k]||0,p=b>0?r/b*100:0;G+=r;B+=b;if(!b&&!r)return"";return'<tr><td>'+k+'</td><td class="n">'+m(b)+'</td><td class="n">'+m(r)+'</td><td class="n '+(b?(r<=b?"ok":"ko"):"mu")+'">'+(b?(r<=b?"+":"−")+m(Math.abs(b-r)):"–")+'</td><td style="min-width:90px">'+(b>0?'<div class="pb"><i class="'+(p>100?"x":"")+'" style="width:'+Math.min(p,100)+'%"></i></div>':"")+'</td></tr>'}).join("");
 var ed=CATS.g.map(function(k){return'<label class="mu" style="flex:1 1 200px;display:flex;justify-content:space-between;gap:6px">'+k+'<input type="number" min="0" value="'+(c.bud[k]||"")+'" placeholder="ARS" data-c="'+k+'" onchange="setCB(this.dataset.c,this.value)" style="max-width:120px;flex:0 1 120px"></label>'}).join("");
 return'<div class="card"><h2>Presupuesto de temporada por categoría (ARS)</h2><div class="row">'+ed+'</div></div>'
 +'<div class="card"><h2>Real vs presupuestado</h2>'+(rows?'<div class="sc"><table><tr><th>Categoría</th><th class="n">Presup.</th><th class="n">Real</th><th class="n">Diferencia</th><th></th></tr>'+rows+'<tr><th>Total</th><th class="n">'+m(B)+'</th><th class="n">'+m(G)+'</th><th class="n '+(B?(G<=B?"ok":"ko"):"mu")+'">'+(B?(G<=B?"+":"−")+m(Math.abs(B-G)):"–")+'</th><th></th></tr></table></div>':'<span class="mu">Cargá presupuestos o gastos para ver la comparación.</span>')
 +'<div class="mu" style="margin-top:6px"><small>Por carrera: presupuesto sumado '+m(sum(rs,function(r){return r.budget||0}))+" · gasto asignado a carreras "+m(sum(rs,function(r){return spent(r.id)}))+'</small></div></div>'
 +'<div class="card"><h2>Proyección de la temporada</h2><div class="row"><label class="mu">Carreras de la temporada <input type="number" min="0" value="'+(c.total||"")+'" onchange="setTot(this.value)" style="max-width:90px"></label></div>'
 +(c.total>0?'<div class="k" style="margin-top:8px"><div><small>Gasto actual</small><b>'+m(gt)+'</b></div><div><small>Promedio por carrera ('+done.length+' con gasto)</small><b>'+m(avg)+'</b></div><div><small>Cierre estimado ('+rem+' restantes)</small><b>'+m(gt+avg*rem)+'</b></div></div>'+(B?'<div class="'+(gt+avg*rem<=B?"ok":"ko")+'" style="margin-top:8px">Contra el presupuesto de '+m(B)+': '+(gt+avg*rem<=B?"quedarías "+m(B-gt-avg*rem)+" por debajo":"te pasarías "+m(gt+avg*rem-B))+'</div>':"")+'<div class="mu"><small>Estimación simple: gasto actual + promedio por carrera × carreras restantes.</small></div>':'<div class="mu" style="margin-top:6px"><small>Ingresá la cantidad de carreras de la temporada para estimar el cierre.</small></div>')+'</div>'}
function viewE(t){var c=cf(),gt=totG(),B=sum(CATS.g,function(k){return c.bud[k]||0}),pc=sum(c.staff,function(s){return s.pago+s.viat}),ps=sum(c.aport,function(a){return a.pct});
 return'<div class="card"><h2>Dueño del auto</h2><select onchange="setOwner(this.value)">'+["","Piloto","Equipo","Otro"].map(function(o){return'<option value="'+o+'"'+(c.owner===o?" selected":"")+'>'+(o||"Sin definir")+'</option>'}).join("")+'</select></div>'
 +'<div class="card"><h2>Aportes al presupuesto</h2><div class="row"><input id="apn" placeholder="Quién aporta (piloto, sponsor, equipo…)"><input id="app" type="number" min="0" max="100" placeholder="% del presupuesto"><button class="p" onclick="addAp()">Agregar</button></div>'
 +(c.aport.length?'<div class="sc"><table><tr><th>Aportante</th><th class="n">%</th><th class="n">Del presupuesto</th><th class="n">Del gasto real</th><th></th></tr>'+c.aport.map(function(a){return'<tr><td>'+esc(a.name)+'</td><td class="n">'+a.pct+'%</td><td class="n">'+(B?m(B*a.pct/100):"–")+'</td><td class="n">'+m(gt*a.pct/100)+'</td><td class="n"><button class="g" data-i="'+a.id+'" onclick="delIn(\'aport\',this.dataset.i)">✕</button></td></tr>'}).join("")+'</table></div><div class="'+(ps===100?"ok":"ko")+'"><small>Suma de aportes: '+ps+'%'+(ps===100?"":" (debería sumar 100%)")+'</small></div>':"")+'</div>'
 +'<div class="card"><h2>Personal</h2><div class="row"><input id="stn" placeholder="Nombre"><input id="str" placeholder="Rol (mecánico, motorista…)"><input id="stp" type="number" min="0" placeholder="Pago por carrera ARS"><input id="stv" type="number" min="0" placeholder="Viático por carrera ARS"><button class="p" onclick="addSt()">Agregar</button></div>'
 +(c.staff.length?'<div class="sc"><table><tr><th>Nombre</th><th>Rol</th><th class="n">Pago</th><th class="n">Viático</th><th class="n">Total/carrera</th><th></th></tr>'+c.staff.map(function(s){return'<tr><td>'+esc(s.name)+'</td><td>'+esc(s.rol||"–")+'</td><td class="n">'+m(s.pago)+'</td><td class="n">'+m(s.viat)+'</td><td class="n">'+m(s.pago+s.viat)+'</td><td class="n"><button class="g" data-i="'+s.id+'" onclick="delIn(\'staff\',this.dataset.i)">✕</button></td></tr>'}).join("")+'<tr><th colspan="4">Costo de personal por carrera'+(c.total?" · temporada ("+c.total+")":"")+'</th><th class="n">'+m(pc)+(c.total?" · "+m(pc*c.total):"")+'</th><th></th></tr></table></div>':"")+'</div>'}
function csvq(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'}
function dl(n,d){var t=/\.pdf$/.test(n)?"application/pdf":/\.csv$/.test(n)?"text/csv;charset=utf-8":"application/json",b=d instanceof Blob?d:new Blob([d],{type:t}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function exCSV(){var H=["Fecha","Tipo","Categoría","Carrera","Monto ARS","Moneda","Monto USD","Cotización","Nota","Comprobante","Número","Proveedor/Cliente","CUIT","IVA ARS"];
 var R=mine(S.moves).sort(function(a,b){return a.date>b.date?1:-1}).map(function(x){return[x.date,x.type==="i"?"Ingreso":"Gasto",x.cat,rname(x.race),String(x.amt).replace(".",","),x.cur||"ARS",x.usd||"",x.fx||"",x.note,x.vt,x.vn,x.vp,x.vc,x.vi||""].map(csvq).join(";")});
 dl("movimientos-"+cur().name.replace(/\W+/g,"-")+"-"+T()+".csv","\ufeff"+[H.map(csvq).join(";")].concat(R).join("\r\n"))}
function exPDF(){var t=cur(),J=window.jspdf;if(!J){alert("No se pudo cargar el generador de PDF.");return}var d=new J.jsPDF(),y=16;
 function ln(s,b){if(y>280){d.addPage();y=16}d.setFont("helvetica",b?"bold":"normal");d.setFontSize(b?12:10);d.text(String(s),14,y);y+=b?8:6}
 var I=sum(mine(S.moves).filter(function(x){return x.type==="i"}),function(x){return x.amt}),G=totG(),by={};
 mine(S.moves).forEach(function(x){if(x.type==="g")by[x.cat]=(by[x.cat]||0)+x.amt});
 ln("Informe - "+t.name+(t.pilot?" ("+t.pilot+")":""),1);ln("Fecha: "+fd(T())+" · Valores en "+(S.disp==="USD"&&S.fxref>0?"USD (cotiz. "+S.fxref+")":"ARS"));y+=3;
 ln("Resumen de temporada",1);ln("Ingresos: "+m(I));ln("Gastos: "+m(G));ln("Balance: "+m(I-G));ln("Por pagar: "+m(sum(mine(S.pend).filter(function(x){return x.kind!=="c"}),function(x){return x.amt}))+" · Por cobrar: "+m(sum(mine(S.pend).filter(function(x){return x.kind==="c"}),function(x){return x.amt})));y+=3;
 ln("Gastos por categoria",1);Object.keys(by).sort(function(a,b){return by[b]-by[a]}).forEach(function(k){var b=cf().bud[k];ln(k+": "+m(by[k])+(b?" (presup. "+m(b)+")":""))});y+=3;
 ln("Gastos por carrera",1);races().forEach(function(r){var s=spent(r.id);ln(r.name+(r.sede?" - "+r.sede:"")+": "+m(s)+(r.budget?" (presup. "+m(r.budget)+")":"")+(r.km?" · "+m(s/r.km)+"/km":""))});
 dl("informe-"+t.name.replace(/\W+/g,"-")+"-"+T()+".pdf",d.output("arraybuffer"))}
function exJSON(){dl("tc-cuentas-copia-"+T()+".json",JSON.stringify(S))}
function impF(f){if(!f)return;var r=new FileReader();r.onload=function(){try{var o=JSON.parse(r.result);if(!o||!Array.isArray(o.teams)||!Array.isArray(o.moves))throw 0;if(!confirm("Esto reemplaza TODOS los datos actuales por los de la copia. ¿Continuar?"))return;Object.assign(S,o);S.edit=null;save2()}catch(e){alert("El archivo no es una copia válida de TC Cuentas.")}};r.readAsText(f)}
function viewRep(t){var by={},I=sum(mine(S.moves).filter(function(x){return x.type==="i"}),function(x){return x.amt}),G=totG();mine(S.moves).forEach(function(x){if(x.type==="g")by[x.cat]=(by[x.cat]||0)+x.amt});
 return'<div class="card"><h2>Exportar</h2><div class="row"><button class="p" onclick="exCSV()">Movimientos (CSV)</button><button class="p" onclick="exPDF()">Informe (PDF)</button></div></div>'
 +'<div class="card"><h2>Copia de seguridad</h2><div class="row"><button onclick="exJSON()">Descargar copia (JSON)</button><label class="mu">Importar copia <input type="file" accept=".json" onchange="impF(this.files[0])"></label></div><div class="mu" style="margin-top:6px"><small>Incluye todos los equipos y datos. Importar reemplaza lo que hay ahora.</small></div></div>'
 +'<div class="card"><h2>Resumen de temporada</h2><div class="k"><div><small>Ingresos</small><b class="ok">'+m(I)+'</b></div><div><small>Gastos</small><b class="ko">'+m(G)+'</b></div><div><small>Balance</small><b>'+m(I-G)+'</b></div></div></div>'
 +'<div class="card"><h2>Por carrera</h2><div class="sc"><table><tr><th>Carrera</th><th class="n">Gasto</th><th class="n">Presupuesto</th><th class="n">Diferencia</th></tr>'+races().map(function(r){var s=spent(r.id),b=r.budget||0;return'<tr><td>'+esc(r.name)+'</td><td class="n">'+m(s)+'</td><td class="n">'+(b?m(b):"–")+'</td><td class="n '+(b?(s<=b?"ok":"ko"):"mu")+'">'+(b?(s<=b?"+":"−")+m(Math.abs(b-s)):"–")+'</td></tr>'}).join("")+'</table></div></div>'}
function post3(){var t=cur();if(!t)return;var tb=document.querySelector(".tabs");if(!tb)return;
 if(!$("dp")){document.querySelector(".top").insertAdjacentHTML("beforeend",'<span class="row"><select id="dp" onchange="S.disp=this.value;save2()"><option>ARS</option><option>USD</option></select><input id="fr" type="number" min="0" placeholder="Cotiz. USD ref." style="max-width:130px" onchange="S.fxref=parseFloat(this.value)||0;save2()"></span>')}
 $("dp").value=S.disp;$("fr").value=S.fxref||"";
 var V=[["pre","Presupuesto"],["eq","Equipo"],["rep","Reportes"]];
 tb.insertAdjacentHTML("beforeend",V.map(function(v){return'<button class="'+(S.view===v[0]?"on":"")+'" onclick="setView(\''+v[0]+'\')">'+v[1]+'</button>'}).join(""));
 var f={pre:viewB,eq:viewE,rep:viewRep}[S.view];
 if(f){while(tb.nextSibling)tb.parentNode.removeChild(tb.nextSibling);tb.insertAdjacentHTML("afterend",f(t))}
 if(S.view==="res"&&$("a")&&!$("mc")){var b=document.querySelector('button[onclick="addMove()"]');b.insertAdjacentHTML("beforebegin",'<select id="mc"><option>ARS</option><option>USD</option></select><input id="mx" type="number" min="0" placeholder="Cotiz. (si USD)"><select id="vt"><option value="">Comprobante</option><option>Factura A</option><option>Factura B</option><option>Factura C</option><option>Recibo</option><option>Ticket</option><option>Otro</option></select><input id="vn" placeholder="N° comprobante"><input id="vp" placeholder="Proveedor / cliente"><input id="vc" placeholder="CUIT"><input id="vi" type="number" min="0" placeholder="IVA discriminado ARS">')}
 if(S.edit&&S.edit.k==="m"&&$("mc")){var x=find(S.moves,S.edit.id);if(x){$("mc").value=x.cur||"ARS";$("mx").value=x.fx||"";if(x.cur==="USD")$("a").value=x.usd;$("vt").value=x.vt||"";$("vn").value=x.vn||"";$("vp").value=x.vp||"";$("vc").value=x.vc||"";$("vi").value=x.vi||""}}}
var _p3=post;post=function(){_p3();post3()};
var _d=draw;draw=function(){_d();post()};
if(!S.sel&&S.teams.length)S.sel=S.teams[0].id;
draw();
