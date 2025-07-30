import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {commonArgTypes} from "@/shared/ui/common-arg-types.ts";

import VGroup from "./ui.vue";

const meta: Meta = {
  component: VGroup,
  title: 'VGroup',
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# VGroup

VGroup — это компонент дизайн-системы для создания горизонтальных flex-контейнеров с настраиваемыми параметрами выравнивания и отступов.

## Когда использовать

VGroup следует использовать для группировки элементов в горизонтальном flex-контейнере с контролем над расположением, выравниванием и отступами между элементами.

## Основные возможности

- **Gap система**: Поддержка размерных токенов ('xs', 'sm', 'md', 'lg', 'xl') для отступов между элементами
- **Justify**: Управление основным направлением flex-контейнера ('flex-start', 'flex-end', 'space-between', 'space-around', 'center')
- **Align**: Управление поперечным направлением flex-контейнера ('scratch', 'center', 'flex-start', 'flex-end')
- **Наследование VBox**: Все возможности базового компонента VBox

## Параметры выравнивания

### Justify (основное направление)
- \`flex-start\` - элементы прижимаются к началу
- \`flex-end\` - элементы прижимаются к концу
- \`center\` - элементы центрируются
- \`space-between\` - равномерное распределение с отступами между элементами
- \`space-around\` - равномерное распределение с отступами вокруг элементов

### Align (поперечное направление)
- \`scratch\` - по умолчанию
- \`center\` - центрирование элементов
- \`flex-start\` - выравнивание к началу
- \`flex-end\` - выравнивание к концу
        `,
      },
    },
  },
  argTypes: {
    ...commonArgTypes,
    gap: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Размер отступа между элементами',
    },
    justify: {
      control: { type: 'select' },
      options: ['flex-start', 'flex-end', 'space-between', 'space-around', 'center'],
      description: 'Выравнивание по основному направлению',
    },
    align: {
      control: { type: 'select' },
      options: ['scratch', 'center', 'flex-start', 'flex-end'],
      description: 'Выравнивание по поперечному направлению',
    },
  },
}

export default meta;

function createTemplate(slotContent: string, args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { VGroup },
      setup() {
        return { args };
      },
      template: `
        <VGroup v-bind="args">
          ${slotContent}
        </VGroup>
      `,
    }),
  };
}

type Story = StoryObj<typeof VGroup>;

export const Default = createTemplate(`
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 1</div>
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 2</div>
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 3</div>
`);

export const WithGap = createTemplate(`
  <div style="background: #f0f0f0; padding: 8px;">Item 1</div>
  <div style="background: #f0f0f0; padding: 8px;">Item 2</div>
  <div style="background: #f0f0f0; padding: 8px;">Item 3</div>
`, { gap: 'md' });

export const SpaceBetween = createTemplate(`
  <div style="background: #f0f0f0; padding: 8px;">Start</div>
  <div style="background: #f0f0f0; padding: 8px;">Middle</div>
  <div style="background: #f0f0f0; padding: 8px;">End</div>
`, { justify: 'space-between', w: '300px' });

export const Centered = createTemplate(`
  <div style="background: #f0f0f0; padding: 8px;">Centered</div>
  <div style="background: #f0f0f0; padding: 8px;">Content</div>
`, { justify: 'center', align: 'center', gap: 'sm' });
