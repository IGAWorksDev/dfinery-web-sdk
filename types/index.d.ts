export declare const DFEvent: {
  readonly LOGIN: "df_login";
  readonly LOGOUT: "df_logout";
  readonly SIGN_UP: "df_sign_up";
  readonly PURCHASE: "df_purchase";
  readonly REFUND: "df_refund";
  readonly VIEW_HOME: "df_view_home";
  readonly VIEW_PRODUCT_DETAILS: "df_view_product_details";
  readonly ADD_TO_CART: "df_add_to_cart";
  readonly ADD_TO_WISHLIST: "df_add_to_wishlist";
  readonly VIEW_SEARCH_RESULT: "df_view_search_result";
  readonly SHARE_PRODUCT: "df_share_product";
  readonly VIEW_LIST: "df_view_list";
  readonly VIEW_CART: "df_view_cart";
  readonly REMOVE_CART: "df_remove_cart";
  readonly ADD_PAYMENT_INFO: "df_add_payment_info";
};

export declare const DFEventProperty: {
  readonly ITEMS: "df_items";
  readonly ITEM_ID: "df_item_id";
  readonly ITEM_NAME: "df_item_name";
  readonly ITEM_PRICE: "df_price";
  readonly ITEM_QUANTITY: "df_quantity";
  readonly ITEM_DISCOUNT: "df_discount";
  readonly ITEM_CATEGORY1: "df_category1";
  readonly ITEM_CATEGORY2: "df_category2";
  readonly ITEM_CATEGORY3: "df_category3";
  readonly ITEM_CATEGORY4: "df_category4";
  readonly ITEM_CATEGORY5: "df_category5";
  readonly TOTAL_REFUND_AMOUNT: "df_total_refund_amount";
  readonly ORDER_ID: "df_order_id";
  readonly DELIVERY_CHARGE: "df_delivery_charge";
  readonly PAYMENT_METHOD: "df_payment_method";
  readonly TOTAL_PURCHASE_AMOUNT: "df_total_purchase_amount";
  readonly SHARING_CHANNEL: "df_sharing_channel";
  readonly SIGN_CHANNEL: "df_sign_channel";
  readonly KEYWORD: "df_keyword";
  readonly DISCOUNT: "df_discount";
};

export declare const DFIdentity: {
  readonly EXTERNAL_ID: "external_id";
  readonly EMAIL: "email";
  readonly PHONE_NO: "phone_no";
  readonly KAKAO_USER_ID: "kakao_user_id";
  readonly LINE_USER_ID: "line_user_id";
  readonly UNIFIED_ID: "unified_id";
};

export declare const DFUserProfile: {
  readonly BIRTH: "df_birth";
  readonly GENDER: "df_gender";
  readonly NAME: "df_name";
  readonly MEMBERSHIP: "df_membership";
  readonly PUSH_OPTIN: "df_push_optin";
  readonly PUSH_ADS_OPTIN: "df_push_ads_optin";
  readonly PUSH_NIGHT_ADS_OPTIN: "df_push_night_ads_optin";
  readonly SMS_ADS_OPTIN: "df_sms_ads_optin";
  readonly KAKAO_ADS_OPTIN: "df_kakao_ads_optin";
};

export declare const DFGender: {
  readonly MALE: "Male";
  readonly FEMALE: "Female";
  readonly NON_BINARY: "NonBinary";
  readonly OTHER: "Other";
};

export declare const DFLogLevel: {
  readonly DISABLE: 0;
  readonly ERROR: 1;
  readonly WARN: 2;
  readonly INFO: 3;
  readonly DEV: 99;
};

export declare const DFConfig: {
  readonly LOG_ENABLE: "logEnable";
  readonly LOG_LEVEL: "logLevel";
  readonly SHARE_SUBDOMAIN_COOKIE: "shareSubdomainCookie";
};

export declare const Dfinery: {
  readonly isInitialized: boolean;
  readonly dfnOptions: unknown;
  readonly queue: unknown[];
  readonly debug: {
    traceListener(fn: (message: string, logLevel?: typeof DFLogLevel[keyof typeof DFLogLevel]) => void): void;
  };
  readonly UserProfile: typeof DFUserProfile;
  readonly Identity: typeof DFIdentity;
  readonly Gender: typeof DFGender;
  readonly Event: typeof DFEvent;
  readonly EventProperty: typeof DFEventProperty;
  readonly LogLevel: typeof DFLogLevel;
  init(serviceId: string, options?: {
    shareSubdomainCookie?: boolean;
    logEnable?: boolean;
    logLevel?: typeof DFLogLevel[keyof typeof DFLogLevel];
    transport?: 0 | 1;
    traceListener?: (message: string, logLevel?: typeof DFLogLevel[keyof typeof DFLogLevel]) => void;
  } | null): Promise<void>;
  onInitialized(callback: () => void): Promise<void>;
  getCookieId(): string;
  logEvent(eventName: typeof DFEvent[keyof typeof DFEvent] | string, properties?: Record<string, unknown> | null): Promise<void>;
  isSDKEnabled(): boolean;
  enableSDK(): Promise<void>;
  disableSDK(): void;
  setUserProfile(key: typeof DFUserProfile[keyof typeof DFUserProfile] | string, value: unknown): Promise<void>;
  setUserProfiles(profiles: Partial<Record<typeof DFUserProfile[keyof typeof DFUserProfile] | string, unknown>> & Record<string, unknown>): Promise<void>;
  setIdentity(key: typeof DFIdentity[keyof typeof DFIdentity], value: string | null): Promise<void>;
  setIdentities(identity: Partial<Record<typeof DFIdentity[keyof typeof DFIdentity], string | null>> & {
    anonymous_id?: string | null;
    unified_id?: string | null;
  }): Promise<void>;
  resetIdentity(): Promise<void>;
  runQueuedFunctions(): Promise<boolean>;
  remainQueuedFunctions(): Promise<boolean>;
};
export default Dfinery;
