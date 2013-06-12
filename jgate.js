/* appjet:version 0.1 */
/* appjet:server */

import("storage");
import("lib-flickr-minimal-dev");
import("lib-sessions");
import("lib-jquery");

// import('storage')
// storage.domain = {appjet:"whatwherewhen.jgate.de", husk:"husk.org", gmap:"ABQIAAAAAuD6u2ORBgn25rPuxX1qxxQ21dkJCVC628PWbWveFuMTTTsMmxS2p7mhq2A7XXDWxDsRzEGLTH9vBQ"};    // live
// storage.flickr = {};
// storage.flickr.key="d7d840824b23102b8a040d3b93e0cf4b";
// storage.flickr.secret = "29e6310d67dc0895";

// storage.domain = {appjet:"localhost:8092", husk:"local.husk.org", gmap:"ABQIAAAAAuD6u2ORBgn25rPuxX1qxxS6k2STUI7dBt_gdCvI8VbBy9p7VxRBVy-MEKFwRxZLOqIji4rYf0zIpw"}; // dev

// canonical domain is husk.org, not appjet (under new name)
if (request.headers['Host'] == "flickr-places.appjet.net") {
    print("Requested site from appjet, redirecting");
    response.redirect('http://where-what-when.husk.org/');
}

// HTML printing, both logged in and logged out
return_html = function() {
    auth = flickr.auth_url("read", true);

    page.setTitle("husk.org. where? what? when?");

    // login and logout
    if (request.params.frob) {
        user_info = flickr.promote(request.params.frob);

        keys = ['token', 'nsid', 'username', 'fullname'];
        for (key in keys) {
            session[keys[key]] = user_info[keys[key]];
        }
        response.redirect('/');
    }

    if (request.params.logout) {
        // nasty logout hack - then print the logged out page
        session.token = null;
        response.redirect('/');
    }

    // get and output gmap key + ui references
    page.head.write("""<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>""");

    husk = storage.domain.husk;
    page.head.write("""<script src="http://"""+husk+"""/js/ui/jquery.dimensions.js" type="text/javascript" language="javascript" charset="utf-8"></script>""");
    page.head.write("""<script src="http://"""+husk+"""/js/ui/ui.core.js" type="text/javascript" language="javascript" charset="utf-8"></script>""");
    page.head.write("""<script src="http://"""+husk+"""/js/ui/ui.slider.js" type="text/javascript" language="javascript" charset="utf-8"></script>""");

    // pass through server-side variabls
    if (session.token) {
        page.head.write("""<script type="text/javascript">var logged_in = true;</script>""");
    }
    if (request.params.tags) {
        page.head.write("""<script type="text/javascript">var showing = 'tags';</script>""");
    } else {
        page.head.write("""<script type="text/javascript">var showing = 'recent';</script>""");
    }
    // args = { auth_token:session.token }, place_type:"locality" }

    print(html("""<div id="map"></div>"""));

    // new logged in / logged out logic
    // basically, logged out get tag explorers; logged in get full user stuff

    print(html("""<div id="input"><form id="form" action="#" method="get">"""));

    print(raw("""<table cellpadding="0" cellspacing="0" id="www"><tr><th>where?</th><th>what?</th><th>when?</th></tr>"""));
    print(raw("""<tr><td><select id="place_type_id" name="place_type_id">
      <option value="22">neighbourhood</option>
      <option value="7" selected="selected">locality</option>
      <option value="8">region</option>
      <!-- option value="9">county</option -->
      <option value="12">country</option>
      <option value="29">continent</option></select><br/>

      </td>
      """));

    print(raw("""<td>Show <select id="type" name="type">"""));

    var tag = "London";
    if (request.params.tag) {
        tag = request.params.tag;
    }

    if (session.token) {
        print (html(""" <option value="me">my photos</option>
                        <option value="ff">photos from friends</option>
                        <option value="contacts" selected="selected">photos from contacts</option>
                        <option value="tag">photos tagged</option></select><br/>
                        <input type="text" name="tag" id="tag" value='"""+tag+"""' style="display:none;">"""));
    } else {
        print (html(""" <option value="tag" selected="selected">photos tagged</option></select>
                        <input type="text" name="tag" id="tag" value='"""+tag+"""'>"""));
    }

    print(html("""</td><td>"""));

    print(html("""  <div id='container'><span class="slider_container"><span class='slider_bar'>
              <span id='slider1_handle' class='slider_handle'></span>
              <span id='slider2_handle' class='slider_handle'></span>
              </span></span></div>"""));

    print(html("""&nbsp;taken <span id="dateinfo"></span>"""));

    print(html("""</td><td>"""));

    print(html("""<input type="submit" value="Update locations"><br>
                  <input type="checkbox" name="reset" id="reset" value="yes"><label for="reset">Don't reset map when updating.</label>"""));

    print(html("""</td></tr></table></form></div>"""));

 /*   print(html(""" <select id="time_type_code" name="time_type_code">
      <option value="0" selected="selected">at any time</option>
      <option value="86400">in the last day</option>
      <option value="604800">in the last week</option>
      <option value="2678400">in the last month</option>
      <option value="16070400">in the last six months</option>
      <option value="32140800">in the last year</option>
      <option value="96422400">in the last three years</option></select>. """));
*/

/*

    if (!session.token) {
        print(raw("""<div id="authorise">"""));
        print(link(flickr.auth_url("read", true), "Authorize with Flickr"));
        print(raw(""" to see your photos on the map.</div>"""));
    }
*/

    print(html("""<div id="photos"><div id="photos_content"></div></div>"""));
    print(html("""<div id="info">"""));

    print(H1(raw("where? what? when? <br><span class='subhead'>maps and photos, oh my!</span>")));

    print(html("""<div id="blurb"><p>This is a small web app that uses new Flickr API methods to show
                    where in the world photos posted to Flickr have been taken. It will show photos with a particular tag,
                    or, if you authenticate, photos from your friends, contacts, or yourself. The size
                    of the circle on any given place indicates how many photos were taken there.</p>

                    <p>You can click on a circle to see photos taken in that area, or zoom in if there
                    are lots of overlapping areas. The controls at the bottom change where, what and when
                    is in the photos.</p>"""));

    if (!session.token) {
        print(html("""<p>"""));
        print(link(flickr.auth_url("read", true), "Authorize with Flickr"));
        print(html(""" to see your photos, and those of your friends and family, grouped on the map.</p>"""));
    }

    print(html("""<p style="text-align:right"><a href="#" onclick="$('div#info').fadeOut(); return false;">Hide this overlay</a></div></div>"""));

    print(html("""<script type="text/javascript">var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www."); document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E")); </script> <script type="text/javascript"> try { var pageTracker = _gat._getTracker("UA-5271055-6"); pageTracker._trackPageview(); } catch(err) {}</script>"""));
}

return_json = function() {
  page.setMode("plain");
  method = request.params.method || "flickr.places.placesForUser";

  dlog.info(request.params);

  args = request.params;
  delete(request.params['method']);

  if (session.token) args['auth_token'] = session.token;
  args['place_type_id'] = request.params['place_type_id'] || "7";

  print(raw(flickr.make_call(method, args, true)));
}

if (request.path == "/json/") {
    return_json();
} else if (request.path == "/") {
    return_html();
} else {
    response.redirect("/");
}

/* below is the client code
 *
 *
 *
 *
 *
 */

/* appjet:client */

$(document).ready(load);
// $(window).unload(GUnload);

var map;
var markers = [];
var current_tag;
var show_photos;
var place;

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function switch_to_tags() {
    showing = "tags";
    show_photos();
}

function switch_to_recent() {
    showing = "recent";
    show_photos();
}

function switch_to_interesting() {
    showing = "interesting";
    show_photos();
}

function plot(data) {
    var so = 90; var we = 180; var no = -90; var ea = -180;
    var max = 0;

    if (!data.places) {
      alert("There was an error fetching data from Flickr.");
      return;
    }

    console.log(data.places);

    for (var index = 0; index < data.places.place.length; index++) {
      place = data.places.place[index];
      if (parseInt(place.photo_count) > max) {
        max = parseInt(place.photo_count);
      }
    }
    console.log("max photos per place: "+max);

    for (var index = 0; index < data.places.place.length; index++) {
      place = data.places.place[index];

      lat = parseFloat(place.latitude);
      lon = parseFloat(place.longitude);

      var ll = new google.maps.LatLng(lat, lon);

      var size = Math.ceil(Math.log(parseInt(place.photo_count))/Math.log(max)*40)

      show_photos = function() {
        if (this.value) { place = this.value; }
        var html = "<div class='lr'><span class='l'><a href='http://flickr.com/places"+place.place_url+"'>"+place._content+"</a>";
        html += " - "+place.photo_count+" photos for this "+place.place_type+"</span>";
        html += "<span class='r'><img src='http://husk.org/images/spinner.gif' id='spinner' width='9' height='9' border='0' style='margin:0px;' alt='Please wait...'>";
        if (showing == "tags") {
          html += " <a href='#' onclick='javascript:switch_to_recent(); return false;'>Show recent photos</a> | <a href='#' onclick='javascript:switch_to_interesting(); return false;'>Show interesting photos</a> | <b>Showing tags</b> | ";
        } else if (showing == "recent") {
          html += " <b>Showing recent photos</b> | <a href='#' onclick='javascript:switch_to_interesting(); return false;'>Show interesting photos</a> | <a href='#' onclick='javascript:switch_to_tags(); return false;'>Show tags</a> | ";
        } else if (showing == "interesting") {
          html += " <a href='#' onclick='javascript:switch_to_recent(); return false;'>Show recent photos</a> | <b>Showing interesting photos</b> | <a href='#' onclick='javascript:switch_to_tags(); return false;'>Show tags</a> | ";
        }
        html += " <a href='#' onclick='javascript:$('div#photos').fadeOut(); return false;'>Hide</a></span></div><br style='clear:both;'>";

        // get appropriate photos (or tags)
        var type = $('form select#type option:selected').attr('value');
        var place_type_id = $('form select#place_type_id option:selected').attr('value');

        var min = to_mysql_datestamp(new Date($(".slider_bar").slider("value", 0)*1000));
        var max = to_mysql_datestamp(new Date($(".slider_bar").slider("value", 1)*1000));

        if (showing == "tags") {
            $.getJSON("/json/?method=flickr.places.tagsForPlace", { place_id : place.place_id, max_taken_date: max, min_taken_date: min }, add_tags);
        } else {
            // photos
            if (showing == "recent") {
                sort = "date-taken-desc";
            } else {
                sort = "interestingness-desc";
            }

            if (type == "contacts") {
                $.getJSON("/json/?method=flickr.photos.search", { place_id : place.place_id, extras: 'owner_name', max_taken_date: max, min_taken_date: min, sort: sort, per_page: 20,   user_id: "me", contacts: "all" }, add_photos);
            } else if (type == "ff") {
                $.getJSON("/json/?method=flickr.photos.search", { place_id : place.place_id, extras: 'owner_name', max_taken_date: max, min_taken_date: min, sort: sort, per_page: 20,   user_id: "me", contacts: "ff" }, add_photos);
            } else if (type == "tag") {
                $.getJSON("/json/?method=flickr.photos.search", { place_id : place.place_id, extras: 'owner_name', max_taken_date: max, min_taken_date: min, sort: sort, per_page: 20,   tags: $("input#tag").attr("value") }, add_photos);
            } else {
                $.getJSON("/json/?method=flickr.photos.search", { place_id : place.place_id, extras: 'owner_name', max_taken_date: max, min_taken_date: min, sort: sort, per_page: 20,   user_id: "me" }, add_photos);
            }
        }

        $('div#photos_content').html(html);
        $('div#photos').fadeIn("slow");
        console.log(place);
        console.log($('div#photos').width());

      }

      var marker = new google.maps.Marker( { position: ll,
                                             map: map,
                                             icon: get_circle(size) }
                                         );
//      marker.title = place;
      google.maps.event.addListener(marker, "click", show_photos);

//       google.maps.event.addListener(marker, "dblclick", function() {
//         map.setCenter(this.getLatLng());
//         map.zoomIn();
//
//         // too dumb to get this to work
//         // this.zoomhandler = google.maps.event.addListener(marker, "moveend", function() {
//         //   map.removeListener(this.zoomhandler);
//         // });
//       });
      // marker.bindInfoWindowHtml(html);

      markers.push(marker);
      console.log("added marker (?)");

      marker = undefined;

      if (lat < so) { so = lat; }
      if (lat > no) { no = lat; }
      if (lon < we) { we = lon; }
      if (lon > ea) { ea = lon; }
    }

    // TODO don't do this if the map's been moved
//     if (!$('input#reset').attr('checked')) {
//         var latLngBounds = new google.maps.LatLngBounds(new google.maps.LatLng(so, we), new google.maps.LatLng(no, ea));
//         var center = latLngBounds.getCenter();
//         var zoom = map.fitBounds(latLngBounds);
//         map.setCenter(center, zoom);
//     }
}

function add_photos(data) {
    console.log(data);

    var width = ($('div#photos_content').width()/80)-1;

    if (!data.photos.photo.length) {
        $('div#photos_content').append("<p>No photos found for this search.</p>");
        $('img#spinner').hide();
        return;
    }

    for (var index = 0; index < width; index++) {
        var p = data.photos.photo[index];
        var html = '<a href="http://flickr.com/photos/'+p.owner+'/'+p.id+'/" target="_blank">';
        html += '<img src="http://farm'+p.farm+'.static.flickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_s.jpg" '
        html += 'width="75" height="75" border="0" title="';
        html += p.title.replace(/"/g, "'")+' by '+p.ownername.replace(/"/g, "'")+'"><'+'/a>';
        $('div#photos_content').append(html);
    }

    $('img#spinner').hide();
}

function add_tags(data) {
    console.log(data);
    if (!data.tags.tag.length) {
        $('div#photos_content').append("<p id='tags'>No tags found for this location.</p>");
    } else {
        $('div#photos_content').append("<p id='tags'></p>");
    }

    for (var index = 0; index < data.tags.tag.length; index++) {
        var tag = data.tags.tag[index]._content;
        // var html = '<a href="#" class="tags">'+tag+'</a>, ';
        var html = '<a href="http://flickr.com/photos/tags/'+tag+'/" target="_blank" class="tag">'+tag+'</a>, ';
        $('p#tags').append(html);
    }

    $('a.tag').click(function () {
        var tag = $(this).text();
        $('input#tag').attr('value', tag);

        clear_markers();
        $("div#photos").fadeOut();
        get_places();

        return false;
    });

    $('img#spinner').hide();
}

function load() {
    /* initialise slider */
    $(document).ready(
      function() {
        max = Math.floor(new Date().getTime()/1000);
        min = max-(60*60*24*365.25*5)
        $('.slider_bar').slider( {
          handle: '.slider_handle',

          range: true,
          min: min,
          max: max,
          slide: function(e, ui) {
              var min_epoch = new Date($(".slider_bar").slider("value", 0)*1000);
              var min = months[min_epoch.getMonth()]+" "+min_epoch.getFullYear();

              var max_epoch = new Date($(".slider_bar").slider("value", 1)*1000);
              var max = months[max_epoch.getMonth()]+" "+max_epoch.getFullYear();

              if (min == max) {
                  $('#dateinfo').text("in "+min);
              } else {
                  $('#dateinfo').text("from "+min+" to "+max+".");
              }
          },

          change: function(e,ui) {
//             clear_markers();
//             $("div#photos").fadeOut();
//             get_places();
          }
        });

        $(".slider_bar").slider("moveTo", min, 0);
        $(".slider_bar").slider("moveTo", max, 1);
      }
    );

    /* layout page */
    // if (!GBrowserIsCompatible()) { alert("Your browser is not compatible."); return; }

    var height = $(window).height()-$('form').height()-$('div#appjetfooter').height()-20;

    // var height = $(window).height()-$('h1').height()-$('form').height()-$('div#appjetfooter').height()-20;
    console.log("new map height: "+height);
    $('div#map').height(height);
    $('div.lr').width(Math.floor($(window).width()/80)*80);
    $('div#photos_content').width(Math.floor($(window).width()/80)*80);

    /* initialise map */
    var textual = [{
        featureType: "all",
        elementType: "geometry",
        stylers: [{
            visibility: "off"
        }]
    }];

    var mapOptions = {
        zoom: 2,
        center: new google.maps.LatLng(0, 0),
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL}
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

//     var styledMapOptions = {
//         map: map,
//         name: "Literal"
//     }
//
//     var MapType = new google.maps.StyledMapType(textual, styledMapOptions);
//
//     map.mapTypes.set('literal', MapType);
//     map.setMapTypeId('literal');


    // map.addControl(new google.maps.LargeMapControl());
    // map.addControl(new google.maps.MapTypeControl());
    // map.addMapType(G_PHYSICAL_MAP);
    // map.setMapType(G_PHYSICAL_MAP);
    // map.setCenter(new google.maps.LatLng(0, 0), 2);

    $('form select#type').change(function() {
        if ($('form select#type option:selected').attr('value') == "tag") {
            $("input#tag").show();
        } else {
            $("input#tag").hide();
//             clear_markers();
//             $("div#photos").fadeOut();
//             get_places();
        }
    });

//     $('form select').change(function() {
//         clear_markers();
//         $("div#photos").fadeOut()
//         get_places();
//     });

    $('form input').blur(function() {
        var tags = $("input#tag").attr("value");
        if (tags != current_tag) {
            current_tag = tags;
//             clear_markers();
//             $("div#photos").fadeOut();
//             get_places();
        }
    });

    $('form').submit(function() {
        $("div#photos").fadeOut();
        clear_markers();
        get_places();
        return false;
    });

    get_places();
}

function clear_markers() {
    for (var index = 0; index < markers.length; index++) {
        map.removeOverlay(markers[index]);
    }
    markers = [];
}

function get_places() {
    console.log("getting places");

    var type = $('form select#type option:selected').attr('value');
    var place_type_id = $('form select#place_type_id option:selected').attr('value');

    // sort out dates (if necessary)
    // var time_type = $('form select#time_type_code option:selected').attr('value');

    var ds = to_mysql_datestamp(new Date(0));
    // $(".slider_bar").slider("value", 0);
    /* if (time_type > 0) {
      var d = new Date(Date.now()-(1000*time_type));
      ds = to_mysql_datestamp(d);
    } */

    var min_epoch = $(".slider_bar").slider("value", 0)*1000;
    var min = to_mysql_datestamp(new Date(min_epoch));

    var max_epoch = $(".slider_bar").slider("value", 1)*1000;
    var max = to_mysql_datestamp(new Date(max_epoch));

    if (type == "contacts") {
      $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min }, plot);
    } else if (type == "ff") {
      $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min, contacts: "ff" }, plot);
    } else if (type == "tag") {
      $.getJSON("/json/?method=flickr.places.placesForTags", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min, tags: $("input#tag").attr("value") }, plot);
    } else {
      $.getJSON("/json/?method=flickr.places.placesForUser", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min }, plot);
    }

    console.log("Past getJSON call");
}

function get_circle(size) {
    // Create our "tiny" marker icon
    var icon = new google.maps.MarkerImage(
                  "http://husk.org/images/circle-100.png",
                  null, // new google.maps.Size(100, 100),
                  null, // new google.maps.Point(Math.ceil(size*0.9), Math.ceil(size*.1)),
                  new google.maps.Point(Math.ceil(size/2), Math.ceil(size/2)),
                  new google.maps.Size(size, size)
               );

    console.log("built icon of size "+size);
    return icon;
}

function to_mysql_datestamp(d) {
    return(sprintf("%04d-%02d-%02d %02d:%02d:%02d",
                          d.getUTCFullYear(),
                          d.getUTCMonth()+1,
                          d.getUTCDate(),
                          d.getUTCHours(),
                          d.getUTCMinutes(),
                          d.getUTCSeconds()
                          ));
}

/**
 * sprintf() for JavaScript v.0.4
 *
 * Copyright (c) 2007 Alexandru Marasteanu <http://alexei.417.ro/>
 * Thanks to David Baird (unit test and patch).
**/

function str_repeat(i, m) { for (var o = []; m > 0; o[--m] = i); return(o.join('')); }

function sprintf () {
  var i = 0, a, f = arguments[i++], o = [], m, p, c, x;
  while (f) {
    if (m = /^[^\x25]+/.exec(f)) o.push(m[0]);
    else if (m = /^\x25{2}/.exec(f)) o.push('%');
    else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
      if (((a = arguments[m[1] || i++]) == null) || (a == undefined)) throw("Too few arguments.");
      if (/[^s]/.test(m[7]) && (typeof(a) != 'number'))
        throw("Expecting number but found " + typeof(a));
      switch (m[7]) {
        case 'b': a = a.toString(2); break;
        case 'c': a = String.fromCharCode(a); break;
        case 'd': a = parseInt(a); break;
        case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
        case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
        case 'o': a = a.toString(8); break;
        case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
        case 'u': a = Math.abs(a); break;
        case 'x': a = a.toString(16); break;
        case 'X': a = a.toString(16).toUpperCase(); break;
      }
      a = (/[def]/.test(m[7]) && m[2] && a > 0 ? '+' + a : a);
      c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
      x = m[5] - String(a).length;
      p = m[5] ? str_repeat(c, x) : '';
      o.push(m[4] ? a + p : p + a);
    }
    else throw ("Huh ?!");
    f = f.substring(m[0].length);
  }
  return o.join('');
}

/* appjet:css */

body {
    margin: 0px;
    padding: 0px;
    font-family:"helvetica neue", helvetica, arial, sans-serif;
    font-size:12px;
    line-height:14px;
}

h1 {
    margin: 7px 5px;
    padding: 0px;
    color: #666;
    font-size: 36px;
    letter-spacing: -0.05em;
    line-height: 24px;
}

h1 span.subhead {
    font-size: 14px;
    font-weight: normal;
    letter-spacing: -0.02em;
}

p {
    font-size:12;
    line-height:16px;
}

div#map {
    width: 100%;
    height: 600px;
    margin: 0px;
    padding: 0px;
}

div#login {
    margin: 5px;
    padding: 0px;
}

div#appjetfooter div {
    margin: 0px 5px;
}

div#photos {
    background-image:url(http://husk.org/images/photostrip.png);
    position:absolute;
    bottom:115px;
    width:100%;
    height: 115px;
    display: none;
    overflow: hidden;
}

div#photos_content {
    margin: 0px auto;
    width: 800px;
    overflow: hidden;
}

div#photos_content p {
    margin: 5px 0px 5px 5px;
}

div#photos_content p img {
    margin: 0px;
}

div#photos_content img {
    margin: 5px;
    opacity: 0.7;
}

div#photos_content img:hover {
    margin: 5px;
    opacity: 1;
}

div#photos_content p#tags {
  font-size:24px;
  line-height:27px;
  font-weight: normal;
  opacity: 0.7;
}

div#photos_content p#tags a {
  color:#000;
  text-decoration:none;
}

div#photos_content p#tags a:hover {
  text-decoration:underline;
  color:#00f;
  opacity: 1;
}

div#info {
    background-image:url(http://husk.org/images/photostrip.png);
    position:absolute;
    top:90px;
    right:30px;
    width:400px;
}

div#info p {
    margin-left: 10px;
    margin-right: 10px;
}

div.lr {
    margin: 5px 5px 10px 5px;
}

span.l {
    float: left;
}

span.r {
    float: right;
}

form {
    margin: 5px;
}

input#tag {
    width: 75px;
}

div#input {
    float: left;
}

/* slider */

div#container {
    height: 26px;
    width: 290px;
/*    position: absolute;
    right: 5px; */
}

span.slider_container {
    position: relative;
    height: 20px;
}

span.slider_bar {
    background: url(http://husk.org/images/www/sliderbar.png) no-repeat;
    height: 18px;
    width: 280px;
    float: left;
    margin: 5px;
    position: relative;
}

span.slider_handle {
    background: url(http://husk.org/images/www/slider.png) no-repeat;
    height: 18px;
    width: 11px;
    overflow: hidden;
    position: absolute;
    top: 1px;
}

* :focus { outline:none }