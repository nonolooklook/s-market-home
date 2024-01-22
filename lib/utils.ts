import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { get } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMsg(error: any) {
  // msg
  let msg = "Unkown";
  if (typeof error == "string") msg = error;
  else if (typeof error?.msg == "string") msg = error?.msg;
  else if (typeof error?.message == "string") msg = error?.message;
  // replace
  if (msg.includes("User denied") || msg.includes("user rejected transaction")) return "You declined the action in your wallet.";
  if (msg.includes("transaction failed")) return "Transaction failed";
  return msg;
}

function proxyGetDef<T extends object>(obj: T, def: any) {
  const get = function (target: T, p: string) {
    const hasValue = p in target;
    if (hasValue && (target as any)[p] !== null && (target as any)[p] !== undefined) {
      return (target as any)[p];
    }
    (target as any)[p] = def;
    return (target as any)[p];
  };
  return new Proxy(obj, { get }) as T;
}

export function getBigint(result: any, path: string | (string | number)[], def: bigint = 0n) {
  const data = get(result, path, def);
  if (typeof data == "bigint") return data;
  return def;
}
