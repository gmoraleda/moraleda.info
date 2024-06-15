---
layout: post
title: iOS - Localizing strings in a project
---

Localization is an often overlooked problem. We start a project, we know that we only have to support one language and we approach our string-handling based on that requirement. When the time comes to support a second language, the project grew so much that adapting to that second language causes pain and frustration.

## Doing it right from the beginning

iOS and Xcode support localized strings in a _rudimentary-but-pragmatic_ way: we can define a `Localizable.strings` file, and localize that file in _n_ languages. For each language we will have a key-value file that will contain all our strings:

```
// German strings

"ok_button_title" = "OK";
"cancel_button_title" = "Abbrechen";

/*Main Screen*/
"main_title" = "Willkommen";
```

```
// Spanish strings

"ok_button_title" = "Vale";
"cancel_button_title" = "Cancelar";

/*Main Screen*/
"main_title" = "Bienvenido";
```

For accessing these strings all we need to do is to use `NSLocalizedString(key, comment: "")` and pass the key we are interested in. Eg. `NSLocalizedString("ok_button_title", comment: "")`

This is going to work nicely and, if we were to launch the app in German or Spanish, the system will know which strings to use.

## Getting they keys under control

The main drawback of that approach is that keys are strings and if they start going around, that could be prone to error.

This can be easily solved as well. Let's define a new type called `Strings` which will contain all our keys:

```swift
enum Strings: String {
	case okButtonTitle = "ok_button_title"
	case cancelButtonTitle = "cancel_button_title"
	case mainTitle = "main_title"
	case mainSubtitle = "main_subtitle"
}
```

We can even define an extension to get the localized string for every key in the `Strings` enum:

```swift
extension Strings {
    var localized: String {
        return NSLocalizedString(rawValue, comment: "")
    }
}
```

Now all we need to do to use a string in a `UILabel`, for example, is to call:

```swift
label.text = Strings.mainTitle.localized
```

## Bringing it to the next level: extracting the strings

Keeping strings and wordings up to date is usually a burden for developers.
Designers would produce a mockup which some wordings than then the product manager will need to check/update. The developer is usually left with the task of making sure that these wordings are in sync. If a project is run in several platforms (iOS, Android, web...), keeping the wordings up to date and synchronized can get out of control easily.

A wiser approach would be to move these strings out of the project and place them in a centralized tool that every platform could access.
You could build such a service or you can use a commercial solution.
For the sake of this tutorial I'm going to use [POEditor](https://poeditor.com): an online tool which allows you define terms and their translations and provides an API to access that information.

### Setting up the project

This step is very straight-forward: we create a project, we add new entries (called terms in POEditor) and provide the translations. That's all it is.

![POEditor](/assets/img/blog/poeditor.png)
POEditor
{:.figcaption}

### Automatizing the fetching of the strings

The underlying idea is that, on every build, we want to fetch the latest strings, generating our `Strings` enum automatically (listing all available keys), and download the translations in the different supported languages.

To do so I'm using Python, hacking my way into it (please, don't judge my Python knowledge: I know nothing about nothing).

{% gist 99e7157b78a400e29a6a0d17b178dc8a localize.py %}

The script does two main things: first, it fetches all the terms listed in the project. With that we create our `Strings` class (we are also taking care of the case conversion from snake to camel case).

The second step is to download the files containing the translations.

This script is run during the build phase:

![Build Phases](/assets/img/blog/localize_build.png)
Build Phases
{:.figcaption}

## Conclusion

This can be easily improved, but with a couple of neat tricks we were able to create a setup where developers don't really need to worry about strings anymore. A PM or marketing person could go into that tool and update these strings and the app will pick-up on the changes during the next build.

The tool also supports other formats for the export file (JSON, Android XML, etc.), so this script could be easily adapted to your project/platform requirements.

Thanks for reading! ✌️
