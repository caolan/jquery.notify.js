/*
 * jQuery Notify Plugin v0.1 - by @caolan
 *
 *   Attempts to implement notifications similar to those available in
 *   Ubuntu since Jaunty Jackalope (9.04) [see: $ aptitude show notify-osd]
 *
 *   For more information on the notifications, see the following:
 *      - http://www.markshuttleworth.com/archives/253
 *      - http://launchpad.net/notify-osd
 *
 *   Dependencies: jquery 1.3
 *
 * Copyright (c) 2009 Caolan McMahon (http://caolanmcmahon.com)
 * Dual licensed under the MIT and GPL licenses (same as jQuery).
 * http://docs.jquery.com/License
 */

(function($){

    $.fn.below = function(x,y){
        // gets the element below the selected elements at point x,y
        $(this).hide();
        var below = document.elementFromPoint(x,y);
        $(this).show();
        return $(below);
    };

    $.fn.is_hovering = function(x,y){
        // we can't rely on the usual mouseover event due to $().below()
        // re-triggering it due to hide/show of element
        var r = this[0].getBoundingClientRect();
        return (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    };

    $.notify = function(options){
        // main notification function, options is an object which can include:
        // title, text, icon, delay
        var li = $("<li/>");

        // add content
        if(options.icon){
            li.append($("<div/>").addClass("icon")).addClass("icon");
        }
        if(options.title){
            li.append($("<div/>").addClass("title").text(options.title));
        }
        if(options.text){
            li.append(options.text);
        }

        // bind event handlers
        with(li){
            bind('notify_mouseover', function(){$(this).fadeTo(200, 0.15);});
            bind('notify_mouseout',  function(){$(this).fadeTo(200, 0.85);});
            mousemove(function(e){
                var below = $(this).parent().below(e.pageX, e.pageY);
                $(this).css('cursor', below.css('cursor'));
            });
            click(function(e){
                $(this).parent().below(e.pageX, e.pageY).click();
            });
        }

        // create timeout to fadeout and cleanup
        setTimeout(function(){
            li.fadeOut('slow', function(){
                li.remove();
                $("#notifications:empty").remove();
            });
        }, options.delay || 3000);

        return li.appendTo($._notify.getContainer());
    };

    $._notify = {
        getContainer: function(){
            // get or create notifications list
            var c = $("#notifications");
            if(!c.length){
                c = $('<ul id="notifications"></ul>').appendTo(document.body);
            }
            return c;
        },
        init: function(){
            // fake hover events (can't use normal mouseover/mouseout, as
            // these are triggered when hiding/showing to find element below)
            $(document).mousemove(function(e){
                $("#notifications li").each(function(){
                    if($(this).is_hovering(e.pageX, e.pageY)){
                        if(!$(this).data('notify_hover')){
                            $(this).trigger('notify_mouseover');
                            $(this).data('notify_hover', true);
                        }
                    }
                    else if($(this).data('notify_hover')){
                        $(this).trigger('notify_mouseout');
                        $(this).data('notify_hover', false);
                    }
                });
            });
        }
    }

})(jQuery);

// init notifications once page has loaded
$(document).ready(function(){$._notify.init();});
