const plans = [
    {
        name: 'Honda NXR 160 Bros CBS',
        img: 'bros.png',
        type: 'moto',
        price: 610,
        credit: 27000,
        meses: 60,
        tag: 'AVENTURA'
    },
    {
        name: 'Honda CG Titan 160',
        img: 'titan.png',
        type: 'moto',
        price: 560,
        credit: 24850,
        meses: 60,
        tag: 'ESTILO'
    },
    {
        name: 'Honda PCX 160 CBS',
        img: 'pcx.png',
        type: 'scooter',
        price: 510,
        credit: 22800,
        meses: 60,
        tag: 'CONFORTO'
    },
    {
        name: 'Honda Biz 125 ES',
        img: 'biz.png',
        type: 'moto',
        price: 370,
        credit: 16700,
        meses: 60,
        tag: 'PRATICIDADE'
    },
    {
        name: 'Honda Pop 110i ES',
        img: 'pop.png',
        type: 'moto',
        price: 299,
        credit: 13350,
        meses: 60,
        tag: 'ECONOMIA'
    },
    {
        name: 'Scooter elétrica',
        img: 'eletrica.png',
        type: 'eletrica',
        price: 230,
        credit: 10000,
        meses: 60,
        tag: 'MOBILIDADE'
    }
];

const money = v => v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
});

const products = document.querySelector('#products');

function apiBase() {
    if (location.pathname.startsWith('/sites/')) return '';
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:3001';
    }
    return 'https://conix.api.br/conix';
}

function tipoDoNome(nome) {
    const n = String(nome || '').toLowerCase();
    if (n.includes('elétr') || n.includes('eletr')) return 'eletrica';
    if (n.includes('scooter') || n.includes('pcx')) return 'scooter';
    if (/biz|pop|titan|bros|nxr|\bcg\b|moto/.test(n)) return 'moto';
    return 'outro';
}

function assetConhecido(nome) {
    const n = String(nome || '');
    if (/bros|nxr/i.test(n)) return 'bros.png';
    if (/titan/i.test(n)) return 'titan.png';
    if (/pcx/i.test(n)) return 'pcx.png';
    if (/biz/i.test(n)) return 'biz.png';
    if (/pop/i.test(n)) return 'pop.png';
    if (/el[eé]tric/i.test(n)) return 'eletrica.png';
    return '';
}

function srcImagem(p) {
    if (!p.img) return '';
    if (/^(https?:|assets\/)/i.test(p.img)) return p.img;
    return `assets/${p.img}`;
}

function precoHero(valor) {
    const n = Number(valor) || 0;
    const inteiro = Math.abs(n - Math.round(n)) < 0.001;
    const texto = inteiro
        ? Math.round(n).toLocaleString('pt-BR')
        : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `R$ ${texto}/mês`;
}

function slidesHero(lista) {
    const slides = [];
    for (const bem of lista) {
        const planos = Array.isArray(bem.planos) && bem.planos.length
            ? bem.planos
            : [{ price: bem.price }];
        for (const plano of planos) {
            const src = srcImagem(bem);
            if (!src || !plano.price) continue;
            slides.push({
                name: String(bem.name || '').toUpperCase(),
                src,
                alt: bem.name,
                preco: precoHero(plano.price),
            });
        }
    }
    return slides;
}

function iniciarHero(lista) {
    const img = document.querySelector('.hero-bike');
    const label = document.querySelector('.float-label');
    const nome = label?.querySelector('span');
    const preco = label?.querySelector('b');
    if (!img || !nome || !preco) return;

    const slides = slidesHero(lista);
    if (!slides.length) return;

    slides.forEach((slide) => {
        const preload = new Image();
        preload.src = slide.src;
    });

    let indice = 0;
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const aplicar = (slide) => {
        img.src = slide.src;
        img.alt = slide.alt;
        nome.textContent = slide.name;
        preco.textContent = slide.preco;
        img.classList.remove('is-out');
        label.classList.remove('is-out');
    };

    const mostrar = (index) => {
        const slide = slides[index];
        if (reduzido) {
            aplicar(slide);
            return;
        }
        img.classList.add('is-out');
        label.classList.add('is-out');
        window.setTimeout(() => aplicar(slide), 280);
    };

    aplicar(slides[0]);
    if (slides.length < 2 || window.__heroCarousel) return;
    window.__heroCarousel = window.setInterval(() => {
        indice = (indice + 1) % slides.length;
        mostrar(indice);
    }, 4500);
}

function planosDoCatalogo(data) {
    const lista = [];
    for (const grupo of data.grupos || []) {
        if (!(Number(grupo.cotas_disponiveis) > 0)) continue;
        for (const bem of grupo.bens || []) {
            const name = String(bem.bem || bem.nome || '').trim();
            if (!name) continue;
            const local = assetConhecido(name);
            lista.push({
                name,
                img: local || bem.imagem_url || '',
                type: tipoDoNome(name),
                price: Number(bem.valor_parcela) || 0,
                credit: Number(bem.valor_bem) || 0,
                meses: Number(bem.total_meses) || 0,
                grupoId: Number(grupo.id) || 0,
                grupo: String(grupo.nome || '').trim(),
                planos: Array.isArray(bem.planos)
                    ? bem.planos
                        .map((plano) => ({
                            price: Number(plano.valor_parcela) || 0,
                            meses: Number(plano.total_meses) || 0,
                            dia: Number(plano.dia_vencimento) || 0,
                        }))
                        .filter((plano) => plano.price > 0)
                    : [],
            });
        }
    }
    return lista;
}

function renderPlans(lista) {
    products.innerHTML = lista.map((p, i) => {

        const planos = Array.isArray(p.planos) ? p.planos : [];
        const varios = planos.length > 1;
        const msgDe = (plano) => {
            const price = plano?.price || p.price;
            const meses = plano?.meses ? `, ${plano.meses} meses` : '';
            const dia = plano?.dia ? `, vencimento todo dia ${plano.dia}` : '';
            return encodeURIComponent(
                price
                    ? `Olá! Vi no site da INVVEST os planos da INVVEST e quero saber mais sobre ${p.name}, parcela de ${money(price)}${meses}${dia}, crédito de ${money(p.credit)}.`
                    : `Olá! Vi no site da INVVEST os planos da INVVEST e quero saber mais sobre ${p.name}, crédito de ${money(p.credit)}.`
            );
        };
        const msg = msgDe();

        return `
        <article
            class="product reveal"
            data-type="${p.type}"
            data-grupo="${p.grupoId || ''}"
            style="--i:${i}"
        >
        <div class="product-scene">
        <div class="product-flip">
        <div class="product-front">

            <div class="product-visual">

                ${p.grupo ? `<div class="product-number">${p.grupo}</div>` : ''}

                <button type="button" class="cotas-open">
                    Ver Cotas Disponíveis
                </button>

                <img
                    loading="lazy"
                    src="${srcImagem(p)}"
                    alt="${p.name}"
                >

            </div>

            <div class="product-info">

                <div class="product-overline">
                    ${planos.length > 1
                        ? 'PLANOS INVVEST'
                        : (p.meses ? `PLANOS INVVEST · ${p.meses} MESES` : 'PLANOS INVVEST')}
                </div>

                <h3>${p.name}</h3>

                ${varios ? '' : `
                <div class="price-caption">
                    PARCELAS A PARTIR DE
                </div>

                <div class="price">
                    ${p.price ? money(p.price) : '—'}
                    <small>/mês</small>
                </div>
                `}

                ${varios ? `
                <ul class="plan-list">
                    ${planos.map((plano) => `
                    <li>
                        <div class="plan-line">
                            <strong>${money(plano.price)}<small>/mês</small></strong>
                            <span>${[plano.meses ? `${plano.meses} MESES` : '', plano.dia ? `VENCIMENTO DIA ${plano.dia}` : ''].filter(Boolean).join(' · ')}</span>
                        </div>
                        <a
                            class="product-btn"
                            href="https://wa.me/5527995202040?text=${msgDe(plano)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Quero este plano
                            <span>↗</span>
                        </a>
                    </li>
                    `).join('')}
                </ul>
                ` : ''}

                <div class="specs${varios ? ' specs-one' : ''}">

                    <div>
                        <span>VALOR DO CRÉDITO</span>
                        <strong>${money(p.credit)}</strong>
                    </div>

                    ${varios ? '' : `
                    <div>
                        <span>VENCIMENTO</span>
                        <strong>${(() => {
                            const dia = planos[0]?.dia;
                            return dia >= 1 && dia <= 31 ? `Todo dia ${dia}` : 'Todo dia 10';
                        })()}</strong>
                    </div>
                    `}

                </div>

                ${varios ? '' : `
                <a
                    class="product-btn"
                    href="https://wa.me/5527995202040?text=${msg}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Quero este plano
                    <span>↗</span>
                </a>
                `}

            </div>

        </div>

        <div class="product-back">
            <div class="product-overline">COTAS DISPONÍVEIS</div>
            <h3>${p.name}</h3>
            <p class="cotas-status">Carregando…</p>
            <div class="cotas-grid"></div>
            <button type="button" class="cotas-back">Voltar</button>
        </div>

        </div>
        </div>
        </article>
    `;

    }).join('');

    document.querySelectorAll('#products .reveal').forEach(e => {
        observer.observe(e);
    });
}

const observer = new IntersectionObserver(
    entries => entries.forEach(e => {

        if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        }

    }),
    {
        threshold: .08
    }
);

document.querySelectorAll('.reveal').forEach(e => {
    observer.observe(e);
});

const cotasCache = new Map();

function preencherCotas(card, numeros) {
    const status = card.querySelector('.cotas-status');
    const grid = card.querySelector('.cotas-grid');
    const lista = (Array.isArray(numeros) ? numeros : [])
        .map((item) => String(item || '').trim())
        .filter((item) => /^\d+$/.test(item));
    if (!lista.length) {
        status.textContent = 'Nenhuma cota disponível para venda neste grupo.';
        grid.replaceChildren();
        return;
    }
    status.textContent = lista.length === 1
        ? '1 cota disponível'
        : `${lista.length} cotas disponíveis`;
    grid.innerHTML = lista.map((item) => `<span>${item}</span>`).join('');
}

async function mostrarCotas(card) {
    const status = card.querySelector('.cotas-status');
    const grupoId = Number(card.dataset.grupo);
    if (!grupoId) {
        status.textContent = 'Cotas indisponíveis no momento.';
        return;
    }
    if (cotasCache.has(grupoId)) {
        preencherCotas(card, cotasCache.get(grupoId));
        return;
    }
    status.textContent = 'Carregando…';
    try {
        const resposta = await fetch(`${apiBase()}/public/landing/invvest/grupos/${grupoId}/cotas`, {
            headers: { Accept: 'application/json' },
        });
        if (!resposta.ok) throw new Error('cotas');
        const dados = await resposta.json();
        const numeros = Array.isArray(dados.numeros) ? dados.numeros : [];
        cotasCache.set(grupoId, numeros);
        if (card.classList.contains('is-flipped')) preencherCotas(card, numeros);
    } catch {
        if (card.classList.contains('is-flipped')) {
            status.textContent = 'Não foi possível carregar as cotas.';
        }
    }
}

products.addEventListener('click', (event) => {
    const card = event.target.closest('.product');
    if (!card || !products.contains(card)) return;
    if (event.target.closest('.cotas-back')) {
        card.classList.remove('is-flipped');
        return;
    }
    if (!event.target.closest('.cotas-open')) return;
    card.classList.add('is-flipped');
    mostrarCotas(card);
});

async function carregarCatalogo() {
    try {
        const resposta = await fetch(`${apiBase()}/public/landing/invvest`, {
            headers: { Accept: 'application/json' },
        });
        if (!resposta.ok) throw new Error('catalogo indisponivel');
        const dados = await resposta.json();
        const vivos = planosDoCatalogo(dados);
        const lista = vivos.length ? vivos : plans;
        renderPlans(lista);
        iniciarHero(lista);
    } catch {
        renderPlans(plans);
        iniciarHero(plans);
    }
}

carregarCatalogo();

document.querySelectorAll('.filter').forEach(btn => {

    btn.addEventListener('click', () => {

        document.querySelectorAll('.filter').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        document.querySelectorAll('.product').forEach(card => {
            card.hidden =
                btn.dataset.filter !== 'todos' &&
                card.dataset.type !== btn.dataset.filter;
        });

    });

});

const menuBtn = document.querySelector('#menuBtn');
const menu = document.querySelector('#menu');

menuBtn.addEventListener('click', () => {

    const open = menu.classList.toggle('open');

    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '✕' : '☰';

});

menu.querySelectorAll('a').forEach(a => {

    a.addEventListener('click', () => {

        menu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = '☰';

    });

});

document.querySelector('#year').textContent =
    new Date().getFullYear();

let ticking = false;

window.addEventListener('scroll', () => {

    if (!ticking) {

        requestAnimationFrame(() => {

            const max =
                document.documentElement.scrollHeight - innerHeight;

            document.querySelector('#progress').style.width =
                (max > 0 ? scrollY / max * 100 : 0) + '%';

            ticking = false;

        });

        ticking = true;

    }

}, {
    passive: true
});


/* ==================================================
   VÍDEOS DO INSTAGRAM — DUAS PUBLICAÇÕES

   Os posts são incorporados com o player oficial do
   Instagram. É possível clicar para assistir SEM SAIR
   do site quando o Instagram permitir a incorporação.
   O Instagram pode exigir login, bloquear a reprodução
   ou não permitir autoplay. O link original permanece
   disponível logo abaixo de cada publicação.

   Futuramente, você também pode adicionar MP4 de vídeos
   próprios em assets/reels/ para reprodução nativa.
================================================== */
const instagramReels = [
    {
        titulo: 'Vídeo 01 — INVVEST',
        video: '',
        url: 'https://www.instagram.com/p/DchRBZkBw6H/',
        poster: ''
    },
    {
        titulo: 'Vídeo 02 — INVVEST',
        video: '',
        url: 'https://www.instagram.com/p/DerWActFW4v/?img_index=1',
        poster: ''
    }
];

function urlReelValida(valor) {
    try {
        const url = new URL(String(valor || ''));
        const hostValido = url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com';
        if (url.protocol !== 'https:' || !hostValido) return '';
        const correspondencia = url.pathname.match(/^\/(reel|p)\/([a-zA-Z0-9_-]+)\/?$/);
        if (!correspondencia) return '';
        const indice = url.searchParams.get('img_index');
        const query = indice && /^[1-9]\d?$/.test(indice) ? `?img_index=${indice}` : '';
        return `https://www.instagram.com/${correspondencia[1]}/${correspondencia[2]}/${query}`;
    } catch {
        return '';
    }
}

function criarElemento(tag, classes, texto) {
    const elemento = document.createElement(tag);
    if (classes) elemento.className = classes;
    if (texto != null) elemento.textContent = texto;
    return elemento;
}

function montarReels() {
    const trilho = document.querySelector('#reelsRail');
    const btnAnterior = document.querySelector('#reelsPrev');
    const btnProximo = document.querySelector('#reelsNext');
    if (!trilho) return;

    instagramReels.forEach((reel) => {
        const link = urlReelValida(reel.url);
        const arquivo = String(reel.video || '').trim();
        const poster = String(reel.poster || '').trim();
        const card = criarElemento('article', 'reel-card');
        const media = criarElemento('div', 'reel-media');
        const tag = criarElemento('span', 'reel-live-tag', 'INVVEST REELS');

        if (link && archivoMp4Valido(arquivo)) {
            const ancora = criarElemento('a', 'reel-video-link');
            ancora.href = link;
            ancora.target = '_blank';
            ancora.rel = 'noopener noreferrer';
            ancora.setAttribute('aria-label', `Assistir ${reel.titulo} no Instagram`);
            const video = criarElemento('video');
            video.muted = true;
            video.defaultMuted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.setAttribute('muted','');
            video.setAttribute('playsinline','');
            video.setAttribute('disablepictureinpicture','');
            video.src = arquivo;
            if (poster) video.poster = poster;
            const overlay = criarElemento('div', 'reel-on-video');
            overlay.append(criarElemento('span', '', 'ASSISTA NO INSTAGRAM'), criarElemento('strong', '', '↗'));
            ancora.append(video, overlay);
            media.append(ancora);
        } else if (link) {
            // Um iframe é reproduzível conforme as permissões do Instagram,
            // mas o autoplay não pode ser imposto por este site.
            const frame = criarElemento('iframe', 'reel-iframe');
            const publicacao = new URL(link);
            const incorporacao = new URL(`https://www.instagram.com${publicacao.pathname}embed/`);
            // Mantém o índice escolhido nas publicações em carrossel, se suportado pelo Instagram.
            const indice = publicacao.searchParams.get('img_index');
            if (indice) incorporacao.searchParams.set('img_index', indice);
            frame.src = incorporacao.toString();
            frame.title = `Publicação do Instagram: ${reel.titulo}`;
            frame.loading = 'lazy';
            frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            media.append(frame);
        } else {
            const preview = criarElemento('div', 'reel-preview');
            if (poster) {
                const img = criarElemento('img');
                img.src = poster;
                img.alt = '';
                img.loading = 'lazy';
                preview.append(img);
            }
            const informacoes = criarElemento('div', 'reel-preview-info');
            informacoes.append(criarElemento('span', '', 'ESPAÇO PARA O VÍDEO'), criarElemento('strong', '', '▶'));
            preview.append(informacoes);
            media.append(preview);
        }
        if (link && archivoMp4Valido(arquivo)) media.append(tag);
        const descricao = criarElemento('div', 'reel-copy');
        if (link) {
            const visita = criarElemento('a', 'reel-open', 'Ver no Instagram ↗');
            visita.href = link;
            visita.target = '_blank';
            visita.rel = 'noopener noreferrer';
            descricao.append(visita);
        } else {
            descricao.append(criarElemento('span', 'reel-coming', 'Aguardando vídeo e link'));
        }
        card.append(media, descricao);
        trilho.append(card);
    });

    function atualizarSetas() {
        const fim = trilho.scrollWidth - trilho.clientWidth;
        if (btnAnterior) btnAnterior.disabled = trilho.scrollLeft <= 4;
        if (btnProximo) btnProximo.disabled = trilho.scrollLeft >= fim - 4;
    }
    function mover(direcao) {
        const card = trilho.querySelector('.reel-card');
        if (!card) return;
        const espacamento = parseFloat(getComputedStyle(trilho).gap) || 18;
        trilho.scrollBy({ left: direcao * (card.getBoundingClientRect().width + espacamento), behavior: 'smooth' });
    }
    btnAnterior?.addEventListener('click', () => mover(-1));
    btnProximo?.addEventListener('click', () => mover(1));
    trilho.addEventListener('scroll', atualizarSetas, { passive: true });
    window.addEventListener('resize', atualizarSetas);
    requestAnimationFrame(atualizarSetas);

    // Evita consumir dados/reproduzir vídeos que estão fora da tela.
    const visibilidade = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            const video = entrada.target;
            if (entrada.isIntersecting && !document.hidden) {
                const tentativa = video.play();
                if (tentativa?.catch) tentativa.catch(() => {});
            } else video.pause();
        });
    }, { threshold: .5 });
    trilho.querySelectorAll('video').forEach((video) => visibilidade.observe(video));
    document.addEventListener('visibilitychange', () => {
        trilho.querySelectorAll('video').forEach((video) => {
            if (document.hidden) video.pause();
            else if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) {
                const tentativa = video.play();
                if (tentativa?.catch) tentativa.catch(() => {});
            }
        });
    });
}

function archivoMp4Valido(caminho) {
    return /^(?:assets\/reels\/[^\s?#]+\.mp4|https:\/\/[^\s]+\.mp4(?:\?[^\s]*)?)$/i.test(caminho);
}

montarReels();
