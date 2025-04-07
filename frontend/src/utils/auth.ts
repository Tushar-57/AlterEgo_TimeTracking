export const isValidToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() + 60000; // Add 1min buffer
  } catch {
    return false;
  }
};