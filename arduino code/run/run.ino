#include <DHT.h>
#include <ESP8266WiFi.h>
#include<WiFiClient.h>

const char* host = "192.168.137.1";
const int port = 8081;

const int DHTPIN = D2;       //Đọc dữ liệu từ DHT11 ở chân 2 trên mạch Arduino
const int DHTTYPE = DHT11;  //Khai báo loại cảm biến, có 2 loại là DHT11 và DHT22
const char* ssid = "chi";
const char* password = "12345678";
long startingTimeInServer=-1, lastMilisSendData, startingTimeInMCU;
DHT dht(DHTPIN,11);

void setup() {
  // put your setup code here, to run once:
  startWifi(ssid,password);
  //getCurrentTimeInServer
//  startingTimeInServer = getCurrentTimeInServer();
//  startingTimeInMCU = millis()/1000;
  while(startingTimeInServer <= 0){
    startingTimeInServer = getCurrentTimeInServer();
    startingTimeInMCU = millis()/1000;
  }
  Serial.println(String("startingTimeInServer: ")+ startingTimeInServer );
  Serial.println(String("startingTimeInMCU: ")+ startingTimeInMCU );
  //start dht listener
   dht.begin();
}

void loop() {
  // put your main code here, to run repeatedly:
    if(WiFi.isConnected()){
      //if time is reseted in mcu 
//      if() {
//          startingTimeInServer = getCurrentTimeInServer();
//          startingTimeInMCU = millis()/1000;
          while(startingTimeInServer <= 0 || lastMilisSendData >  millis()/1000){
            startingTimeInServer = getCurrentTimeInServer();
            startingTimeInMCU = millis()/1000;
          }
          //reset last time sending data
          lastMilisSendData =0;
//      }
//       Serial.println(String("startingTimeInServer: ")+ startingTimeInServer );
//       Serial.println(String("startingTimeInMCU: ")+ startingTimeInMCU );
      if((millis()/1000 - lastMilisSendData) > 5){
          //set last time sending data
          lastMilisSendData = millis()/1000;
          Serial.println(String("lastMilisSendData: ")+ lastMilisSendData);
          postData();
      }
    }
}


void postData(){
  float h = dht.readHumidity();    //Đọc độ ẩm
  float t = dht.readTemperature(); //Đọc nhiệt độ

//
  WiFiClient mclient;
  if(!mclient.connect(host,port)){
    Serial.println(String("connection failed: ")+ host );
    return;
  }
  long time = startingTimeInServer + (millis()/1000 - startingTimeInMCU);
  Serial.println(String("current time: ") + String(time));
  String req_body = String("{\"h\": ") + String(h) + ", \"t\": " + String(t) + ", \"time\": " + String(time) + "}";
  Serial.println(String("req_body: ")+ req_body);
  mclient.print(String("POST ") + "/data" + " HTTP/1.1\r\n"
               + "Host: " + host + "\r\n"
               + "Content-Length: " + String(req_body.length()) + "\r\n"
               + "Content-Type: application/json\r\n"
               + "Connection: close\r\n\r\n"
               + req_body);
  Serial.println("Request send");
  long timeout = millis()/1000;
  while (mclient.available() == 0) {
    if (millis()/1000 - timeout > 2) {
      Serial.println("Client Timeout !");
      mclient.stop();
      return;
    }
  }

  while(mclient.available()){
    String line = mclient.readString();
    Serial.println(line);
    Serial.println();
  }
}

long getCurrentTimeInServer(){
  WiFiClient mclient;
  if(!mclient.connect(host,port)){
    Serial.println(String("connection failed: ")+ host );
    return 0;
  }

  mclient.print(String("GET ") + "/current_time" + " HTTP/1.1\r\n"
               + "Host: " + host + "\r\n"
               + "Content-Length: " + "0" + "\r\n"
               + "Content-Type: application/json\r\n"
               + "Connection: close\r\n\r\n"
               );
  Serial.println("GET time request send");
 long  timeout = millis()/1000;
 while (mclient.available() == 0) {
    if (millis()/1000 - timeout > 2000) {
      Serial.println("Client Timeout !");
      mclient.stop();
      return 0;
    }
  }

String line;
while (mclient.available()) {
            line = mclient.readStringUntil('\n');
//          Serial.print(c);
        }
          Serial.println("last line: "+ line);
  line = line.substring(0,line.length()-3);
  long l = atol(line.c_str());
  return l;
 }
void startWifi(const char* ssid,const char* password){
  Serial.begin(115200);
  Serial.println();
  Serial.print("connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  }
