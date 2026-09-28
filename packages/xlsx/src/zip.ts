import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';

/** Read a zip archive into a { path: utf8-string } map (xlsx parts are all text/XML for v0). */
export const readZip = (data: Uint8Array): Record<string, string> => {
  const files = unzipSync(data);
  const out: Record<string, string> = {};
  for (const name of Object.keys(files)) {
    out[name] = strFromU8(files[name]);
  }
  return out;
};

/** Write a { path: utf8-string } map into a zip archive. */
export const writeZip = (files: Record<string, string>): Uint8Array => {
  const zippable: Record<string, Uint8Array> = {};
  for (const name of Object.keys(files)) {
    zippable[name] = strToU8(files[name]);
  }
  return zipSync(zippable);
};
