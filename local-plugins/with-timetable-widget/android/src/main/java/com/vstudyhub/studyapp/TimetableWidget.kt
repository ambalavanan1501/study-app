package com.vstudyhub.studyapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONObject

class TimetableWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        // There may be multiple widgets active, so update all of them
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}

internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
    // Construct the RemoteViews object
    val views = RemoteViews(context.packageName, R.layout.timetable_widget)
    
    // Read data from SharedPreferences
    // We use a specific shared preferences file "WidgetData" to share between app and widget
    val prefs: SharedPreferences = context.getSharedPreferences("WidgetData", Context.MODE_PRIVATE)
    val timetableJsonString = prefs.getString("timetableData", null)

    if (timetableJsonString != null) {
         views.setTextViewText(R.id.widget_content, formatTimetable(timetableJsonString))
    } else {
        views.setTextViewText(R.id.widget_content, "No timetable set")
    }

    // Instruct the widget manager to update the widget
    appWidgetManager.updateAppWidget(appWidgetId, views)
}

private fun formatTimetable(jsonString: String): String {
    try {
        // Simple formatting for now. You can make this more complex.
        // Assuming jsonString is something we can parse or just display.
        // For now, let's just display it directly or parse if it's a JSON object.
        return jsonString 
        
        // Example parsing logic (uncomment/adapt as needed):
        // val json = JSONObject(jsonString)
        // return json.optString("today", "No classes")
    } catch (e: Exception) {
        return "Error loading data"
    }
}
