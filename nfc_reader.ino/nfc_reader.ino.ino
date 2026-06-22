// PN532 NFC Module V1.0 (SunFounder) — Arduino Uno
//
// I2C: SET0=H SET1=L | MO/SDA->A4 NSS/SCL->A5 | 5V GND
// Serial 115200: "ready" al iniciar, {"uid":"..."} por tarjeta nueva

#include <Wire.h>
#include <Adafruit_PN532.h>

Adafruit_PN532 nfc(-1, -1);

uint8_t lastUid[7];
uint8_t lastUidLen = 0;

bool uidEquals(const uint8_t* uid, uint8_t len) {
  if (len != lastUidLen) return false;
  for (uint8_t i = 0; i < len; i++) {
    if (uid[i] != lastUid[i]) return false;
  }
  return true;
}

void rememberUid(const uint8_t* uid, uint8_t len) {
  lastUidLen = len;
  for (uint8_t i = 0; i < len; i++) lastUid[i] = uid[i];
}

void clearLastUid() {
  lastUidLen = 0;
}

void printUidJson(const uint8_t* uid, uint8_t len) {
  Serial.print(F("{\"uid\":\""));
  for (uint8_t i = 0; i < len; i++) {
    if (uid[i] < 0x10) Serial.print('0');
    Serial.print(uid[i], HEX);
  }
  Serial.println(F("\"}"));
}

void setup(void) {
  Serial.begin(115200);
  while (!Serial) delay(10);

  nfc.begin();
  if (!nfc.getFirmwareVersion()) {
    while (1) delay(1000);
  }

  nfc.SAMConfig();
  Serial.println(F("ready"));
}

void loop(void) {
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
    if (!uidEquals(uid, uidLength)) {
      rememberUid(uid, uidLength);
      printUidJson(uid, uidLength);
    }
  } else {
    clearLastUid();
  }
}
