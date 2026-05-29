# CDN MPA Example

This is a no-build, no-npm MPA example for old server-rendered integrations.

Each HTML page:

- pastes an inline Dfinery snippet bootstrap into the page;
- loads an SDK bundle through that snippet;
- uses `window.Dfinery`, `window.DFEvent`, `window.DFEventProperty`, `window.DFIdentity`, `window.DFUserProfile`, `window.DFGender`, and `window.DFLogLevel`;
- calls `Dfinery.init` once for that document load;
- passes `transport: 1` to `Dfinery.init` so SDK API requests use XHR instead of beacon;
- moves between pages with normal document links.

Open the source directly through any static server:

```bash
cd WebSDK/examples/cdn-mpa
python3 -m http.server 9053
```

Then open `http://127.0.0.1:9053/home.html?sdk=dev`.

The source example defaults to hosted SDK URLs so it can be opened directly. The deployable playground build emits three SDK-source variants:

- `local`: builds the local dev SDK, copies it into `dist/cdn-mpa-playground/local/sdk/`, then loads that relative SDK file.
- `dev`: loads the deployed dev SDK from `https://static.dfinery.io/web-sdk/test/dfn-web-sdk.js`.
- `prod`: loads the deployed latest SDK from `https://static.dfinery.io/web-sdk/latest/dfn-web-sdk.min.js`.

Query parameters:

- `serviceId`: overrides the default service ID. The dev/local outputs default to `gou080`; the prod output defaults to `jyraee`.
- `runId`: adds a stable suffix to identities and order IDs.
- `sdk=dev`: uses the dev SDK mode. In the `local` deployable build, this defaults to `./sdk/dfn-web-sdk.js`; in the `dev` deployable build, this defaults to `https://static.dfinery.io/web-sdk/test/dfn-web-sdk.js`.
- `sdk=latest`: uses the latest/prod SDK mode. In the deployable build, this defaults to `https://static.dfinery.io/web-sdk/latest/dfn-web-sdk.min.js`.
- `sdkUrl`: overrides the SDK bundle URL completely.
