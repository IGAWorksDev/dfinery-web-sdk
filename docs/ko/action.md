# 액션

액션은 푸시 알림, 인앱 메시지 등을 통해 고객과 가상으로 소통할 수 있는 방법입니다. 

## 통합 ID와 단말기를 연결하기
사용자가 액션을 받기 위해서는 통합 ID 기반으로 설정된 유저 정보와 단말기의 연결하여 해당 유저가 타겟팅이 되도록 해야합니다.

### 연결하기
[통합 ID 식별 정보 설정하기](./identity.md)를 통해 통합 ID 식별 정보를 설정하면 SDK가 자동으로 통합 ID와 단말기를 연결합니다.

### 연결 해제하기
`Dfinery.suspendUserTargeting()` 메소드를 사용하면 유저 식별 정보와 단말기의 연결을 해제할 수 있습니다. 연결 해제시 액션을 수신 받을 수 없습니다. 다시 유저 식별 정보를 설정할 경우에는 다시 새로 연결이 구축됩니다.


```javascript
Dfinery.suspendUserTargeting();
```

### 연결 예제

> [!NOTE]
> 통합 ID와 단말기의 연결은 이벤트와는 관계없습니다. 이해를 돕기위해 로그인, 로그아웃 이벤트를 넣었으므로 참고 바랍니다.

#### 로그인 시 통합 ID 정보를 설정하고 로그아웃시 별도의 동작을 하지 않을 경우
로그아웃시의 별도의 동작을 하지 않는 경우입니다. 이 경우 통합 ID 설정하기를 통해 새로운 유저의 정보가 설정되기 전까지는 로그아웃을 하더라도 기존 유저의 이벤트 흐름이 유지되고 액션도 계속해서 수신됩니다. 

```javascript
//통합 ID 정보 설정
await Dfinery.setIdentity(Dfinery.Identity.EXTERNAL_ID, 'TestUserId')
//로그인 이벤트 등록
Dfinery.logEvent(Dfinery.Event.LOGIN)
//로그아웃 이벤트 등록
Dfinery.logEvent(Dfinery.Event.LOGOUT)
```

#### 로그인 시 통합 ID 정보를 설정하고 로그아웃시 임의로 연결을 해제하는 경우
로그아웃시에 임의로 연결을 해제하는 경우입니다. 연결을 해제한 뒤로는 통합 ID 설정하기를 통해 새로운 유저의 정보가 설정되기 전까지 기존 유저의 이벤트 기록의 흐름은 유지되나 액션은 수신 받을 수 없습니다.

```javascript
//통합 ID 정보 설정
Dfinery.setIdentity(Dfinery.Identity.EXTERNAL_ID, 'TestUserId')
//로그인 이벤트 등록
Dfinery.logEvent(Dfinery.Event.LOGIN)
//로그아웃 이벤트 등록
Dfinery.logEvent(Dfinery.Event.LOGOUT)
//통합 ID와 단말기 연결 해제
Dfinery.suspendUserTargeting()
```

#### 로그인 시 통합 ID 정보를 설정하고 로그아웃시 초기화할 경우
로그아웃시에 통합 ID 정보를 초기화 하는 경우입니다. 초기화 한 뒤로는 통합 ID 설정하기를 통해 새로운 유저의 정보가 설정되기 전까지 기존 유저의 이벤트 기록이 끊기고 액션을 수신 받을 수 없습니다.

```javascript
//통합 ID 정보 설정
Dfinery.setIdentity(DF.Identity.EXTERNAL_ID, 'TestUserId')
//로그인 이벤트 등록
Dfinery.logEvent(DF.Event.LOGIN, null)
//로그아웃 이벤트 등록
Dfinery.logEvent(DF.Event.LOGOUT, null)
//통합 ID 정보 초기화
Dfinery.resetIdentity()
```