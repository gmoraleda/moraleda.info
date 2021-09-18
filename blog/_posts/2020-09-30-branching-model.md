---
layout: post
title: 🌳 Branching Model for iOS development. Continuous Integration with Bitrise
---

When I started working at my current company, the setup we had for our iOS platform was hosted completely locally: **Bitbucket Server** for the repo, **Jenkins** as build platform and an own implementation of **Hockeyapp** for the distribution (as far as I understood, from the old days when Hockeyapp was an open source project). All that was run by an external agency (the one who had developed our app).

One of the first tasks I was assigned to was the internalization of such services in order to become independent and take control of the development cycle.

For hosting the repository we would use **Bitbucket Cloud** and **Hockeyapp** for distribution, but since our company does not host any server at all (our infrastructure runs mostly under the AWS umbrella), taking over the Jenkins implementation as it was, was not an option. **I was in the market for a new cloud CI/CD platform.**

[The Olympics of iOS cloud continuous integration servers][olimpics] was a great starting point. Since we are not developing an iOS only app, Buddybuild was not considered. After some research, the two finalists were **CircleCI** and **Bitrise**.

## Initial Steps

My initial choice was CircleCI but even I was following a couple of [tutorials][tutorials] I didn't manage to get the signing working. It may offer more customization than Bitrise but for **someone who has no idea what's he doing, having a building blocks interface as Bitrise does is key in such an early stage**.

The customer service responded promptly to my questions as well, yet another reason to move to Bitrise.

![All the steps included in one of our workflows… pretty self-explanatory](/assets/img/blog/bitrise.png)

All the steps included in one of our workflows… pretty self-explanatory
{:.figcaption}

After linking all the steps (using basically the recommended templates from Bitrise) the building platform was working… sorta.

## Limitations

We had three main workflows: Staging, Release Candidate and Distribution.

Staging and Release Candidate would build from our `develop` branch while Distribution would build from `master`.

If you are a single developer this setup works ok… but as the team grows, so does the need for more flexibility.

What if I want to build a release candidate and someone else modifies the `develop` branch? What if I want to ship a version to the QA department but I want to continue the development (and therefore merging branches into `develop`)? **Having a single branch in these scenarios is bad**.

## New branching model to the rescue

At that point it was quite clear that we were in need of more flexibility. We added two extra branches to our setup: `beta` and `release`.

`develop` would continue to reflect the current development state, generating new **alpha versions** every time a new branch would be merged into `develop`. As soon as the product manager required a new version to test a bunch of tickets together, we would manually merge from `develop` into beta, creating a new **beta version** app.

![Creating a new beta version at a given point](/assets/img/blog/new-scenario.jpeg)

Creating a new beta version at a given point
{:.figcaption}

That same approach would apply when several major features would be ready to integrate together in a more mature state, triggering a **release candidate version**. A manual merge would be executed from `beta` into `release`, producing a new release candidate version app.

![Different beta versions, manual merge into a new release candidate](/assets/img/blog/beta-release.gif)

Different beta versions, manual merge into a new release candidate
{:.figcaption}

**This release candidate would the one potentially being shipped to iTunes Connect**. In case the final testing and the review process would be satisfactory, the app would be published and a manual merge from release into `master` would be made, **including a tag with the version number. The** `master` **branch would ideally contain all the app versions published in the App Store, properly tagged.**

```bash
git checkout master
git tag v.1.2          # As an example
git push --tags
```

![Merging into `master` once the app is published, using a tag (v.1.2)](/assets/img/blog/release-master.jpeg)

Merging into `master` once the app is published, using a tag (v.1.2)
{:.figcaption}

All different versions produce two .ipa files, one targeting our staging backend and the second one targeting our live services.

In order to make it easier for us (and for our testers) to tell which version targets what, we assigned different app icons including the version name and the backend environment:

![App versions](/assets/img/blog/app-versions.jpeg)

App versions
{:.figcaption}

These apps are uploaded to HockeyApp, where our team of testers can see and download them.
And that's our current setup. Thanks for reading! ✌️

[olimpics]: https://medium.com/xcblog/olympics-of-top-5-cloud-ios-continuous-integration-servers-fcaa6c79468d
[tutorials]: https://medium.com/sixt-labs-techblog/continuous-integration-and-delivery-at-sixt-91ca215670a0
