import type {CSSProperties} from 'vue'

export type SizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | (string & {})
export type SpacingValues = Record<SizeKey | (string & {}), string>
export type Spacing = keyof SpacingValues | (string & {}) | number

export type StyleProp<Value> = Value

export type BaseComponentProps = {
  /** margin */
  m?: StyleProp<Spacing>
  /** marginBlock */
  my?: StyleProp<Spacing>
  /** marginInline */
  mx?: StyleProp<Spacing>
  /** marginTop */
  mt?: StyleProp<Spacing>
  /** marginBottom */
  mb?: StyleProp<Spacing>
  /** marginInlineStart */
  ms?: StyleProp<Spacing>
  /** marginInlineEnd */
  me?: StyleProp<Spacing>
  /** marginLeft */
  ml?: StyleProp<Spacing>
  /** marginRight */
  mr?: StyleProp<Spacing>
  /** padding */
  p?: StyleProp<Spacing>
  /** paddingBlock */
  py?: StyleProp<Spacing>
  /** paddingInline */
  px?: StyleProp<Spacing>
  /** paddingTop */
  pt?: StyleProp<Spacing>
  /** paddingBottom */
  pb?: StyleProp<Spacing>
  /** paddingInlineStart */
  ps?: StyleProp<Spacing>
  /** paddingInlineEnd */
  pe?: StyleProp<Spacing>
  /** paddingLeft */
  pl?: StyleProp<Spacing>
  /** paddingRight */
  pr?: StyleProp<Spacing>
  /** border */
  bd?: StyleProp<CSSProperties['border']>
  /** background, theme key: theme.colors */
  //bg?: StyleProp<MantineColor>
  /** color */
  //c?: StyleProp<MantineColor>
  opacity?: StyleProp<CSSProperties['opacity']>
  /** fontFamily */
  ff?: StyleProp<'monospace' | 'text' | 'heading' | (string & {})>
  /** fontSize, theme key: theme.fontSizes */
  //fz?: StyleProp<MantineFontSize | `h${1 | 2 | 3 | 4 | 5 | 6}` | number | (string & {})>
  /** fontWeight */
  fw?: StyleProp<CSSProperties['fontWeight']>
  /** letterSpacing */
  lts?: StyleProp<CSSProperties['letterSpacing']>
  /** textAlign */
  ta?: StyleProp<CSSProperties['textAlign']>
  /** lineHeight, theme key: lineHeights */
  //lh?: StyleProp<MantineLineHeight | `h${1 | 2 | 3 | 4 | 5 | 6}` | number | (string & {})>
  /** fontStyle */
  fs?: StyleProp<CSSProperties['fontStyle']>
  /** textTransform */
  tt?: StyleProp<CSSProperties['textTransform']>
  /** textDecoration */
  td?: StyleProp<CSSProperties['textDecoration']>
  /** width */
  w?: StyleProp<CSSProperties['width']>
  /** minWidth*/
  miw?: StyleProp<CSSProperties['minWidth']>
  /** maxWidth */
  maw?: StyleProp<CSSProperties['maxWidth']>
  /** height */
  h?: StyleProp<CSSProperties['height']>
  /** minHeight */
  mih?: StyleProp<CSSProperties['minHeight']>
  /** maxHeight */
  mah?: StyleProp<CSSProperties['maxHeight']>
  /** backgroundSize */
  bgsz?: StyleProp<CSSProperties['backgroundSize']>
  /** backgroundPosition */
  bgp?: StyleProp<CSSProperties['backgroundPosition']>
  /** backgroundRepeat */
  bgr?: StyleProp<CSSProperties['backgroundRepeat']>
  /** backgroundAttachment */
  bga?: StyleProp<CSSProperties['backgroundAttachment']>
  /** position */
  pos?: StyleProp<CSSProperties['position']>
  top?: StyleProp<CSSProperties['top']>
  left?: StyleProp<CSSProperties['left']>
  bottom?: StyleProp<CSSProperties['bottom']>
  right?: StyleProp<CSSProperties['right']>
  inset?: StyleProp<CSSProperties['inset']>
  display?: StyleProp<CSSProperties['display']>
  flex?: StyleProp<CSSProperties['flex']>
}

export const SIZE_KEYS: Array<SizeKey> = ['xs', 'sm', 'md', 'lg', 'xl']

export function isSizeKey(key: unknown): key is SizeKey {
  return SIZE_KEYS.includes(key as SizeKey)
}

export function mapMayBeSizeProperty<T extends (string & {}) | number | undefined>(
  prop: T,
  varName: string
) {
  if (isSizeKey(prop)) {
    return `var(${varName}-${prop})`
  }

  return mapProperty(prop)
}

function isNumericString(str: string) {
  // Matches strings containing only one or more digits (0-9)
  return /^\d+$/.test(str);
}

export function mapProperty(prop?: StyleProp<(string & {}) | number>) {
  if (typeof prop === 'number' || (typeof prop === 'string' && isNumericString(prop))) {
    return `${prop}px`
  }

  return prop
}

export const GAP_VAR = '--v-gap';
export const SPACING_VAR = '--v-spacing';
export const TEXT_SIZE_VAR = '--v-text-size' as const;

export function mapBaseComponentPropsToStyles(props: BaseComponentProps) {
  const {
    h,
    maw,
    w,
    miw,
    p,
    mah,
    mih,
    m,
    mx,
    mt,
    ml,
    mr,
    mb,
    me,
    ms,
    my,
    py,
    px,
    pe,
    pb,
    pl,
    pr,
    ps,
    pt,
    flex,
    pos,
    display,
    bd,
    top
  } = props;
  const styles = {
    border: bd,
    flex: flex,
    position: pos,
    display: display,
    maxHeight: mapProperty(mah),
    height: mapProperty(h),
    mih: mapProperty(mih),
    top: mapProperty(top),
    maxWidth: mapProperty(maw),
    width: mapProperty(w),
    minWidth: mapProperty(miw),
    paddingTop: mapMayBeSizeProperty(pt, SPACING_VAR),
    paddingLeft: mapMayBeSizeProperty(pl, SPACING_VAR),
    paddingRight: mapMayBeSizeProperty(pr, SPACING_VAR),
    paddingBottom: mapMayBeSizeProperty(pb, SPACING_VAR),
    paddingInlineStart: mapMayBeSizeProperty(ps, SPACING_VAR),
    paddingInlineEnd: mapMayBeSizeProperty(pe, SPACING_VAR),
    paddingBlock: mapMayBeSizeProperty(py, SPACING_VAR),
    paddingInline: mapMayBeSizeProperty(px, SPACING_VAR),
    padding: mapMayBeSizeProperty(p, SPACING_VAR),
    margin: mapMayBeSizeProperty(m, SPACING_VAR),
    marginInline: mapMayBeSizeProperty(mx, SPACING_VAR),
    marginTop: mapMayBeSizeProperty(mt, SPACING_VAR),
    marginLeft: mapMayBeSizeProperty(ml, SPACING_VAR),
    marginRight: mapMayBeSizeProperty(mr, SPACING_VAR),
    marginBottom: mapMayBeSizeProperty(mb, SPACING_VAR),
    marginInlineEnd: mapMayBeSizeProperty(me, SPACING_VAR),
    marginInlineStart: mapMayBeSizeProperty(ms, SPACING_VAR),
    marginBlock: mapMayBeSizeProperty(my, SPACING_VAR)
  }

  return Object.fromEntries(
    Object.keys(styles)
      .filter((key) => styles[key as keyof typeof styles] !== undefined)
      .map((key) => [key, styles[key as keyof typeof styles]])
  )
}

export type TextProps = {
  size?: SizeKey
}

export function getTextStyles(props: TextProps) {
  return {
    fontSize: mapMayBeSizeProperty(props.size, TEXT_SIZE_VAR)
  }
}
