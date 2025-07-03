/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      source: {
        type: 'dynamic',
        excludeDecorators: true,
      },
    },
    // Add GitHub repository link
    links: {
      github: {
        title: 'GitHub',
        url: 'https://github.com/walkframe/gridsheet',
      },
    },
    // Add GitHub link to toolbar
    toolbar: {
      'github-link': {
        title: 'View on GitHub',
        icon: 'github',
        url: 'https://github.com/walkframe/gridsheet',
      },
    },
  },
};

export default preview;