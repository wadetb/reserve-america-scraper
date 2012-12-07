## Example Usage
`node scraper.js '--campgrounds=Bahia_Honda_Sp,Curry_Hammock_Sp,Long_Key_Sp' --state=FL --length=23 --electric=30`
`--arrival=1/6/13 --departure=2/15/13 --nights=4 --notify_boxcar --interval=15`

Every 15 minutes, this will search reserveamerica.com for 30-amp electric campsites at least 23 feet in length at Bahia Honda, Curry Hammock, and Long Key with four consecutive nights of availability from January 6, 2013 to February 15, 2013. Any matching campsites will be notified via Boxcar.

### Required Parameters
`--campgrounds`  
`--state`  
`--arrival`  
`--nights`

### Additional Parameters
`--length`  
`--electric`  
`--departure`  
`--waterfront`  
`--notify_boxcar`  
`--notify_growl`  
`--notify_pushover`  
`--interval`

### Required Configuration in config.json
`campground_enum`
*add additional campgrounds to campground_enum using values from reserveamerica.com*

### Optional Configuration in config.json
`campsites_ignore`  
`growl`  
`boxcar`  
`pushover`

## Getting Started with Sample Data
[Download Node.js](http://nodejs.org/download/)  
[Node.js with Heroku](https://devcenter.heroku.com/articles/nodejs)  
[Heroku Toolbelt](https://toolbelt.heroku.com/)  
*ignore any references to express*  
`cp config.json-template config.json`  
`cp Procfile-template Procfile`

### Test locally
`foreman start`

### Deploy to Heroku
`heroku create`  
`git push heroku master`  
Use [Heroku Dashboard](https://dashboard.heroku.com) to start/stop dyno(s)