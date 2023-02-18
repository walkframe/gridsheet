const fs = require('fs');
const { execSync } = require('child_process');

const generate = () => {
  execSync('yarn less');
  const css = fs.readFileSync('./src/styles/root.min.css');
  const time = Math.floor((new Date()).getTime() / 1000);
  fs.writeFileSync('./src/styles/minified.ts',
`// yarn generate-style\nexport const LAST_MODIFIED = ${time};\nexport const CSS = \`${css}\`;\n`
  );
};

generate();
