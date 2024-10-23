export const jsonMinify = (json: string) => {
  return JSON.stringify(JSON.parse(json));
};

export const jsonQuery = (json: string, keys: string[]) => {
  const obj = JSON.parse(json);
  return keys.reduce((acc, key) => {
    return acc[key];
  }, obj);
}