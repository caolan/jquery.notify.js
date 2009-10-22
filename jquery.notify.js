/*
 * jQuery Notify Plugin v0.1 - by @caolan
 *
 *   Attempts to implement notifications similar to those available in
 *   Ubuntu since Jaunty Jackalope (9.04)
 *
 *   Dependencies: jQuery 1.3
 *                 jquery.jcorners.js
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
        var el = $(this);
        var r = el.offset();
        r.bottom = r.top + el.height();
        r.right = r.left + el.width();
        return (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    };

    $.notify = function(options){
        // main notification function, options is an object which can include:
        // title, text, icon, delay
        var li = $("<li/>");
        var inner = $("<div/>").addClass("inner").appendTo(li);;

        // add content
        if(options.icon){
            var img = $("<img alt='icon' />").attr('src', options.icon);
            inner.append($("<div/>").addClass("icon").append(img));
            li.addClass("withicon");
        }
        if(options.title){
            inner.append($("<div/>").addClass("title").text(options.title));
        }
        if(options.text){
            inner.append($("<div/>").addClass("text").text(options.text));
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
            li.fadeTo('slow', 0, function(){
                $(this).slideUp('fast', function(){
                    $(this).remove();
                    $("#notifications:empty").remove();
                });
            });
        }, options.delay || 5000);

        li.appendTo($._notify.getContainer());
        if($.boxModel){
            $.jcorners(inner, {radius:6});
        } else {
            $.jcorners(inner, {radius:3});
        }
        return li;
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
        add_styles: function(){
            // add style tag for storing copies of :hover css in custom classes,
            // allowing us to later add this css manually (since :hover is not
            // triggered for elements below a notification)
            $('head').append($('<style/>').attr({
                rel: "stylesheet",
                media: "screen",
                title: "notifySheet",
                type: "text/css"
            }));
            function getStylesheetByTitle(title){
                for(var i=0; i<document.styleSheets.length; i++){
                    if(document.styleSheets[i].title == title){
                        return document.styleSheets[i];
                    }
                }
                return null;
            }
            var storage = getStylesheetByTitle('notifySheet');

            function appendRule(sheet, selector, rules){
                if(sheet.addRule){
                    return sheet.addRule(selector, rules);
                }
                else if(sheet.insertRule){
                    var index = sheet.cssRules.length;
                    var css = selector + " {" + rules + " }";
                    return sheet.insertRule(css, index);
                }
            }

            var class_counter = 0;

            // returns next class number and increments the counter
            /*function next_class(){
                var cl = "hoverclass" + class_counter;
                class_counter++;
                return cl
            }*/
            // returns a list of rules for this sheet and its imports
            function parse_sheet(sheet){
                var rules = [];
                if(sheet.imports){
                    for(var i=0; i<sheet.imports.length; i++){
                        rules = rules.concat(parse_sheet(sheet.imports[i]));
                    }
                }
                var ruleslist = (sheet.rules) ? sheet.rules : sheet.cssRules;
                return rules.concat(to_array(ruleslist));
            }
            // returns an array-like object into a proper array
            function to_array(x){
                var a = [];
                for(var i=0; i<x.length; i++){
                    a.push(x[i]);
                }
                return a;
            }
            // copies hover css into new class and attaches js event handler to
            // relevant elements to add/remove the new class
            function parse_rule(rule){
                // regex from http://www.xs4all.nl/~peterned/htc/csshover3-source.htc
                //var REG_INTERACTIVE = /(^|\s)((([^a]([^ ]+)?)|(a([^#.][^ ]+)+)):(hover|active|focus))/i
                var REG_INTERACTIVE = /(^|\s)((([^a]([^ ]+)?)|(a([^#.][^ ]+)+)):hover)/i

                select = rule.selectorText;
                if(REG_INTERACTIVE.test(select)){
                    //var cl = next_class();
                    //appendRule(storage, select.replace(':hover','') + "." + cl, rule.style.cssText);
                    appendRule(storage, select.replace(':hover','') + ".notify_hover", rule.style.cssText);
                    $(select.replace(':hover', '')).bind(
                        'notify_mouseover',
                        function(){
                            $(this).addClass('notify_hover');
                            console.log($(this).attr('class'));
                        }
                    ).bind(
                        'notify_mouseout',
                        function(){$(this).removeClass('notify_hover');}
                    );
                }
            }

            // start parsing all stylesheets
            var sheets = window.document.styleSheets;
            var rules = [];
            for(var i=0; i<sheets.length; i++){
                rules = rules.concat(parse_sheet(sheets[i]));
            }
            for(var i=0; i<rules.length; i++){
                parse_rule(rules[i]);
            }

        },
        init: function(){
            $._notify.add_styles();
            // fake hover events (can't use normal mouseover/mouseout, as
            // these are triggered when hiding/showing to find element below)
            $(document).mousemove(function(e){
                var newhover;
                $("#notifications li").each(function(){
                    if($(this).is_hovering(e.pageX, e.pageY)){
                        newhover = $(this).parent().below(e.pageX, e.pageY);
                        newhover = newhover.get(0);
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
                if($._notify.last_hover && newhover != $._notify.last_hover){
                    $($._notify.last_hover).trigger('notify_mouseout');
                }
                if(newhover && newhover != $._notify.last_hover){
                    $._notify.last_hover = newhover;
                    $(newhover).trigger('notify_mouseover');
                }
            });
        }
    }

})(jQuery);

// init notifications once page has loaded
$(document).ready(function(){$._notify.init();});
