(function () {
  "use strict";
  var $ = require('jquery'),
      request = require('request'),
      querystring = require('querystring'),
      growler = require('growler'),
      fs = require('fs'),
      argv = require('optimist').boolean('notify_growl').boolean('notify_boxcar').boolean('notify_pushover')
              .boolean('hookup').boolean('waterfront').default('interval', 0).default('false_positives_max', 100).argv,
      boxcar = require('boxcar'),
      push = require('pushover-notifications'),
      nconf = require('nconf'),
      path = require('path');

  var config_file = path.join(__dirname, argv.config_path, 'config.json');
  nconf.argv().env().file({ file: config_file });
         
  var campground_enum = nconf.get('campground_enum'),
      campsites_ignore = nconf.get('campsites_ignore') || [],
      campgrounds = argv.campgrounds.split(','),
      hookup_enum = nconf.get('hookup_enum'),
      interval = argv.interval * 1000 * 60;

  var scraper = function() {

    campgrounds.forEach(function(campground) {
      if (!campground) {
        throw new Error('Campground not found!');
        return;
      }  
      
      if (!campground_enum[campground]) {
        throw new Error(campground + ' not found!');
        return;
      }

      var campground_fullname = campground.replace('_Sp','').replace('_', ' '),
          state = argv.state,
          parkId = campground_enum[campground],
          eqplen = nconf.get('eqplen') || null,
          hookup = (argv.hookup) ? '3002' : '',
          waterfront = (argv.waterfront) ? '3011' : '',
          arrival = argv.arrival,
          departure = argv.departure,
          range = (departure) ? '2' : '',
          nights = argv.nights,
          false_positives_max = argv.false_positives_max,
          notify_growl = argv.notify_growl,
          notify_boxcar = argv.notify_boxcar,
          notify_pushover = argv.notify_pushover;

      var query = querystring.stringify({ parkId:parkId, siteType:'2001', expfits:true, eqplen:eqplen, hookup:hookup, 
                  waterfront:waterfront, range:range,
                  arvdate:arrival, enddate:departure, lengthOfStay:nights, page:'calendar',
                  contractCode:state, siteTypeFilter:'RV or Tent' }),
          baseurl = 'http://www.reserveamerica.com',
          action = '/camping/' + campground + '/r/campsiteCalendar.do?',
          url =  baseurl + action + query;

      request(url + '&submitSiteForm=true', function(error, response, body) {

        request(url, function(error, response, body) {
          // console.log(body);
          console.log(url);
          // console.log(campground_fullname);
          var found = 0,
              text = "Found: ";
          $(body).find('table#calendar tbody tr:not(:has(td.sn a.unavail))').each(function(index) {
            var that = $(this).find('td.sn a:not(.sitemarker)'),
                campsite = parseInt(that.text(),10),
                campsite_link = that.attr('href');
            if ($.inArray(campsite,campsites_ignore[campground]) === -1) {
              text += '#' + campsite + ' ';
              // text += '<a href="' + baseurl + campsite_link + '">View</a>';
              console.log(campsite + "*");
              found++;
            } else {
              console.log(campsite);
            }
          });
          if (found > 0) {
            if (found < false_positives_max) {
              if (notify_growl) {
                var growl_app = new growler.GrowlApplication(nconf.get('growl:growl_app')),
                    icon_file = path.join(__dirname, nconf.get('growl:icon')),
                    icon = (fs.existsSync(icon_file)) ? fs.readFileSync(icon_file) : '';
                growl_app.setNotifications({
                  'Status': {}
                });
                growl_app.register();
                growl_app.sendNotification('Status', {
                  title: campground_fullname,
                  text: text,
                  icon: icon
                });        
              }
              if (notify_boxcar) {
                var user = new boxcar.User(nconf.get('boxcar:username'), nconf.get('boxcar:password'));
                user.notify(text, campground_fullname, null, null, nconf.get('boxcar:iconUrl'));
              }
              if (notify_pushover) {
                var p = new push( {
                  user: nconf.get('pushover:user'),
                  token: nconf.get('pushover:token')
                });
                var msg = {
                  message: text,
                  title: campground_fullname
                };
                p.send(msg, function(err,result) {
                  if (err) {
                    throw err;
                  }
                  console.log(result);
                });
              }
            }
            else {
              console.log('Possibly too many false positives!');
              console.log(url);
              console.log(body);
            }
          }
          else {
            var date = (departure) ? ' from ' + arrival + ' to ' + departure : ' on ' + arvdate;
            console.log('Sorry, no preferred campsites found at ' + campground_fullname + date + ' for ' + nights + ' night' + ((nights>1) ? 's' : '') + '.');
          }
        });

      });

    });
  };

  scraper();
  if (interval > 0) setInterval(scraper, interval);

}) ();