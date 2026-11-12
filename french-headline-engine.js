/* French article → short Facebook headline (local, deterministic, extractive).
   Uses stopwords-fr (MIT) from stopwords-iso/stopwords-fr.
   Returns suggestions with source evidence. It is NOT an AI language generator. */
(function(root){
 "use strict";
 const frStopwords=new Set(["a","abord","absolument","afin","ah","ai","aie","aient","aies","ailleurs","ainsi","ait","allaient","allo","allons","allô","alors","anterieur","anterieure","anterieures","apres","après","as","assez","attendu","au","aucun","aucune","aucuns","aujourd","aujourd'hui","aupres","auquel","aura","aurai","auraient","aurais","aurait","auras","aurez","auriez","aurions","aurons","auront","aussi","autant","autre","autrefois","autrement","autres","autrui","aux","auxquelles","auxquels","avaient","avais","avait","avant","avec","avez","aviez","avions","avoir","avons","ayant","ayez","ayons","b","bah","bas","basee","bat","beau","beaucoup","bien","bigre","bon","boum","bravo","brrr","c","car","ce","ceci","cela","celle","celle-ci","celle-là","celles","celles-ci","celles-là","celui","celui-ci","celui-là","celà","cent","cependant","certain","certaine","certaines","certains","certes","ces","cet","cette","ceux","ceux-ci","ceux-là","chacun","chacune","chaque","cher","chers","chez","chiche","chut","chère","chères","ci","cinq","cinquantaine","cinquante","cinquantième","cinquième","clac","clic","combien","comme","comment","comparable","comparables","compris","concernant","contre","couic","crac","d","da","dans","de","debout","dedans","dehors","deja","delà","depuis","dernier","derniere","derriere","derrière","des","desormais","desquelles","desquels","dessous","dessus","deux","deuxième","deuxièmement","devant","devers","devra","devrait","different","differentes","differents","différent","différente","différentes","différents","dire","directe","directement","dit","dite","dits","divers","diverse","diverses","dix","dix-huit","dix-neuf","dix-sept","dixième","doit","doivent","donc","dont","dos","douze","douzième","dring","droite","du","duquel","durant","dès","début","désormais","e","effet","egale","egalement","egales","eh","elle","elle-même","elles","elles-mêmes","en","encore","enfin","entre","envers","environ","es","essai","est","et","etant","etc","etre","eu","eue","eues","euh","eurent","eus","eusse","eussent","eusses","eussiez","eussions","eut","eux","eux-mêmes","exactement","excepté","extenso","exterieur","eûmes","eût","eûtes","f","fais","faisaient","faisant","fait","faites","façon","feront","fi","flac","floc","fois","font","force","furent","fus","fusse","fussent","fusses","fussiez","fussions","fut","fûmes","fût","fûtes","g","gens","h","ha","haut","hein","hem","hep","hi","ho","holà","hop","hormis","hors","hou","houp","hue","hui","huit","huitième","hum","hurrah","hé","hélas","i","ici","il","ils","importe","j","je","jusqu","jusque","juste","k","l","la","laisser","laquelle","las","le","lequel","les","lesquelles","lesquels","leur","leurs","longtemps","lors","lorsque","lui","lui-meme","lui-même","là","lès","m","ma","maint","maintenant","mais","malgre","malgré","maximale","me","meme","memes","merci","mes","mien","mienne","miennes","miens","mille","mince","mine","minimale","moi","moi-meme","moi-même","moindres","moins","mon","mot","moyennant","multiple","multiples","même","mêmes","n","na","naturel","naturelle","naturelles","ne","neanmoins","necessaire","necessairement","neuf","neuvième","ni","nombreuses","nombreux","nommés","non","nos","notamment","notre","nous","nous-mêmes","nouveau","nouveaux","nul","néanmoins","nôtre","nôtres","o","oh","ohé","ollé","olé","on","ont","onze","onzième","ore","ou","ouf","ouias","oust","ouste","outre","ouvert","ouverte","ouverts","o|","où","p","paf","pan","par","parce","parfois","parle","parlent","parler","parmi","parole","parseme","partant","particulier","particulière","particulièrement","pas","passé","pendant","pense","permet","personne","personnes","peu","peut","peuvent","peux","pff","pfft","pfut","pif","pire","pièce","plein","plouf","plupart","plus","plusieurs","plutôt","possessif","possessifs","possible","possibles","pouah","pour","pourquoi","pourrais","pourrait","pouvait","prealable","precisement","premier","première","premièrement","pres","probable","probante","procedant","proche","près","psitt","pu","puis","puisque","pur","pure","q","qu","quand","quant","quant-à-soi","quanta","quarante","quatorze","quatre","quatre-vingt","quatrième","quatrièmement","que","quel","quelconque","quelle","quelles","quelqu'un","quelque","quelques","quels","qui","quiconque","quinze","quoi","quoique","r","rare","rarement","rares","relative","relativement","remarquable","rend","rendre","restant","reste","restent","restrictif","retour","revoici","revoilà","rien","s","sa","sacrebleu","sait","sans","sapristi","sauf","se","sein","seize","selon","semblable","semblaient","semble","semblent","sent","sept","septième","sera","serai","seraient","serais","serait","seras","serez","seriez","serions","serons","seront","ses","seul","seule","seulement","si","sien","sienne","siennes","siens","sinon","six","sixième","soi","soi-même","soient","sois","soit","soixante","sommes","son","sont","sous","souvent","soyez","soyons","specifique","specifiques","speculatif","stop","strictement","subtiles","suffisant","suffisante","suffit","suis","suit","suivant","suivante","suivantes","suivants","suivre","sujet","superpose","sur","surtout","t","ta","tac","tandis","tant","tardive","te","tel","telle","tellement","telles","tels","tenant","tend","tenir","tente","tes","tic","tien","tienne","tiennes","tiens","toc","toi","toi-même","ton","touchant","toujours","tous","tout","toute","toutefois","toutes","treize","trente","tres","trois","troisième","troisièmement","trop","très","tsoin","tsouin","tu","té","u","un","une","unes","uniformement","unique","uniques","uns","v","va","vais","valeur","vas","vers","via","vif","vifs","vingt","vivat","vive","vives","vlan","voici","voie","voient","voilà","voire","vont","vos","votre","vous","vous-mêmes","vu","vé","vôtre","vôtres","w","x","y","z","zut","à","â","ça","ès","étaient","étais","était","étant","état","étiez","étions","été","étée","étées","étés","êtes","être","ô"].map(w=>w.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
 const boilerplate=new Set(["article","afrique","tvplus","tv","plus","lire","partage","publicite","commentaires"]);
 const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 function wordsOf(source) {
  return (normalize(source).match(/[a-z][a-z0-9'-]{2,}/g)||[]).filter(w=>w.length>=3&&!frStopwords.has(w)&&!boilerplate.has(w));
 }
 function clean(source){
  const raw=String(source||"").slice(0,28000)
   .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
   .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
   .replace(/<[^>]+>/g," ")
   .replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&")
   .replace(/&quot;|&ldquo;|&rdquo;/gi,'"').replace(/&rsquo;|&lsquo;/gi,"’")
   .replace(/\r/g,"\n").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
  return raw;
 }
 function sentences(body){
  // Retain paragraph boundaries and split journalistic sentences.
  return body.split(/\n{1,}|(?<=[.!?])\s+(?=[«“"A-ZÀ-ÖØ-Þ0-9])/u)
   .map(s=>s.trim().replace(/^[•–—\-\d.)\s]+/u,""))
   .filter(s=>s.length>=22&&s.length<=1200&&!/^https?:\/\//.test(s)&&!/^#/.test(s))
   .slice(0,90);
 }
 function cutToLimit(source,limit,wordLimit) {
  let s=String(source||"").replace(/\s+/g," ").trim().replace(/^[«“"' ]+|[»”"' ]+$/g,"");
  s=s.replace(/\bfrancs\s+CFA\b/gi,"FCFA").replace(/^[\-–—•\s]+/,"");
  s=s.replace(/[.!?]+\s*$/,"");
  // Drop generic introductions when the rest is an independent factual sentence.
  s=s.replace(/^(?:au cours d['’]une intervention|lors d['’]une conférence|dans un communiqué|selon un communiqué|à l['’]occasion d['’]une cérémonie),\s*/i,"");

  const sourceText=s;
  function within(t){return [...t].length<=limit&&t.split(/\s+/).length<=wordLimit;}
  if(within(s))return {title:s,cut:false};
  // Prefer natural clause boundaries, not arbitrary character truncation.
  for(const separator of [/;\s+/,/,\s+(?=(?:le|la|les)\s+[A-ZÀ-ÖØ-Þ])/i,/[,;]\s+(?:mais|alors que|tandis que|cependant)\s+/i,/\s+[—–]\s+/,/\s+(?:tandis que|alors que|dans le cadre de|dans les processus de|à l['’]occasion d['’]|au terme de|lors d['’]|au cours de)\s+/i]){
   const sections=s.split(separator);
   if(sections.length>1&&sections[0].length>=30&&within(sections[0]))return {title:sections[0].trim(),cut:false};
  }
  const firstColon=s.lastIndexOf(": ");
  if(firstColon>0&&firstColon<42){
   const tail=s.slice(firstColon+2).trim();
   if(tail.length>=30&&within(tail))return {title:tail,cut:false};
  }
  // An incomplete clip is explicit; editorial review is required.
  const tokens=s.split(/\s+/),out=[];
  for(const token of tokens){
   const next=[...out,token].join(" ");
   if([...next].length>limit-1||out.length>=wordLimit)break;
   out.push(token);
  }
  const clipped=out.join(" ").replace(/[,;:\s]+$/,"");
  return {title:clipped&&clipped!==sourceText?clipped+"…":clipped,cut:true};
 }
 function suggest(input){
  const headline=clean(input?.headline||"").replace(/\n/g," ");
  const body=clean(input?.article||"");
  const limit=Math.max(35,Math.min(100,Number(input?.maxChars)||75));
  const maxWords=Math.max(6,Math.min(18,Number(input?.maxWords)||12));
  const extracted=sentences(body);
  const frequency=new Map();
  const totalTokens=wordsOf(body);
  for(const w of totalTokens)frequency.set(w,(frequency.get(w)||0)+1);
  const headlineWords=new Set(wordsOf(headline));
  const wordWeights=[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,35);
  const keyWords=new Set(wordWeights.map(x=>x[0]));
  const numbers=new Set((headline+" "+body).match(/\b\d+(?:[.,]\d+)?\b/g)||[]);
  function relevance(sentence,index,source){
   const tokens=wordsOf(sentence),uniq=[...new Set(tokens)];
   if(!uniq.length)return -999;
   const overlap=uniq.filter(x=>headlineWords.has(x)).length;
   const themes=uniq.filter(x=>keyWords.has(x)).length;
   const numberCount=(sentence.match(/\b\d+(?:[.,]\d+)?\b/g)||[]).filter(n=>numbers.has(n)).length;
   const factual=(source==="article"?1:0);
   const early=Math.max(0,11-index*1.25);
   const clarity=sentence.length>=35&&sentence.length<=180?8:0;
   const unclear=/^(?:il|elle|ils|elles|cela|ce dernier|cette dernière|celui-ci|celle-ci)\b/i.test(sentence)?-25:0;
   return overlap*5+themes*2.5+Math.min(numberCount,3)*4+early+clarity+factual+unclear;
  }
  const ordered=[];
  if(headline)ordered.push({text:headline,from:"titre initial",index:0,source:"headline"});
  extracted.forEach((text,index)=>ordered.push({text,from:"article · passage "+(index+1),index,source:"article"}));
  const scored=ordered.map(item=>{
    const short=cutToLimit(item.text,limit,maxWords);
    const score=relevance(item.text,item.index,item.source) + (item.source==="headline"?6:0) - (short.cut?42:0)
      -(short.title.length<26?15:0);
    return {...item,...short,score};
  }).filter(x=>x.title.length>=18&&x.score>-100).sort((a,b)=>b.score-a.score);
  const picked=[],used=new Set();
  for(const x of scored){
   const key=normalize(x.title).replace(/[^a-z0-9]/g,"");
   if(used.has(key)||[...used].some(prev=>prev.includes(key)||key.includes(prev)))continue;
   used.add(key);picked.push({title:x.title,source:x.from,needsReview:x.cut,sourceSentence:x.text.slice(0,280)});
   if(picked.length>=3)break;
  }
  if(!picked.length&&headline){
   const clip=cutToLimit(headline,limit,maxWords);
   picked.push({title:clip.title,source:"titre initial",needsReview:clip.cut,sourceSentence:headline});
  }
  return {candidates:picked,keywords:wordWeights.slice(0,8).map(x=>x[0]),sentencesReviewed:extracted.length,
   engine:"Extractif français · stopwords-fr (MIT)",message:body.length<110?
     "Contenu trop court pour une analyse fiable : ajoutez l’article intégral.":"Propositions extraites du texte fourni. Vérifiez les faits et la formulation avant publication."};
 }
 root.TVPlusFrenchHeadlines={suggest,version:"1.0.0",license:"MIT (stopwords-fr)",wordsLoaded:frStopwords.size};
})(typeof window!=="undefined"?window:globalThis);
