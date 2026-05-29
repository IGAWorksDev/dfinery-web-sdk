# Dfinery Web SDK Playground

이 디렉터리는 고객사가 SDK를 붙이는 방식을 직접 손으로 확인하기 위한 예제 모음입니다.

먼저 대부분의 명령은 `WebSDK`에서 실행합니다.

```bash
cd WebSDK
```

모든 playground는 SDK init 옵션에 `transport: 1`을 넣어 XHR 통신을 사용합니다. SDK 내부 기준은 `0 = beacon`, `1 = xhr`입니다.

## 무엇을 확인할 때 무엇을 쓰나

| 확인 목적 | 사용할 것 | 결과를 보는 곳 |
| --- | --- | --- |
| npm + TypeScript SPA 개발 경험 | `examples/npm-spa` | `http://127.0.0.1:9051/` |
| npm + TypeScript MPA 개발 경험 | `examples/npm-mpa` | `http://127.0.0.1:9052/home.html` |
| CDN snippet 기반 구식 MPA 연동 | `examples/cdn-mpa` | `http://127.0.0.1:9053/home.html?sdk=dev` |
| 배포 가능한 npm playground 산출물 | `npm run playground:npm:build` | `dist/npm-playground/` |
| 배포 가능한 CDN MPA playground 산출물 | `npm run playground:cdn-mpa:build` | `dist/cdn-mpa-playground/` |
| 산출물 브라우저 자동 검증 | `npm run playground:*:verify` | Chrome 실행 결과 |
| S3 업로드 전 미리보기 | `npm run playground:upload:dry-run` | 터미널의 `aws s3 sync --dryrun` 출력 |

## npm SPA를 직접 개발하듯 테스트

이 방식은 고객사가 SPA에서 npm 패키지를 설치하고 TypeScript로 SDK를 import하는 경험을 확인할 때 사용합니다.

```bash
cd WebSDK
npm run package:build
cd examples/npm-spa
npm install
npm run typecheck
npm run dev
```

브라우저에서 엽니다.

```text
http://127.0.0.1:9051/
```

직접 볼 파일:

```text
WebSDK/examples/npm-spa/src/main.ts
```

여기서는 `import Dfinery, { DFEvent } from "@igaworks/dfinery-web-sdk"` 같은 npm import, TypeScript 자동완성, 타입 에러, 빌드 동작을 확인합니다. SPA 라우트 이동은 문서 전체를 새로 로드하지 않으므로 `Dfinery.init`은 앱 부팅 시 한 번만 호출되는 흐름입니다.
init 옵션에는 `transport: 1`이 들어가 있어 SDK API 요청은 XHR로 기록됩니다.

## npm MPA를 직접 개발하듯 테스트

이 방식은 고객사가 여러 HTML 문서마다 별도 entry를 두는 MPA에서 npm 패키지를 쓰는 경험을 확인할 때 사용합니다.

```bash
cd WebSDK
npm run package:build
cd examples/npm-mpa
npm install
npm run typecheck
npm run dev
```

브라우저에서 엽니다.

```text
http://127.0.0.1:9052/home.html
http://127.0.0.1:9052/product.html
http://127.0.0.1:9052/cart.html
```

직접 볼 파일:

```text
WebSDK/examples/npm-mpa/src/shared.ts
WebSDK/examples/npm-mpa/src/home.ts
WebSDK/examples/npm-mpa/src/product.ts
WebSDK/examples/npm-mpa/src/cart.ts
```

MPA는 페이지 이동 때마다 새 문서가 로드됩니다. 그래서 각 문서 entry가 로딩될 때 `Dfinery.init`이 한 번씩 호출됩니다.
각 문서의 init 옵션에도 `transport: 1`이 들어가 있어 SDK API 요청은 XHR로 기록됩니다.

## CDN snippet 구식 MPA를 직접 테스트

이 방식은 npm, TypeScript, import, bundler 없이 `<script>`와 `window.Dfinery`만 사용하는 기존 서버 렌더링 페이지를 확인할 때 사용합니다.
snippet 방식에서도 `Dfinery.init` 옵션에 `transport: 1`을 넣어 XHR 통신을 사용합니다.

```bash
cd WebSDK/examples/cdn-mpa
python3 -m http.server 9053
```

브라우저에서 엽니다.

```text
http://127.0.0.1:9053/home.html?sdk=dev
http://127.0.0.1:9053/product.html?sdk=dev
http://127.0.0.1:9053/cart.html?sdk=dev
```

직접 볼 파일:

```text
WebSDK/examples/cdn-mpa/home.html
WebSDK/examples/cdn-mpa/product.html
WebSDK/examples/cdn-mpa/cart.html
WebSDK/examples/cdn-mpa/legacy-mpa.js
```

쿼리 파라미터:

| 파라미터 | 의미 |
| --- | --- |
| `serviceId` | 기본 service id 대신 다른 service id 사용. dev API 기본값은 `gou080`, prod API 기본값은 `jyraee` |
| `runId` | 서버에서 찾기 쉽도록 identity/order id 등에 붙는 실행 식별자 |
| `sdk=dev` | dev SDK 모드 사용 |
| `sdk=latest` | latest/prod SDK 모드 사용 |
| `sdkUrl` | SDK script URL을 직접 지정 |

## 배포 가능한 npm playground 만들기

```bash
cd WebSDK
npm run playground:npm:build
```

결과물:

```text
WebSDK/dist/npm-playground/local-sdk-dev-api/index.html
WebSDK/dist/npm-playground/local-sdk-dev-api/spa/index.html
WebSDK/dist/npm-playground/local-sdk-dev-api/mpa/home.html
WebSDK/dist/npm-playground/local-sdk-dev-api/mpa/product.html
WebSDK/dist/npm-playground/local-sdk-dev-api/mpa/cart.html

WebSDK/dist/npm-playground/local-sdk-prod-api/index.html
WebSDK/dist/npm-playground/local-sdk-prod-api/spa/index.html
WebSDK/dist/npm-playground/local-sdk-prod-api/mpa/home.html
WebSDK/dist/npm-playground/local-sdk-prod-api/mpa/product.html
WebSDK/dist/npm-playground/local-sdk-prod-api/mpa/cart.html
```

이름의 의미:

| 경로 | SDK 소스 | API 서버 |
| --- | --- | --- |
| `local-sdk-dev-api/` | 현재 로컬 코드로 만든 npm tarball | dev API |
| `local-sdk-prod-api/` | 현재 로컬 코드로 만든 npm tarball | prod API |

자동 검증:

```bash
npm run playground:npm:verify
```

주의: 현재 `@igaworks/dfinery-web-sdk`는 public npm registry에서 조회되지 않습니다. 그래서 이 산출물은 원격 npm 배포본 비교가 아니라, 로컬 SDK를 npm package tarball처럼 묶어서 dev/prod API host별로 빌드한 후보 산출물입니다. 나중에 실제 npm 배포본을 검증할 수 있게 되면 `published-sdk-dev-api/`, `published-sdk-prod-api/`처럼 SDK 소스를 경로명에 별도로 드러내는 구조로 확장합니다.

## 배포 가능한 CDN MPA playground 만들기

```bash
cd WebSDK
npm run playground:cdn-mpa:build
```

결과물:

```text
WebSDK/dist/cdn-mpa-playground/local/index.html
WebSDK/dist/cdn-mpa-playground/dev/index.html
WebSDK/dist/cdn-mpa-playground/prod/index.html
```

SDK 소스:

| 경로 | SDK |
| --- | --- |
| `dist/cdn-mpa-playground/local/` | 로컬에서 빌드한 `local/sdk/dfn-web-sdk.js` |
| `dist/cdn-mpa-playground/dev/` | `https://static.dfinery.io/web-sdk/test/dfn-web-sdk.js` |
| `dist/cdn-mpa-playground/prod/` | `https://static.dfinery.io/web-sdk/latest/dfn-web-sdk.min.js` |

자동 검증:

```bash
npm run playground:cdn-mpa:verify
```

## S3 업로드

실제 업로드 전에 항상 dry-run을 먼저 봅니다.

```bash
cd WebSDK
npm run playground:upload:dry-run
```

특정 surface만 확인할 수도 있습니다.

```bash
npm run playground:npm:upload:dry-run
npm run playground:cdn-mpa:upload:dry-run
```

실제 업로드:

```bash
npm run playground:upload
```

특정 대상만 업로드:

```bash
npm run playground:npm:upload -- --env local-sdk-dev-api
npm run playground:npm:upload -- --env local-sdk-prod-api
npm run playground:cdn-mpa:upload -- --env local
npm run playground:cdn-mpa:upload -- --env dev
npm run playground:cdn-mpa:upload -- --env prod
```

기본 업로드 대상:

```text
s3://static.dfinery.io/web-sdk/test/npm-playground/local-sdk-dev-api/
s3://static.dfinery.io/web-sdk/test/npm-playground/local-sdk-prod-api/
s3://static.dfinery.io/web-sdk/test/cdn-mpa-playground/local/
s3://static.dfinery.io/web-sdk/test/cdn-mpa-playground/dev/
s3://static.dfinery.io/web-sdk/test/cdn-mpa-playground/prod/
```

업로드 후 브라우저에서 보는 URL:

```text
https://static.dfinery.io/web-sdk/test/npm-playground/local-sdk-dev-api/index.html
https://static.dfinery.io/web-sdk/test/npm-playground/local-sdk-prod-api/index.html

https://static.dfinery.io/web-sdk/test/cdn-mpa-playground/local/index.html
https://static.dfinery.io/web-sdk/test/cdn-mpa-playground/dev/index.html
https://static.dfinery.io/web-sdk/test/cdn-mpa-playground/prod/index.html
```

업로드 스크립트는 기본적으로 object ACL을 붙이지 않습니다. `static.dfinery.io` 버킷은 public ACL을 막고 있으므로 `-- --acl public-read`를 붙이면 실패할 수 있습니다.

## 서버에서 기록 찾기

dev API를 호출하는 playground는 기본 service id로 `gou080`을 사용하고, prod API를 호출하는 playground는 기본 service id로 `jyraee`를 사용합니다.

실행별 데이터를 서버에서 쉽게 찾고 싶으면 URL에 `runId`를 붙입니다.

```text
http://127.0.0.1:9051/?runId=my-test-001
http://127.0.0.1:9052/home.html?runId=my-test-001
http://127.0.0.1:9053/home.html?sdk=dev&runId=my-test-001
```
