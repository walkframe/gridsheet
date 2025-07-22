const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

module.exports = withNextra({
  //output: `export`,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@gridsheet/react-core'],
  experimental: {
    esmExternals: 'loose'
  }
})
