---
layout: post
title: SwiftUI in the Apple Watch - Baby Colors
---

My daughter Lola, as any other toddler I suppose, loves screens. She gets hypnotized by any square that throws light.
My wife and I have been pretty consequent about her exposure to screens: we don't watch TV if she is around, we limit our own screen time, etc.
Yet there is one last screen my daughter is enjoying: my Apple Watch.

## The problem

I don't want to remove it every time I go on my knees and start playing with her, but the moment that the watch detects a wrist movement and activates, Lola goes to it like bees to honey.

I'm amazed by how fast she got the swiping gesture. She swipes throw menus with her tiny fingers, messing with various apps... it is fun but I'm also a bit concern that she is going to delete some important appointment or challenge my colleagues in the Workouts app. Don't want them to be embarrassed 😜

## The solution

I thought about creating a playground for her. An App on itself where she could swipe. It's coding time!

## The implementation

I have zero experience with watchOS. The app I wanted to build would be some sort of TableView where each cell would have a background color and some emojis perhaps. Emojis are fun. I can do this fairly quick with UIKit. What about the Apple Watch?

Well, now you can build a standalone watchOS App using SwitfUI even faster. The App is 50 lines of code. Yes. Fifty. And is ridiculously easy to follow:

{% highlight swift %}

struct ViewItem: Identifiable {
    var id = UUID()
    var color = Color.random
}

class ListViewModel: ObservableObject {
    @Published var items = [ViewItem]()

    init() {
        reload()
    }

    func reload() {
        let intArray = [Int](repeating: 0, count: 50)
        items = intArray.map { _ in ViewItem() }
    }
}

{% endhighlight %}

We have a `ViewItem` which represent every cell in the TableView (a `List` in the SwifUI world). It needs to conform to `Identifiable` and it basically holds one color. Just a random generated one.

Then we have a `ListViewModel` which holds an array of items. I created the `reload` function so that the array would be regenerated when any cell is touched. 

{% highlight swift %}
struct ContentView: View {
    let cellHeight = WKInterfaceDevice.current().screenBounds.height / 2
    
    @State var isEmojiVisible = true
    @ObservedObject var viewModel = ListViewModel()

    var body: some View {
        List {
            ForEach(viewModel.items) { item in
                ZStack {
                    Button(action: {
                        viewModel.reload()
                        isEmojiVisible.toggle()
                    }) {
                        item.color.edgesIgnoringSafeArea(.all)
                    }
                    Text(isEmojiVisible ? String.randomEmoji : "").font(.title)
                }.listRowInsets(EdgeInsets())
            }
        }
        .environment(\.defaultMinListRowHeight, cellHeight)
    }
}
{% endhighlight %}

And then we have the `ContentView` itself. It hosts the `List` where each item is represented by a `ZStack` view which holds a `Button` view and a `Text` view holding the Emoji. That's all it is.

The button action toggles the `isEmojiVisible` variable and reloads the ViewModel, generating new colors.

## The final result
{% include image.html url="/assets/blog/babycolors.gif" description="Final result" %}

I tested it with Lola and she seems to love it. And I loved how easy is to create something from scratch using SwiftUI.

I publish the project on [GitHub](https://github.com/gmoraleda/BabyColors) for those who might be interested. Thanks for reading! ✌️