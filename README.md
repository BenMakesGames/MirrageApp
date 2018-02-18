MirrageApp
==========

MirrageApp is a JS MVC framework for making single-page apps for mobile devices, probably via Cordova/Phonegap.

MirrageApp assumes that many modern ES6 features (class, const, template strings...) and CSS features (grid, variables...) are available. **IE/Edge support is ignored**, since Microsoft is not a mobile player.

Design Philosophy
-----------------

A little history: MirrageApp was initially created for a work project, where most of my coworkers are not experienced JS programmers, and are not very comfortable with the CLI (command-line interface). I was having trouble finding a framework that would work for the team, and was eventually told not to use a framework at all. After the project was over, I had essentially built my own framework. I later rewrote that framework, making improvements along the way... thus was born MirrageApp.

MirrageApp was written while keeping many concepts from modern MVC frameworks in mind (particularly PHP's Symfony and JS's Angular, which I happen to have some experience with). There is an **extendable templating engine (with out-of-the-box support for Lodash, Underscore, doT, and jsRender)**; pages are objects with view and logic kept separate; you can write services to add more functionality to your app.

Despite some of MirrageApp's modern considerations, I've decided to keep MirrageApp CLI-free. You're probably going to need to learn CLI eventually, to build, test, and deploy your Cordova/Phonegap app, but I totally understand why the CLI can be an intimidating foe for some. **If you know some HTML, JS, and CSS, but are a CLI noob, but really want to make a mobile app, I want MirrageApp to work for you.** When you're ready to build and publish your MirrageApp app, it should be easy to drop it into a fresh Cordova/Phonegap project, and go from there. When that time comes, you will probably need to learn a little bit about filesystems and the CLI. Don't forget that. But until then, don't worry too much about it, and just have fun getting started with your mobile app!   

Requirements
------------
* jQuery
  * https://jquery.com
* jQuery.mobile
  * https://jquerymobile.com
  * jQuery mobile provides a handy way for Mirrage to access and provide mobile-friendly functions. As you write your app, your usage of jQuery/jQuery mobile should be minimal. (**You will not be using jQuery to alter the DOM**, except perhaps in services.)
* jQuery.mobile.swipeupdown
  * https://github.com/blackdynamo/jquerymobile-swipeupdown
  * Allows MirrageApp to offer **pull-to-refresh functionality that looks and feels like a native app.**  
* jQuery.ba-throttle-debounce
  * https://github.com/cowboy/jquery-throttle-debounce
* SugarJS
  * https://sugarjs.com
  * For shimming a few ES6 methods. I may look to alternatives in the future (in particular, I suspect that Lodash may someday replace SugarJS and jQuery.ba-throttle-debounce).

Template Engine Requirement
---------------------------

Your app will almost certainly require a templating engine. MirrageApp comes with built-in support for Lodash, Underscore, doT, and jsRender. If you prefer another JS templating engine, it is probably easy to write a MirrageApp plugin to add support for it. (See mirrage-lodash.js as an example of how to do this.)

Install one of the following:

* Lodash
  * https://github.com/lodash/lodash
  * My personal recommendation.
* Underscore
  * https://github.com/jashkenas/underscore
  * Lodash started as a rewrite of Underscore, so they are exceedingly similar, but if you prefer Underscore over Lodash, use Underscore!
* doT
  * https://github.com/olado/doT
  * I don't remember much about this one, honestly. It's just another I tried while playing with different templating engines.
* jsRender
  * https://github.com/BorisMoore/jsrender
  * MirrageApp used to REQUIRE jsRender, but the more I worked with it, the more I found it was lacking in some features (which is what lead me to make MirrageApp support any templating engine via a plugin). I can't really recommend jsRender, but if it's your jam, rejoice: MirrageApp supports it out-of-the-box.
* Anything else
  * Again, look to `js/mirrage-lodash.js`, `js/mirrage-doT.js`, or `js/mirrage-jsrender.js`, for examples on how to add support for any other templating engine.

Recommendations
---------------
 
* Use a good IDE. I happen to like PHPStorm (with JavaScript set to ES6), but there are many good IDEs out there.
* If you haven't used a JS framework (or ANY framework) before, forget what you know about writing HTML/JS webpages. A single-page app is totally different. You're going to be initially confused, and possibly annoyed, but stick with it: MirrageApp may seem weird at first, but concepts you learn here will translate to other MVC frameworks. You'll be learning some good and cool things. 

Installing & Getting Started
----------------------------

1. Download the MirrageApp repository as a ZIP, and unzip it anywhere.
2. Open the `index.html` file in a modern (non-IE/non-Edge) browser, and take a look.
   * Try out the hamburger menu.
   * Try pull-to-refresh.
   * Note that the About page does NOT allow pull-to-refresh.
3. Open the `index.html` file in an IDE or text editor, and take a look.
   * Pay special attention to how pages and services are loaded (via both `<script>` tag, and the `pages` and `services` arrays).
4. Look around in the `js/` directory, especially `js/pages/` and `js/services/`.
   * Notice the `<a data-page="...">` and `<a data-back>` navigational links. That's weird, right?
5. Be bewildered by the strange (and - I promise - wonderful) way that pages are handled.
   * Try making some simple changes; reload your web browser to check it out.
6. If you're already familiar with Lodash, Underscore, doT, or jsRender, edit `index.html` to enable the library you prefer (you'll have to make changes in a couple places). If you're *not* familiar with one of these, I recommend using Lodash: edit `index.html` to enable Lodash, check out `js/pages/home.js` for some examples on how to use its templating language, and search the web to learn more.
7. Start coding! :)

Later:

8. Download &amp; install Cordova/Phonegap.
9. Create a new Cordova/Phonegap project.
10. Open up the Cordova/Phonegap project's `www/` directory. Notice that it has an `index.html` file.
11. Delete everything in the Cordova/Phonegap project's `www/` directory! (Yep! All files and all directories! Trash 'em!)
12. **Copy** all of the files from your MirageApp app into the Cordova/Phonegap project `www/` directory.
    * The Cordova/Phonegap project's `www/` directory should once again contain an `index.html`: the `index.html` from your MirageApp app.
    * When you feel satisfied and safe about your project's new home, delete its old location.
13. Read up on Cordova/Phonegap. How to build and publish a Cordova/Phonegap app is beyond the scope of this tutorial.

Pro Tips
--------
In addition to the "Recommendations" above...

* Learn how to use git.
* Learn about JavaScript promises. (If you've done AJAX requests with jQuery, you may have already used them, even if you didn't know what they were called.)
* Check out all the other cool features of ES6 and modern CSS.
  * Refer to https://caniuse.com to make sure that modern (mobile) browsers support the cool feature you want to use.

A Disclaimer About MirrageApp
-----------------------------

MirrageApp trades away some power in order to gain some ease-of-use.

If you're serious about mobile app development with Cordova/Phonegap, consider Vue.js, or Angular. These frameworks were created by super-smart people, and are super-powerful. They also have a higher learning curve, and were not designed with mobile development foremost in mind (though for Angular in particular, check out ionic, a project for mobile+Angular development).
  
Which solution is right for you is something you must decide. I released a professional mobile app using MirrageApp's predecessor. But it was also a relatively small app, and needed to be accessible to developers with relatively little JS experience. Are you making a large app? Do you have a team of JS experts? If so, MirrageApp may not be for you.

MirrageApp's Future
-------------------

I'm currently using MirrageApp to develop my own mobile game, so I can at least guarantee that I will be working on &amp; improving MirrageApp for as long as I'm working on that game.

MirrageApp depends heavily on jQuery, and I can't decide if I like that or not. In some ways, I regard jQuery as a relic of the IE6-7 days that does not have much place in modern web development; on the other hand, it's a popular library that is familiar to many, and may make MirrageApp more-approachable.

I should probably add npm support, despite Mirrage's history as a CLI-adverse library... 

If you'd like to make any suggestions (or pull requests), please feel free to do so.
