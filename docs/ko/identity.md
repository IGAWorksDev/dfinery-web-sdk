# 통합 ID 식별 정보 설정하기

Dfinery는 유저를 식별하기 위해 통합 아이디를 발급하여 관리합니다. 통합 아이디는 여러 정보를 규합하여 하나의 값을 만들기 때문에 유저 식별 정보가 많이 입력 될 경우 아이디의 고유성이 더 보장됩니다. 해당 정보들은 모두 선택사항이며 쿠키에 암호화하여 저장됩니다.

### 익명의 유저 프로필

유저 식별 정보를 설정하지 않았을 경우 유저는 익명 유저로 취급됩니다. 예를 들어 웹사이트에 방문했지만 가입하지 않았거나 모바일 앱을 다운로드 했지만 프로필을 만들지 않은 유저가 될 수 있습니다.
처음에 SDK를 통해 유저가 인식되면 SDK에서 생성한 고유 식별자가 발급되어 익명의 유저 프로필이 생성됩니다.


### 통합 ID 식별된 유저 프로필

아래 식별 정보 유형 중 `Dfinery.Identity.EXTERNAL_ID` 값을 설정할 경우 Dfinery에서 식별된 유저로 취급되며 여러 장치에서 동일한 유저 프로필을 식별할 수 있게 됩니다. 또한 보다 명확한 유저 식별을 위해 유저 이메일, 전화번호 등의 정보를 추가로 설정할 수 있습니다.

만약 기존에 기입한 `Dfinery.Identity.EXTERNAL_ID` 값과 다른 값을 입력할 경우 새로운 유저로 인식하여 기존에 저장하고 있던 식별 정보를 모두 제거합니다.


### 통합 ID 식별 정보 유형

| 유형                           | 내용                       |
| ------------------------------ | -------------------------- |
| Dfinery.Identity.EXTERNAL_ID   | 사용자 ID |
| Dfinery.Identity.EMAIL         | 사용자 이메일                |
| Dfinery.Identity.PHONE_NO      | 사용자 전화번호              |
| Dfinery.Identity.KAKAO_USER_ID | 사용자의 카카오 계정 아이디  |
| Dfinery.Identity.LINE_USER_ID  | 사용자의 라인 계정 아이디    |

### 항목 별로 설정하기

- 지원 유형
  - key : `식별 정보 유형`
  - value : `String`

```javascript
Dfinery.setIdentity(Dfinery.Identity.EXTERNAL_ID, "{value}");
```

### 한번에 여러건 설정하기

- 지원 유형 : `Array`

```javascript
let identity = {};
identity[Dfinery.Identity.EXTERNAL_ID] = "TESTID";
identity[Dfinery.Identity.EMAIL] = "test1234@gmail.com";
identity[Dfinery.Identity.PHONE_NO] = "010-1234-5678";
identity[Dfinery.Identity.KAKAO_USER_ID] = "12d1s21";

Dfinery.setIdentities(identity);
```

## 통합 ID 식별 정보 초기화하기

Dfinery.resetIdentity 메소드를 호출하면 기존 저장하고 있던 통합 ID 식별 정보를 제거하고 초기화할 수 있습니다.
> [!CAUTION]
> 이 메소드를 호출 할 경우 기존 사용자의 이벤트 흐름이 끊기므로 유저 시나리오에 맞게 사용하세요.

```javascript
Dfinery.resetIdentity();
```

