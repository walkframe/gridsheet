const fs = require('fs');
const { execSync } = require('child_process');

const generate = () => {
  execSync('pnpm less');
  const css = fs.readFileSync('./styles/root.min.css');
  const time = Math.floor((new Date()).getTime() / 1000);
  fs.writeFileSync('./styles/minified.ts',
`// pnpm generate-style\nexport const LAST_MODIFIED = ${time};\nexport const CSS = \`${css}\`;\n`
  );
};

generate();
