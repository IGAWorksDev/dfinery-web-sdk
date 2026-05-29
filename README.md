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

## Release Boundary

Publishing to npm, uploading CDN bundles, syncing the public GitHub repository, and updating the guide are managed DFINERY release operations.
