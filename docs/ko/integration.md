# Web-SDK 연동하기

## 시작하기 전에

콘솔 서비스 관리 / 서비스 정보 페이지에서 데이터 소소에 Web > 루트 도메인을 등록해주셔야합니다.

## 설치 및 초기화

### 지원 브라우저

| Chrome | Firefox | Safari | Edge | IE  |
| :----: | :-----: | :----: | :--: | :-: |
|   O    |    O    |   O    |  O   |  X  |

### 설치 및 초기화

```javascript
// SDK 설치
// Set Dfinery Web SDK in Lastest Version
<script type="text/javascript" src="//static.dfinery.io/web-sdk/latest/dfinery-snippet-latest.min.js"></script>

<script>
    Dfinery.init('Your ServiceId');
</script>
```

SDK 초기화 시 항목별 설정값은 아래와 같습니다. 필수값은 아니며 설정 안할시 기본값을 사용합니다.

| 이름                 | 타입               | 기본값                   | 설명                                 |
| -------------------- | ------------------ | ------------------------ | ------------------------------------ |
| shareSubdomainCookie | boolean            | true                     | sub domain과 공유되는 쿠키 사용 여부 |
| traceLevel           | Dfinery.TraceLevel | Dfinery.TraceLevel.Error | [로그 레벨](#로그-레벨)              |

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

### 다른 기능과 부가 설정을 확인하게 위해선 다음 문서를 참조하세요.

- [분석](./analytics.md)
- [유저 식별 정보](./identity.md)
- [유저 프로필](./user_profile.md)
- [액션](./action.md)
- [연동 시나리오](./identity_scenario.md)

## 더 알아보기

### 서비스 ID 확인하기

1. 콘솔에서 서비스 관리 > 서비스 정보 페이지에 진입합니다.

2. 하단에 있는 Key 정보에서 서비스키를 확인합니다.



