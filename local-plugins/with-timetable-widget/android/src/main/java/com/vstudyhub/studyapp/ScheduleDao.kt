package com.vstudyhub.studyapp

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ScheduleDao {

    @Query("SELECT * FROM schedule WHERE dayOfWeek = :day ORDER BY startTime ASC")
    fun getScheduleForDay(day: String): List<ScheduleEntity>

    @Query("SELECT * FROM schedule ORDER BY dayOfWeek, startTime ASC")
    fun getAllSchedule(): List<ScheduleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertAll(schedules: List<ScheduleEntity>)

    @Query("DELETE FROM schedule")
    fun deleteAll()
}
