define(["require",
        "core",
        "mustache",
        "text!./uploader.html",
        "hub-lib"], 
function(require, 
         Core,
         Mustache,
         Template,
         Hub){
             
    var pvt = {};         
    var View = Core.View.extend({     
        template: Template,
        events: {
            "click #upload": "delegateUpload",
            "click #upload-back": "delegateBack"
        },
        
        /**
         * User clicks the back button
         */
        delegateBack: function(e){
            e.preventDefault();
            var thisView = this;
            thisView.model.set("map", null);
        },
        
        /**
         * User clicks to Upload button
         */
        delegateUpload: function(e){
            e.preventDefault();
            var thisView = this;
            
            var data = new FormData();
            $.each($('#file')[0].files, function(i, file) {
                data.append('file-'+i, file);
            });
            
            data.append('submit', true);
            
            var path = require.toUrl("./upload.php");
            $.ajax({
                url: path,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                method: 'POST',
                type: 'POST', // For jQuery < 1.9
                success: function(ret){
                    var json = JSON.parse(ret);
                    pvt.postUpload.call(thisView, json);
                }
            });
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Core.View.prototype.initialize.call(thisView);
            Mustache.parse(thisView.template);
            
            
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
        }
    });
    
    pvt.postUpload = function(json){
        var thisView = this;
        if(json.success === true){
            // Get the resource id
            var resourceid = json.resourceid;
            var mapid = thisView.model.get("map").id;

            // Refetch the resource data from the server
            Hub.sendUserNotification("Updating resource records.");
            var lockID = lockSite(true, "map-manager.uploader.pvt.postUpload");
            
            return Hub.get("resource").fetch({wait:true}).then(function(){
                return Hub.get("mapresource").create({
                    "mapid": mapid,
                    "resourceid": resourceid
                }, {wait:true});
            }).then(function(){
                lockSite(false, lockID);
                thisView.model.set("map", null);
            });
        }
    };
    
    return View;
});
