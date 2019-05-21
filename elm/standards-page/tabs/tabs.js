define(["core",
        "mustache",
        "text!./tabs.html",
        "hub-lib"], 
function(Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click .standard-tab": "delegateChangeSubject"
        },
        
        delegateChangeSubject: function(e){
            e.preventDefault();
            var thisView = this;
            var $el = $(e.currentTarget);
            var id = Number($el.attr("name").split("subject-")[1]);
            appstate.set("activeSubject", Hub.get("subject").get(id).get("name").toLowerCase())
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            // Page cares about:
            // a) subjects added
            
            thisView.listenTo(Hub.get("subject"), "add", pvt.subjectAdded);
            thisView.listenTo(appstate, "change:activeSubject", thisView.render);
            
            // Add any subjects that already exist.
            if(Hub.get("subject").length > 0){
                Hub.get("subject").forEach(function(d){
                    pvt.subjectAdded.call(thisView, d);
                });
            }
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var activeSubject = appstate.get("activeSubject");
            
            var subjects = thisView.model.get("subjects").map(function(subject){
                var name = Hub.stripHtml(subject.get("hubmodel").get("name"));
                return {
                    id: subject.get("hubmodel").id,
                    name: name,
                    selected: (activeSubject === name.toLowerCase())
                };
            });
            
            // Sort by name ascending
            subjects.sort(function(a,b){
                return b.name.localeCompare(a.name);
            });
            
            var renderOb = {
                subjects: subjects
            };
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    pvt.subjectAdded = function(model){
        var thisView = this;
        thisView.model.get("subjects").add({
            id: model.id,
            hubmodel: model
        });
        thisView.render();
    };
    
    return View;
});