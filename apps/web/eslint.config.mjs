import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createWebConfig } from '@agents/eslint-config/web'

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url))

export default createWebConfig({ tsconfigRootDir })
