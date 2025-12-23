package com.vstudyhub.studyapp

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TimetableWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TimetableWidgetModule"
    }

    @ReactMethod
    fun setTimetableData(data: String) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("WidgetData", Context.MODE_PRIVATE)
        prefs.edit().putString("timetableData", data).apply()

        // Trigger widget update
        val intent = Intent(context, TimetableWidget::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, TimetableWidget::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
    }
}
