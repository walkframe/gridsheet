import React from 'react';

// Return the document object with SSR.
export const useDocument = () => {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    setOk(true);
  });
  if (ok && typeof document !== 'undefined') {
    return document;
  }
};
