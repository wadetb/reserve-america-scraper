Example Usage
=============

`node scraper.js '--campgrounds=Bahia_Honda_Sp,Curry_Hammock_Sp,Long_Key_Sp' --state=FL --length=23 --electric=30`
`--arrival=1/6/13 --departure=2/15/13 --nights=4 --notify_boxcar --interval=15`

Every 15 minutes, this will search reserveamerica.com for 30-amp electric campsites at least 23 feet in length at Bahia Honda, Curry Hammock, and Long Key with four consecutive nights of availability from January 6, 2013 to February 15, 2013. Any matching campsites will be notified via Boxcar.

Additional Parameters
---------------------

`--waterfront`
`--notify_growl`
`--notify_pushover`

Additional Configuration
------------------------

campsites_ignore