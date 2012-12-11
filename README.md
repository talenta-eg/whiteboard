whiteboard
==========

Open Source, web based Project Management that makes sense in the trenches, not on paper (though it makes sense on paper too)

Description:
==========

We're making good project management software *for small, innovative programming/design teams*. We are *not* building software for everyone, and have no interest in putting in features that 40 year olds in big beurocratic companies need. The key idea is dependencies. *Almost everything* in small team code/design projects relies on something else already being done. So why not plan your projects as a graph of dependencies, instead of a schedule or a GANTT chart? Do these things, then do those things. And what better way
to see dependencies than working with a visual graph? Whiteboard aims to do
that. We're *not guessing schedules*, because those guesses are meaningless. Work as fast as you can, and we'll stay on top of what still needs to get done, and provide you with nice checklists based on who's working on what, and what's already finished. No more asking around for a project. Let Whiteboard kill your down time ;)

Auxilliary Goals:
----------
(add your ideas here)

- It would be really cool to gamify the production experience with badges ("office hero" for finishing a project that atleast one other person passed on, "speedy gonzales" for finishing 10 items in the same day, etc.). Let's do that.

Getting A Local Test Server Set Up:
==========

We're using Apache Tomcat 7 as our server environment, with MySQL 5 as a database, and Java as our server side language. We're also using Apache Ant 1.8 as our build tool. Here are some excellent tutorials on getting set up with all of this:

Quick Guides:
----------
(note on doing this on Mac OS 10.8: *make sure* your $JAVA\_HOME variable is set. I assumed that it would be on a mac. Not so. Also, it needs to be set to a different place than the official Apache docs specify (new in 10.8): /System/Library/Frameworks/JavaVM.framework/Home)

Apache Tomcat 7: http://www3.ntu.edu.sg/home/ehchua/programming/howto/Tomcat\_HowTo.html
MySQL 5: http://www3.ntu.edu.sg/home/ehchua/programming/sql/MySQL\_HowTo.html
Alerternative Tutorial for Mac Users (skip everything except for MySQL and Tomcat sections): http://www3.ntu.edu.sg/home/ehchua/programming/howto/Tomcat\_HowTo.html
Official Tomcat 7 First Webapp: http://tomcat.apache.org/tomcat-7.0-doc/appdev/index.html

Official Docs:
----------
Apache Setup: http://tomcat.apache.org/tomcat-7.0-doc/setup.html
Ant Docs (No hyperlink directly to setup, click it on the left): http://ant.apache.org/manual/index.html


High minded principles section: 
==========
(never speak of them, think of them always)


Programming:
----------
1. Build what you want to use. Don't let competion ever justify a feature.
2. Less code means fewer bugs. Does the absence of that feature make you want to use it less?
3. Optimization is the biggest cause of programming sins. For now, just don't.
4. Comment, comment, comment.
5. Use a real text editor. Vim or Emacs, or something else. It will make you faster, which is better.

Design:
----------
1. Exceed the web medium artistically, not technologically. Don't use lots of images when some CSS and JS will do. Load times!
2. Don't make users think. Computers are supposed to do that for us, not to us.
3. Don't copy where it doesn't fit. Otherwise, copy shamelessly.
