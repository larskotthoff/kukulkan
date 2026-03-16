import type { RouterResponseInit, CustomResponse } from "../types";
export declare function redirect(url: string, init?: number | RouterResponseInit): CustomResponse<never>;
export declare function reload(init?: RouterResponseInit): CustomResponse<never>;
export declare function json<T>(data: T, init?: RouterResponseInit): CustomResponse<T>;
