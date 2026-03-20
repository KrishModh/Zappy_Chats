export const formatTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
};

export const formatDateSeparator = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (left, right) => left.toDateString() === right.toDateString();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';

  return new Intl.DateTimeFormat([], {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export const formatDateOfBirth = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat([], {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
};

export const formatDateInputValue = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

export const formatLastSeen = (value, isOnline) => {
  if (isOnline) return 'online';
  if (!value) return 'offline';
  return `last seen ${new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))}`;
};
