const toInitials = (fullName = '', username = '') => {
  const source = fullName.trim() || username.trim();
  if (!source) {
    return 'Z';
  }

  const words = source.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const createAvatarSvg = (initials) => {
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#bg)" />
      <text x="80" y="95" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="700" fill="#f8fafc">
        ${initials}
      </text>
    </svg>
  `.trim());

  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

export const getUserAvatar = ({ profilePic = '', fullName = '', username = '' } = {}) =>
  profilePic || createAvatarSvg(toInitials(fullName, username));

