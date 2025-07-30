import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {commonArgTypes} from "@/shared/ui/common-arg-types.ts";

import VText from "./ui.vue";

const meta: Meta = {
  component: VText,
  title: 'VText',
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# VText

VText — это типографический компонент дизайн-системы для отображения текста с настраиваемыми стилями и размерами.

## Когда использовать

VText следует использовать для отображения текстового контента с единообразным стилем в рамках дизайн-системы. Компонент обеспечивает типографическую иерархию и консистентность.

## Основные возможности

- **Размерная система**: Поддержка размерных токенов ('xs', 'sm', 'md', 'lg', 'xl') для fontSize
- **Семантические элементы**: Настройка HTML-тега через атрибут \`is\` (по умолчанию 'p')
- **Наследование стилей**: Все возможности базового компонента VBox для spacing, позиционирования и т.д.
- **Типографические свойства**: Полная поддержка CSS свойств для текста (fontFamily, fontWeight, textAlign и др.)
- **Слот содержимое**: Гибкость в размещении любого текстового контента

## Размерные токены

Для свойства \`size\` можно использовать предустановленные размерные токены:
- \`xs\` - самый маленький размер текста
- \`sm\` - маленький размер текста
- \`md\` - средний размер текста (по умолчанию)
- \`lg\` - большой размер текста
- \`xl\` - самый большой размер текста

## Семантические HTML элементы

Через атрибут \`is\` можно указать нужный HTML-тег:
- \`p\` - параграф (по умолчанию)
- \`span\` - строковый элемент
- \`h1\`, \`h2\`, \`h3\`, \`h4\`, \`h5\`, \`h6\` - заголовки
- \`div\` - блочный элемент
- \`label\` - лейбл
- \`strong\`, \`em\` - выделение текста

## Типографические свойства

Компонент наследует все типографические возможности от BaseComponentProps:
- \`ff\` - fontFamily ('monospace', 'text', 'heading')
- \`fw\` - fontWeight
- \`ta\` - textAlign
- \`tt\` - textTransform
- \`td\` - textDecoration
- \`fs\` - fontStyle
- \`lts\` - letterSpacing
        `,
      },
    },
  },
  argTypes: {
    ...commonArgTypes,
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Размер текста из дизайн-системы',
    },
    is: {
      control: { type: 'select' },
      options: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'strong', 'em'],
      description: 'HTML-тег для рендеринга',
    },
  },
}

export default meta;

function createTemplate(slotContent: string, args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { VText },
      setup() {
        return { args };
      },
      template: `
        <VText v-bind="args">
          ${slotContent}
        </VText>
      `,
    }),
  };
}

type Story = StoryObj<typeof VText>;

export const Default = createTemplate("Это обычный текст");

export const WithSize = createTemplate("Большой текст", { size: 'lg' });

export const AllSizes = {
  render: () => ({
    components: { VText },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <VText size="xs">Очень маленький текст (xs)</VText>
        <VText size="sm">Маленький текст (sm)</VText>
        <VText size="md">Средний текст (md)</VText>
        <VText size="lg">Большой текст (lg)</VText>
        <VText size="xl">Очень большой текст (xl)</VText>
      </div>
    `,
  }),
};

export const Headlines = {
  render: () => ({
    components: { VText },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <VText is="h1" size="xl" fw="bold">Заголовок H1</VText>
        <VText is="h2" size="lg" fw="600">Заголовок H2</VText>
        <VText is="h3" size="md" fw="600">Заголовок H3</VText>
        <VText is="h4" size="sm" fw="500">Заголовок H4</VText>
        <VText is="h5" size="xs" fw="500">Заголовок H5</VText>
        <VText is="h6" size="xs" fw="400">Заголовок H6</VText>
      </div>
    `,
  }),
};

export const TextStyles = {
  render: () => ({
    components: { VText },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <VText fw="normal">Обычный текст</VText>
        <VText fw="bold">Жирный текст</VText>
        <VText fs="italic">Курсив</VText>
        <VText td="underline">Подчеркнутый текст</VText>
        <VText tt="uppercase">ВЕРХНИЙ РЕГИСТР</VText>
        <VText tt="lowercase">нижний регистр</VText>
        <VText tt="capitalize">Заглавные Буквы</VText>
      </div>
    `,
  }),
};

export const TextAlign = {
  render: () => ({
    components: { VText },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; width: 300px; border: 1px solid #ccc; padding: 16px;">
        <VText ta="left">Текст по левому краю</VText>
        <VText ta="center">Текст по центру</VText>
        <VText ta="right">Текст по правому краю</VText>
        <VText ta="justify">Текст по ширине. Этот текст должен быть достаточно длинным, чтобы продемонстрировать выравнивание по ширине.</VText>
      </div>
    `,
  }),
};

export const FontFamilies = {
  render: () => ({
    components: { VText },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <VText ff="text">Основной шрифт (text)</VText>
        <VText ff="heading">Шрифт заголовков (heading)</VText>
        <VText ff="monospace">Моноширинный шрифт (monospace)</VText>
      </div>
    `,
  }),
};

export const WithSpacing = createTemplate("Текст с отступами", { 
  p: 'md', 
  m: 'sm', 
  bd: '1px solid #ccc' 
});

export const InlineElements = {
  render: () => ({
    components: { VText },
    template: `
      <div>
        <VText is="span">Это строковый элемент </VText>
        <VText is="strong" fw="bold">жирный текст </VText>
        <VText is="em" fs="italic">курсивный текст </VText>
        <VText is="span">и снова обычный текст.</VText>
      </div>
    `,
  }),
};

export const LongText = createTemplate(`
  Это длинный текст для демонстрации работы компонента с большим объемом контента. 
  Текст автоматически переносится на новую строку, сохраняя читаемость и правильное 
  отображение. Компонент VText отлично подходит для параграфов, описаний и любого 
  другого текстового контента в приложении.
`, { size: 'md', ta: 'justify', maw: '400px' });

export const WithCustomStyles = createTemplate("Кастомный стилизованный текст", {
  size: 'lg',
  ff: 'heading',
  fw: '600',
  ta: 'center',
  tt: 'uppercase',
  lts: '0.1em',
  p: 'md',
  bd: '2px solid #007bff',
  opacity: '0.9'
});