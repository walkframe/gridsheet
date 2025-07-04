/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    docs: {
      disable: true,
    },
    controls: {
      disable: true,
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