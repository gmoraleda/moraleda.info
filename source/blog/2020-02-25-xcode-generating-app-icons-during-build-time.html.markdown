---

title: 'Xcode: Generating app icons during build time'
date: 2020-02-25 08:44 UTC
tags: 

---

When working in a corporate environment, you will easily find yourself building several variances of the same app, targeting different configurations (debug, beta, release), different environments (staging, production) and different versions.

It can be messy if there is no clear way to differentiate them at a glance, i.e. with the app icon, and can potentially lead to situations where testers insert test data into production or try *to QA* a feature in the wrong app version.

Our first approach at [Cluno] was to generate different icons for different versions and include all of them in the assets catalogue. This methods works straightforward but has two problems. First of all, it is not very flexible. The icons needs to be designed, attached to the project, and mapped to each configuration:

![](./2020-02-25/configurations.png)
*App Icons in Build Settings section*

You have to ship you app with more icons than it should, increasing as well the binary size.

The second problem is that you lose the capability to include in the icons dynamic information such as version, build number, commit hash, etc.

## Generating iOS app icons with ImageMagick
There are several [tutorials], on how to [generate the app icon] using [ImageMagick], running a script in a build phase and replacing it in the app package.
> **As of iOS 11 that method doesn’t work anymore**. Apparently Xcode creates a copy of the app icon in a separate private file and that’s the one being used.

### A new approach
Digging into Stackoverflow I found several people facing the same issue until [this answer] pointed us in the right direction: accessing directly the icon in the asset catalogue, performing the needed modifications before copying the bundle resources and reverting all the modifications at the very end, in order to leave the project in a clean state (with an unmodified app icon).

### Show me the code!
In our project folder we created two scripts that are called during the build phases:

![](./2020-02-25/phases.png)
*Build phases*

#### Icon generation script:
```bash
#!/bin/bash

#
# Helpers
#
function installImageMagick() {
	brew install imagemagick ghostscript
}

#
# Preflight: Check if tools are installed
#

if hash identify 2>/dev/null && hash convert 2>/dev/null; then
	echo "----------------------------------	"
	echo "ImageMagick already installed ✅		"
	echo "----------------------------------	"
else
	echo "-------------------------------	"
	echo "ImageMagick is not installed💥 	"
	echo "-------------------------------	"
	
	installImageMagick
fi

#
# Access AppIcon
#
IFS=$'\n'
BASE_ICONS_DIR=$(find ${SRCROOT}/${PRODUCT_NAME} -name "AppIcon.appiconset")
IFS=$' '
CONTENTS_JSON="${BASE_ICONS_DIR}/Contents.json"

#
# Read configuration, version and build number
#
staging_configurations=("Debug", "DebugStaging", "AlphaStaging", "BetaStaging", "Release", "ReleaseStaging")
production_configurations=("DebugProduction", "AlphaProduction", "BetaProduction", "ReleaseProduction")

version="${MARKETING_VERSION}"
buildNumber=`/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${INFOPLIST_FILE}"`

if [ "${CONFIGURATION}" == "Debug" ]; then
	caption="DebugStaging\n${version}\n($buildNumber)"
elif [ "${CONFIGURATION}" == "Release" ]; then
	caption="AlphaStaging\n${version}\n($buildNumber)"
else
	caption="${CONFIGURATION}\n${version}\n($buildNumber)"
fi

echo $caption

#
# Generate icons
#
function generateIcons() {
ICON_PATH=$1

width=`identify -format %w ${ICON_PATH}`
[ $? -eq 0 ] || exit 1

height=$((width * 30 / 100))

if [ "${CONFIGURATION}" != "ReleaseProduction" ]; then

width=`identify -format %w ${ICON_PATH}`
height=`identify -format %h ${ICON_PATH}`
band_height=$((($height * 50) / 100))
band_position=$(($height - $band_height))
text_position=$(($band_position - 1))
point_size=$(((14 * $width) / 100))

#
# Band color
#
band_color='rgba(0,0,0,0.8)'

if [[ " ${production_configurations[@]} " =~ "${CONFIGURATION}" ]] && [[ "${CONFIGURATION}" != "Debug" ]] && [[ "${CONFIGURATION}" != "Release" ]]; then
	band_color='rgba(224,40,40,0.8)'
fi

#
# Blur band and text
#
convert ${ICON_PATH} -blur 10x8 /tmp/blurred.png
convert /tmp/blurred.png -gamma 0 -fill white -draw "rectangle 0,$band_position,$width,$height" /tmp/mask.png
convert -size ${width}x${band_height} xc:none -fill $band_color -draw "rectangle 0,0,$width,$band_height" /tmp/labels-base.png
convert -background none -size ${width}x${band_height} -pointsize $point_size -fill white -gravity center -gravity South -font ArialNarrowB caption:"$caption" /tmp/labels.png

convert ${ICON_PATH} /tmp/blurred.png /tmp/mask.png -composite /tmp/temp.png

rm /tmp/blurred.png
rm /tmp/mask.png

#
# Compose final image
#
convert /tmp/temp.png /tmp/labels-base.png -geometry +0+$band_position -composite /tmp/labels.png -geometry +0+$text_position -geometry +${w}-${h} -composite "${ICON_PATH}"

#
# Clean up
#
rm /tmp/temp.png
rm /tmp/labels-base.png
rm /tmp/labels.png
fi
}

ICONS=(`grep 'filename' "${CONTENTS_JSON}" | cut -f2 -d: | tr -d ',' | tr -d '\n' | tr -d '"'`)

ICONS_COUNT=${#ICONS[*]}

IFS=$'\n'

for (( i=0; i<ICONS_COUNT; i++ )); do
generateIcons "$BASE_ICONS_DIR/${ICONS[$i]}"
done

```

This script has to be called before the Copy Bundle Resources step. It can be pasted directly or called in the following way:

`"${SRCROOT}/Scripts/IconVersioning.sh"`

It embeds configuration, version and build number information to the icon. The band is tinted red in the case of production configurations, to make the tester aware of being in a production environment.

The second script needs to be placed as last step during the build phases and is responsible for reverting the changes, checking out the unmodified version of the icon:

#### Revert script:

```bash
if [ "${CONFIGURATION}" != "ReleaseProduction" ]; then
IFS=$'\n'
git checkout -- `find "${SRCROOT}/${PRODUCT_NAME}" -name AppIcon.appiconset -type d`
fi
```

### … and then the final result 🎉

![](./2020-02-25/icons.png)

Now is super convenient to work with different configurations, knowing that the icons are going to be up to date 😎.

I set up a test project with the basic implementation: <https://github.com/gmoraleda/Xcode-Dynamic-Icon-Generation>

[Cluno]: https://www.cluno.com/en/career/
[tutorials]: https://accounts.raywenderlich.com/v2/sso/login?sso=bm9uY2U9NmJiOThjNmJjZDM0MGM5ZWY1OTI4MzA0OTcyZmJhZGImY2FsbGJh%0AY2tfdXJsPWh0dHBzJTNBJTJGJTJGd3d3LnJheXdlbmRlcmxpY2guY29tJTJG%0Ac2Vzc2lvbnMlMkZjcmVhdGU%3D%0A&sig=e60c2ec60c73daf0ca4ffe80cc01422de9f9ea9ecae9f2154909e7adb872b9b9&mode=login
[generate the app icon]: http://merowing.info/2013/03/overlaying-application-version-on-top-of-your-icon/
[ImageMagick]: https://imagemagick.org/index.php
[this answer]: https://stackoverflow.com/questions/46114034/ios11-appicon-cant-change/49528873#49528873