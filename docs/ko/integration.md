# Web-SDK 연동하기

## 시작하기 전에

콘솔 서비스 관리 / 서비스 정보 페이지에서 데이터 소스에 Web > 루트 도메인을 등록해주셔야합니다.

## 설치 및 초기화

SDK 설치 및 초기화 방법에 대한 안내 가이드 입니다.

### 지원 브라우저
지원 브라우저는 아래와 같습니다. 
```
Chrome, Safari, Samsung Internet, Edge, Whale, Firefox, Opera
```

> [!WARNING] 
> IE(Intenet Explorer)는 지원하지 않습니다.

### 설치 및 초기화

아래의 코드를 추가하여 SDK를 설치 및 초기화 합니다.

```javascript
// SDK 설치
// Set Dfinery Web SDK in Lastest Version
<script type="text/javascript" src="//static.dfinery.io/web-sdk/latest/dfinery-snippet-latest.min.js"></script>

<script>
    Dfinery.init('Your ServiceId');
</script>
```

> [!NOTE]
> SDK 버전 업데이트 시, 스크립트 내의 메서드 명이 변경되거나 추가될 수 있습니다. 항상 최신 버전을 유지하시는 것을 권장합니다.

> [!WARNING]
> 반드시 설치 스크립트 이후에 초기화 스크립트가 실행되어야 합니다.

SDK 초기화 시 항목별 설정값은 아래와 같습니다.

| 이름                 | 타입               | 기본값                   | 설명                                 | 필수 |
| -------------------- | ------------------ | ------------------------ | ------------------------------------ | ---- |
| shareSubdomainCookie | boolean            | true                     | sub domain과 공유되는 쿠키 사용 여부 | X    |
| traceLevel           | Dfinery.TraceLevel | Dfinery.TraceLevel.Error | [로그 레벨](#로그-레벨)              | X    |

```javascript
<script>
     // init 옵션을 사용하는 경우
    Dfinery.init('Your ServiceId', {
        traceLevel: Dfinery.TraceLevel.INFO, // INFO로 설정시 자세한 로그를 볼수 있습니다.  테스트시 추천
    });
</script>
```

### 로그 레벨

| 상수                       | 값  | 타입                        |
| -------------------------- | --- | --------------------------- |
| Dfinery.TraceLevel.DISABLE | 0   | 로그 설정 안함              |
| Dfinery.TraceLevel.ERROR   | 1   | Error 로그만 표시           |
| Dfinery.TraceLevel.WARN    | 2   | Warn, Error 로그 표시       |
| Dfinery.TraceLevel.INFO    | 3   | Error, Warn, Info 로그 표시 |

## 설치 확인

SDK 가 정상적으로 불러와졌는지 확인하기 위해서는 브라우저 콘솔 창에 window.Dfinery를 입력하여 객체가 생성되어 있는지 확인합니다.

### 다른 기능과 부가 설정을 확인하게 위해선 다음 문서를 참조하세요.

- [분석](./analytics.md)
- [통합 ID 식별 정보](./identity.md)
- [유저 프로필](./user_profile.md)
- [연동 시나리오](./identity_scenario.md)

## 더 알아보기

### 서비스 ID 확인하기

1. 콘솔에서 서비스 관리 > 서비스 정보 페이지에 진입합니다.

2. 하단에 있는 Key 정보에서 서비스키를 확인합니다.
