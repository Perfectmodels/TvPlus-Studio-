(function localReportagePatch() {
  "use strict";
  const $=id=>document.getElementById(id);
  const dlg=$("studioEditorialDialog"),kind=$("studioCaptionType"),preview=$("studioCaptionPreview"),original=$("headline");
  const editorial=window.TVPlusEditorial;
  if(!dlg||!kind||!preview||!original||!editorial)return;
  const captionSection=dlg.querySelector('[data-toolpanel="caption"]');
  const grid=kind.closest(".studio-form-grid");
  const captionTitle=$("studioCaptionTitle");
  if(!grid||!captionSection||!captionTitle)return;
  const hiddenInReport=["studioCaptionLink","studioCaptionIntro","studioCaptionHashtags"];
  const existing={link:$("studioCaptionLink")?.closest("label"),intro:$("studioCaptionIntro")?.closest("label"),hashtags:captionSection.querySelector(".studio-hashtag-box")};
  const rewrite=document.createElement("section");
  rewrite.className="studio-title-assist";rewrite.id="studioFrenchTitleAssist";
  rewrite.innerHTML=`
    <div class="studio-title-assist-head"><strong>Correction et reformulation du titre</strong><small>Français · règles locales et correcteur du navigateur</small></div>
    <div class="studio-editorial-actions">
      <button id="studioProofreadTitle" type="button">Vérifier les fautes</button>
      <button id="studioRewriteTitle" type="button" class="studio-accent">Proposer des reformulations</button>
    </div>
    <p id="studioProofreadingStatus" class="studio-note" role="status" aria-live="polite"></p>
    <div id="studioRewriteSuggestions" class="studio-rewrite-list" role="group" aria-label="Choisir une formulation du titre"></div>
    <p class="studio-note">Le dictionnaire français du navigateur peut souligner d’autres fautes. Les corrections proposées restent à relire.</p>`;
  const form=document.createElement("section");form.className="studio-title-only-box";form.id="studioFormatOnlyTitle";
  form.hidden=true;
  form.innerHTML=`
    <div class="tvplus-format-fields" data-format-title="reportage" hidden>
      <strong>Reportage · titre de terrain</strong>
      <label>Titre du reportage<textarea id="studioOnlyTitleInput" rows="3" maxlength="500" lang="fr" spellcheck="true" placeholder="Titre propre au reportage"></textarea></label>
      <label>Contexte et angle du reportage<textarea id="studioReportageBrief" rows="3" maxlength="3000" placeholder="Faits, protagonistes et angle du terrain (facultatif)"></textarea></label>
      <p class="studio-note">Titre de reportage développé, distinct de la capsule 60 secondes.</p>
    </div>
    <div class="tvplus-format-fields" data-format-title="60secondes" hidden>
      <strong>En 60 secondes · titre court</strong>
      <label>Titre de la capsule<textarea id="studio60TitleInput" rows="2" maxlength="500" lang="fr" spellcheck="true" placeholder="Un fait principal, en une phrase courte"></textarea></label>
      <label>Informations essentielles<textarea id="studio60Brief" rows="3" maxlength="3000" placeholder="Ce que le public doit retenir en 60 secondes (facultatif)"></textarea></label>
      <p class="studio-note" id="studio60TitleCounter" role="status">75 caractères et 12 mots maximum.</p>
    </div>
    <div class="tvplus-format-fields" data-format-title="alerte" hidden>
      <strong>Alerte Info · titre factuel</strong>
      <label>Titre de l'alerte<textarea id="studioAlertTitleInput" rows="2" maxlength="500" lang="fr" spellcheck="true" placeholder="Fait important confirmé"></textarea></label>
      <label>Éléments vérifiés<textarea id="studioAlertBrief" rows="3" maxlength="3000" placeholder="Préciser seulement les faits confirmés (facultatif)"></textarea></label>
    </div>
    <button type="button" id="studioUsePosterTitle">Reprendre le titre de l'affiche pour ce format</button>
    <p class="studio-note" id="studioOnlyTitleDescription">Chaque format possède son propre brouillon.</p>`;
  grid.insertAdjacentElement("afterend",form);
  form.insertAdjacentElement("afterend",rewrite);
  captionTitle.setAttribute("lang","fr");
  captionTitle.setAttribute("spellcheck","true");
  const formatFields={reportage:{title:$("studioOnlyTitleInput"),brief:$("studioReportageBrief")}, "60secondes":{title:$("studio60TitleInput"),brief:$("studio60Brief")},alerte:{title:$("studioAlertTitleInput"),brief:$("studioAlertBrief")}};
  const status=$("studioProofreadingStatus"),suggestions=$("studioRewriteSuggestions");
  const oldTitleBox=$("studioCaptionTitleBlock"),shortener=$("studioShortenerPanel"),articlePanel=$("studioArticleHeadlineTool");
  const KEY="tvplus:format-caption-title-v1";
  let memory={};
  try{memory=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(_){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(memory))}catch(_){}};
  const source=()=>String(original.value||"").trim();
  const kindNow=()=>kind.value||"lire";
  const activeInput=()=>kindNow()==="lire"?captionTitle:formatFields[kindNow()]?.title;
  const storedType=()=>Boolean(formatFields[kindNow()]);
  function length60(){const t=formatFields["60secondes"].title.value.trim(),chars=[...t].length,words=t?t.split(/\s+/).length:0;
   const over=chars>75||words>12,n=$("studio60TitleCounter");n.textContent=chars+"/75 caractères · "+words+"/12 mots"+(over?" · À raccourcir avant de copier.":"");n.classList.toggle("is-warning",over);return over;}
  const heading={
    reportage:"📺 𝗧𝗩+ | 𝗥𝗘𝗣𝗢𝗥𝗧𝗔𝗚𝗘",
    alerte:"🚨 𝗧𝗩+ | 𝗔𝗟𝗘𝗥𝗧𝗘 𝗜𝗡𝗙𝗢",
    "60secondes":"📺 𝗧𝗩+ | 𝗘𝗡 𝟲𝟬 𝗦𝗘𝗖𝗢𝗡𝗗𝗘𝗦"
  };
  const labels={reportage:"Titre du reportage",alerte:"Titre de l’alerte info","60secondes":"Titre du 60 secondes"};
  const wa="📲 𝗦𝘂𝗶𝘃𝗲𝘇-𝗻𝗼𝘂𝘀 𝘀𝘂𝗿 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 https://l.tvplusafrique.com/xw7b";
  function unicodeBold(text){
    return [...String(text||"")].map(ch=>{
      const c=ch.codePointAt(0);
      if(c>=65&&c<=90)return String.fromCodePoint(0x1D400+c-65);
      if(c>=97&&c<=122)return String.fromCodePoint(0x1D41A+c-97);
      if(c>=48&&c<=57)return String.fromCodePoint(0x1D7CE+c-48);
      return ch;
    }).join("");
  }
  function hashtags(title,type){
    const values=["#TVPlusAfrique"];
    if(type==="reportage")values.push("#Reportage");
    if(type==="alerte")values.push("#AlerteInfo");
    if(type==="60secondes")values.push("#60Secondes");
    const add=word=>{
      const part=String(word||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9_]/g,"");
      if(part.length>=3&&part.length<=35&&/[A-Za-z]/.test(part))values.push("#"+part);
    };
    const stop=new Set(["TV","Reportage","Le","La","Les","Des","Une","Pour","Avec","Voici","Sur"]);
    for(const acronym of title.match(/\b[A-ZÀ-ÖØ-Þ]{2,12}\b/g)||[])if(!stop.has(acronym))add(acronym);
    for(const name of title.match(/\b[A-ZÀ-ÖØ-Þ][a-zà-ÿ]{2,}\s+[A-ZÀ-ÖØ-Þ][a-zà-ÿ]{2,}\b/gu)||[])add(name.replace(/\s+/g,""));
    for(const city of title.match(/\b(?:Gabon|Libreville|Mayumba|Dakar|Togo|Cameroun|Oyem|Mouila)\b/gi)||[])add(city);
    return [...new Map(values.map(x=>[x.toLowerCase(),x])).values()].slice(0,8).join(" ");
  }
  function renderCaption(){
    const type=kindNow();
    if(type==="lire")return;
    const title=activeInput().value.trim()||"[Titre "+(type==="60secondes"?"du 60 secondes":type==="alerte"?"de l'alerte":"du reportage")+" à compléter]";
    if(type==="60secondes")length60();
    const lines=[heading[type]||heading.reportage];
    if(type==="alerte")lines.push("");
    lines.push("🔴 "+unicodeBold(title),wa,"",hashtags(title,type));
    preview.value=lines.join("\n");
  }
  function seed(){
    const type=kindNow();if(!storedType())return;
    const poster=source();
    if(!memory[type]||memory[type].source!==poster)memory[type]={source:poster,value:"",brief:""};
    formatFields[type].title.value=String(memory[type].value||"");
    formatFields[type].brief.value=String(memory[type].brief||"");
    save();
  }
  function saveActive(){
    const type=kindNow();if(!storedType())return;
    memory[type]={source:source(),value:formatFields[type].title.value,brief:formatFields[type].brief.value};
    save();renderCaption();
  }
  function updateForm(){
    const type=kindNow(),simple=storedType();
    form.hidden=!simple;
    for(const node of form.querySelectorAll("[data-format-title]"))node.hidden=node.dataset.formatTitle!==type;
    if(simple){seed();$("studioOnlyTitleDescription").textContent=labels[type]+" · titre et contexte indépendants des autres formats.";}
    if(existing.link)existing.link.hidden=simple;
    if(existing.intro)existing.intro.hidden=simple;
    if(existing.hashtags)existing.hashtags.hidden=simple;
    if(oldTitleBox)oldTitleBox.hidden=simple;
    if(shortener)shortener.hidden=simple;
    if(articlePanel)articlePanel.hidden=simple;
    grid.style.gridTemplateColumns=simple?"1fr":"";
    suggestions.replaceChildren();status.textContent="";renderCaption();
  }
  const commonErrors=new Map([
    ["reporatge","reportage"],["reporttage","reportage"],["imersion","immersion"],
    ["estudiantinne","estudiantine"],["étudiatine","estudiantine"],
    ["entreprenneur","entrepreneur"],["journalise","journaliste"],
    ["connaisance","connaissance"],["dévelloppement","développement"],
    ["communiquéé","communiqué"],["incendit","incendie"],["avce","avec"],
    ["plsu","plus"],["gabaon","Gabon"],["librevile","Libreville"],
    ["recontre","rencontre"],["pladé","plaidé"],["évenement","événement"]
  ]);
  function proofread(value){
    let v=String(value||"").normalize("NFC");
    const notes=[];
    for(const [error,fix] of commonErrors){
      const regex=new RegExp("(^|[^\\p{L}])("+error+")(?=$|[^\\p{L}])","giu");
      if(regex.test(v)){
        v=v.replace(regex,(_m,prefix,word)=>prefix+(word[0]===word[0].toUpperCase()?fix[0].toUpperCase()+fix.slice(1):fix));
        notes.push(error+" → "+fix);
      }
    }
    const previous=v;
    v=v.replace(/\s{2,}/g," ").replace(/\s+([,.])/g,"$1").replace(/,([^\s\d])/g,", $1")
      .replace(/\s*([:;!?])\s*/g,"\u202F$1 ")
      .replace(/\s+([»”])/g,"\u202F$1").replace(/([«“])\s*/g,"$1\u202F").trim();
    if(v!==previous)notes.push("Ponctuation et espacements harmonisés");
    const repeated=/\b([\p{L}]{2,})\s+\1\b/giu;
    if(repeated.test(v)){v=v.replace(repeated,"$1");notes.push("Mot répété supprimé");}
    return {text:v,changed:v!==value,notes};
  }
  function variants(value){
    const result=[];
    const corrected=proofread(value).text.trim();
     const base=window.TVPlusHeadlineCase?.(corrected)||corrected;
    const add=(title,label)=>{
      title=String(title||"").trim().replace(/[.!?]+$/,"");
      if(title.length<8||result.some(x=>x.title.toLocaleLowerCase("fr")===title.toLocaleLowerCase("fr")))return;
      result.push({title,label});
    };
    add(base,"Titre corrigé");
    const direct=base.replace(/^(?:Reportage\s*[:\-–—]\s*|Immersion au cœur de\s+|Retour sur\s+|Zoom sur\s+|Découvrez\s+|Voici\s+)/i,"").trim();
    if(direct!==base&&direct.length>=12)add(direct[0].toUpperCase()+direct.slice(1),"Formulation directe · à vérifier");
    const acr=base.match(/^([A-ZÀ-ÖØ-Þ]{2,12}),\s*(.{8,})$/u);
    if(acr){
      add(acr[1]+" : "+acr[2],"Formulation institutionnelle · à vérifier");
      if(/^(?:immersion|visite|formation|enquête|rencontre|découverte)\b/i.test(acr[2])){
        add(acr[2][0].toUpperCase()+acr[2].slice(1)+" à l’"+acr[1],"Formulation reportage · à vérifier");
      }
    }
    const condensed=base.split(/\s+[—–]\s+|,\s+(?=(?:mais|tandis que|alors que)\b)/i)[0];
    if(condensed!==base&&condensed.length>=20)add(condensed,"Version condensée · à vérifier");
    if(kindNow()==="lire"&&$("studioArticleBody")?.value.trim().length>110&&window.TVPlusFrenchHeadlines?.suggest){
      try{
        const p=window.TVPlusFrenchHeadlines.suggest({headline:base,article:$("studioArticleBody").value,maxChars:75,maxWords:12});
        for(const x of p.candidates||[])if(!x.needsReview)add(x.title,"Extrait de l’article · à vérifier");
      }catch(_){}
    }
    return result.filter(x=>kindNow()!=="60secondes"||([ ...x.title ].length<=75&&x.title.split(/\s+/).length<=12&&!x.title.endsWith("…"))).slice(0,4);
  }
  function applyTitle(value){
    const input=activeInput();
    input.value=value;
    if(kindNow()==="lire")input.dispatchEvent(new Event("input",{bubbles:true}));
    else saveActive();
    input.focus();
  }
  const css=document.createElement("style");css.id="studio-reportage-titles-style";
  css.textContent=`
#studioFormatOnlyTitle[hidden],#studioFrenchTitleAssist[hidden],.tvplus-format-fields[hidden]{display:none!important}
.tvplus-format-fields{display:grid;gap:10px}.tvplus-format-fields>strong{font-size:13px;color:#ffcf57}
.tvplus-format-fields label{display:grid;gap:6px;font-size:12px}.tvplus-format-fields textarea{box-sizing:border-box;width:100%;border:1px solid #506b87;border-radius:8px;padding:10px;background:#0d1d31;color:#fff}
#studioUsePosterTitle{margin:10px 0;border:1px solid #53728d;background:#223b57;color:#fff;border-radius:8px;padding:10px;cursor:pointer}
#studio60TitleCounter.is-warning{color:#ffbd70;font-weight:750}
.studio-title-only-box{background:#132741;border:1px solid #405a77;border-radius:10px;padding:12px;margin:11px 0}
.studio-title-only-box label{display:block;color:#eaf3ff;font-size:12px}
.studio-title-only-box textarea{width:100%;min-height:86px;line-height:1.5;resize:vertical;margin-top:8px}
.studio-title-assist{margin:12px 0;padding:12px;border:1px solid #40546d;background:#13263d;border-radius:10px}
.studio-title-assist-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}
.studio-title-assist-head strong{font-size:12px;color:#fff}
.studio-title-assist-head small{font-size:10px;color:#9fb7d1}
.studio-rewrite-list{display:grid;gap:7px;margin:8px 0}
.studio-rewrite-list button{padding:9px 10px;min-height:42px;border:1px solid #4b617c;background:#1c324d;color:#fff;border-radius:9px;cursor:pointer;text-align:left}
.studio-rewrite-list button strong{display:block;font-size:12px}
.studio-rewrite-list button small{display:block;font-size:10px;color:#a9c0d6;margin-top:3px}
.studio-rewrite-list button:hover,.studio-rewrite-list button:focus-visible{border-color:#ffd05a;background:#284562}
`;
  document.head.append(css);
  $("studioProofreadTitle").addEventListener("click",()=>{
    const value=activeInput().value;
    if(!value.trim()){status.textContent="Saisissez un titre avant la correction.";return;}
    const result=proofread(value);
    if(result.changed)applyTitle(result.text);
    status.textContent=result.changed?
      "Corrections proposées appliquées : "+(result.notes.join("; ")||"ponctuation")+". Vérifiez le sens.":
      "Aucune erreur couverte par les règles locales. Vérifiez aussi le dictionnaire du navigateur.";
    suggestions.replaceChildren();
  });
  function alsoSuggestWithAI(){
    const assistant=window.TVPlusOpenAI;
    if(!assistant?.run)return;
    const panel=document.getElementById("tvplusOpenAIPanel");
    if(panel)panel.open=true;
    assistant.run("reformulation");
  }
  $("studioRewriteTitle").addEventListener("click",()=>{
    suggestions.replaceChildren();
    const title=activeInput().value.trim();
    if(!title){status.textContent="Saisissez un titre avant la reformulation.";return;}
    const list=variants(title);
    if(list.length<=1){status.textContent="Pas de variante locale sûre trouvée. Vérification des propositions IA dans l’assistant.";alsoSuggestWithAI();return;}
    for(const option of list){
      const b=document.createElement("button");b.type="button";
      const strong=document.createElement("strong");strong.textContent=option.title;
      const detail=document.createElement("small");detail.textContent=option.label;
      b.append(strong,detail);b.addEventListener("click",()=>{applyTitle(option.title);status.textContent="Titre proposé appliqué. Relisez le sens avant publication.";});
      suggestions.append(b);
    }
    status.textContent=list.length+" propositions locales issues du texte. Des variantes IA sont proposées dans l’assistant, si l’API est disponible.";alsoSuggestWithAI();
  });
  for(const [type,obj] of Object.entries(formatFields)){
    for(const field of [obj.title,obj.brief])field.addEventListener("input",()=>{if(kindNow()===type)saveActive();});
  }
  $("studioUsePosterTitle").addEventListener("click",()=>{
    if(!storedType())return;
    activeInput().value=source();saveActive();activeInput().focus();
    status.textContent="Le titre de l'affiche a été repris uniquement pour "+labels[kindNow()]+".";
  });
  kind.addEventListener("change",updateForm);
  kind.addEventListener("input",updateForm);
  $("studioCaptionRefresh")?.addEventListener("click",()=>{
    if(storedType()){activeInput().value=source();saveActive();}
  });
  // Update the preview before the inherited copy handler reads its value.
  const copy=$("studioCaptionCopy");
  if(copy){
    copy.addEventListener("click",event=>{
      if(!storedType())return;
      renderCaption();
      if(!activeInput().value.trim()||(kindNow()==="60secondes"&&length60())){
        event.preventDefault();event.stopImmediatePropagation();
        $("studioCaptionStatus").textContent=activeInput().value.trim()?"Titre du 60 secondes trop long : maximum 75 caractères et 12 mots.":"Saisissez le titre propre à ce format avant de copier.";
        activeInput().focus();
      }
    },true);
    copy.addEventListener("pointerdown",renderCaption,true);
  }
  const originalShow=editorial.show;
  editorial.show=function(page){originalShow(page);if(page==="caption")updateForm();};
  updateForm();
  window.TVPlusFormatTitles={
    getTitle:type=>String(formatFields[type]?.title.value||"").trim(),
    getInput:type=>formatFields[type]?.title||null,
    getContext:type=>String(formatFields[type]?.brief.value||"").trim(),
    renderCaption:()=>{if(!storedType())return false;renderCaption();return true;},
    getCurrentFormat:kindNow
  };
  window.TVPlusTitleTools={proofread,variants,refresh:updateForm,version:"2.0"};
})();