define(["backbone",
        "mustache",
        "text!./file-selector.html",
        "fileuploader/file-uploader-view",
        "fileuploader/file-uploader-model",
        "hub-lib"], 
function(Backbone,
         Mustache,
         Template,
         FileUploaderView,
         FileUploaderModel,
         Hub){
             
    var pvt = {};         
    var View = Backbone.View.extend({     
        template: Template,
        events: {
            "click #upload-resource-cancel" : "delegateCancel",
            "click #upload-resource-ok" : "delegateUpload"
        },
        
        delegateCancel: function(e){
            var thisView = this;
            e.preventDefault();
            thisView.model.set("map", null);
        },
        
        delegateUpload:function(e){
            var thisView = this;
            e.preventDefault();

            var options = {};
            options.description 	= thisView.$el.find("#res-description").val();
            options.title 		= thisView.$el.find("#res-title").val();
            options.mapid		= thisView.model.get("map").id;

            // Change the state
            thisView.model.get("uploader").upload(options).then(function(){
                return Promise.all([
                    Hub.get("map").get(options.mapid).fetch(),
                    Hub.get("resource").fetch(),
                    Hub.get("mapresource").fetch()
                ]);
            }).then(function(){
            	thisView.model.set("map", null);
            });
        },
        
        /**
         * Initialize the view
         */
        initialize:function(){
            var thisView = this;
            Mustache.parse(thisView.template);
            
            thisView.model.set("map", null);
            thisView.listenTo(thisView.model, "change:map", thisView.render);
        },
        
        /**
         * Render the view
         */
        render:function(){
            var thisView = this;
            var renderOb = {};
            if(thisView.model.get("map") === null){
                return;
            }
            
            var $el = $(Mustache.render(thisView.template, renderOb));
            thisView.$el.after($el);
            thisView.$el.remove();
            thisView.setElement($el[0]);
            
            // Same as edit but without needing to check the active graph first
            // Get the data
            var fileUploaderModel = new FileUploaderModel({ id: 'file-uploader-model'});

            var $el = thisView.$el.find("#file-uploader");
            var fileUploaderView = new FileUploaderView({ id: 'file-uploader-view', el: $el[0], model: fileUploaderModel, callback:function(showCommit){
                if(showCommit){
                    thisView.$el.find("#upload-resource-ok").show();
                }else{
                    thisView.$el.find("#upload-resource-ok").hide();
                }
            }});
            fileUploaderView.setupTemplate().then(function(){
                fileUploaderView.render();
            });
            thisView.model.set("uploader", fileUploaderView);
            
        }
    });
	return View;
});