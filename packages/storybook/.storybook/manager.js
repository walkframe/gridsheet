import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

// Create a custom theme
const theme = create({
  base: 'light',
  brandTitle: 'Gridsheet',
  brandUrl: 'https://github.com/walkframe/gridsheet',
  brandImage: 'https://github.com/favicon.ico',
  brandTarget: '_blank',
});

// Add the theme to the manager
addons.setConfig({
  theme,
  sidebar: {
    showRoots: true,
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
  panelPosition: 'bottom',
  showPanel: false,
}); 