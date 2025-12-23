const {
    withAndroidManifest,
    withDangerousMod,
    withMainApplication,
    AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withTimetableWidget = (config) => {
    // 1. Add the receiver to AndroidManifest.xml
    config = withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
            config.modResults
        );

        const receiver = {
            $: {
                "android:name": "com.vstudyhub.studyapp.TimetableWidget",
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
                        "android:resource": "@xml/timetable_widget_info",
                    },
                },
            ],
        };

        if (!mainApplication.receiver) {
            mainApplication.receiver = [];
        }

        // Check availability
        const existing = mainApplication.receiver.find(
            (r) => r.$["android:name"] === "com.vstudyhub.studyapp.TimetableWidget"
        );

        if (!existing) {
            mainApplication.receiver.push(receiver);
        }

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
            await copyFile(
                path.join(sourceDir, "res/xml/timetable_widget_info.xml"),
                path.join(resDir, "xml/timetable_widget_info.xml")
            );
            await copyFile(
                path.join(sourceDir, "res/layout/timetable_widget.xml"),
                path.join(resDir, "layout/timetable_widget.xml")
            );

            // Copy Kotlin classes
            if (!fs.existsSync(javaDir)) {
                fs.mkdirSync(javaDir, { recursive: true });
            }
            await copyFile(
                path.join(sourceDir, "java/com/vstudyhub/studyapp/TimetableWidget.kt"),
                path.join(javaDir, "TimetableWidget.kt")
            );
            await copyFile(
                path.join(sourceDir, "java/com/vstudyhub/studyapp/TimetableWidgetModule.kt"),
                path.join(javaDir, "TimetableWidgetModule.kt")
            );
            await copyFile(
                path.join(sourceDir, "java/com/vstudyhub/studyapp/TimetableWidgetPackage.kt"),
                path.join(javaDir, "TimetableWidgetPackage.kt")
            );

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
