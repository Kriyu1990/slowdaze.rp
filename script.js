
const API_URL = 'https://script.google.com/macros/s/AKfycbz-xM0ggbs882SpPIP7CchkUiWC78Mk9X7v1j5fLQd2HLbmiUqgMYrkPwOV37lsmbh04Q/exec';

function publicApi(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName =
      'slowdazeCallback_' + Date.now() + '_' +
      Math.random().toString(36).slice(2);

    const query = new URLSearchParams({
      api: '1',
      action,
      ...params,
      callback: callbackName
    });

    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('API ตอบกลับช้าเกินไป'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('เชื่อมต่อ API ไม่สำเร็จ'));
    };

    script.src = API_URL + '?' + query.toString();
    document.body.appendChild(script);
  });
}

const $ = id => document.getElementById(id);

function showError(id, message) {
  const el = $(id);
  if (el) el.textContent = message;
}

function safeLink(url) {
  try {
    const u = new URL(String(url || ''));
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}

function makeCard(className, title, description) {
  const card = document.createElement('article');
  card.className = className;

  const heading = document.createElement('h3');
  heading.textContent = title || 'ไม่ระบุชื่อ';

  const text = document.createElement('p');
  text.textContent = description || '';

  card.append(heading, text);
  return card;
}

function renderPortfolio(data) {
  const grid = $('portfolioGrid');
  grid.replaceChildren();

  const items = Array.isArray(data.portfolio) ? data.portfolio : [];

  if (!items.length) {
    showError('portfolioStatus', 'ยังไม่มีผลงานที่เผยแพร่');
    return;
  }

  showError('portfolioStatus', '');

  items.forEach(item => {
    const card = makeCard(
      'portfolio-card',
      item.title || item.category || 'ผลงานภาพถ่าย',
      item.description || ''
    );

    const url = safeLink(item.imageUrl);
    if (url) {
      const image = document.createElement('img');
      image.src = url;
      image.alt = item.title || 'ผลงานภาพถ่าย';
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.onerror = () => image.remove();
      card.prepend(image);
    }

    grid.appendChild(card);
  });
}

function renderServices(data) {
  const grid = $('serviceGrid');
  grid.replaceChildren();

  const types = Array.isArray(data.types) ? data.types : [];
  const prices = data.prices || {};

  if (!types.length) {
    showError('serviceStatus', 'ยังไม่มีข้อมูลบริการ');
    return;
  }

  showError('serviceStatus', '');

  types.forEach(type => {
    const name = typeof type === 'string'
      ? type
      : type.name || type.type || type.title || '';

    if (!name) return;

    const card = makeCard('service-card', name, 'สอบถามรายละเอียดและราคาได้');
    const price = prices[name];

    if (price !== undefined && price !== null && price !== '') {
      const priceText = document.createElement('p');
      priceText.className = 'service-price';
      priceText.textContent = `ราคาเริ่มต้น ${price} บาท`;
      card.appendChild(priceText);
    }

    grid.appendChild(card);
  });
}

function renderContacts(data) {
  const container = $('contactLinks');
  container.replaceChildren();

  const settings = data.settings || data;
  const candidates = [
    ['Instagram', settings.instagram || settings.instagramUrl],
    ['Facebook', settings.facebook || settings.facebookUrl],
    ['LINE', settings.line || settings.lineUrl || data.lineUrl]
  ];

  let count = 0;

  candidates.forEach(([label, rawUrl]) => {
    const url = safeLink(rawUrl);
    if (!url) return;

    const link = document.createElement('a');
    link.className = 'contact-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    container.appendChild(link);
    count++;
  });

  if (!count) {
    const note = document.createElement('p');
    note.textContent = 'กรุณาตรวจสอบช่องทางติดต่อในข้อมูล Settings';
    container.appendChild(note);
  }
}

async function loadPublicData() {
  try {
    const data = await publicApi('publicData');

    if (!data || data.success === false) {
      throw new Error(data?.message || 'ไม่สามารถอ่านข้อมูลได้');
    }

    renderPortfolio(data);
    renderServices(data);
    renderContacts(data);

    console.log('โหลดข้อมูลเว็บไซต์สำเร็จ', data);
  } catch (error) {
    console.error('โหลดข้อมูลเว็บไซต์ไม่สำเร็จ:', error);
    showError('portfolioStatus', 'โหลดผลงานไม่สำเร็จ กรุณาลองใหม่');
    showError('serviceStatus', 'โหลดบริการไม่สำเร็จ กรุณาลองใหม่');
    const contact = $('contactLinks');
    if (contact) contact.textContent = 'โหลดข้อมูลติดต่อไม่สำเร็จ';
  }
}

$('year').textContent = new Date().getFullYear();

const menuToggle = $('menuToggle');
const mainNav = $('mainNav');

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  mainNav.classList.toggle('is-open', open);
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

loadPublicData();
