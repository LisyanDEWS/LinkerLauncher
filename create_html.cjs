const fs = require('fs');
const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Frame / Wallpaper Library</title>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root { --ink:#1d1b20; --muted:#625b66; --paper:#fff9f7; --surface:#f5eff3; --surface-2:#ede5ef; --line:#d3c6d1; --primary:#755f9a; --primary-ink:#fff; --focus:#e9ddff; --shadow:0 18px 44px rgba(56,39,66,.12); }
[data-theme="dark"] { --ink:#e9e0e7; --muted:#cec1cc; --paper:#171217; --surface:#231c23; --surface-2:#302630; --line:#514653; --primary:#d6bbff; --primary-ink:#3b245d; --focus:#473165; --shadow:0 18px 44px rgba(0,0,0,.34); }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; min-width:320px; color:var(--ink); background:var(--paper); font-family:Manrope,Arial,sans-serif; transition:background-color .3s ease,color .3s ease; }
button,input { font:inherit; }
button { color:inherit; }
.topbar { position:sticky; top:0; z-index:20; border-bottom:1px solid color-mix(in srgb,var(--line) 82%,transparent); background:color-mix(in srgb,var(--paper) 88%,transparent); backdrop-filter:blur(18px); }
.topbar-inner { width:min(1440px,calc(100% - 40px)); min-height:80px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:24px; }
.brand { display:flex; align-items:center; gap:11px; text-decoration:none; color:var(--ink); }
.brand-mark { display:grid; place-items:center; width:39px; height:39px; border-radius:14px 14px 5px 14px; background:var(--primary); color:var(--primary-ink); font:500 14px/1 "DM Mono",monospace; transform:rotate(-6deg); }
.brand-name { font-size:18px; font-weight:800; letter-spacing:-.045em; }
.brand-name small { display:block; margin-top:1px; color:var(--muted); font:500 9px/1.2 "DM Mono",monospace; letter-spacing:.08em; }
.topbar-actions { display:flex; align-items:center; gap:10px; }
.search { position:relative; width:min(360px,34vw); }
.search input { width:100%; height:45px; padding:0 17px 0 42px; border:1px solid transparent; border-radius:16px; outline:none; color:var(--ink); background:var(--surface); transition:border-color .2s ease,background .2s ease; }
.search input:focus { border-color:var(--primary); background:var(--paper); }
.search svg { position:absolute; left:15px; top:13px; width:18px; height:18px; stroke:var(--muted); }
.round-button,.filter,.text-button { border:0; cursor:pointer; transition:transform .2s ease,background .2s ease,color .2s ease; }
.round-button { display:grid; place-items:center; width:45px; height:45px; border-radius:50%; color:var(--ink); background:var(--surface); }
.round-button:hover,.round-button:focus-visible { transform:rotate(12deg); background:var(--focus); outline:none; }
.round-button svg { width:20px; height:20px; stroke:currentColor; }
main { width:min(1440px,calc(100% - 40px)); margin:0 auto; padding:58px 0 80px; }
.intro { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:42px; align-items:end; margin-bottom:42px; }
.eyebrow { margin:0 0 14px; color:var(--primary); font:500 11px/1 "DM Mono",monospace; letter-spacing:.1em; text-transform:uppercase; }
h1 { max-width:800px; margin:0; font-size:clamp(42px,6vw,82px); line-height:.99; letter-spacing:-.07em; font-weight:800; }
h1 span { color:var(--primary); }
.intro-copy { margin:17px 0 0; max-width:610px; color:var(--muted); font-size:16px; line-height:1.65; }
.library-total { padding:26px; border-radius:31px 31px 9px 31px; background:var(--surface); }
.library-total strong { display:block; font-size:54px; line-height:.95; letter-spacing:-.07em; color:var(--primary); }
.library-total span { display:block; margin-top:9px; color:var(--muted); font:500 11px/1.5 "DM Mono",monospace; text-transform:uppercase; }
.filter-row { display:flex; flex-wrap:wrap; gap:9px; padding:8px 0 36px; }
.filter { padding:11px 15px; border:1px solid var(--line); border-radius:14px; background:transparent; color:var(--ink); font-size:13px; font-weight:700; }
.filter:hover { background:var(--surface); transform:translateY(-2px); }
.filter.active { border-color:var(--primary); background:var(--primary); color:var(--primary-ink); }
.wallpaper-section { margin:0 0 54px; scroll-margin-top:104px; }
.section-heading { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:18px; }
.section-heading h2 { margin:0; font-size:clamp(22px,2.3vw,31px); line-height:1; letter-spacing:-.055em; }
.section-meta { margin:8px 0 0; color:var(--muted); font:500 11px/1.4 "DM Mono",monospace; text-transform:uppercase; }
.section-count { color:var(--primary); font:500 12px/1 "DM Mono",monospace; white-space:nowrap; }
.wallpaper-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.wallpaper { position:relative; min-width:0; aspect-ratio:16/9; overflow:hidden; border:0; border-radius:21px 21px 7px 21px; cursor:pointer; background:var(--surface-2); box-shadow:0 0 0 1px color-mix(in srgb,var(--line) 68%,transparent); animation:rise .55s both; animation-delay:calc(var(--item) * 24ms); }
.wallpaper img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .5s cubic-bezier(.2,.8,.2,1),filter .4s ease; }
.wallpaper.pixel img { image-rendering:pixelated; }
.wallpaper::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,transparent 43%,rgba(13,10,17,.78) 100%); opacity:0; transition:opacity .25s ease; }
.wallpaper:hover img,.wallpaper:focus-visible img { transform:scale(1.055); filter:saturate(1.08); }
.wallpaper:hover::after,.wallpaper:focus-visible::after { opacity:1; }
.wallpaper:focus-visible { outline:3px solid var(--primary); outline-offset:3px; }
.image-label { position:absolute; z-index:1; left:14px; right:14px; bottom:13px; color:white; text-align:left; opacity:0; transform:translateY(5px); transition:opacity .22s ease,transform .22s ease; }
.wallpaper:hover .image-label,.wallpaper:focus-visible .image-label { opacity:1; transform:translateY(0); }
.image-label strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; letter-spacing:-.02em; }
.image-label small { display:block; margin-top:3px; color:rgba(255,255,255,.72); font:500 9px/1 "DM Mono",monospace; text-transform:uppercase; }
.resolution { position:absolute; z-index:1; left:12px; top:12px; padding:6px 8px; border-radius:8px 8px 3px 8px; color:white; background:rgba(19,15,24,.67); backdrop-filter:blur(8px); font:500 9px/1 "DM Mono",monospace; }
.empty { padding:54px 20px; border:1px dashed var(--line); border-radius:24px; color:var(--muted); text-align:center; }
.dialog { position:fixed; z-index:50; inset:0; display:grid; place-items:center; padding:28px; border:0; background:rgba(15,11,17,.76); opacity:0; pointer-events:none; transition:opacity .2s ease; }
.dialog.show { opacity:1; pointer-events:auto; }
.dialog-panel { width:min(1120px,100%); overflow:hidden; border-radius:28px 28px 10px 28px; background:var(--paper); box-shadow:var(--shadow); transform:translateY(18px) scale(.985); transition:transform .28s cubic-bezier(.2,.8,.2,1); }
.dialog.show .dialog-panel { transform:translateY(0) scale(1); }
.dialog-image { display:block; width:100%; max-height:min(67vh,630px); aspect-ratio:16/9; object-fit:cover; background:var(--surface-2); }
.dialog-image.pixel-art { image-rendering:pixelated; }
.dialog-footer { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:21px 24px; }
.dialog-title { margin:0; font-size:19px; letter-spacing:-.04em; }
.dialog-detail { margin:5px 0 0; color:var(--muted); font:500 10px/1.4 "DM Mono",monospace; text-transform:uppercase; }
.dialog-actions { display:flex; gap:9px; }
.text-button { padding:11px 14px; border-radius:12px; color:var(--ink); background:var(--surface); font-size:13px; font-weight:800; text-decoration:none; }
.text-button:hover { transform:translateY(-2px); background:var(--surface-2); }
.text-button.primary { color:var(--primary-ink); background:var(--primary); }
.modal-close { position:fixed; top:20px; right:20px; z-index:1; }
@keyframes rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
@media (max-width:1050px) { .wallpaper-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (max-width:720px) { .topbar-inner,main { width:min(100% - 28px,1440px); } .topbar-inner { min-height:70px; } .brand-name small { display:none; } .search { width:auto; } .search input { width:45px; padding:0; color:transparent; cursor:pointer; } .search input:focus { width:min(52vw,280px); padding-left:42px; color:var(--ink); cursor:text; } main { padding-top:42px; } .intro { grid-template-columns:1fr; gap:25px; } .library-total { width:100%; padding:20px; } .library-total strong { font-size:42px; } .wallpaper-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; } .section-heading { align-items:start; } .section-count { padding-top:5px; } .dialog { padding:14px; } .dialog-footer { flex-direction:column; align-items:stretch; } .dialog-actions { width:100%; } .dialog-actions > * { flex:1; text-align:center; } }
</style>
</head>
<body>
<header class="topbar">
<div class="topbar-inner">
<a class="brand" href="#library" aria-label="Frame wallpaper library"><span class="brand-mark">F/</span><span class="brand-name">FRAME<small>wallpaper library</small></span></a>
<div class="topbar-actions">
<label class="search" aria-label="Поиск обоев"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.2 4.2"></path></svg><input id="search" type="search" placeholder="Поиск по коллекции"></label>
<button class="round-button" id="theme-toggle" type="button" aria-label="Переключить тему"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.55 1.55M16.85 16.85l1.55 1.55M18.4 5.6l-1.55 1.55M7.15 16.85 5.6 18.4"></path><circle cx="12" cy="12" r="4.1"></circle></svg></button>
</div>
</div>
</header>
<main id="library">
<section class="intro" aria-labelledby="page-title">
<div><p class="eyebrow">Desktop backgrounds / 16:9</p><h1 id="page-title">Выбери свой <span>фон.</span></h1><p class="intro-copy">Кураторская библиотека из 150 обоев для широкого экрана. Категории соответствуют содержимому: космос показывает космос, а Pixel Art создан в настоящей пиксельной стилистике.</p></div>
<div class="library-total" aria-label="150 обоев в коллекции"><strong id="total-count">150</strong><span>обоев / 9 категорий</span></div>
</section>
<nav class="filter-row" aria-label="Категории обоев" id="filters"></nav>
<div id="gallery"></div>
</main>
<div class="dialog" id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
<button class="round-button modal-close" id="close-dialog" type="button" aria-label="Закрыть просмотр"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"></path></svg></button>
<div class="dialog-panel"><img class="dialog-image" id="dialog-image" src="" alt=""><div class="dialog-footer"><div><h2 class="dialog-title" id="dialog-title"></h2><p class="dialog-detail" id="dialog-detail"></p></div><div class="dialog-actions"><a class="text-button" id="source-link" href="#" target="_blank" rel="noopener">Открыть оригинал</a><button class="text-button primary" id="apply-link" type="button">Применить обои</button></div></div></div>
</div>
<script>
const pexels = (id, ext = 'jpeg') => \`https://images.pexels.com/photos/\${id}/pexels-photo-\${id}.\${ext}\`;
const imageUrl = (source, size) => source.startsWith('data:') ? source : \`\${source}?auto=compress&cs=tinysrgb&fit=crop&w=\${size[0]}&h=\${size[1]}\`;
const sourcePools = {
'4k':[pexels(12260629,'png'),pexels(1632044),pexels(1525041),pexels(10394827),pexels(20572628),pexels(29607138),pexels(18099105),pexels(29106399),pexels(29106402),pexels(29698817)],
nature:[pexels(18296931),pexels(1525041),pexels(11917567),pexels(18062747),pexels(6016480),pexels(38880622),pexels(12721814),pexels(8558892),pexels(35060933),pexels(19161533)],
space:[pexels(9160637),pexels(37269546),pexels(2312040),pexels(37269529),pexels(36489751,'png'),pexels(37269532),pexels(2538107),pexels(37269550),pexels(4644812),pexels(11737041)],
city:[pexels(3075993),pexels(4261607),pexels(3980364),pexels(33878663),pexels(13259678),pexels(4034345),pexels(747101),pexels(1036657),pexels(18302561),pexels(11269298)],
abstract:[pexels(7135028),pexels(7135053),pexels(7130536),pexels(7135037),pexels(6985193),pexels(6985121),pexels(7135034),pexels(7135075),pexels(7135058),pexels(6985118)],
minimal:[pexels(7130496),pexels(7130490),pexels(7130491),pexels(7130469),pexels(4253271),pexels(4252899),pexels(28494633),pexels(4252525),pexels(29652324),pexels(4253062)],
dark:[pexels(167699),pexels(13258046),pexels(11735178),pexels(13258049),pexels(13258054),pexels(5459512),pexels(30773319),pexels(37911514),pexels(1909572),pexels(5431724)],
colorful:[pexels(13382071),pexels(15035617),pexels(15011846),pexels(15049825),pexels(15072693),pexels(15103625),pexels(15131893),pexels(15147961),pexels(11150766),pexels(15011845)]
};
const catalog = [
{id:'4k',label:'4K',title:'4K пейзажи',note:'Фото высокого разрешения',count:20,resolution:'3840 x 2160',names:['Австрийские Альпы','Горный хребет с высоты','Озеро Брайес','Зелёная долина','Снежные вершины','Арктический берег','Закат в Оберстдорфе','Татры и озеро','Зеркальная вода Татр','Швейцарский поток','Свет над Альпами','Каменные пики','Озеро в Доломитах','Облака над долиной','Северные горы','Ледяное побережье','Вечерний хребет','Высокогорное озеро','Снежное отражение','Альпийское утро']},
{id:'pixel',label:'Pixel Art',title:'Pixel Art',note:'Создано в пиксельной графике',count:15,resolution:'Pixel art / 16:9',names:['Неоновый мегаполис','Лунный форпост','Пиксельный закат','Горная долина','Ретро-аркада','Космический рейс','Лес после дождя','Океанский маяк','Красная пустыня','Северное сияние','Ночная ферма','Кибер-улица','Остров облаков','Порт после заката','Геймерская ночь']},
{id:'nature',label:'Природа',title:'Природа и озёра',note:'Горы, вода, леса',count:20,resolution:'2560 x 1440',names:['Лесное отражение','Озеро Брайес','Маттерхорн','Озеро Гайсальп','Тирольское утро','Домик у Оберзее','Туманное озеро','Альберта','Зимний Халльштатт','Озеро в Тироле','Береговой лес','Доломиты','Швейцарские вершины','Зелёное озеро','Снег и сосны','Баварский берег','Горный туман','Ледяная гладь','Зима в Альпах','Спокойная вода']},
{id:'space',label:'Космос',title:'Космос и туманности',note:'Реальные космические фотографии',count:15,resolution:'3840 x 2160',names:['Туманность Северная Америка','Глубокая туманность','Млечный Путь','Звёздное облако','Красная туманность','Бирюзовый космос','Галактика ночью','Зелёная туманность','Ночное звёздное небо','Фиолетовый Млечный Путь','Свет в туманности','Космический горизонт','Тысячи звёзд','Северное небо','Звёздная глубина']},
{id:'city',label:'Города',title:'Города ночью',note:'Скайлайны и улицы',count:15,resolution:'2560 x 1440',names:['Нью-Йорк: ночь','Город сверху','Чёрно-белый скайлайн','Свет над Манхэттеном','Бруклинский мост','Сингапурская бухта','Огни Гудзона','Чикаго на закате','Ночной проспект','Вена после заката','Манхэттенские огни','Городская сетка','Нью-Йорк и вода','Световой мост','Стеклянный горизонт']},
{id:'abstract',label:'Абстракция',title:'Цветовая абстракция',note:'Градиенты и цветовые поля',count:20,resolution:'2560 x 1440',names:['Лиловый спектр','Пастельный переход','Мягкий рассвет','Синий и красный','Цветной свет','Три цвета','Зелёная волна','Голубая глубина','Светлый спектр','Фиолетовый поток','Сиреневый переход','Воздушная пастель','Синий импульс','Красно-синяя волна','Тёплый свет','RGB-поле','Мятная глубина','Синий спектр','Светлая тишина','Ультрафиолет']},
{id:'minimal',label:'Минимализм',title:'Минимализм',note:'Чистые формы и мягкий свет',count:15,resolution:'2560 x 1440',names:['Мягкий синий свет','Белая вспышка','Сиреневый градиент','Пастельный воздух','Два цвета','Чёрно-белые слои','Розовая геометрия','Серые листы','Монохромная дуга','Теал и жёлтый','Чистая композиция','Световое поле','Тонкая структура','Спокойные линии','Минимум цвета']},
{id:'dark',label:'Тёмные',title:'Тёмные ландшафты',note:'Туман, леса и тяжёлое небо',count:15,resolution:'2560 x 1440',names:['Туманный склон','Гроза над хребтом','Озеро в Уэльсе','Лес в облаках','Сквозь туман','Тёмные горы','Шотландское плато','Холмы Слайго','Лесная мгла','Дорога в тумане','Тёмные сосны','Облачный перевал','Вечернее озеро','Густой лес','Горная тень']},
{id:'colorful',label:'Яркие',title:'Яркое искусство',note:'Краска, цвет и движение',count:15,resolution:'2560 x 1440',names:['Радужный жест','Акриловый взрыв','Цветовые мазки','Оранжевый ритм','Красный и синий','Экспрессивное поле','Синий акцент','Краска в движении','Радужные капли','Яркий холст','Насыщенный поток','Жёлтый импульс','Цветная материя','Смелые мазки','Живой пигмент']}
];
function pixelArt(index) {
const palettes=[['#161b4b','#303b7a','#ed6a5a','#ffd166','#f7f4e9'],['#0e2237','#155e75','#16c79a','#ffe66d','#edf6f9'],['#2d133c','#563b8b','#e45c96','#ffcb69','#ffe9e3'],['#052e2b','#0b5d5a','#52b788','#d8f3dc','#f4e285'],['#200b2b','#4b1f5e','#8e44ad','#00d4ff','#f9f7f7']][index%5];
const rand=seed=>((Math.sin(seed*942.37)+1)/2);
const stars=Array.from({length:45},(_,i)=>{const x=Math.floor(rand(index*60+i)*320/3)*3;const y=Math.floor(rand(index*89+i)*72/3)*3;const s=i%7===0?4:2;return \`<rect x="\${x}" y="\${y}" width="\${s}" height="\${s}" fill="\${palettes[4]}" opacity="\${.3+(i%5)/8}"/>\`;}).join('');
const skyline=Array.from({length:16},(_,i)=>{const h=20+Math.floor(rand(index*37+i)*48);const x=i*21-6;const lit=i%3===0?palettes[3]:palettes[1];return \`<rect x="\${x}" y="\${180-h}" width="18" height="\${h}" fill="\${palettes[0]}"/><rect x="\${x+5}" y="\${180-h+9}" width="4" height="4" fill="\${lit}"/><rect x="\${x+5}" y="\${180-h+22}" width="4" height="4" fill="\${lit}"/>\`;}).join('');
const y=108+(index%4)*6;
const svg=\`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" shape-rendering="crispEdges"><rect width="320" height="180" fill="\${palettes[0]}"/><rect y="74" width="320" height="106" fill="\${palettes[1]}"/>\${stars}<rect x="\${39+index%6*25}" y="\${23+index%4*7}" width="28" height="28" fill="\${palettes[3]}"/><rect x="\${35+index%6*25}" y="\${27+index%4*7}" width="36" height="20" fill="\${palettes[3]}"/><polygon points="0,\${y+49} 82,\${y-18} 145,\${y+49}" fill="\${palettes[2]}"/><polygon points="65,\${y+49} 184,\${y-38} 295,\${y+49}" fill="\${palettes[0]}"/><polygon points="148,\${y-18} 184,\${y-38} 214,\${y-12} 190,\${y-19}" fill="\${palettes[4]}"/><rect y="\${y+48}" width="320" height="58" fill="\${palettes[1]}"/><rect y="\${y+66}" width="320" height="6" fill="\${palettes[2]}" opacity=".7"/>\${skyline}</svg>\`;
return \`data:image/svg+xml;charset=utf-8,\${encodeURIComponent(svg)}\`;
}
const wallpapers=catalog.flatMap(category=>Array.from({length:category.count},(_,index)=>{const pixel=category.id==='pixel';const source=pixel?pixelArt(index):sourcePools[category.id][index%sourcePools[category.id].length];return {id:\`\${category.id}-\${index}\`,category:category.id,categoryTitle:category.title,name:category.names[index],resolution:category.resolution,pixel,preview:imageUrl(source,[1280,720]),full:imageUrl(source,[3840,2160])};}));
const gallery=document.getElementById('gallery');
const filters=document.getElementById('filters');
const search=document.getElementById('search');
let activeCategory='all';
let searchTerm='';
function makeFilters() { filters.innerHTML=''; [{id:'all',label:'Все 150'},...catalog.map(({id,label})=>({id,label}))].forEach(filter=>{const button=document.createElement('button');button.className=\`filter\${filter.id===activeCategory?' active':''}\`;button.type='button';button.textContent=filter.label;button.addEventListener('click',()=>{activeCategory=filter.id;makeFilters();renderGallery();});filters.appendChild(button);}); }
function wallpaperButton(wallpaper,index) { const button=document.createElement('button');button.className=\`wallpaper\${wallpaper.pixel?' pixel':''}\`;button.type='button';button.style.setProperty('--item',index%12);button.innerHTML=\`<img src="\${wallpaper.preview}" alt="\${wallpaper.name}" loading="lazy"><span class="resolution">\${wallpaper.pixel?'PIXEL ART':wallpaper.resolution}</span><span class="image-label"><strong>\${wallpaper.name}</strong><small>\${wallpaper.categoryTitle}</small></span>\`;button.addEventListener('click',()=>openDialog(wallpaper));return button; }
function renderGallery() { gallery.innerHTML='';const visible=catalog.filter(category=>activeCategory==='all'||activeCategory===category.id);let results=false;visible.forEach(category=>{const items=wallpapers.filter(wallpaper=>wallpaper.category===category.id&&wallpaper.name.toLowerCase().includes(searchTerm));if(!items.length)return;results=true;const section=document.createElement('section');section.className='wallpaper-section';section.id=\`section-\${category.id}\`;section.innerHTML=\`<div class="section-heading"><div><h2>\${category.title}</h2><p class="section-meta">\${category.note}</p></div><span class="section-count">\${items.length} / \${category.count}</span></div>\`;const grid=document.createElement('div');grid.className='wallpaper-grid';items.forEach((wallpaper,index)=>grid.appendChild(wallpaperButton(wallpaper,index)));section.appendChild(grid);gallery.appendChild(section);});if(!results)gallery.innerHTML='<div class="empty">Ничего не найдено. Попробуйте другой запрос.</div>'; }
const dialog=document.getElementById('dialog');const dialogImage=document.getElementById('dialog-image');const dialogTitle=document.getElementById('dialog-title');const dialogDetail=document.getElementById('dialog-detail');const sourceLink=document.getElementById('source-link');const applyLink=document.getElementById('apply-link');
function openDialog(wallpaper) { dialogImage.src=wallpaper.full;dialogImage.alt=wallpaper.name;dialogImage.classList.toggle('pixel-art',wallpaper.pixel);dialogTitle.textContent=wallpaper.name;dialogDetail.textContent=\`\${wallpaper.categoryTitle} / \${wallpaper.resolution}\${wallpaper.pixel?'':' / photo: Pexels'}\`;sourceLink.href=wallpaper.full;dialog.classList.add('show');document.body.style.overflow='hidden';document.getElementById('close-dialog').focus(); }
function closeDialog() { dialog.classList.remove('show');document.body.style.overflow=''; }
document.getElementById('close-dialog').addEventListener('click',closeDialog);dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDialog();});search.addEventListener('input',event=>{searchTerm=event.target.value.trim().toLowerCase();renderGallery();});
document.getElementById('theme-toggle').addEventListener('click',()=>{const dark=document.body.getAttribute('data-theme')==='dark';document.body.setAttribute('data-theme',dark?'light':'dark');});
document.getElementById('total-count').textContent=wallpapers.length;makeFilters();renderGallery();

// LinkerRu Integration:
applyLink.addEventListener('click', () => {
  window.parent.postMessage({ type: 'APPLY_WALLPAPER', payload: dialogImage.src }, '*');
  // Optional: show some feedback or close dialog
  applyLink.textContent = 'Применено!';
  setTimeout(() => {
    applyLink.textContent = 'Применить обои';
    closeDialog();
  }, 1000);
});
</script>
</body>
</html>`;

fs.writeFileSync('public/wallpaper-ext.html', html);
console.log('html created');
