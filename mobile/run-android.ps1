# Run Expo Android with JAVA_HOME set (use this if JAVA_HOME is not in system env)
$jdkHome = "C:\Users\user\jdk-17\jdk-17.0.18+8"
if (Test-Path $jdkHome) {
  $env:JAVA_HOME = $jdkHome
  $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}
npx expo run:android @args
