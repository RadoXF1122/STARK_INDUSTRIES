// STARK_EDITH_V1 - okulary (ESP32-CAM AI-Thinker + OLED 128x64 I2C SDA=15 SCL=14)
// Lacznosc WYLACZNIE Bluetooth BLE. Brak Wi-Fi, brak hasel, brak IP.
// Biblioteki: Adafruit SSD1306 + Adafruit GFX. Plytka: "AI Thinker ESP32-CAM", Partition: Huge APP.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include "esp_camera.h"
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#define SVC  "5a4e0001-7374-6172-6b2d-656469746831"
#define CMD  "5a4e0002-7374-6172-6b2d-656469746831"
#define DATA "5a4e0003-7374-6172-6b2d-656469746831"
#define INFO "5a4e0004-7374-6172-6b2d-656469746831"
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
BLECharacteristic *cData, *cInfo; volatile bool wantPhoto=false, connected=false, rick=false; String pending="";

void show(const String& t){ oled.clearDisplay(); oled.setTextSize(1); oled.setTextColor(1); oled.setCursor(0,0); oled.print(t); oled.display(); }
void arrow(char d,int m){ oled.clearDisplay(); int cx=64,cy=24;
  if(d=='L') oled.fillTriangle(cx-20,cy,cx+4,cy-14,cx+4,cy+14,1);
  else if(d=='R') oled.fillTriangle(cx+20,cy,cx-4,cy-14,cx-4,cy+14,1);
  else if(d=='U') { oled.drawCircle(cx,cy,14,1); oled.fillTriangle(cx-14,cy,cx-20,cy-6,cx-8,cy-6,1);} 
  else oled.fillTriangle(cx,cy-20,cx-14,cy+4,cx+14,cy+4,1);
  oled.setTextSize(2); oled.setCursor(36,46); oled.print(m); oled.print(" m"); oled.display(); }
void handle(String p){ rick=false;
  if(p=="P") wantPhoto=true; else if(p=="R") rick=true; else if(p=="C") show("");
  else if(p.startsWith("T:")) show(p.substring(2));
  else if(p.startsWith("S:")) show("~ " + p.substring(2));
  else if(p.startsWith("M:")) { int i=p.indexOf('|'); show(p.substring(2,i)+":\n"+p.substring(i+1)); }
  else if(p.startsWith("N:")) arrow(p.charAt(2), p.substring(4).toInt()); }
struct CB: BLECharacteristicCallbacks{ void onWrite(BLECharacteristic* c){ pending=String(c->getValue().c_str()); } };
struct SCB: BLEServerCallbacks{ void onConnect(BLEServer*){connected=true; show("STARK INDUSTRIES\nPOLACZONO");}
  void onDisconnect(BLEServer*){connected=false; show("CZEKAM NA\nTELEFON..."); BLEDevice::startAdvertising();} };
void camInit(){ camera_config_t c={}; c.ledc_channel=LEDC_CHANNEL_0; c.ledc_timer=LEDC_TIMER_0;
  c.pin_d0=5;c.pin_d1=18;c.pin_d2=19;c.pin_d3=21;c.pin_d4=36;c.pin_d5=39;c.pin_d6=34;c.pin_d7=35;
  c.pin_xclk=0;c.pin_pclk=22;c.pin_vsync=25;c.pin_href=23;c.pin_sccb_sda=26;c.pin_sccb_scl=27;c.pin_pwdn=32;c.pin_reset=-1;
  c.xclk_freq_hz=20000000;c.pixel_format=PIXFORMAT_JPEG;c.frame_size=FRAMESIZE_QVGA;c.jpeg_quality=14;c.fb_count=1; esp_camera_init(&c); }
void setup(){ Wire.begin(15,14); oled.begin(SSD1306_SWITCHCAPVCC,0x3C); show("STARK INDUSTRIES\nSTART..."); camInit();
  BLEDevice::init("STARK_EDITH_V1"); BLEDevice::setMTU(247); BLEServer* s=BLEDevice::createServer(); s->setCallbacks(new SCB());
  BLEService* sv=s->createService(SVC);
  sv->createCharacteristic(CMD,BLECharacteristic::PROPERTY_WRITE)->setCallbacks(new CB());
  cData=sv->createCharacteristic(DATA,BLECharacteristic::PROPERTY_NOTIFY); cData->addDescriptor(new BLE2902());
  cInfo=sv->createCharacteristic(INFO,BLECharacteristic::PROPERTY_NOTIFY); cInfo->addDescriptor(new BLE2902());
  sv->start(); BLEAdvertising* a=BLEDevice::getAdvertising(); a->addServiceUUID(SVC); BLEDevice::startAdvertising(); show("CZEKAM NA\nTELEFON..."); }
void loop(){
  if(pending.length()){ String p=pending; pending=""; handle(p); }
  if(wantPhoto && connected){ wantPhoto=false; camera_fb_t* fb=esp_camera_fb_get(); if(fb){
    String l="LEN:"+String(fb->len); cInfo->setValue(l.c_str()); cInfo->notify();
    for(size_t i=0;i<fb->len;i+=180){ size_t n=min((size_t)180,fb->len-i); cData->setValue(fb->buf+i,n); cData->notify(); delay(8); }
    cInfo->setValue("END"); cInfo->notify(); esp_camera_fb_return(fb);} }
  if(rick){ static int f=0; oled.clearDisplay(); int x=54+(f%2?6:-6); oled.drawCircle(x+10,12,6,1); oled.drawLine(x+10,18,x+10,40,1);
    oled.drawLine(x+10,24,x+(f%2?24:-4),f%2?16:30,1); oled.drawLine(x+10,24,x+(f%2?-4:24),f%2?30:16,1);
    oled.drawLine(x+10,40,x+2,58,1); oled.drawLine(x+10,40,x+18,58,1); oled.display(); f++; delay(250); }
}
