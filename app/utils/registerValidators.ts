// Função para formatar CPF
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

// Função para validar nome completo (nome e sobrenome)
export const validateFullName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;
  
  // Remover espaços extras
  const trimmedName = name.trim();
  
  // Verificar se tem pelo menos 3 caracteres
  if (trimmedName.length < 3) return false;
  
  // Verificar se tem pelo menos nome e sobrenome (2 palavras)
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  if (nameParts.length < 2) return false;
  
  // Verificar se cada parte tem pelo menos 2 caracteres
  for (const part of nameParts) {
    if (part.length < 2) return false;
  }
  
  // Verificar se não contém caracteres inválidos (apenas letras, espaços, hífens e acentos)
  const validNameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!validNameRegex.test(trimmedName)) return false;
  
  // Verificar se não contém caracteres especiais como @, números, etc.
  if (/[@#$%^&*()_+=\[\]{}|\\:";'<>?,.\/0-9]/.test(trimmedName)) return false;
  
  return true;
};

// Função para validar TLD do email
export const validateEmailTLD = (email: string): boolean => {
  if (!email || !email.includes('@')) return false;
  
  const domain = email.split('@')[1];
  if (!domain || !domain.includes('.')) return false;
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  
  // Verificar se o TLD tem pelo menos 2 caracteres e contém apenas letras
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return false;
  
  // Lista de TLDs válidos comuns
  const validTLDs = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'br', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'pt',
    'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'ie', 'gr', 'ru', 'jp', 'cn', 'in', 'kr', 'mx', 'ar',
    'cl', 'pe', 've', 'ec', 'uy', 'py', 'bo', 'cr', 'pa', 'do', 'gt', 'hn', 'ni', 'sv', 'info', 'biz', 'name', 'pro',
    'io', 'dev', 'tech', 'online', 'site', 'website', 'xyz', 'app', 'cloud', 'store', 'shop', 'blog', 'news', 'tv',
    'me', 'cc', 'ws', 'mobi', 'asia', 'tel', 'jobs', 'travel', 'cat', 'eu', 'ac', 'ad', 'ae', 'af', 'ag', 'ai', 'al',
    'am', 'ao', 'aq', 'as', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'bf', 'bg', 'bh', 'bi', 'bj', 'bm', 'bn', 'bs', 'bt',
    'bv', 'bw', 'by', 'bz', 'cd', 'cf', 'cg', 'ci', 'ck', 'cm', 'cu', 'cv', 'cw', 'cx', 'cy', 'dj', 'dm', 'dz', 'ee',
    'eg', 'eh', 'er', 'et', 'fj', 'fk', 'fm', 'fo', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn',
    'gp', 'gq', 'gs', 'gu', 'gw', 'gy', 'hk', 'hm', 'hr', 'ht', 'hu', 'id', 'il', 'im', 'iq', 'ir', 'is', 'je', 'jm',
    'jo', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt',
    'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'mf', 'mg', 'mh', 'mk', 'ml', 'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt',
    'mu', 'mv', 'mw', 'my', 'mz', 'na', 'nc', 'ne', 'nf', 'ng', 'np', 'nr', 'nu', 'nz', 'om', 'pf', 'pg', 'ph', 'pk',
    'pm', 'pn', 'pr', 'ps', 'pw', 'qa', 're', 'ro', 'rs', 'rw', 'sa', 'sb', 'sc', 'sd', 'sg', 'sh', 'si', 'sj', 'sk',
    'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sx', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm',
    'tn', 'to', 'tr', 'tt', 'tw', 'tz', 'ua', 'ug', 'um', 'uz', 'va', 'vc', 'vg', 'vi', 'vn', 'vu', 'wf', 'ye',
    'yt', 'za', 'zm', 'zw'
  ];
  
  // Verificar TLD de dois níveis (ex: com.br, co.uk)
  if (parts.length >= 2) {
    const twoLevelTLD = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`.toLowerCase();
    const twoLevelValidTLDs = ['com.br', 'com.mx', 'com.ar', 'com.co', 'org.br', 'net.br', 'gov.br', 'edu.br', 'co.uk', 'com.au'];
    if (twoLevelValidTLDs.includes(twoLevelTLD)) return true;
  }
  
  return validTLDs.includes(tld);
};

