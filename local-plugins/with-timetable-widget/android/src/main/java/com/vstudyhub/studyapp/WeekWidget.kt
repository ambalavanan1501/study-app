package com.vstudyhub.studyapp

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.material3.GlanceTheme
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.background
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WeekWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val scheduleList = withContext(Dispatchers.IO) {
            val db = AppDatabase.getDatabase(context)
            db.scheduleDao().getAllSchedule()
        }

        // Processing to add headers
        val displayItems = mutableListOf<WeekDisplayItem>()
        var currentDay = ""
        scheduleList.forEach { schedule ->
            if (schedule.dayOfWeek != currentDay) {
                currentDay = schedule.dayOfWeek
                displayItems.add(WeekDisplayItem.Header(currentDay))
            }
            displayItems.add(WeekDisplayItem.ClassItem(schedule))
        }

        provideContent {
            GlanceTheme {
                WeekContent(displayItems)
            }
        }
    }

    @Composable
    fun WeekContent(items: List<WeekDisplayItem>) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(GlanceTheme.colors.surface)
                .padding(16.dp)
        ) {
            Text(
                text = "Weekly Schedule",
                style = TextStyle(
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = GlanceTheme.colors.onSurface
                ),
                modifier = GlanceModifier.padding(bottom = 8.dp)
            )

            LazyColumn(modifier = GlanceModifier.fillMaxSize()) {
               items(items.size) { index ->
                   when (val item = items[index]) {
                       is WeekDisplayItem.Header -> DayHeader(item.day)
                       is WeekDisplayItem.ClassItem -> WeekScheduleItem(item.schedule)
                   }
                   Spacer(modifier = GlanceModifier.height(4.dp))
               }
            }
        }
    }

    @Composable
    fun DayHeader(day: String) {
        Text(
            text = day,
            style = TextStyle(
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = GlanceTheme.colors.primary
            ),
            modifier = GlanceModifier.padding(vertical = 8.dp)
        )
    }

    @Composable
    fun WeekScheduleItem(schedule: ScheduleEntity) {
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .background(GlanceTheme.colors.surfaceVariant)
                .padding(8.dp)
        ) {
            Text(
                text = "${schedule.startTime} - ${schedule.endTime}",
                style = TextStyle(
                    fontSize = 12.sp,
                    color = GlanceTheme.colors.onSurfaceVariant
                ),
                modifier = GlanceModifier.width(80.dp)
            )
            Column {
                Text(
                    text = schedule.subject,
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlanceTheme.colors.onSurfaceVariant
                    )
                )
                Text(
                    text = schedule.room,
                    style = TextStyle(
                        fontSize = 12.sp,
                        color = GlanceTheme.colors.onSurfaceVariant
                    )
                )
            }
        }
    }
}

sealed class WeekDisplayItem {
    data class Header(val day: String) : WeekDisplayItem()
    data class ClassItem(val schedule: ScheduleEntity) : WeekDisplayItem()
}
