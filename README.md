# Dfinery Web SDK

Browser and npm package distribution for the Dfinery Web SDK.

## Install

```sh
npm install @igaworks/dfinery-web-sdk
```

```ts
import Dfinery, { DFEvent } from '@igaworks/dfinery-web-sdk';

Dfinery.init('SERVICE_KEY');
Dfinery.logEvent(DFEvent.VIEW_HOME);
```

For browser snippet installations, use:

```html
<script src="https://static.dfinery.io/web-sdk/latest/dfn-web-sdk.min.js" async></script>
```

Versioned CDN bundles are published under:

```text
https://static.dfinery.io/web-sdk/{version}/dfn-web-sdk.min.js
```

## Bundled Runtime Dependencies

The following libraries are bundled into the SDK at build time. Consumers do not need to install them separately.

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [jsstore](https://github.com/ujjwalguptaofficial/JsStore) | ^4.9.0 | IndexedDB wrapper with SQL-like API | MIT |
| [ua-parser-js](https://github.com/faisalman/ua-parser-js) | ^0.7.41 | User-Agent string parsing | MIT |
| [js-cookie](https://github.com/js-cookie/js-cookie) | ^3.0.8 | Cookie management | MIT |

> These libraries are inlined into the bundle via Webpack (no `externals`).  
> They are listed under `devDependencies` since installation is not required at runtime.

## Release Boundary

Publishing to npm, uploading CDN bundles, syncing the public GitHub repository, and updating the guide are managed DFINERY release operations.
