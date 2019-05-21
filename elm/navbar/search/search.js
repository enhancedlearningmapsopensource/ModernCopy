define(["core",
        "mustache",
        "text!./search.html",
        "../omnisearch/omnisearch",
        "hub-lib",
        "search-engine-lib",
        "ranker-lib"], 
function(Core,
         Mustache,
         Template,
         Omnisearch,
         Hub,
         SearchEngine,
         Ranker){
             
    var pvt = {
        consts: {
            DELAY: 500,
            DOM_TEXTBOX: "input[type='text']"
        }
    };         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "keyup input[type=text]": "delegateSelected",
            "keydown input[type=text]": "delegateType",
            "keypress input[type=text]": "delegateType",
            "keyrelease input[type=text]": "delegateType",
            "propertychange input[type=text]": "delegateType",
            //"click input[type=text]": "delegateType",
            "input input[type=text]": "delegateType",
            "paste input[type=text]": "delegateType",
            "focus input[type=text]": "delegateFocus",
            "click input[type=text]": "delegateFocus",
            "change input[type=text]": "delegateType"
        },
        
        delegateFocus: function (e) {
            var thisView = this;
            thisView.model.set("open", true);
            return false;
        },
        
        delegateType: function (e) {
            var thisView = this;
            if(typeof e !== "undefined" && e !== null){
                if(e.key !== "undefined" && e.key !== null){
                    pvt.keyDown.call(thisView, e.key);
                }
            }
        },
        
        /**
         * Initialize the view.
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            thisView.add("omnisearch-view", new Omnisearch({
                id: "omnisearch-view",
                model: thisView.model.get("omnisearch")
            })).render();
            
            thisView.listenTo(thisView.model, "change:open" , pvt.openChanged);
            thisView.listenTo(appstate, "change:omnisearch", pvt.applicationUpdate);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var result = thisView.model.get("omnisearch").get("result");
            var renderOb = {
                term: (result === null) ? "" : result.term
            };
            
            // Detach
            thisView.get("omnisearch-view").$el.detach();
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Reattach
            var $results = thisView.$el.find(".search-results");
            $results.html(thisView.get("omnisearch-view").$el);
        },
        
        search: function(searchText){
            var thisView = this;
            if(searchText === null){
                return;
            }
            
            var results = pvt.searchEngine.call(thisView, searchText);
            
            appstate.set("omnisearch", searchText, {silent:true});
            thisView.model.set("open", true);
            thisView.model.get("omnisearch").set("result", null);
            thisView.model.get("omnisearch").set("result", results);
        }
    });
    
    pvt.applicationUpdate = function(model){
        var thisView = this;
        var appValue = appstate.get("omnisearch");
        var result = thisView.model.get("omnisearch").get("result");
        if(result === null || result.term !== appValue){
            thisView.search(appValue);
            thisView.render();
        }
    };
    
    pvt.enterPressed = function(){
        var thisView = this;
        thisView.get("omnisearch-view").enter();
    };
    
    pvt.keyDown = function(key){
        var thisView = this;
        var searchText = thisView.$el.find(pvt.consts.DOM_TEXTBOX).val();
        thisView.model.set("open", true);

        if (key === "Enter") {
            // Ignore
            var enterOff = getPreference("OENTER_ON");
            enterOff = (enterOff === 't') ? true : false;

            if (enterOff === false) {
                pvt.enterPressed.call(thisView);
            }
        } if (key === "Backspace") {
            setTimeout(function(){
                pvt.keyDown.call(thisView, "");
            },0);
        } else {
            searchText = searchText + key;
            setTimeout(function () {
                var checkText = thisView.$el.find(pvt.consts.DOM_TEXTBOX).val();
                if (checkText !== searchText) {
                    return;
                }

                // Make sure we haven't already searched for this
                var searchResult = thisView.model.get("omnisearch").get("result");
                if(typeof searchResult !== "undefined" && searchResult !== null && searchResult.term === searchText){
                    return;
                }
                thisView.$el.find("#results-row").hide();
                thisView.$el.find("#notice-row").show();
                thisView.search(searchText);
            }, pvt.consts.DELAY);
        }
    };
    
    
    
    pvt.openChanged = function(model, options){
        var thisView = this;
        thisView.model.get("omnisearch").set("open", thisView.model.get("open"));
        if(thisView.model.get("open") === true){
            thisView.$el.addClass("open");
            var val = thisView.$el.find(pvt.consts.DOM_TEXTBOX).val();
            thisView.model.get("omnisearch").set("result", null);
            appstate.set("omnisearch", null, {silent:true});
            thisView.search(val);
        }else if(thisView.model.get("open") === false){
            thisView.$el.removeClass("open");
        }else{
            throw Error("Invalid value for open: " + thisView.model.get("open"));
        }
    };
    
    pvt.searchEngine = function(searchText){
        // Perform a search for the terms
        var searchStart = timeNow();
        var engineResults = SearchEngine.search({
            value: searchText
        });
        var searchTime = timeNow() - searchStart;

        // Rank results
        var rankStart = timeNow();
        var rankedResults = Ranker.omni(engineResults, searchText);
        var rankTime = timeNow() - rankStart;

        if((searchTime + rankTime) > 1000){
            console.warn(["Search For: ",searchText,"took a long time.\n-- search time: ",searchTime,"\n-- rank time:",rankTime].join(""));
        }
        return rankedResults;
    };
    
    return View;
});
