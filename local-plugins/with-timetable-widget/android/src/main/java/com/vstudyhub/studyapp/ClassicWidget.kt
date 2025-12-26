package com.vstudyhub.studyapp

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.unit.ColorProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ClassicWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val scheduleList = withContext(Dispatchers.IO) {
            val db = AppDatabase.getDatabase(context)
            val day = getDayOfWeekString()
            db.scheduleDao().getScheduleForDay(day)
        }

        provideContent {
                TimetableContent(scheduleList)
        }
    }

    private fun getDayOfWeekString(): String {
        val calendar = Calendar.getInstance()
        return calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.LONG, Locale.getDefault()) ?: "Monday"
    }

    @Composable
    fun TimetableContent(scheduleList: List<ScheduleEntity>) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(androidx.compose.ui.graphics.Color.White))
                .padding(16.dp)
        ) {
            // Header
            Text(
                text = "Today's Classes",
                style = TextStyle(
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ColorProvider(androidx.compose.ui.graphics.Color.Black)
                ),
                modifier = GlanceModifier.padding(bottom = 8.dp)
            )

            if (scheduleList.isEmpty()) {
                Box(
                    modifier = GlanceModifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No classes today! \uD83C\uDF89",
                        style = TextStyle(color = ColorProvider(androidx.compose.ui.graphics.Color.Gray))
                    )
                }
            } else {
                LazyColumn(modifier = GlanceModifier.fillMaxSize()) {
                    items(scheduleList) { schedule ->
                        ScheduleItem(schedule)
                        Spacer(modifier = GlanceModifier.height(8.dp))
                    }
                }
            }
        }
    }

    @Composable
    fun ScheduleItem(schedule: ScheduleEntity) {
        val isCurrent = isCurrentClass(schedule.startTime, schedule.endTime)
        
        val backgroundColor = if (isCurrent) ColorProvider(androidx.compose.ui.graphics.Color(0xFFEADDFF)) else ColorProvider(androidx.compose.ui.graphics.Color(0xFFEEEEEE))
        val contentColor = if (isCurrent) ColorProvider(androidx.compose.ui.graphics.Color.Black) else ColorProvider(androidx.compose.ui.graphics.Color.Black)

        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .background(backgroundColor)
                .padding(12.dp)
                .clickable(actionStartActivity<MainActivity>()), 
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    text = schedule.subject,
                    style = TextStyle(
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = contentColor
                    )
                )
                Text(
                    text = "${schedule.startTime} - ${schedule.endTime}",
                    style = TextStyle(
                        fontSize = 12.sp,
                        color = contentColor
                    )
                )
            }
            Spacer(modifier = GlanceModifier.width(8.dp))
            Text(
                text = schedule.room,
                style = TextStyle(
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = contentColor
                )
            )
        }
    }

    private fun isCurrentClass(start: String, end: String): Boolean {
        try {
            val now = Calendar.getInstance()
            val currentHour = now.get(Calendar.HOUR_OF_DAY)
            val currentMinute = now.get(Calendar.MINUTE)
            val currentTime = currentHour * 60 + currentMinute

            val startParts = start.split(":")
            val startVal = startParts[0].toInt() * 60 + startParts[1].toInt()

            val endParts = end.split(":")
            val endVal = endParts[0].toInt() * 60 + endParts[1].toInt()

            return currentTime in startVal..endVal
        } catch (e: Exception) {
            return false
        }
    }
}
