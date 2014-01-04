(function () {
  "use strict";

  var $ = require("jquery"),
      request = require('request'),
      querystring = require('querystring'),
      fs = require('fs'),
      argv = require('optimist').boolean('notify_boxcar').boolean('notify_pushover')
              .boolean('waterfront').default('interval', 0).argv,
      boxcar = require('boxcar'),
      push = require('pushover-notifications'),
      nodemailer = require("nodemailer"),
      nconf = require('nconf'),
      path = require('path'),
      shorturl = require('shorturl');

  var config_file = path.join(__dirname, 'config.json');
  nconf.argv().env().file({ file: config_file });

  var campground_enum = nconf.get('campground_enum'),
      campgrounds = argv.campgrounds.split(','),
      interval = argv.interval * 1000 * 60,
      notify_boxcar = argv.notify_boxcar,
      notify_pushover = argv.notify_pushover,
      notify_gmail = argv.notify_gmail;

  var smtpTransport;
  if (notify_gmail) {
    smtpTransport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
          user: nconf.get('gmail:user'),
          pass: nconf.get('gmail:password')
      }
    });
  }

  var notify = function(title, text, longtext) {
    console.log('NOTIFY: '+title+' - '+text);
    if (argv.notify_boxcar) {
      var user = new boxcar.User(nconf.get('boxcar:username'), nconf.get('boxcar:password'));
      user.notify(text, title, null, null, nconf.get('boxcar:iconUrl'));
    }
    if (notify_pushover) {
      var p = new push( {
        user: nconf.get('pushover:user'),
        token: nconf.get('pushover:token')
      });
      var msg = {
        message: text,
        title: title 
      };
      p.send(msg, function(err,result) {
        if (err) {
          throw err;
        }
      });
    }     
    if (notify_gmail) {
      var msg = {
          from: nconf.get('gmail:user'),
          to: nconf.get('gmail:recipients'),
          subject: title,
          html: longtext
      }
      smtpTransport.sendMail(msg, function(error, response) {
        if (error) {
          notify_gmail = false;
          notify('ReserveAmerica Error', 'GMail notification failed:\n' + error);
          notify_gmail = true;
        }
      });
    }
  }

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
          length = argv.length || '',
          waterfront = (argv.waterfront) ? 'true' : '',
          arrival = argv.arrival,
          nights = argv.nights,
          flexibility = argv.flexibility || '4wk';

      var form = {
          contractCode:state,
          parkId:parkId, 
          siteTypeFilter:'ALL', 
          submitSiteForm:'true',
          search:'site',
          lookingFor:'2002',
          camping_2002_3013:length,
          camping_2002_moreOptions:'true',
          camping_2002_3011:waterfront,
          campingDate:arrival,
          campingDateFlex:flexibility,
          lengthOfStay:nights
      };

      // First request always returns all sites, reason unclear.  Session issues?
      request.post('http://www.reserveamerica.com/campsiteCalendar.do', {form: form}, function(error, response, body) {

        request.post('http://www.reserveamerica.com/campsiteCalendar.do', {form: form}, function(error, response, body) {

          if (error) {
            notify('ReserveAmerica Error', error);
            return;
          }

          var matchSummary = $(body).find('.matchSummary').text();
          var m = matchSummary.match(/^\s*(\d+) site\(s\) available\s+out of \d+/);

          if (!m) {
            notify('ReserveAmerica Error', 'Failed to detect number of sites available in the following text:\n'+text);
            return;
          }

          var siteCount = m[1];

          if (siteCount >= 1) { 
            var table = $(body).find('#csitecalendar');
            $(table).find('thead').find('tr').first().remove();
            $(table).find('a').replaceWith(function() {
              return $(this).contents();
            }); 
            $(table).find('#maplinkicon').remove();

            var url = 'http://reserveamerica.com/campsiteCalendar.do?'+querystring.stringify(form); 

            shorturl(url, function(shorturl_result) {
              notify(siteCount + ' site(s) available at ' + campground_fullname, shorturl_result, shorturl_result+'\n'+$(table).html());
            });
          }
        
        });

      });

  });
  };

  scraper();
  if (interval > 0) setInterval(scraper, interval);

})();
