---
layout: post
title: Masking out text in SwiftUI
---

Today's post is rather short: Let's mask out text on a view in order to make it transparent using SwiftUI.

First, an extension on `View` to generate an inverted mask:

```swift
extension View {
    public func inverseMask<M: View>(_ mask: M, cornerRadius: CGFloat) -> some View {
        let inverseMask = mask
            .background(Color.white)
            .compositingGroup()
            .luminanceToAlpha()
            .cornerRadius(cornerRadius)
        return self.mask(inverseMask)
    }
}
```

Then the view itself. Just a white `Rectangle` where we apply our new mask:

```swift
struct CutOutText: View {
    let text: String

    var body: some View {
        Rectangle().fill(Color.white).padding()
            .inverseMask(
                Text(text)
                    .font(Font.custom("Avenir Next", size: 14).weight(.medium))
                    .padding(.horizontal, 10).padding(.vertical, 5), cornerRadius: 5

            )
    }
}
```

And finally, let's test it on a `LazyVGrid`!

```swift
struct ContentView: View {
    var body: some View {

        let colors = [Color.red, Color.yellow, Color.blue, Color.green, Color.orange, Color.black, Color.pink, Color.purple]

        let columns = [
            GridItem(.flexible()),
            GridItem(.flexible()),
        ]
        return
            ScrollView {
                LazyVGrid(columns: columns) {
                    ForEach(colors, id: \.self) { color in
                        ZStack {
                            Rectangle().fill(color).padding().frame(height: 200)
                            CutOutText(text: "This is a demo")
                        }
                    }
                }

            }

    }
}
```

![LazyVGrid with cut out text](/assets/img/blog/grid-view.png)

This approach could be applied to images, views, etc.

Thanks for reading! ✌️
