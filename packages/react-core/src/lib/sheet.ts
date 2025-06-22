export const escapeSheetName = (name: string): string => {
  const escaped = name.replace(/'/g, "''");
  return `'${escaped}'`;
};

export const getSheetPrefix = (name?: string): string => {
  if (name) {
    return `${escapeSheetName(name)}!`;
  }
  return '';
};
