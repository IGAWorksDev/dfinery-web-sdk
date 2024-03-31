# 유저 프로필

유저 프로필은 Dfinery 서버에서 관리하고 있는 유저에 대한 프로필 정보입니다. 해당 정보들은 모두 선택사항이며 단말기에 저장되지 않습니다.

## 시작하기 전에

유저프로필을 설정하기 전에 디파이너리 콘솔에 유저프로필 속성을 생성 후 연동해 주세요. 유저프로필 속성은 부가 설정 / 데이터 연동 / 속성 관리 / 유저 프로필 속성 목록에서 생성할 수 있습니다.

> [!WARNING]
> 등록되지 않은 유저 프로필, 잘못된 타입의 유저 프로필 속성이 기록될 경우, 유저 프로필은 설정되지 않습니다.

### 유저 프로필 유형

| 상수명                         | 프로필명      | 내용                   |
| ------------------------------ | ------------- | ---------------------- |
| Dfinery.UserProfile.BIRTH      | df_birth      | 유저 생일              |
| Dfinery.UserProfile.GENDER     | df_gender     | 유저 성별              |
| Dfinery.UserProfile.NAME       | df_name       | 유저 이름              |
| Dfinery.UserProfile.MEMBERSHIP | df_membership | 유저의 멤버쉽          |
| Dfinery.UserProfile.CUSTOM     | custom        | 유저의 커스텀 프로파일 |

### 이름 설정하기

- 지원 유형
  - key : `Dfinery.UserProfile.NAME`
  - value : `String`

```javascript
Dfinery.setUserProfile(Dfinery.UserProfile.NAME, "{value}");
```

### 성별 설정하기

- 지원 유형
  - key : `Dfinery.UserProfile.GENDER`
  - value : `Dfinery.Gender.MALE`, `Dfinery.Gender.FEMALE`, `Dfinery.Gender.NON_BINARY`, `Dfinery.Gender.OTHER`

```javascript
Dfinery.setUserProfile(Dfinery.UserProfile.GENDER, Dfinery.Gender.MALE);
```

### 멤버십 설정하기

- 지원 유형
  - key : `Dfinery.UserProfile.MEMBERSHIP`
  - value : `String`

```javascript
Dfinery.setUserProfile(Dfinery.UserProfile.MEMBERSHIP, "{value}");
```

### 생년월일 설정하기

- 지원 유형
  - key : `Dfinery.UserProfile.BIRTH`
  - value : `Date`

```javascript
// 2014-05-14를 new Date를 사용해 입력했을 경우
Date birthday = new Date('2014-05-14');
Dfinery.setUserProfile(Dfinery.UserProfile.BIRTH, birthday);

// 2014/05/14을 new Date을 사용해 입력했을 경우
Date birthday = new Date('2014/05/14 GMT');
Dfinery.setUserProfile(Dfinery.UserProfile.BIRTH, birthday);
```

- 입력하는 값이 제대로 설정되는지 확인하기 위해서는 toISOString().substring(0,10)해서 나온 값과 저장하려는 값을 비교해서 확인할 수 있습니다.

  - new Date('2014/05/14').toISOString().substring(0,10) => '2014-05-13' **X**
  - new Date('2014/05/14 GMT').toISOString().substring(0,10) => '2014-05-14' **O**
  - new Date('2014-05-14').toISOString().substring(0,10) => '2014-05-14' **O**

### 유저 커스텀 프로필 설정하기

> [!WARNING]
> 가변 인자로 입력받는 `Array of String` 형식은 최대 10개, `Array of Number` 형식은 최대 5개까지 입력이 가능합니다.

- 지원 유형
  - key : `String`
  - value : `String`, `Boolean`, `Number`, `Date`, `Array of String`, `Array of Number`

```javascript
Dfinery.setUserProfile("{key}", "{value}");
```

### 유저 프로필 한번에 여러건 설정하기

지원 유형 : `builder`

- custom 지원 유형
  - key : `String`
  - value : `String`, `Boolean`, `Number`, `Date`, `Array of String`, `Array of Number`

```javascript
const profile = {};
profile[(Dfinery.UserProfile.BIRTH, new Date("2014-05-14"))];
profile[(Dfinery.UserProfile.NAME, "TestName")];
profile[(Dfinery.UserProfile.GENDER, Dfinery.Gender.MALE)];
profile[(Dfinery.UserProfile.MEMBERSHIP, "VIP")];
profile[("CustomKey", "CustomValue")]; // 설정한 Key값으로 입력

Dfinery.setUserProfiles(profile);
```

### 알림 수신 동의 정보 설정하기

이 정보는 유저 프로필의 항목이며 다양한 채널에 대한 수신 동의 정보 값을 설정할 수 있습니다.

> [!CAUTION] 
> [오후 9시 부터 오전 8시 사이에는 별도의 수신 동의를 받아야 광고성 알림을 전송할 수 있습니다.](https://spam.kisa.or.kr/spam/na/ntt/selectNttInfo.do?mi=1037&nttSn=1351&bbsId=1003)

#### 알림 수신 동의 유형

| 명칭                                                               | 채널   | 설명                                       |
| ------------------------------------------------------------------ | ------ | ------------------------------------------ |
| Dfinery.Consent.INFORMATIONAL_NOTIFICATION_FOR_PUSH_CHANNEL        | 푸시   | 푸시 채널에 대한 정보성 알림 동의          |
| Dfinery.Consent.INFORMATIONAL_NOTIFICATION_FOR_SMS_CHANNEL         | 문자   | 푸시 채널에 대한 정보성 알림 동의          |
| Dfinery.Consent.INFORMATIONAL_NOTIFICATION_FOR_KAKAO_CHANNEL       | 알림톡 | 카카오 알림톡 채널에 대한 정보성 알림 동의 |
| Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_PUSH_CHANNEL          | 푸시   | 푸시 채널에 대한 광고성 알림 동의          |
| Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_SMS_CHANNEL           | 문자   | 문자 채널에 대한 광고성 알림 동의          |
| Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_KAKAO_CHANNEL         | 알림톡 | 카카오 알림톡 채널에 대한 광고성 알림 동의 |
| Dfinery.Consent.ADVERTISING_NOTIFICATION_AT_NIGHT_FOR_PUSH_CHANNEL | 푸시   | 푸시 채널에 대한 야간 광고성 알림 동의     |

#### 설정하기

- 지원 유형
  - key : `알림 수신 동의 유형`
  - value : `Boolean`

```javascript
Dfinery.setUserProfile(
  Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_PUSH_CHANNEL,
  true
);

const profile = {};
profile[Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_PUSH_CHANNEL] = true;
profile[Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_SMS_CHANNEL] = true;
profile[Dfinery.Consent.ADVERTISING_NOTIFICATION_FOR_KAKAO_CHANNEL] = true;
profile[Dfinery.Consent.ADVERTISING_NOTIFICATION_AT_NIGHT_FOR_PUSH_CHANNEL] = false;

Dfinery.setUserProfiles(profile);
```
