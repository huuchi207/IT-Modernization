//https://www.sparkfun.com/datasheets/Sensors/Biometric/MQ-7.pdf
//https://www.detectcarbonmonoxide.com/co-health-risks/

void setup() {
  // put your setup code here, to run once:
  pinMode(A0, INPUT);
  Serial.begin(9600);

}

void loop() {
  int value = analogRead(A0);
  float value2 = (value/1024.0)*1000;
  Serial.println(value2);
  delay(1000);
  // put your main code here, to run repeatedly:

}
