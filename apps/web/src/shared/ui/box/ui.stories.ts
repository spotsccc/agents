import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {commonArgTypes} from "@/shared/ui/common-arg-types.ts";

import VBox from "./ui.vue";

const meta: Meta = {
  component: VBox,
  title: 'VBox',
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# VBox

VBox — это базовый компонент дизайн-системы, предназначенный для создания контейнеров с настраиваемыми стилями.

## Когда использовать

VBox следует использовать в тех случаях, когда другие специализированные компоненты дизайн-системы не подходят для решения задачи. Этот компонент служит основой для построения других компонентов системы.

## Основные возможности

- **Spacing система**: Поддержка размерных токенов ('xs', 'sm', 'md', 'lg', 'xl') для margin и padding
- **Flexbox свойства**: Настройка display, flex и позиционирования
- **Типографика**: Управление шрифтами, размерами и стилями текста
- **Размеры**: Контроль ширины, высоты и их ограничений
- **Позиционирование**: Absolute, relative и другие типы позиционирования
- **Фон**: Настройка background свойств

## Размерные токены

Для spacing свойств (margin, padding) можно использовать предустановленные размерные токены:
- \`xs\` - самый маленький отступ
- \`sm\` - маленький отступ
- \`md\` - средний отступ
- \`lg\` - большой отступ
- \`xl\` - самый большой отступ

Также принимаются числовые значения (автоматически конвертируются в px) и строковые CSS значения.
        `,
      },
    },
  },
  argTypes: {...commonArgTypes},
}

export default meta;

function createTemplate(slotContent: string, args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { VBox },
      setup() {
        return { args };
      },
      template: `
        <VBox v-bind="args">
          ${slotContent}
        </VBox>
      `,
    }),
  };
}

type Story = StoryObj<typeof VBox>;

export const Default = createTemplate("Content");
