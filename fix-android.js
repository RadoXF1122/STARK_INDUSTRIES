// Dodaje uprawnienia Bluetooth + mikrofon do AndroidManifest i nazwe APK.
const fs=require('fs');const m='android/app/src/main/AndroidManifest.xml';let x=fs.readFileSync(m,'utf8');
const perms=['BLUETOOTH','BLUETOOTH_ADMIN','BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation','BLUETOOTH_CONNECT','ACCESS_FINE_LOCATION','RECORD_AUDIO','MODIFY_AUDIO_SETTINGS','INTERNET'];
for(const p of perms){const t=`<uses-permission android:name="android.permission.${p}" />`;if(!x.includes(p.split('"')[0]+'"'))x=x.replace('<application',t+'\n    <application');}
x=x.replace('<application','<queries><intent><action android:name="android.speech.RecognitionService" /></intent></queries>\n    <application');
fs.writeFileSync(m,x);console.log('Manifest OK');
