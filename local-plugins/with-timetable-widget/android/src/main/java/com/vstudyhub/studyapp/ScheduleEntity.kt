package com.vstudyhub.studyapp

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "schedule")
data class ScheduleEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val subject: String,
    val startTime: String, // Format: HH:mm
    val endTime: String,   // Format: HH:mm
    val room: String,
    val dayOfWeek: String  // e.g., "Monday"
)
