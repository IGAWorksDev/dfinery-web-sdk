import cjsModule from "./index.cjs";

const sdk = cjsModule && cjsModule.__esModule ? cjsModule : cjsModule;

export const Dfinery = sdk.Dfinery;
export const DFEvent = sdk.DFEvent;
export const DFEventProperty = sdk.DFEventProperty;
export const DFIdentity = sdk.DFIdentity;
export const DFUserProfile = sdk.DFUserProfile;
export const DFGender = sdk.DFGender;
export const DFLogLevel = sdk.DFLogLevel;
export const DFConfig = sdk.DFConfig;

export default sdk.default || sdk.Dfinery;
