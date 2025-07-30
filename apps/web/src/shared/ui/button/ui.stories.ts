import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {commonArgTypes} from "@/shared/ui/common-arg-types.ts";

import VButton from "./ui.vue";

const meta: Meta = {
  component: VButton,
  title: 'VButton',
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# VButton

VButton — это компонент дизайн-системы для создания кнопок с настраиваемыми стилями и поведением.

## Когда использовать

VButton следует использовать для создания интерактивных элементов управления - кнопок, ссылок и других кликабельных элементов с единообразным стилем в рамках дизайн-системы.

## Основные возможности

- **Семантические элементы**: Настройка HTML-тега через атрибут \`is\` (по умолчанию 'button')
- **Наследование стилей**: Все возможности базового компонента VBox для spacing, размеров, позиционирования
- **Типографические свойства**: Полная поддержка CSS свойств для текста
- **Слот содержимое**: Гибкость в размещении любого контента внутри кнопки
- **Состояния**: Поддержка disabled, focus, hover и других состояний через CSS
- **Accessibility**: Полная поддержка accessibility атрибутов

## Семантические HTML элементы

Через атрибут \`is\` можно указать нужный HTML-тег:
- \`button\` - кнопка (по умолчанию)
- \`a\` - ссылка
- \`input\` - input элемент (с type="button", type="submit" и т.д.)
- \`div\` - div элемент (для custom кнопок)

## Стилизация

Компонент наследует все стилевые возможности от BaseComponentProps:
- **Spacing**: margin и padding с размерными токенами
- **Размеры**: width, height, min/max размеры
- **Типографика**: fontFamily, fontSize, fontWeight, textAlign
- **Границы**: border свойства
- **Позиционирование**: position, flex свойства
- **Фон**: background свойства

## Типы кнопок

- **Primary**: Основные действия (сохранить, отправить)
- **Secondary**: Вторичные действия (отменить, назад)
- **Danger**: Опасные действия (удалить, очистить)
- **Link**: Ссылки и навигация
- **Icon**: Кнопки только с иконками

## Accessibility

- Поддержка всех ARIA атрибутов
- Правильное управление фокусом
- Семантическая разметка
- Поддержка клавиатурной навигации
        `,
      },
    },
  },
  argTypes: {
    ...commonArgTypes,
    is: {
      control: { type: 'select' },
      options: ['button', 'a', 'input', 'div'],
      description: 'HTML-тег для рендеринга',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'Тип кнопки (только для button и input)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключенное состояние',
    },
    href: {
      control: { type: 'text' },
      description: 'URL для ссылки (только для is="a")',
    },
  },
}

export default meta;

function createTemplate(slotContent: string, args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { VButton },
      setup() {
        const handleClick = () => {
          console.log('Button clicked!');
        };
        return { args, handleClick };
      },
      template: `
        <VButton v-bind="args" @click="handleClick">
          ${slotContent}
        </VButton>
      `,
    }),
  };
}

type Story = StoryObj<typeof VButton>;

export const Default = createTemplate("Нажми меня");

export const PrimaryButton = createTemplate("Основная кнопка", {
  p: 'sm',
  px: 'md',
  bd: '1px solid #007bff',
  fw: '500',
  ta: 'center',
  miw: '120px'
});

export const SecondaryButton = createTemplate("Вторичная кнопка", {
  p: 'sm',
  px: 'md',
  bd: '1px solid #6c757d',
  fw: '400',
  ta: 'center',
  miw: '120px'
});

export const DangerButton = createTemplate("Удалить", {
  p: 'sm',
  px: 'md',
  bd: '1px solid #dc3545',
  fw: '500',
  ta: 'center',
  miw: '120px'
});

export const ButtonSizes = {
  render: () => ({
    components: { VButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center;">
        <VButton p="xs" px="sm" bd="1px solid #007bff">Маленькая</VButton>
        <VButton p="sm" px="md" bd="1px solid #007bff">Средняя</VButton>
        <VButton p="md" px="lg" bd="1px solid #007bff">Большая</VButton>
      </div>
    `,
  }),
};

export const ButtonStates = {
  render: () => ({
    components: { VButton },
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <VButton p="sm" px="md" bd="1px solid #007bff">Обычная</VButton>
        <VButton p="sm" px="md" bd="1px solid #007bff" disabled>Отключена</VButton>
        <VButton p="sm" px="md" bd="1px solid #28a745">Успех</VButton>
        <VButton p="sm" px="md" bd="1px solid #ffc107">Предупреждение</VButton>
      </div>
    `,
  }),
};

export const LinkButton = createTemplate("Перейти на страницу", {
  is: 'a',
  href: '#',
  td: 'none',
  p: 'sm',
  px: 'md',
  bd: '1px solid #007bff',
  ta: 'center'
});

export const IconButton = createTemplate("🚀", {
  w: '40px',
  h: '40px',
  p: '0',
  bd: '1px solid #007bff',
  ta: 'center',
  display: 'flex',
});

export const FullWidthButton = createTemplate("Полная ширина", {
  w: '100%',
  p: 'sm',
  bd: '1px solid #007bff',
  ta: 'center',
  maw: '400px'
});

export const ButtonWithContent = {
  render: () => ({
    components: { VButton },
    template: `
      <VButton p="sm" px="md" bd="1px solid #007bff" ta="center" display="flex" style="align-items: center; gap: 8px;">
        <span>📁</span>
        <span>Загрузить файл</span>
      </VButton>
    `,
  }),
};

export const CustomStyledButton = createTemplate("Кастомная кнопка", {
  p: 'md',
  px: 'lg',
  bd: '2px solid #6f42c1',
  fw: '600',
  tt: 'uppercase',
  lts: '0.05em',
  ta: 'center',
  opacity: '0.9'
});

export const ButtonGroup = {
  render: () => ({
    components: { VButton },
    template: `
      <div style="display: flex; border: 1px solid #007bff; border-radius: 4px; overflow: hidden;">
        <VButton p="sm" px="md" bd="none" style="border-right: 1px solid #007bff;">Первая</VButton>
        <VButton p="sm" px="md" bd="none" style="border-right: 1px solid #007bff;">Вторая</VButton>
        <VButton p="sm" px="md" bd="none">Третья</VButton>
      </div>
    `,
  }),
};

export const ResponsiveButton = createTemplate("Адаптивная кнопка", {
  p: 'sm',
  px: 'md',
  bd: '1px solid #007bff',
  ta: 'center',
  w: '100%',
  maw: '200px',
  miw: '100px'
});

export const LoadingButton = {
  render: () => ({
    components: { VButton },
    setup() {
      return {
        loading: true
      };
    },
    template: `
      <VButton 
        p="sm" 
        px="md" 
        bd="1px solid #007bff" 
        ta="center"
        :disabled="loading"
        style="display: flex; align-items: center; gap: 8px;"
      >
        <span v-if="loading">⏳</span>
        <span>{{ loading ? 'Загрузка...' : 'Отправить' }}</span>
      </VButton>
    `,
  }),
};