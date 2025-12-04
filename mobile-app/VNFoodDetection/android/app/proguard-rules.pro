# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native Paper
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# React Native Vision Camera
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# React Native Image Picker
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# React Native Permissions
-keep class com.zoontek.rnpermissions.** { *; }
-dontwarn com.zoontek.rnpermissions.**

# React Native Config
-keep class com.lugg.ReactNativeConfig.** { *; }
-dontwarn com.lugg.ReactNativeConfig.**

# React Native Share
-keep class cl.json.** { *; }
-dontwarn cl.json.**

# OkHttp (used by React Native)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
