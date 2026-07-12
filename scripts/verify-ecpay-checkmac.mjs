import { createHash } from "node:crypto";
import { createCipheriv, createDecipheriv } from "node:crypto";
import assert from "node:assert/strict";

function normalizeEcpayEncodedValue(value) {
  return encodeURIComponent(value)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%7e/g, "~");
}

function buildEcpayCheckMacValue(params, hashKey, hashIv) {
  const source = Object.entries(params)
    .filter(([key, value]) => key !== "CheckMacValue" && value !== null && value !== undefined)
    .sort(([left], [right]) => left.toLowerCase().localeCompare(right.toLowerCase()))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const encoded = normalizeEcpayEncodedValue(`HashKey=${hashKey}&${source}&HashIV=${hashIv}`);

  return createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

function verifyEcpayCheckMacValue(params, hashKey, hashIv) {
  const received = String(params.CheckMacValue || "").toUpperCase();

  if (!received) {
    return false;
  }

  return buildEcpayCheckMacValue(params, hashKey, hashIv) === received;
}

function encryptEcpayData(data, hashKey, hashIv) {
  const encoded = encodeURIComponent(JSON.stringify(data));
  const cipher = createCipheriv("aes-128-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIv, "utf8"));

  return Buffer.concat([cipher.update(encoded, "utf8"), cipher.final()]).toString("base64");
}

function decryptEcpayData(encryptedData, hashKey, hashIv) {
  const decipher = createDecipheriv("aes-128-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIv, "utf8"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "base64")),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(decodeURIComponent(decrypted));
}

const officialExampleParams = {
  TradeDesc: "促銷方案",
  PaymentType: "aio",
  MerchantTradeDate: "2023/03/12 15:30:23",
  MerchantTradeNo: "ecpay20230312153023",
  MerchantID: "3002607",
  ReturnURL: "https://www.ecpay.com.tw/receive.php",
  ItemName: "Apple iphone 15",
  TotalAmount: "30000",
  ChoosePayment: "ALL",
  EncryptType: "1"
};

const actual = buildEcpayCheckMacValue(
  officialExampleParams,
  "pwFHCqoQZGmho4w6",
  "EkRm7iFT261dpevs"
);

assert.equal(
  actual,
  "6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840"
);

const paymentCallback = {
  MerchantID: "3002607",
  MerchantTradeNo: "ecpay20230312153023",
  RtnCode: "1",
  RtnMsg: "Succeeded",
  TradeNo: "230312153023001",
  TradeAmt: "30000",
  PaymentDate: "2023/03/12 15:35:23",
  PaymentType: "Credit_CreditCard",
  PaymentTypeChargeFee: "0",
  TradeDate: "2023/03/12 15:30:23",
  SimulatePaid: "0"
};
const paymentCallbackMac = buildEcpayCheckMacValue(
  paymentCallback,
  "pwFHCqoQZGmho4w6",
  "EkRm7iFT261dpevs"
);

assert.equal(
  buildEcpayCheckMacValue(
    { ...paymentCallback, CheckMacValue: paymentCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  paymentCallbackMac
);
assert.equal(
  verifyEcpayCheckMacValue(
    { ...paymentCallback, CheckMacValue: paymentCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  true
);
assert.equal(
  verifyEcpayCheckMacValue(
    { ...paymentCallback, TradeAmt: "30001", CheckMacValue: paymentCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  false
);

const refundCallback = {
  PlatformID: "3002599",
  MerchantID: "2000132",
  RqHeader: {
    Timestamp: 1525168923
  },
  Data: JSON.stringify({
    MerchantID: "2000132",
    MerchantTradeNo: "CBX20220302153064851",
    TradeAmount: 1000,
    TotalRefundAmount: 500,
    RefundAmount: 200
  })
};
const refundCallbackMac = buildEcpayCheckMacValue(
  refundCallback,
  "pwFHCqoQZGmho4w6",
  "EkRm7iFT261dpevs"
);

assert.equal(
  buildEcpayCheckMacValue(
    { ...refundCallback, CheckMacValue: refundCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  refundCallbackMac
);
assert.equal(
  verifyEcpayCheckMacValue(
    { ...refundCallback, CheckMacValue: refundCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  true
);
assert.equal(
  verifyEcpayCheckMacValue(
    { ...refundCallback, Data: JSON.stringify({ MerchantTradeNo: "tampered" }), CheckMacValue: refundCallbackMac },
    "pwFHCqoQZGmho4w6",
    "EkRm7iFT261dpevs"
  ),
  false
);

const cryptoExample = {
  Name: "Test",
  ID: "A123456789"
};
const encrypted = encryptEcpayData(cryptoExample, "7b53896b742849d3", "37a0ad3c6ffa428b");

assert.deepEqual(
  decryptEcpayData(encrypted, "7b53896b742849d3", "37a0ad3c6ffa428b"),
  cryptoExample
);

console.log("ECPay CheckMacValue and AES Data crypto examples passed.");
