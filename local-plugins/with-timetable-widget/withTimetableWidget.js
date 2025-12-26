const {
    withAndroidManifest,
    withDangerousMod,
    withMainApplication,
    withAppBuildGradle,
    withProjectBuildGradle,
    AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withTimetableWidget = (config) => {
    // 1. Add the receivers to AndroidManifest.xml
    config = withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
            config.modResults
        );

        const widgets = [
            {
                name: "com.vstudyhub.studyapp.TimetableWidget",
                resource: "@xml/timetable_widget_info"
            },
            {
                name: "com.vstudyhub.studyapp.CompactWidgetReceiver",
                resource: "@xml/compact_widget_info"
            },
            {
                name: "com.vstudyhub.studyapp.WeekWidgetReceiver",
                resource: "@xml/week_widget_info"
            }
        ];

        if (!mainApplication.receiver) {
            mainApplication.receiver = [];
        }

        widgets.forEach(widget => {
            const receiver = {
                $: {
                    "android:name": widget.name,
                    "android:exported": "true",
                },
                "intent-filter": [
                    {
                        action: [
                            {
                                $: {
                                    "android:name": "android.appwidget.action.APPWIDGET_UPDATE",
                                },
                            },
                        ],
                    },
                ],
                "meta-data": [
                    {
                        $: {
                            "android:name": "android.appwidget.provider",
                            "android:resource": widget.resource,
                        },
                    },
                ],
            };

            const existing = mainApplication.receiver.find(
                (r) => r.$["android:name"] === widget.name
            );

            if (!existing) {
                mainApplication.receiver.push(receiver);
            }
        });

        return config;
    });

    // 2. Copy native files
    config = withDangerousMod(config, [
        "android",
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const platformRoot = config.modRequest.platformProjectRoot;

            // Source paths (inside our plugin folder)
            const sourceDir = path.join(
                projectRoot,
                "local-plugins/with-timetable-widget/android/src/main"
            );

            // Destination paths (inside android/app/src/main)
            const resDir = path.join(platformRoot, "app/src/main/res");
            const javaDir = path.join(
                platformRoot,
                "app/src/main/java/com/vstudyhub/studyapp"
            );

            // Copy XML resources
            const xmlFiles = [
                "timetable_widget_info.xml",
                "compact_widget_info.xml",
                "week_widget_info.xml"
            ];

            for (const file of xmlFiles) {
                await copyFile(
                    path.join(sourceDir, "res/xml", file),
                    path.join(resDir, "xml", file)
                );
            }

            await copyFile(
                path.join(sourceDir, "res/layout/timetable_widget.xml"),
                path.join(resDir, "layout/timetable_widget.xml")
            );
            await copyFile(
                path.join(sourceDir, "res/drawable/widget_background.xml"),
                path.join(resDir, "drawable/widget_background.xml")
            );

            // Copy Kotlin classes
            if (!fs.existsSync(javaDir)) {
                fs.mkdirSync(javaDir, { recursive: true });
            }

            const javaSourceDir = path.join(sourceDir, "java/com/vstudyhub/studyapp");
            if (fs.existsSync(javaSourceDir)) {
                // empty the destination directory first to remove old files if needed?
                // No, just copy overwriting. Old files like TimetableGlanceWidget.kt are deleted from source.
                // But they might persist in destination.
                // We should probably clean destination java dir.
                // For safety, let's just copy.
                const files = fs.readdirSync(javaSourceDir);
                for (const file of files) {
                    await copyFile(
                        path.join(javaSourceDir, file),
                        path.join(javaDir, file)
                    );
                }
            } else {
                console.warn("Source java directory not found:", javaSourceDir);
            }

            return config;
        },
    ]);

    // 3. Register Package in MainApplication.kt
    config = withMainApplication(config, (config) => {
        let contents = config.modResults.contents;

        // Check if the package is already added to avoid duplicates
        if (!contents.includes("new TimetableWidgetPackage()")) {
            // 1. Add Import
            const importStatement = "import com.vstudyhub.studyapp.TimetableWidgetPackage";
            if (!contents.includes(importStatement)) {
                contents = contents.replace(
                    /package com\.vstudyhub\.studyapp/,
                    `package com.vstudyhub.studyapp\n\n${importStatement}`
                );
            }

            // 2. Add Package to getPackages()
            // Look for "return PackageList(this).getPackages()" or similar.
            if (contents.includes("return PackageList(this).getPackages()")) {
                contents = contents.replace(
                    /return PackageList\(this\)\.getPackages\(\)/,
                    `val packages = PackageList(this).getPackages()\n      packages.add(TimetableWidgetPackage())\n      return packages`
                );
            }
        }

        config.modResults.contents = contents;
        return config;
    });

    // 4. Add Dependencies to app/build.gradle
    config = withAppBuildGradle(config, (config) => {
        const buildGradle = config.modResults.contents;
        // Use kapt directly to avoid replacement logic issues
        const dependencies = [
            'implementation "androidx.glance:glance-appwidget:1.1.0"',
            'implementation "androidx.glance:glance-material3:1.1.0"',
            'implementation "androidx.room:room-runtime:2.6.1"',
            'implementation "androidx.room:room-ktx:2.6.1"',
            'ksp "androidx.room:room-compiler:2.6.1"',
            'implementation "com.google.code.gson:gson:2.10.1"'
        ].join('\n    ');

        if (!buildGradle.includes("androidx.glance:glance-appwidget")) {
            const dependencyBlock = /dependencies\s?{/;
            if (buildGradle.match(dependencyBlock)) {
                config.modResults.contents = buildGradle.replace(
                    dependencyBlock,
                    `dependencies {\n    ${dependencies}`
                );
            }
        }

        // Ensure com.google.devtools.ksp and org.jetbrains.kotlin.plugin.compose plugins are applied
        if (!config.modResults.contents.includes("com.google.devtools.ksp")) {
            const pluginsBlock = /plugins\s?{/;
            const applyPluginApp = /apply plugin: "com.android.application"/;

            if (config.modResults.contents.match(pluginsBlock)) {
                config.modResults.contents = config.modResults.contents.replace(
                    pluginsBlock,
                    `plugins {\n    id "org.jetbrains.kotlin.plugin.compose"\n    id "com.google.devtools.ksp"`
                );
            } else if (config.modResults.contents.match(applyPluginApp)) {
                // Fallback for older gradle templates or where plugins block isn't used for app plugin
                config.modResults.contents = config.modResults.contents.replace(
                    applyPluginApp,
                    `apply plugin: "com.android.application"\napply plugin: "org.jetbrains.kotlin.plugin.compose"\napply plugin: "com.google.devtools.ksp"`
                );
            } else {
                // Absolute fallback
                config.modResults.contents = `apply plugin: "org.jetbrains.kotlin.plugin.compose"\napply plugin: "com.google.devtools.ksp"\n${config.modResults.contents}`;
            }
        }

        // Enable Compose features in android block
        if (!config.modResults.contents.includes("buildFeatures {")) {
            const androidBlock = /android\s?{/;
            if (config.modResults.contents.match(androidBlock)) {
                config.modResults.contents = config.modResults.contents.replace(
                    androidBlock,
                    `android {\n    buildFeatures {\n        compose true\n    }`
                );
            }
        } else if (!config.modResults.contents.includes("compose true")) {
            // buildFeatures exists but compose not set
            const buildFeaturesBlock = /buildFeatures\s?{/;
            config.modResults.contents = config.modResults.contents.replace(
                buildFeaturesBlock,
                `buildFeatures {\n        compose true`
            );
        }

        return config;
    });

    // 5. Add Classpath to Root build.gradle
    config = withProjectBuildGradle(config, (config) => {
        const buildGradle = config.modResults.contents;

        // Exact version matching the Kotlin version seen in logs (Kotlin 2.1.20 -> KSP 2.1.20-2.0.1)
        const kspClasspath = 'classpath "com.google.devtools.ksp:com.google.devtools.ksp.gradle.plugin:2.1.20-2.0.1"';
        const search = /dependencies\s?{/;

        // Add Compose Compiler plugin classpath (required for org.jetbrains.kotlin.plugin.compose)
        // Artifact: org.jetbrains.kotlin:compose-compiler-gradle-plugin:2.1.20
        const composeClasspath = 'classpath "org.jetbrains.kotlin:compose-compiler-gradle-plugin:2.1.20"';

        if (buildGradle.match(search)) {
            let newContents = buildGradle;
            if (!newContents.includes("com.google.devtools.ksp")) {
                newContents = newContents.replace(search, `dependencies {\n        ${kspClasspath}`);
            }
            if (!newContents.includes("compose-compiler-gradle-plugin")) {
                newContents = newContents.replace(search, `dependencies {\n        ${composeClasspath}`);
            }
            config.modResults.contents = newContents;
        } else {
            console.warn("Could not find dependencies block in root build.gradle to add KSP/Compose classpath");
        }
        return config;
    });

    return config;
};

async function copyFile(src, dest) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.copyFile(src, dest);
}

module.exports = withTimetableWidget;
