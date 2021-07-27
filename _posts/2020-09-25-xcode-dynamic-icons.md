---
layout: post
title: Dynamic App icon generation with Xcode
---

When working in a corporate environment, you will easily find yourself building several variances of the same app, targeting different configurations (debug, beta, release), different environments (staging, production) and different versions.

It can be messy if there is no clear way to differentiate them at a glance, i.e. with the app icon, and can potentially lead to situations where testers insert test data into production or try _to QA_ a feature in the wrong app version.

Our first approach at [Cluno] was to generate different icons for different versions and include all of them in the assets catalog. This methods works straightforward but has two problems. First of all, it is not very flexible. The icons needs to be designed, attached to the project, and mapped to each configuration:

{% include image.html url="/assets/blog/configurations.png" description="App Icons in Build Settings section" %}

You have to ship you app with more icons than it should, increasing as well the binary size.

The second problem is that you lose the capability to include in the icons dynamic information such as version, build number, commit hash, etc.

## Generating iOS app icons with ImageMagick

There are several [tutorials], on how to [generate the app icon] using [ImageMagick], running a script in a build phase and replacing it in the app package.

> **As of iOS 11 that method doesn’t work anymore**. Apparently Xcode creates a copy of the app icon in a separate private file and that’s the one being used.

### A new approach

Digging into StackOverflow I found several people facing the same issue until [this answer] pointed us in the right direction: accessing directly the icon in the asset catalog, performing the needed modifications before copying the bundle resources and reverting all the modifications at the very end, in order to leave the project in a clean state (with an unmodified app icon).

### Show me the code!

In our project folder we created two scripts that are called during the build phases:

#### Icon generation script:

{% gist af51e85ff5cac49b92d68c7705feac1d IconVersioning.sh %}

This script has to be called before the Copy Bundle Resources step. It can be pasted directly or called in the following way:

`"${SRCROOT}/Scripts/IconVersioning.sh"`

It embeds configuration, version and build number information to the icon. The band is tinted red in the case of production configurations, to make the tester aware of being in a production environment.

The second script needs to be placed as last step during the build phases and is responsible for reverting the changes, checking out the unmodified version of the icon:

#### Revert script:

{% highlight bash %}
if [ "${CONFIGURATION}" != "ReleaseProduction" ]; then
IFS=$'\n'
git checkout -- `find "${SRCROOT}/${PRODUCT_NAME}" -name AppIcon.appiconset -type d`
fi
{% endhighlight %}

### … and then the final result 🎉

{% include image.html url="/assets/blog/icons.png" description="Final result" %}

Now is super convenient to work with different configurations, knowing that the icons are going to be up to date 😎.

I set up a test project with the basic implementation: <https://github.com/gmoraleda/Xcode-Dynamic-Icon-Generation>

[cluno]: https://www.cluno.com/en/career/
[tutorials]: https://accounts.raywenderlich.com/v2/sso/login?sso=bm9uY2U9NmJiOThjNmJjZDM0MGM5ZWY1OTI4MzA0OTcyZmJhZGImY2FsbGJh%0AY2tfdXJsPWh0dHBzJTNBJTJGJTJGd3d3LnJheXdlbmRlcmxpY2guY29tJTJG%0Ac2Vzc2lvbnMlMkZjcmVhdGU%3D%0A&sig=e60c2ec60c73daf0ca4ffe80cc01422de9f9ea9ecae9f2154909e7adb872b9b9&mode=login
[generate the app icon]: http://merowing.info/2013/03/overlaying-application-version-on-top-of-your-icon/
[imagemagick]: https://imagemagick.org/index.php
[this answer]: https://stackoverflow.com/questions/46114034/ios11-appicon-cant-change/49528873#49528873
