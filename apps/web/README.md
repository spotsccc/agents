# .

This app uses Vue 3 with Vite+.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See the [Vite+ guide](https://viteplus.dev/guide/).

## Project Setup

```sh
vp install
```

### Compile and Hot-Reload for Development

```sh
vp dev
```

### Type-Check, Compile and Minify for Production

```sh
vp check
vp build
```

### Run Unit Tests

```sh
vp test
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
vp exec playwright install

# When testing on CI, must build the project first
vp build

# Runs the end-to-end tests
vp run test:e2e
# Runs the tests only on Chromium
vp run test:e2e --project=chromium
# Runs the tests of a specific file
vp run test:e2e tests/example.spec.ts
# Runs the tests in debug mode
vp run test:e2e --debug
```

### Validate Code

```sh
vp check
```
