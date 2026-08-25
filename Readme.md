# 📚 StudySync — Next-Gen Academic Management App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#-ci-cd-pipeline)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter)](https://flutter.dev)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase)](https://firebase.google.com)

A feature-rich cross-platform mobile application designed to help students streamline academic workflows, track attendance thresholds, manage dynamic assignment pipelines, and maintain productivity.

---

## 🎨 System Highlights

* **Dynamic Timetable Engine:** Class schedules with room locator hints, instructor profiles, and recurring event handling.
* **Attendance Analytics:** Real-time percentage calculations per course with threshold alerts (e.g., minimum 75% requirement warning).
* **Task & Assignment Pipeline:** Priority tagging (Low, Medium, Critical), sub-tasks, markdown notes attachment, and due-date countdowns.
* **Smart Contextual Notifications:** Local push notifications tuned to your local timezone for class alerts and upcoming deadlines.
* **Progress Dashboard:** Visual representations of completed coursework, GPA tracking, and weekly study time analytics.
* **Offline-First Storage:** Local cache persistence ensures full app functionality without an active internet connection.

---

## 🏗️ Architecture & Tech Stack

```text
       ┌────────────────────────────────────────────────────────┐
       │                   Flutter Mobile UI                    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                      State Management (Riverpod)
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌──────────────────┐                               ┌──────────────────┐
│ SQLite / Hive    │ ◄─── Offline Sync Engine ───► │ Firebase Cloud   │
│ (Local Storage)  │                               │ Firestore / Auth │
└──────────────────┘                               └──────────────────┘
