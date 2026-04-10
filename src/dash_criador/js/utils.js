const currencyIntegerFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const currencyDecimalFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');
const compactFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function cloneData(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function formatCurrencyBR(value, withDecimals = false) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return withDecimals ? currencyDecimalFormatter.format(value) : currencyIntegerFormatter.format(value);
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return numberFormatter.format(value);
}

export function formatCompactNumber(value) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return compactFormatter.format(value);
}

export function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${Number(value).toFixed(digits).replace('.', ',')}%`;
}

export function formatRatio(value, digits = 2) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${Number(value).toFixed(digits).replace('.', ',')}x`;
}

export function formatDateBR(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTimeBR(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getInitials(name) {
  if (!name) {
    return 'AM';
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildWhatsAppUrl(phone, message) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
}
