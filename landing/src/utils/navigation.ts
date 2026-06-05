export const getDashboardUrl = () => {
  if (typeof window !== 'undefined') {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.')
    ) {
      return 'http://localhost:3000';
    }
  }
  return '/app';
};
