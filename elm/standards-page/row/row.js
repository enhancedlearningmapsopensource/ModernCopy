define(["core",
        "mustache",
        "text!./row.html",
        "hub-lib",
        "../domain/domain"], 
function(Core,
         Mustache,
         Template,
         Hub,
         Domain){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {},
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
                        
            thisView.listenTo(Hub.get("domaingroup"), "add", pvt.hubDomainGroupAdded);
            thisView.listenTo(thisView.model.get("domains"), "add", pvt.domainGroupAdded);
            
            // Add any domaingroups that already exist
            Hub.get("domaingroup").forEach(function(domain){
                pvt.hubDomainGroupAdded.call(thisView, domain);
            });
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            // Detach
            var domains = thisView.detachGroup("domain-views");
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Order domains
            domains.sort(function(a,b){
                return a.model.get("hubmodel").get("ord") - b.model.get("hubmodel").get("ord");
            });
            
            // Reattach
            if(domains.length > 0){
                var lastOrd = domains[0].model.get("hubmodel").get("ord");
                domains.forEach(function(d){
                    var hubmodel = d.model.get("hubmodel");
                    if(Hub.stripHtml(hubmodel.get("name")) === "Number Sense"){
                        var k =0;
                    }
                    while(hubmodel.get("ord") > lastOrd){
                        var $spacer = $("<div class='spacer'>");
                        thisView.$el.append($spacer);
                        lastOrd++;
                    }
                    thisView.$el.append(d.$el);
                    lastOrd++;
                });
            }
            
            // Get the max cells for all rows
            var maxWidth = thisView.model.collection.reduce(function(acc,row){
                return Math.max(acc, row.width());
            }, -500);
            
            var thisWidth = thisView.model.width();
            while(thisWidth < maxWidth){
                var $spacer = $("<div class='spacer'>");
                thisView.$el.append($spacer);
                thisWidth += 1;
            }
            
        }
    });
    
    /*pvt.cellAdded = function(model){ 
        var thisView = this;
    };*/
    pvt.hubDomainGroupAdded = function(model){ 
        var thisView = this;
        var roword = model.get("roword");
        var subject = thisView.model.get("subject").id;
        if(roword === thisView.model.id && subject === model.get("subjectid")){
            thisView.model.get("domains").add({
                id: model.id,
                hubmodel: model
            });
        }
    };
    
    pvt.domainGroupAdded = function(model){ 
        var thisView = this;
        thisView.addToGroup("domain-views", new Domain({
            id: model.id,
            model: model
        })).render();
        thisView.render();
        thisView.listenTo(model.get("cells"), "add", function(){throw Error();});//thisView.render);
    };
    
    
    return View;
});