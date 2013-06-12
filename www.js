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

