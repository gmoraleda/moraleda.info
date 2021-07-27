---
layout: post
title: Build and deploy a Jekyll blog using GitHub Actions
---

One thing I really enjoy about [my current company](https://minddoc.de/) is how we leverage the power of GitHub actions to run many different tasks in our workflows: from linting and formatting, to creating releases or deploy apps to App Store Connect.

Is quite impressive the amount of actions that the community put up together in the [GitHub Marketplace](https://github.com/marketplace?type=).

I wanted to therefore leverage this technology in a smaller scale: the build and deployment of this Jekyll blog.

The idea would be that on every new push to the `master` branch, Jekyll should build the site and upload it to my hosting site via FTP.
This can achieved surprisingly easily using the [Build](https://github.com/marketplace/actions/build-jekyll) and the [FTP Deploy](https://github.com/marketplace/actions/ftp-deploy) actions.

The resulting workflow is quite straightforward:


```
on:
  push:
      branches:
        - master
jobs:
  build:
    name: Build & Deploy
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Build
      uses: jerryjvl/jekyll-build-action@v1
        
    - name: Deploy
      uses: SamKirkland/FTP-Deploy-Action@2.0.0
      env:
        FTP_SERVER: ${{ secrets.FTP_SERVER }}
        FTP_USERNAME: ${{ secrets.FTP_USER }}
        FTP_PASSWORD: ${{ secrets.FTP_PWD }}
        LOCAL_DIR: _site
        REMOTE_DIR: moraleda.info
        ARGS: --delete --transfer-all
        # --delete arg will delete files on the server if you've deleted them in git
```


It is important to notice that, since jobs run in isolation, both steps should run in the same job in order to share the environment, otherwise we would need to pass the output of build to the deploy step. 

## Bonus track
I also added a different workflow to run on pull requests in order to check the spelling of Markdown files (which contain most of the blog content):

```
name: Check Spelling
on:
  pull_request:
    paths:
    - '**.js'
    - '**.vue'
    - '**.txt'
    - '**.html'
    - '**.md'
jobs:
  spelling:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        ref: ${{ github.head_ref }}
    - name: Check Spelling
      uses: UnicornGlobal/spellcheck-github-actions@master

```

Both workflows need to live under the [.github/workflows](https://github.com/gmoraleda/moraleda.info/tree/master/.github/workflows) folder, so that GitHub will know about them.

Thanks for reading! ✌️
