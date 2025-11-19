import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { commonArgTypes } from "@/shared/ui/common-arg-types.ts";

import VStack from "./ui.vue";

const meta: Meta = {
  component: VStack,
  title: "VStack",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# VStack

VStack — это компонент дизайн-системы для создания вертикальных flex-контейнеров (flex-direction: column) с настраиваемыми параметрами выравнивания и отступов.

## Когда использовать

VStack следует использовать для вертикального расположения элементов в столбец с контролем над выравниванием, распределением пространства и отступами между элементами.

## Основные возможности

- **Вертикальное расположение**: Автоматически устанавливает flex-direction: column
- **Gap система**: Поддержка размерных токенов ('xs', 'sm', 'md', 'lg', 'xl') для отступов между элементами
- **Justify**: Управление основным направлением (вертикальным) flex-контейнера
- **Align**: Управление поперечным направлением (горизонтальным) flex-контейнера
- **Наследование VBox**: Все возможности базового компонента VBox

## Параметры выравнивания

### Justify (вертикальное направление)
- \`flex-start\` - элементы прижимаются к верху
- \`flex-end\` - элементы прижимаются к низу
- \`center\` - элементы центрируются по вертикали
- \`space-between\` - равномерное распределение с отступами между элементами
- \`space-around\` - равномерное распределение с отступами вокруг элементов

### Align (горизонтальное направление)
- \`scratch\` - по умолчанию
- \`center\` - центрирование элементов по горизонтали
- \`flex-start\` - выравнивание к левому краю
- \`flex-end\` - выравнивание к правому краю

## Размерные токены для gap

- \`xs\` - самый маленький отступ между элементами
- \`sm\` - маленький отступ
- \`md\` - средний отступ
- \`lg\` - большой отступ
- \`xl\` - самый большой отступ
        `,
      },
    },
  },
  argTypes: {
    ...commonArgTypes,
    gap: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Размер отступа между элементами",
    },
    justify: {
      control: { type: "select" },
      options: ["flex-start", "flex-end", "space-between", "space-around", "center"],
      description: "Выравнивание по вертикали (основное направление)",
    },
    align: {
      control: { type: "select" },
      options: ["scratch", "center", "flex-start", "flex-end"],
      description: "Выравнивание по горизонтали (поперечное направление)",
    },
  },
};

export default meta;

function createTemplate(slotContent: string, args: Story["args"] = {}): Story {
  return {
    args,
    render: (args) => ({
      components: { VStack },
      setup() {
        return { args };
      },
      template: `
        <VStack v-bind="args">
          ${slotContent}
        </VStack>
      `,
    }),
  };
}

type Story = StoryObj<typeof VStack>;

export const Default = createTemplate(`
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 1</div>
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 2</div>
  <div style="background: #f0f0f0; padding: 8px; margin: 4px;">Item 3</div>
`);

export const WithGap = createTemplate(
  `
  <div style="background: #f0f0f0; padding: 8px;">Item 1</div>
  <div style="background: #f0f0f0; padding: 8px;">Item 2</div>
  <div style="background: #f0f0f0; padding: 8px;">Item 3</div>
`,
  { gap: "md" },
);

export const SpaceBetween = createTemplate(
  `
  <div style="background: #f0f0f0; padding: 8px;">Top</div>
  <div style="background: #f0f0f0; padding: 8px;">Middle</div>
  <div style="background: #f0f0f0; padding: 8px;">Bottom</div>
`,
  { justify: "space-between", h: "200px" },
);

export const CenteredHorizontally = createTemplate(
  `
  <div style="background: #f0f0f0; padding: 8px;">Centered</div>
  <div style="background: #f0f0f0; padding: 8px;">Content</div>
`,
  { align: "center", gap: "sm" },
);

export const CenteredBoth = createTemplate(
  `
  <div style="background: #f0f0f0; padding: 8px;">Fully</div>
  <div style="background: #f0f0f0; padding: 8px;">Centered</div>
`,
  { justify: "center", align: "center", gap: "sm", h: "200px" },
);
