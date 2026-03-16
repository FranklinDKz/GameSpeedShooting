const $ = (seletor, el=document) => el.querySelector(seletor);
const $$ = (seletor, el=document) => [...el.querySelectorAll(seletor)];

const botaoMenuTema = $("#botaoMenuTema");
const popTema = $("#popTema");
const seletorTema = $("#seletorTema");
const pontoTema = $("#pontoTema");
const listaPresetsTema = $("#listaPresetsTema");
const botaoResetTema = $("#botaoResetTema");

const botoesAbas = $$(".aba");
const paineis = {
  momento: $("#aba-momento"),
  buscar: $("#aba-buscar"),
  biblioteca: $("#aba-biblioteca"),
};

const botaoIrMomento = $("#botaoIrMomento");
const botaoAtualizarMomento = $("#botaoAtualizarMomento");

const listaMomento = $("#listaMomento");
const formBuscar = $("#formBuscar");
const inputBuscar = $("#inputBuscar");
const listaBuscar = $("#listaBuscar");
const listaBiblioteca = $("#listaBiblioteca");

const audio = $("#audio");
const capa = $("#capa");
const titulo = $("#titulo");
const subtitulo = $("#subtitulo");
const chipAgora = $("#chipAgora");

const botaoTocar = $("#botaoTocar");
const iconeTocar = $("#iconeTocar");
const textoTocar = $("#textoTocar");

const botaoAnterior = $("#botaoAnterior");
const botaoProxima = $("#botaoProxima");
const botaoParar = $("#botaoParar");

const inputUpload = $("#inputUpload");
const listaFila = $("#listaFila");
const botaoLimparFila = $("#botaoLimparFila");

const toast = $("#toast");

let fila = [];
let indiceAtual = -1;
let bibliotecaLocal = [];

const CHAVE_TEMA = "alfy_tema";
const TEMA_PADRAO = "#0ded0d";
const PRESETS = ["#0ded0d","#00d4ff","#ff3d8d","#ffb020","#a78bfa","#22c55e","#f43f5e","#60a5fa"];

function mostrarToast(msg){
  toast.textContent = msg;
  toast.classList.add("mostrar");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => toast.classList.remove("mostrar"), 2200);
}

function setarChip(texto){
  chipAgora.textContent = texto;
}

function escaparHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function aplicarTema(hex){
  document.documentElement.style.setProperty("--tema", hex);
  seletorTema.value = hex;
  pontoTema.style.background = hex;
  localStorage.setItem(CHAVE_TEMA, hex);
}

function iniciarTema(){
  listaPresetsTema.innerHTML = "";
  PRESETS.forEach(cor => {
    const botao = document.createElement("button");
    botao.className = "preset";
    botao.type = "button";
    botao.style.background = cor;
    botao.title = cor;
    botao.addEventListener("click", () => {
      aplicarTema(cor);
      mostrarToast("Tema atualizado ✨");
    });
    listaPresetsTema.appendChild(botao);
  });

  const salvo = localStorage.getItem(CHAVE_TEMA) || TEMA_PADRAO;
  aplicarTema(salvo);
}

botaoMenuTema.addEventListener("click", () => popTema.classList.toggle("aberto"));

document.addEventListener("click", (e) => {
  if (!popTema.contains(e.target) && !botaoMenuTema.contains(e.target)) {
    popTema.classList.remove("aberto");
  }
});

seletorTema.addEventListener("input", () => aplicarTema(seletorTema.value));

botaoResetTema.addEventListener("click", () => {
  aplicarTema(TEMA_PADRAO);
  mostrarToast("Voltamos ao tema padrão ✅");
});

function setarAba(nome){
  botoesAbas.forEach(b => b.classList.toggle("ativa", b.dataset.aba === nome));

  Object.entries(paineis).forEach(([k, el]) => {
    if (k === nome){
      el.classList.remove("escondido");
      el.animate(
        [{opacity:0, transform:"translateY(8px)"},{opacity:1, transform:"translateY(0)"}],
        {duration:220, easing:"cubic-bezier(.2,.9,.2,1)"}
      );
    } else {
      el.classList.add("escondido");
    }
  });

  if (nome === "buscar") inputBuscar.focus?.();
}

botoesAbas.forEach(btn => btn.addEventListener("click", () => setarAba(btn.dataset.aba)));

botaoIrMomento.addEventListener("click", () => {
  setarAba("momento");
  paineis.momento.scrollIntoView({ behavior: "smooth", block: "start" });
});

function normalizarMusica(d){
  return {
    id: d.trackId ?? crypto.randomUUID(),
    titulo: d.trackName ?? d.titulo ?? "Sem título",
    artista: d.artistName ?? d.artista ?? "Artista",
    album: d.collectionName ?? d.album ?? "",
    capa: (d.artworkUrl100 || d.artworkUrl60 || d.capa || "assets/capa_padrão.png")
            .replace?.("100x100bb","300x300bb") ?? (d.capa || "assets/capa_padrão.png"),
    urlPreview: d.previewUrl ?? d.urlPreview ?? null,
    origem: d.origem ?? "online",
  };
}

async function trocarAudioComFade(novaUrl){
  for(let v = audio.volume; v >= 0; v -= 0.1){
    audio.volume = Math.max(0, v);
    await new Promise(r => setTimeout(r, 20));
  }

  audio.pause();
  audio.src = novaUrl;
  audio.volume = 0;

  try{
    await audio.play();
  }catch{
    mostrarToast("tocar");
  }
  for(let v = 0; v <= 1; v += 0.1){
    audio.volume = Math.min(1, v);
    await new Promise(r => setTimeout(r, 20));
  }
}

function setarUIAgora(musica){
  capa.src = musica.capa || "assets/capa_padrão.png";
  titulo.textContent = musica.titulo;
  subtitulo.textContent = `${musica.artista}${musica.album ? " • " + musica.album : ""}`;
}

function setarIconeTocar(tocando){
  iconeTocar.innerHTML = tocando
    ? `<path d="M7 6h4v12H7V6Zm6 0h4v12h-4V6Z" fill="currentColor"/>`
    : `<path d="M8 5v14l11-7-11-7Z" fill="currentColor"/>`;
  textoTocar.textContent = tocando ? "Pausar" : "Tocar";
}

function pararTudo(){
  audio.pause();
  audio.currentTime = 0;
  setarIconeTocar(false);
  setarChip("Parado");
}

async function tocarIndice(indice, autoTocar=false){
  const musica = fila[indice];
  if (!musica) return;

  indiceAtual = indice;
  setarUIAgora(musica);
  renderizarFila();

  if (!musica.urlPreview){
    audio.removeAttribute("src");
    audio.load();
    setarChip("Sem preview");
    mostrarToast("Esse item não tem preview 😕");
    return;
  }

  setarChip(musica.origem === "local" ? "Arquivo local" : "Preview");

  if (autoTocar){
    await trocarAudioComFade(musica.urlPreview);
    setarIconeTocar(true);
  } else {
    audio.src = musica.urlPreview;
  }
}

function adicionarNaFila(musica, autoTocar=true){
  fila.push(musica);
  renderizarFila();

  if (indiceAtual === -1) {
    tocarIndice(fila.length - 1, autoTocar);
    return;
  }
  mostrarToast("Adicionada à fila ✅");
}

botaoAnterior.addEventListener("click", () => {
  if (!fila.length) return mostrarToast("Sem fila ainda 😄");
  const anterior = Math.max(0, indiceAtual - 1);
  tocarIndice(anterior, true);
});

botaoProxima.addEventListener("click", () => {
  if (!fila.length) return mostrarToast("Sem fila ainda 😄");
  const proxima = Math.min(fila.length - 1, indiceAtual + 1);
  tocarIndice(proxima, true);
});

botaoTocar.addEventListener("click", async () => {
  if (indiceAtual === -1){
    if (!fila.length) return mostrarToast("Escolha uma música primeiro 😉");
    return tocarIndice(0, true);
  }
  if (audio.paused){
    try{
      await audio.play();
      setarIconeTocar(true);
      setarChip("Tocando");
    }catch{
      mostrarToast("Clique para iniciar (bloqueio do navegador).");
    }
  } else {
    audio.pause();
    setarIconeTocar(false);
    setarChip("Pausado");
  }
});

botaoParar.addEventListener("click", pararTudo);

audio.addEventListener("play", () => setarIconeTocar(true));
audio.addEventListener("pause", () => setarIconeTocar(false));
audio.addEventListener("ended", () => {
  if (indiceAtual >= 0 && indiceAtual < fila.length - 1){
    tocarIndice(indiceAtual + 1, true);
  } else {
    setarChip("Finalizou");
    setarIconeTocar(false);
  }
});

function renderizarFila(){
  listaFila.innerHTML = "";

  if (!fila.length){
    listaFila.innerHTML = `<div class="muted" style="font-size:12px">Sua fila está vazia. Clique em “Tocar” em alguma música.</div>`;
    return;
  }

  fila.forEach((m, i) => {
    const linha = document.createElement("div");
    linha.className = "item-fila";

    linha.innerHTML = `
      <img src="${escaparHtml(m.capa)}" alt="capa">
      <div class="info-fila">
        <div class="titulo-fila">${escaparHtml(m.titulo)}</div>
        <div class="desc-fila">${escaparHtml(m.artista)}${m.album ? " • " + escaparHtml(m.album) : ""}</div>
      </div>
      <button type="button" title="Remover">✕</button>
    `;

    linha.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "button") return;
      tocarIndice(i, true);
    });

    linha.querySelector("button").addEventListener("click", () => {
      fila.splice(i, 1);
      if (indiceAtual === i) {
        pararTudo();
        indiceAtual = -1;
      } else if (indiceAtual > i) {
        indiceAtual -= 1;
      }
      renderizarFila();
      mostrarToast("Removida da fila.");
    });

    if (i === indiceAtual) {
      linha.style.borderColor = "color-mix(in srgb, var(--tema) 55%, rgba(255,255,255,.12))";
      linha.style.background = "color-mix(in srgb, var(--tema) 10%, rgba(0,0,0,.25))";
    }

    listaFila.appendChild(linha);
  });
}

botaoLimparFila.addEventListener("click", () => {
  fila = [];
  indiceAtual = -1;
  renderizarFila();
  pararTudo();
  mostrarToast("Fila limpa ✅");
});

inputUpload.addEventListener("change", () => {
  const arquivo = inputUpload.files?.[0];
  if (!arquivo) return;

  const url = URL.createObjectURL(arquivo);
  const musica = normalizarMusica({
    titulo: arquivo.name.replace(/\.[^/.]+$/, ""),
    artista: "Você (local)",
    album: "Arquivo",
    capa: "assets/capa_padrão.png",
    urlPreview: url,
    origem: "local",
  });

  bibliotecaLocal.push(musica);
  renderizarBiblioteca();

  adicionarNaFila(musica, true);
  mostrarToast("Arquivo carregado 🎵");
});

function montarItemCartao(m){
  const el = document.createElement("div");
  el.className = "item-cartao";

  const desc = `${m.artista}${m.album ? " • " + m.album : ""}`;

  el.innerHTML = `
    <img class="thumb" src="${escaparHtml(m.capa)}" alt="capa">
    <div class="info">
      <div class="nome">${escaparHtml(m.titulo)}</div>
      <div class="descricao">${escaparHtml(desc)}</div>
    </div>
    <div class="acoes-mini">
      <button class="mini principal" type="button">▶ Tocar</button>
      <button class="mini" type="button">＋ Fila</button>
    </div>
  `;

  const [btTocarAgora, btFila] = el.querySelectorAll("button");

  btTocarAgora.addEventListener("click", () => {
    fila.push(m);
    renderizarFila();
    tocarIndice(fila.length - 1, true);
  });

  btFila.addEventListener("click", () => adicionarNaFila(m, false));

  return el;
}

function renderizarMomento(lista){
  listaMomento.innerHTML = "";
  if (!lista.length){
    listaMomento.innerHTML = `<div class="muted">Sem dados no momento. Tente atualizar.</div>`;
    return;
  }
  lista.forEach(m => listaMomento.appendChild(montarItemCartao(m)));
}

function renderizarBusca(lista){
  listaBuscar.innerHTML = "";
  if (!lista.length){
    listaBuscar.innerHTML = `<div class="muted">Nada encontrado. Tente outro termo.</div>`;
    return;
  }
  lista.forEach(m => listaBuscar.appendChild(montarItemCartao(m)));
}

function renderizarBiblioteca(){
  listaBiblioteca.innerHTML = "";
  if (!bibliotecaLocal.length){
    listaBiblioteca.innerHTML = `<div class="muted">Sua biblioteca local está vazia por enquanto.</div>`;
    return;
  }
  bibliotecaLocal.forEach(m => listaBiblioteca.appendChild(montarItemCartao(m)));
}

async function buscarNoItunes(termo, limite=18){
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&entity=song&limit=${limite}&country=BR`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Falha ao buscar");
  const data = await r.json();
  return (data.results || [])
    .filter(x => x.previewUrl)
    .map(normalizarMusica);
}

async function pegarMomentoApple(){
  const url = "https://rss.applemarketingtools.com/api/v2/br/music/most-played/50/songs.json";
  const r = await fetch(url);
  if (!r.ok) throw new Error("Feed indisponível");
  const data = await r.json();

  const itens = data?.feed?.results || [];
  const top = itens.slice(0, 16);

  const resolvido = await Promise.all(
    top.map(async (it) => {
      const termo = `${it.name} ${it.artistName}`;
      try{
        const res = await buscarNoItunes(termo, 3);
        return res[0] || normalizarMusica({
          titulo: it.name,
          artista: it.artistName,
          album: "Top do momento",
          capa: it.artworkUrl100 || it.artworkUrl60 || "assets/capa_padrão.png",
          urlPreview: null,
        });
      }catch{
        return normalizarMusica({
          titulo: it.name,
          artista: it.artistName,
          album: "Top do momento",
          capa: it.artworkUrl100 || it.artworkUrl60 || "assets/capa_padrão.png",
          urlPreview: null,
        });
      }
    })
  );

  const comPreview = resolvido.filter(x => x.urlPreview);
  const semPreview = resolvido.filter(x => !x.urlPreview);
  return [...comPreview, ...semPreview].slice(0, 16);
}

async function pegarMomentoFallback(){
  const palpite = ["matuê","anitta","luísa sonza","henrique e juliano","the weeknd","taylor swift","mc ig","linkin park"];
  const blocos = await Promise.all(palpite.map(p => buscarNoItunes(p, 4).catch(() => [])));
  const plano = blocos.flat();

  const vistos = new Set();
  const unicos = [];
  for (const m of plano){
    const chave = (m.titulo + "|" + m.artista).toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(m);
  }
  return unicos.slice(0, 16);
}

function esqueletoGrade(texto){
  return `
    <div class="muted" style="margin-bottom:10px">${escaparHtml(texto)}</div>
    ${Array.from({length:6}).map(() => `
      <div class="item-cartao" style="opacity:.7">
        <div class="thumb" style="background:rgba(255,255,255,.06)"></div>
        <div class="info">
          <div class="nome" style="height:12px;background:rgba(255,255,255,.06);border-radius:10px;width:70%"></div>
          <div class="descricao" style="height:10px;background:rgba(255,255,255,.05);border-radius:10px;width:55%;margin-top:8px"></div>
        </div>
        <div class="acoes-mini">
          <div class="mini" style="height:34px;background:rgba(255,255,255,.05);border-color:transparent"></div>
          <div class="mini" style="height:34px;background:rgba(255,255,255,.05);border-color:transparent"></div>
        </div>
      </div>
    `).join("")}
  `;
}

async function carregarMomento(){
  setarAba("momento");
  listaMomento.innerHTML = esqueletoGrade("Carregando o que tá bombando...");

  try{
    const lista = await pegarMomentoApple();
    renderizarMomento(lista);
    mostrarToast("Músicas do momento atualizadas ✅");
  }catch{
    const lista = await pegarMomentoFallback();
    renderizarMomento(lista);
    mostrarToast("Usei uma seleção alternativa (feed indisponível).");
  }
}

botaoAtualizarMomento.addEventListener("click", carregarMomento);

formBuscar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const termo = inputBuscar.value.trim();
  if (!termo) return mostrarToast("Escreve algo pra eu buscar 😄");

  listaBuscar.innerHTML = esqueletoGrade("Procurando músicas...");
  try{
    const lista = await buscarNoItunes(termo, 22);
    renderizarBusca(lista);
    mostrarToast(`Achei ${lista.length} opções com preview 🎧`);
  }catch{
    listaBuscar.innerHTML = `<div class="muted">Ops… não consegui buscar agora. Tenta de novo.</div>`;
  }
});

function iniciar(){
  iniciarTema();
  renderizarFila();
  renderizarBiblioteca();
  carregarMomento();

  setarChip("Pronto");
  setarIconeTocar(false);
}

iniciar();