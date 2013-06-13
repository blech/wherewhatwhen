    $(document).ready(load);

    var api_key = '46810731c766915b2c56c61c39587f45'

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function load() {

        $('div.lr').width(Math.floor($(window).width()/80)*80);
        $('div#photos_content').width(Math.floor($(window).width()/80)*80);

        get_places();
    }

    function get_places() {

        var type = $('form select#type option:selected').attr('value');
        var place_type_id = $('form select#place_type_id option:selected').attr('value');

        type = 'tag'

        if (type == "contacts") {
          $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min }, plot);
        } else if (type == "ff") {
          $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min, contacts: "ff" }, plot);
        } else if (type == "tag") {
          $.ajax({
            // url: "http://api.flickr.com/services/rest/", { method: 'flickr.places.placesForTags', place_type_id: place_type_id, tags: 'snow', tags_real: $("input#tag").attr("value"), api_key:api_key, format:'json', }, 
            url: "http://api.flickr.com/services/rest/?method=flickr.places.placesForTags&api_key=a6fc58b6f800c1c604bb8a46a6a2f2e1&place_type_id=7&tags=snow&format=json",
            dataType: 'jsonp',
            success: function(data) { console.log(data); console.log("calling plot?"); plot(data); },
            });
        } else {
          $.getJSON("/json/?method=flickr.places.placesForUser", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min }, plot);
        }

        console.log("Past getJSON call");
    }


    jsonFlickrApi = function(data) {
        console.log("in jsonFlickrAPI");
        console.log(data);
        plot(data);
    }

    function plot(data) {
        console.log("plotting data");

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

          console.log(lat, lon, place._content, place.photo_count);
          var marker = L.marker(new L.LatLng(lat, lon), 
                   {icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),});
          marker.addTo(map);
        }

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
        /* layout page */
        // if (!GBrowserIsCompatible()) { alert("Your browser is not compatible."); return; }

        var height = $(window).height()-$('form').height()-$('div#appjetfooter').height()-20;

        // var height = $(window).height()-$('h1').height()-$('form').height()-$('div#appjetfooter').height()-20;
        console.log("new map height: "+height);
        $('div#map').height(height);
        $('div.lr').width(Math.floor($(window).width()/80)*80);
        $('div#photos_content').width(Math.floor($(window).width()/80)*80);

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

        type = 'tag'

        console.log(type, place_type_id)

        // sort out dates (if necessary)
        // var time_type = $('form select#time_type_code option:selected').attr('value');

        var ds = to_mysql_datestamp(new Date(0));
        // $(".slider_bar").slider("value", 0);
        /* if (time_type > 0) {
          var d = new Date(Date.now()-(1000*time_type));
          ds = to_mysql_datestamp(d);
        } */

        // var min_epoch = $(".slider_bar").slider("value", 0)*1000;
        // var min = to_mysql_datestamp(new Date(min_epoch));
        // 
        // var max_epoch = $(".slider_bar").slider("value", 1)*1000;
        // var max = to_mysql_datestamp(new Date(max_epoch));

        if (type == "contacts") {
          $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min }, plot);
        } else if (type == "ff") {
          $.getJSON("/json/?method=flickr.places.placesForContacts", { place_type_id: place_type_id, max_taken_date: max, min_taken_date: min, contacts: "ff" }, plot);
        } else if (type == "tag") {
          $.ajax({
            // url: "http://api.flickr.com/services/rest/", { method: 'flickr.places.placesForTags', place_type_id: place_type_id, tags: 'snow', tags_real: $("input#tag").attr("value"), api_key:api_key, format:'json', }, 
            url: "http://api.flickr.com/services/rest/?method=flickr.places.placesForTags&api_key=a6fc58b6f800c1c604bb8a46a6a2f2e1&place_type_id=7&tags=snow&format=json",
            dataType: 'jsonp',
            success: function(data) { console.log(data); console.log("calling plot?"); plot(data); },
            });
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

