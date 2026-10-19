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
