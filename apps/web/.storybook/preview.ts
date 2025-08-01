import type { Preview } from '@storybook/vue3-vite'
import '../src/app/app.css';
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;
