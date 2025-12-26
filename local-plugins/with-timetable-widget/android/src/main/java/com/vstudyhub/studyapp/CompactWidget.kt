package com.vstudyhub.studyapp

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.unit.ColorProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CompactWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val nextClass = withContext(Dispatchers.IO) {
            val db = AppDatabase.getDatabase(context)
            val day = getDayOfWeekString()
            val all = db.scheduleDao().getScheduleForDay(day)
            findNextClass(all)
        }

        provideContent {
                CompactContent(nextClass)
        }
    }

    private fun getDayOfWeekString(): String {
        val calendar = Calendar.getInstance()
        return calendar.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.LONG, Locale.getDefault()) ?: "Monday"
    }

    private fun findNextClass(scheduleList: List<ScheduleEntity>): ScheduleEntity? {
        val now = Calendar.getInstance()
        val currentHour = now.get(Calendar.HOUR_OF_DAY)
        val currentMinute = now.get(Calendar.MINUTE)
        val currentTime = currentHour * 60 + currentMinute

        // Filter for classes that haven't ended yet
        return scheduleList
            .filter { 
                val endParts = it.endTime.split(":")
                val endVal = endParts[0].toInt() * 60 + endParts[1].toInt()
                endVal > currentTime
            }
            .sortedBy { 
                val startParts = it.startTime.split(":")
                startParts[0].toInt() * 60 + startParts[1].toInt()
            }
            .firstOrNull()
    }

    @Composable
    fun CompactContent(schedule: ScheduleEntity?) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(androidx.compose.ui.graphics.Color.White))
                .padding(12.dp)
                .clickable(actionStartActivity<MainActivity>()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (schedule == null) {
                Text(
                    text = "No upcoming classes!",
                    style = TextStyle(
                        fontSize = 16.sp, 
                        fontWeight = FontWeight.Bold,
                        color = ColorProvider(androidx.compose.ui.graphics.Color.Black)
                    )
                )
                Text(
                    text = "Enjoy your free time \uD83C\uDF89",
                    style = TextStyle(fontSize = 12.sp, color = ColorProvider(androidx.compose.ui.graphics.Color.Gray))
                )
            } else {
                Text(
                    text = "UP NEXT",
                    style = TextStyle(
                        fontSize = 10.sp, 
                        fontWeight = FontWeight.Bold,
                        color = ColorProvider(androidx.compose.ui.graphics.Color.Blue)
                    )
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = schedule.subject,
                    style = TextStyle(
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = ColorProvider(androidx.compose.ui.graphics.Color.Black)
                    ),
                    maxLines = 1
                )
                Text(
                    text = "${schedule.startTime} - ${schedule.endTime}",
                    style = TextStyle(
                        fontSize = 14.sp,
                        color = ColorProvider(androidx.compose.ui.graphics.Color.Gray)
                    )
                )
                Text(
                    text = schedule.room,
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = ColorProvider(androidx.compose.ui.graphics.Color.Black)
                    )
                )
            }
        }
    }
}
