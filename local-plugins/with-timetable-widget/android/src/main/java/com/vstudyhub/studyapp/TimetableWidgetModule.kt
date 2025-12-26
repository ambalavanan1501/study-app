package com.vstudyhub.studyapp

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class TimetableWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TimetableWidgetModule"
    }

    @ReactMethod
    fun setTimetableData(json: String) {
        val context = reactApplicationContext.applicationContext
        
        // Use Coroutine to perform DB operations on IO thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // 1. Parse JSON
                val type = object : TypeToken<List<ScheduleEntity>>() {}.type
                val scheduleList: List<ScheduleEntity> = Gson().fromJson(json, type)
                
                // 2. Update Database
                val db = AppDatabase.getDatabase(context)
                val dao = db.scheduleDao()
                
                db.runInTransaction {
                    dao.deleteAll()
                    dao.insertAll(scheduleList)
                }

                // 3. Update Widget
                // Note: TimetableGlanceWidget class will be created in the next step
                // GlanceAppWidgetManager(context).getGlanceIds(TimetableGlanceWidget::class.java).forEach { glanceId ->
                //    TimetableGlanceWidget().update(context, glanceId)
                // }
                // Simplified updateAll extension for GlanceAppWidget
                 ClassicWidget().updateAll(context)
                CompactWidget().updateAll(context)
                WeekWidget().updateAll(context)

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
