# 분석

이 문서는 Dfinery SDK를 사용하여 사용자의 동작을 추적하기 위해 수행해야할 작업에 대해 서술합니다.

## 시작하기 전에

Web-SDK를 사용하기 전에 디파이너리 콘솔에 이벤트를 등록 후 연동해 주세요. 이벤트 등록은 콘솔의 부가 설정 > 데이터 연동 > 이벤트 관리 > 이벤트 목록에서 할 수 있습니다.

> [!WARNING]주의
> 등록되지 않은 이벤트, 이벤트 속성, 잘못된 타입의 이벤트 속성이 기록될 경우, 혹은 등록된 이벤트 속성중 하나라도 누락될 경우 이벤트가 기록되지 않습니다.

## 이벤트 기록

[표준 이벤트](#표준-이벤트)중 하나를 입력 후 `logEvent`함수를 호출하여 이벤트를 기록합니다.

```javascript
logEvent(eventName);

logEvent(eventName, eventParam);
```

각각의 매개변수는 다음을 의미합니다.

- `eventName` : 이벤트명
- `eventParam` : 이벤트 속성

## 표준

표준 이벤트와 표준 이벤트 속성, 상품 속성은 아래와 같습니다.
이벤트명으로 사용해도 무방합니다.

### 표준 이벤트

표준 이벤트의 이벤트명의 경우 다음과 같이 이벤트명이 사전 정의된 정적 상수로 제공됩니다.

| 상수명                             | 이벤트명                |
| ---------------------------------- | ----------------------- |
| Dfinery.Event.SIGN_UP              | df_sign_up              |
| Dfinery.Event.PURCHASE             | df_purchase             |
| Dfinery.Event.VIEW_HOME            | df_view_home            |
| Dfinery.Event.VIEW_PRODUCT_DETAILS | df_view_product_details |
| Dfinery.Event.ADD_TO_CART          | df_add_to_cart          |
| Dfinery.Event.ADD_TO_WISHLIST      | df_add_to_wishlist      |
| Dfinery.Event.REFUND               | df_refund               |
| Dfinery.Event.VIEW_SEARCH_RESULT   | df_view_search_result   |
| Dfinery.Event.SHARE_PRODUCT        | df_share_product        |
| Dfinery.Event.VIEW_LIST            | df_view_list            |
| Dfinery.Event.VIEW_CART            | df_view_cart            |
| Dfinery.Event.ADD_PAYMENT_INFO     | df_add_payment_info     |
| Dfinery.Event.REMOVE_CART          | df_remove_cart          |
| Dfinery.Event.LOGIN                | df_login                |
| Dfinery.Event.LOGOUT               | df_logout               |

### 표준 이벤트 속성

표준 이벤트의 속명의 경우 다음과 같이 이벤트 속성명이 사전 정의된 정적 상수로 제공됩니다.

| 상수명                                          | 이벤트명                 |
| ----------------------------------------------- | ------------------------ |
| Dfinery.EventProperty.KEY_ITEMS                 | df_items                 |
| Dfinery.EventProperty.KEY_TOTAL_REFUND_AMOUNT   | df_total_refund_amount   |
| Dfinery.EventProperty.KEY_ORDER_ID              | df_order_id              |
| Dfinery.EventProperty.KEY_DELIVERY_CHARGE       | df_delivery_charge       |
| Dfinery.EventProperty.KEY_PAYMENT_METHOD        | df_payment_method        |
| Dfinery.EventProperty.KEY_TOTAL_PURCHASE_AMOUNT | df_total_purchase_amount |
| Dfinery.EventProperty.KEY_SHARING_CHANNEL       | df_sharing_channel       |
| Dfinery.EventProperty.KEY_SIGN_CHANNEL          | df_sign_channel          |
| Dfinery.EventProperty.KEY_KEYWORD               | df_keyword               |

### 상품 속성

`Dfinery.EventProperty.KEY_ITEMS` 내에 배열로 적재되는 상품에 대한 기 정의된 속성 값에 대한 정보입니다.

| 상수명                              | 속성 명      | 타입   | 설명           |
| ----------------------------------- | ------------ | ------ | -------------- |
| Dfinery.EventProperty.KEY_ITEM_ID   | df_item_id   | String | 상품 번호(ID)  |
| Dfinery.EventProperty.KEY_ITEM_NAME | df_item_name | String | 상품 명        |
| Dfinery.EventProperty.KEY_PRICE     | df_price     | Number | 상품 단가      |
| Dfinery.EventProperty.KEY_QUANTITY  | df_quantity  | Number | 상품 수량      |
| Dfinery.EventProperty.KEY_DISCOUNT  | df_discount  | Number | 상품 할인가    |
| Dfinery.EventProperty.KEY_CATEGORY1 | df_category1 | String | 상품 카테고리1 |
| Dfinery.EventProperty.KEY_CATEGORY2 | df_category2 | String | 상품 카테고리2 |
| Dfinery.EventProperty.KEY_CATEGORY3 | df_category3 | String | 상품 카테고리3 |
| Dfinery.EventProperty.KEY_CATEGORY4 | df_category4 | String | 상품 카테고리4 |
| Dfinery.EventProperty.KEY_CATEGORY5 | df_category5 | String | 상품 카테고리5 |

### 사용 예시

```javascript
// 이벤트만 기록할 경우 ex) 로그인
Dfinery.logEvent(Dfinery.EVENT.LOGIN);

// 이벤트 속성과 함께 기록할 경우 ex) 회원가입
const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_SIGN_CHANNEL] = 'Kakao';
Dfinery.logEvent(Dfinery.Event.SIGN_UP, eventParam);

// 이벤트 item 속성과 함께 기록할 경우 ex) 구매
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);
const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;

Dfinery.logEvent(Dfinery.Event.PURCHASE, eventParam);
```

## 로그인

유저가 로그인하는 동작을 나타내는 이벤트입니다.  
로그인 이벤트 전 유저의 Identity를 설정하면 해당 유저의 Login이벤트로 측정할 수 있습니다.
Identity설정과 Event를 같이 하려면 비동기(async) 함수내에서 실행되어야 합니다.

```javascript
async function DfineryLogin(){
  // 유저 식별 정보 설정
  await Dfinery.setIdentity(Dfinery.Identity.EXTERNAL_ID, 'TestUserId');
  // 로그인 이벤트
  Dfinery.logEvent(Dfinery.Event.LOGIN);
}
```

> [!WARNING] 
> `Dfinery.setIdentity` API를 기다리지 않고 Login을 실행할 경우 Identity를 설정한 유저의 Login이벤트로 측정 안 될 수 있으므로 반드시 await나 promise.then함수를 사용하여 Identity가 설정된 후 호출 되어야 합니다. 
## 로그아웃

유저가 로그아웃하는 동작을 나타내는 이벤트입니다.

```javascript
Dfinery.logEvent(Dfinery.Event.LOGOUT);
```

## 회원가입

유저가 회원으로 가입하는 동작을 나타내는 이벤트입니다.

```javascript
const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_SIGN_CHANNEL] = 'Kakao';
Dfinery.logEvent(Dfinery.Event.SIGN_UP, eventParam);
```

### 기 정의된 속성 값

| 이름                                   | 타입   | 설명          |
| -------------------------------------- | ------ | ------------- |
| Dfinery.EventProperty.KEY_SIGN_CHANNEL | String | 회원가입 채널 |

## 홈 화면 조회

유저가 앱의 홈 화면을 조회하는 동작을 나타내는 이벤트입니다.

```javascript
const eventParam = {};
eventParam['key'] = 'value'; //사용자 정의 속성 값(Optional)
Dfinery.logEvent(Dfinery.Event.VIEW_HOME, eventParam);
```

## 장바구니 조회

유저가 장바구니를 조회하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);
//itemList.push(item2); 아이템이 2개 이상인경우 추가로 입력

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;

Dfinery.logEvent(Dfinery.Event.VIEW_CART, eventParam);
```

</details>

### 기 정의된 속성 값

| 이름                              | 타입  | 설명               |
| --------------------------------- | ----- | ------------------ |
| Dfinery.EventProperty.KEY_ITEM_ID | Array | [상품 속성](#상품-속성) |

## 상품 목록 조회

유저가 상품 목록을 조회하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;

Dfinery.logEvent(Dfinery.Event.VIEW_LIST, eventParam);
```

</details>

### 기 정의된 속성 값

| 이름      | 타입  | 설명               |
| --------- | ----- | ------------------ |
| KEY_ITEMS | Array | [상품 속성](#상품-속성) |

## 상품 공유하기

유저가 상품을 공유하는 동작을 나타내는 이벤트입니다.

<details open>
  <summary>Javascript</summary>

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
eventParam[Dfinery.EventProperty.KEY_SHARING_CHANNEL] = 'Facebook';

Dfinery.logEvent(Dfinery.Event.SHARE_PRODUCT, eventParam);
```

</details>

### 기 정의된 속성 값

| 이름                                      | 타입  | 설명                                                                                 |
| ----------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| Dfinery.EventProperty.KEY_ITEMS           | Array | [상품 속성](https://github.com/IGAWorksDev/dfn-v2-dfinery-web-sdk/wiki/📊-분석#상품-속성) |
| Dfinery.EventProperty.KEY_SHARING_CHANNEL | Enum  | 상품 공유 채널                                                                       |

## 상품 검색하기

유저가 상품을 검색하여 결과를 확인하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 16000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 700;
item[Dfinery.EventProperty.KEY_QUANTITY] = 10;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
eventParam[Dfinery.EventProperty.KEY_KEYWORD] = '사또밥';

Dfinery.logEvent(Dfinery.Event.VIEW_SEARCH_RESULT, eventParam);
```

</details>

### 기 정의된 속성 값

| 이름                              | 타입   | 설명               |
| --------------------------------- | ------ | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS   | Array  | [상품 속성](#상품-속성) |
| Dfinery.EventProperty.KEY_KEYWORD | String | 검색 키워드        |

## 관심 상품 추가

유저가 상품을 관심 목록에 추가하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
Dfinery.logEvent(Dfinery.Event.ADD_TO_WISHLIST, eventParam);
```

### 기 정의된 속성 값

| 이름                            | 타입  | 설명               |
| ------------------------------- | ----- | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS | Array | [상품 속성](#상품-속성) |

## 장바구니에 상품 담기

유저가 상품을 장바구니에 담는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
Dfinery.logEvent(Dfinery.Event.ADD_TO_CART, eventParam);
```

### 기 정의된 속성 값

| 이름                            | 타입  | 설명               |
| ------------------------------- | ----- | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS | Array | [상품 속성](#상품-속성) |

## 장바구니에 담긴 상품 제거하기

유저가 장바구니에 담긴 상품을 제거하는 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
Dfinery.logEvent(Dfinery.Event.REMOVE_CART, eventParam);
```

### 기 정의된 속성 값

| 이름                            | 타입  | 설명               |
| ------------------------------- | ----- | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS | Array | [상품 속성](#상품-속성) |

## 상품 상세 보기

유저가 특정 상품의 상세 정보를 조회하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
Dfinery.logEvent(Dfinery.Event.VIEW_PRODUCT_DETAILS, eventParam);
```

## 구매 정보 입력

유저가 구매 정보를 입력하는 동작을 나타내는 이벤트입니다.

```javascript
const eventParam = {};
eventParam['key'] = 'value'; //사용자 정의 속성 값(Optional)
Dfinery.logEvent(Dfinery.Event.ADD_PAYMENT_INFO, eventParam);
```

## 구매하기

유저가 상품이나 서비스를 구매하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
eventParam[Dfinery.EventProperty.KEY_PAYMENT_METHOD] = 'BankTransfer';
eventParam[Dfinery.EventProperty.KEY_ORDER_ID] = 'Order-123';
eventParam[Dfinery.EventProperty.KEY_DELIVERY_CHARGE] = 30000;
Dfinery.logEvent(Dfinery.Event.PURCHASE, eventParam);
```

### 기 정의된 속성 값

| 이름                                            | 타입   | 설명               |
| ----------------------------------------------- | ------ | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS                 | Array  | [상품 속성](#상품-속성) |
| Dfinery.EventProperty.KEY_ORDER_ID              | String | 주문 번호(ID)      |
| Dfinery.EventProperty.KEY_DELIVERY_CHARGE       | NUMBER | 배송료             |
| Dfinery.EventProperty.KEY_PAYMENT_METHOD        | String | 결제 방법          |
| Dfinery.EventProperty.KEY_TOTAL_PURCHASE_AMOUNT | NUMBER | 주문 총액          |

## 환불하기

유저가 구매한 주문을 취소하고 환불하는 동작을 나타내는 이벤트입니다.

```javascript
const item = {};
item[Dfinery.EventProperty.KEY_ITEM_ID] = '상품번호';
item[Dfinery.EventProperty.KEY_ITEM_NAME] = '상품이름';
item[Dfinery.EventProperty.KEY_CATEGORY1] = '식품';
item[Dfinery.EventProperty.KEY_CATEGORY2] = '과자';
item[Dfinery.EventProperty.KEY_PRICE] = 5000;
item[Dfinery.EventProperty.KEY_DISCOUNT] = 500;
item[Dfinery.EventProperty.KEY_QUANTITY] = 5;

const itemList = [];
itemList.push(item);

const eventParam = {};
eventParam[Dfinery.EventProperty.KEY_ITEMS] = itemList;
Dfinery.logEvent(Dfindery.Event.REFUND, eventParam);
```

### 기 정의된 속성 값

| 이름                                          | 타입   | 설명               |
| --------------------------------------------- | ------ | ------------------ |
| Dfinery.EventProperty.KEY_ITEMS               | Array  | [상품 속성](#상품-속성) |
| Dfinery.EventProperty.KEY_TOTAL_REFUND_AMOUNT | NUMBER | 환불 총액          |

## 커스텀 이벤트

사용자가 직접 임의의 이벤트 명칭과 속성을 입력하여 반영하는 이벤트입니다.

### 속성이 없을 경우

```javascript
Dfinery.logEvent('{event_name}', null);
```

### 속성이 있을 경우

```javascript
const eventParam = {};
eventParam.push('key', 'value'); //사용자 정의 속성 값(Optional)
Dfinery.logEvent('{event_name}', eventParam);
```

## 자동으로 수집되는 데이터

Dfinery는 다음의 정보에 대해서 자동으로 수집합니다.

> 해당 값은 브라우저의 환경 및 종류에 따라 수집되지 않을 수 있습니다.

- 브라우저
- 브라우저의 버젼
- OS
- 설정된 언어
- 설정된 Time Zone Offset
- Url
- Referer
- utm 파라미터
