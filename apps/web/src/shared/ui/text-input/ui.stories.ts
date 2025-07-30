import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import TextInput from "./ui.vue";

const meta: Meta = {
  component: TextInput,
  title: 'TextInput',
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# TextInput

TextInput — это компонент дизайн-системы для создания текстовых полей ввода с поддержкой лейблов, описаний и сообщений об ошибках.

## Когда использовать

TextInput следует использовать для создания форм ввода текстовой информации с возможностью добавления лейблов, вспомогательного текста и отображения ошибок валидации.

## Основные возможности

- **V-model поддержка**: Полная поддержка двустороннего связывания данных
- **Лейбл**: Автоматическое связывание лейбла с полем ввода через уникальный ID
- **Описание**: Дополнительный текст для пояснения назначения поля
- **Сообщения об ошибках**: Отображение ошибок валидации
- **Кастомизация стилей**: Возможность переопределения CSS классов для всех элементов
- **Наследование атрибутов**: Поддержка всех стандартных HTML атрибутов input элемента
- **Адаптивность**: Автоматическая ширина 100% для адаптивности

## Структура компонента

Компонент состоит из следующих элементов (сверху вниз):
1. **Label** - лейбл поля (опционально)
2. **Description** - описание поля (опционально)
3. **Input** - само поле ввода
4. **Error** - сообщение об ошибке (опционально)

## Кастомизация стилей

Через проп \`classes\` можно переопределить стили для:
- \`root\` - корневой контейнер
- \`label\` - лейбл поля
- \`description\` - текст описания
- \`error\` - сообщение об ошибке

## Accessibility
ч
- Автоматическое связывание лейбла с полем через атрибуты \`for\` и \`id\`
- Уникальный ID генерируется для каждого экземпляра компонента
- Поддержка всех стандартных HTML атрибутов для доступности
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Текст лейбла для поля ввода',
    },
    description: {
      control: { type: 'text' },
      description: 'Дополнительное описание поля',
    },
    error: {
      control: { type: 'text' },
      description: 'Сообщение об ошибке',
    },
    placeholdeчr: {
      control: { type: 'text' },
      description: 'Placeholder текст',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'password', 'email', 'number', 'tel', 'url'],
      description: 'Тип поля ввода',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключенное состояние',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Обязательное поле',
    },
    classes: {
      control: { type: 'object' },
      description: 'Объект с CSS классами для кастомизации',
    },
  },
}

export default meta;

function createTemplate(args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { TextInput },
      setup() {
        const value = ref(args.modelValue || '');
        return { args, value };
      },
      template: `
        <TextInput v-bind="args" v-model="value" />
      `,
    }),
  };
}

type Story = StoryObj<typeof TextInput>;

export const Default = createTemplate({
  placeholder: 'Введите текст...'
});

export const WithLabel = createTemplate({
  label: 'Имя пользователя',
  placeholder: 'Введите ваше имя'
});

export const WithDescription = createTemplate({
  label: 'Email адрес',
  description: 'Мы будем использовать этот email для отправки уведомлений',
  placeholder: 'example@email.com',
  type: 'email'
});

export const WithError = createTemplate({
  label: 'Пароль',
  error: 'Пароль должен содержать минимум 8 символов',
  placeholder: 'Введите пароль',
  type: 'password'
});

export const FullExample = createTemplate({
  label: 'Номер телефона',
  description: 'В международном формате с кодом страны',
  placeholder: '+7 (999) 123-45-67',
  type: 'tel'
});

export const WithErrorAndDescription = createTemplate({
  label: 'Повторите пароль',
  description: 'Пароль должен совпадать с введенным выше',
  error: 'Пароли не совпадают',
  placeholder: 'Повторите пароль',
  type: 'password'
});

export const Disabled = createTemplate({
  label: 'Отключенное поле',
  placeholder: 'Это поле отключено',
  disabled: true,
  modelValue: 'Нельзя редактировать'
});

export const Required = createTemplate({
  label: 'Обязательное поле',
  description: 'Это поле обязательно для заполнения',
  placeholder: 'Обязательное поле *',
  required: true
});

export const NumberInput = createTemplate({
  label: 'Возраст',
  description: 'Введите ваш возраст в годах',
  placeholder: '25',
  type: 'number',
  min: 18,
  max: 120
});

export const CustomStyles = createTemplate({
  label: 'Кастомные стили',
  description: 'Поле с переопределенными стилями',
  placeholder: 'Введите текст',
  classes: {
    root: 'custom-input-root',
    label: 'custom-label',
    description: 'custom-description',
    error: 'custom-error'
  }
});
