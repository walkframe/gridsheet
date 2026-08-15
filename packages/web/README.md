# @gridsheet/web

The **web/DOM rendering layer** for [GridSheet](https://gridsheet.walkframe.com/).

It builds on the headless [`@gridsheet/engine`](https://www.npmjs.com/package/@gridsheet/engine) (the framework-agnostic model + formula engine) and adds the browser-specific helpers the framework bindings need: DOM focus/selection, text input, popup positioning, virtualization, and style embedding. It also re-exports the full `@gridsheet/engine` API, so `@gridsheet/react-core` / `@gridsheet/preact-core` can pull both the model and the DOM helpers from here.

It is **not intended to be used directly** by application developers.

## For application developers

Please use one of the framework-specific packages:

- **React**: [`@gridsheet/react-core`](https://www.npmjs.com/package/@gridsheet/react-core)
- **Preact**: [`@gridsheet/preact-core`](https://www.npmjs.com/package/@gridsheet/preact-core)
- **Vue**: [`@gridsheet/vue-core`](https://www.npmjs.com/package/@gridsheet/vue-core)

For **headless** use (CLI, extension host, backend, CI — no rendering), use [`@gridsheet/engine`](https://www.npmjs.com/package/@gridsheet/engine) directly.

## License

Apache-2.0
