import type {ArgTypes} from "@storybook/vue3-vite";

export const commonArgTypes: Partial<ArgTypes<any>> = {
  m: {
    control: {
      type: 'text',
    },
    description: `
margin.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства margin в виде строки.
        `,
  },
  my: {
    control: {
      type: 'text',
    },
    description: `
marginBlock.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginBlock в виде строки.
        `,
  },
  mx: {
    control: {
      type: 'text',
    },
    description: `
marginInline.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginInline в виде строки.
        `,
  },
  mt: {
    control: {
      type: 'text',
    },
    description: `
marginTop.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginTop в виде строки.
        `,
  },
  mb: {
    control: {
      type: 'text',
    },
    description: `
marginBottom.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginBottom в виде строки.
        `,
  },
  ms: {
    control: {
      type: 'text',
    },
    description: `
marginInlineStart.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginInlineStart в виде строки.
        `,
  },
  me: {
    control: {
      type: 'text',
    },
    description: `
marginInlineEnd.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginInlineEnd в виде строки.
        `,
  },
  ml: {
    control: {
      type: 'text',
    },
    description: `
marginLeft.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginLeft в виде строки.
        `,
  },
  mr: {
    control: {
      type: 'text',
    },
    description: `
marginRight.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства marginRight в виде строки.
        `,
  },
  p: {
    control: {
      type: 'text',
    },
    description: `
padding.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства padding в виде строки.
        `,
  },
  py: {
    control: {
      type: 'text',
    },
    description: `
paddingBlock.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingBlock в виде строки.
        `,
  },
  px: {
    control: {
      type: 'text',
    },
    description: `
paddingInline.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingInline в виде строки.
        `,
  },
  pt: {
    control: {
      type: 'text',
    },
    description: `
paddingTop.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingTop в виде строки.
        `,
  },
  pb: {
    control: {
      type: 'text',
    },
    description: `
paddingBottom.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingBottom в виде строки.
        `,
  },
  ps: {
    control: {
      type: 'text',
    },
    description: `
paddingInlineStart.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingInlineStart в виде строки.
        `,
  },
  pe: {
    control: {
      type: 'text',
    },
    description: `
paddingInlineEnd.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingInlineEnd в виде строки.
        `,
  },
  pl: {
    control: {
      type: 'text',
    },
    description: `
paddingLeft.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingLeft в виде строки.
        `,
  },
  pr: {
    control: {
      type: 'text',
    },
    description: `
paddingRight.
Возможные значения: 'xs', 'sm', 'md', 'lg', 'xl', любое число или валидное значение для свойства paddingRight в виде строки.
        `,
  },
  bd: {
    control: {
      type: 'text',
    },
    description: `
border.
Возможные значения: любое валидное значение для CSS свойства border в виде строки.
        `,
  },
  opacity: {
    control: {
      type: 'text',
    },
    description: `
opacity.
Возможные значения: число от 0 до 1 или любое валидное значение для CSS свойства opacity в виде строки.
        `,
  },
  ff: {
    control: {
      type: 'text',
    },
    description: `
fontFamily.
Возможные значения: 'monospace', 'text', 'heading' или любое валидное значение для CSS свойства fontFamily в виде строки.
        `,
  },
  fw: {
    control: {
      type: 'text',
    },
    description: `
fontWeight.
Возможные значения: любое валидное значение для CSS свойства fontWeight в виде строки или числа.
        `,
  },
  lts: {
    control: {
      type: 'text',
    },
    description: `
letterSpacing.
Возможные значения: любое валидное значение для CSS свойства letterSpacing в виде строки.
        `,
  },
  ta: {
    control: {
      type: 'text',
    },
    description: `
textAlign.
Возможные значения: любое валидное значение для CSS свойства textAlign в виде строки.
        `,
  },
  fs: {
    control: {
      type: 'text',
    },
    description: `
fontStyle.
Возможные значения: любое валидное значение для CSS свойства fontStyle в виде строки.
        `,
  },
  tt: {
    control: {
      type: 'text',
    },
    description: `
textTransform.
Возможные значения: любое валидное значение для CSS свойства textTransform в виде строки.
        `,
  },
  td: {
    control: {
      type: 'text',
    },
    description: `
textDecoration.
Возможные значения: любое валидное значение для CSS свойства textDecoration в виде строки.
        `,
  },
  w: {
    control: {
      type: 'text',
    },
    description: `
width.
Возможные значения: любое число или валидное значение для CSS свойства width в виде строки.
        `,
  },
  miw: {
    control: {
      type: 'text',
    },
    description: `
minWidth.
Возможные значения: любое число или валидное значение для CSS свойства minWidth в виде строки.
        `,
  },
  maw: {
    control: {
      type: 'text',
    },
    description: `
maxWidth.
Возможные значения: любое число или валидное значение для CSS свойства maxWidth в виде строки.
        `,
  },
  h: {
    control: {
      type: 'text',
    },
    description: `
height.
Возможные значения: любое число или валидное значение для CSS свойства height в виде строки.
        `,
  },
  mih: {
    control: {
      type: 'text',
    },
    description: `
minHeight.
Возможные значения: любое число или валидное значение для CSS свойства minHeight в виде строки.
        `,
  },
  mah: {
    control: {
      type: 'text',
    },
    description: `
maxHeight.
Возможные значения: любое число или валидное значение для CSS свойства maxHeight в виде строки.
        `,
  },
  bgsz: {
    control: {
      type: 'text',
    },
    description: `
backgroundSize.
Возможные значения: любое валидное значение для CSS свойства backgroundSize в виде строки.
        `,
  },
  bgp: {
    control: {
      type: 'text',
    },
    description: `
backgroundPosition.
Возможные значения: любое валидное значение для CSS свойства backgroundPosition в виде строки.
        `,
  },
  bgr: {
    control: {
      type: 'text',
    },
    description: `
backgroundRepeat.
Возможные значения: любое валидное значение для CSS свойства backgroundRepeat в виде строки.
        `,
  },
  bga: {
    control: {
      type: 'text',
    },
    description: `
backgroundAttachment.
Возможные значения: любое валидное значение для CSS свойства backgroundAttachment в виде строки.
        `,
  },
  pos: {
    control: {
      type: 'text',
    },
    description: `
position.
Возможные значения: любое валидное значение для CSS свойства position в виде строки.
        `,
  },
  top: {
    control: {
      type: 'text',
    },
    description: `
top.
Возможные значения: любое число или валидное значение для CSS свойства top в виде строки.
        `,
  },
  left: {
    control: {
      type: 'text',
    },
    description: `
left.
Возможные значения: любое число или валидное значение для CSS свойства left в виде строки.
        `,
  },
  bottom: {
    control: {
      type: 'text',
    },
    description: `
bottom.
Возможные значения: любое число или валидное значение для CSS свойства bottom в виде строки.
        `,
  },
  right: {
    control: {
      type: 'text',
    },
    description: `
right.
Возможные значения: любое число или валидное значение для CSS свойства right в виде строки.
        `,
  },
  inset: {
    control: {
      type: 'text',
    },
    description: `
inset.
Возможные значения: любое число или валидное значение для CSS свойства inset в виде строки.
        `,
  },
  display: {
    control: {
      type: 'text',
    },
    description: `
display.
Возможные значения: любое валидное значение для CSS свойства display в виде строки.
        `,
  },
  flex: {
    control: {
      type: 'text',
    },
    description: `
flex.
Возможные значения: любое валидное значение для CSS свойства flex в виде строки.
        `,
  },
}
